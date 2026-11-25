"""Windows desktop research app. Broker execution is not connected."""
import json
import os
import queue
import threading
import time
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk
import webbrowser

from core import Journal, analyse, candidates, evaluate, fetch_snapshot, models, paper_levels

HOME = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "TradeLensAI"


class App:
    def __init__(self, root):
        self.root = root
        self.root.title("TradeLens AI Desk 0.1 — Paper Trading")
        self.root.geometry("1100x740")
        self.root.minsize(850, 600)
        self.events = queue.Queue()
        self.stop = threading.Event()
        self.stop.set()
        self.busy = False
        self.closing = False
        self.journal = Journal(HOME / "journal.sqlite")
        try:
            config = json.loads((HOME / "settings.json").read_text())
        except (OSError, ValueError):
            config = {}
        self.model = tk.StringVar(value=config.get("model", ""))
        self.threshold = tk.StringVar(value=str(config.get("threshold", 85)))
        self.auto_paper = tk.BooleanVar(value=False)
        self.status = tk.StringVar(value="Stopped. Connect a local Ollama model to analyse signals.")
        self.build()
        self.refresh_journal()
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self.root.after(150, self.drain)
        self.root.after(1000, self.schedule)
        self.check_models()

    def build(self):
        frame = ttk.Frame(self.root, padding=16)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="TradeLens AI Desk", font=("Segoe UI", 21, "bold")).pack(anchor="w")
        ttk.Label(frame, text="Independent local AI review • Forex only • Gold excluded • SIMULATION ONLY",
                  font=("Segoe UI", 11)).pack(anchor="w", pady=(3, 12))
        ttk.Label(frame, text="XM App execution: NOT CONNECTED. No login credentials or real orders are sent.",
                  foreground="#a23a12").pack(anchor="w", pady=5)
        options = ttk.LabelFrame(frame, text="Local AI", padding=12)
        options.pack(fill="x", pady=8)
        ttk.Label(options, text="Installed Ollama model").grid(row=0, column=0, sticky="w")
        self.model_box = ttk.Combobox(options, textvariable=self.model, width=35)
        self.model_box.grid(row=0, column=1, padx=8)
        ttk.Button(options, text="Refresh models", command=self.check_models).grid(row=0, column=2)
        ttk.Label(options, text="Pass score (not win probability)").grid(row=1, column=0, sticky="w", pady=8)
        ttk.Entry(options, textvariable=self.threshold, width=8).grid(row=1, column=1, sticky="w", padx=8)
        ttk.Checkbutton(options, text="Automatically record simulated entries after all checks pass",
                        variable=self.auto_paper).grid(row=2, column=0, columnspan=3, sticky="w")
        actions = ttk.Frame(frame)
        actions.pack(fill="x", pady=8)
        for label, command in [("Start monitoring", self.start), ("Check now", self.check),
                               ("Stop", self.halt), ("Open TradeLens", lambda: webbrowser.open("https://wj2195.github.io/EasyABC/TradeLens/"))]:
            ttk.Button(actions, text=label, command=command).pack(side="left", padx=(0, 8))
        ttk.Label(frame, textvariable=self.status, wraplength=1000).pack(anchor="w", pady=5)
        ttk.Label(frame, text="Checks every 60 seconds while this app is open. The upstream scanner can be delayed.",
                  foreground="#666666").pack(anchor="w", pady=(0, 8))
        columns = ("pair", "side", "status", "score", "entry", "tp", "sl")
        self.table = ttk.Treeview(frame, columns=columns, show="headings", height=12)
        for col in columns:
            self.table.heading(col, text={"side": "Direction", "score": "AI score",
                "entry": "Sim. entry", "tp": "Sim. TP", "sl": "Sim. SL"}.get(col, col.title()))
            self.table.column(col, width=125, minwidth=80, stretch=True)
        self.table.pack(fill="both", expand=True)
        self.table.bind("<<TreeviewSelect>>", self.show_detail)
        self.detail = tk.Text(frame, height=8, wrap="word", state="disabled", font=("Consolas", 10))
        self.detail.pack(fill="x", pady=(10, 0))
        ttk.Label(frame, text="TP/SL outcomes are candle-touch research only; no actual fills, position sizing, cash P&L or trading costs.",
                  wraplength=1000).pack(anchor="w", pady=8)

    def log(self, text):
        self.detail.configure(state="normal")
        self.detail.insert("end", time.strftime("%H:%M:%S") + " " + text + "\n")
        self.detail.see("end")
        self.detail.configure(state="disabled")

    def check_models(self):
        def worker():
            try:
                self.events.put(("models", models()))
            except Exception as exc:
                self.events.put(("log", "Ollama unavailable: " + str(exc) + ". Install/start Ollama and download a model separately."))
        threading.Thread(target=worker, daemon=True).start()

    def settings(self):
        score = float(self.threshold.get())
        if not 0 <= score <= 100 or not self.model.get().strip():
            raise ValueError("Choose an installed AI model and a score from 0 to 100")
        model = self.model.get().strip()
        HOME.mkdir(parents=True, exist_ok=True)
        (HOME / "settings.json").write_text(json.dumps({"model": model, "threshold": score}, allow_nan=False), encoding="utf-8")
        return model, score, bool(self.auto_paper.get())

    def start(self):
        try:
            self.settings()
        except Exception as exc:
            messagebox.showerror("Settings", str(exc))
            return
        self.stop.clear()
        self.status.set("Monitoring TradeLens; paper mode only.")
        self.check()

    def halt(self):
        self.stop.set()
        self.status.set("Stopped. A current AI request may finish, but it cannot create a simulated entry.")
        self.log("Monitoring stopped.")

    def check(self):
        if self.busy or self.closing:
            return
        try:
            settings = self.settings()
        except Exception as exc:
            messagebox.showerror("Settings", str(exc))
            return
        # Check now can analyse while stopped, but cannot auto-simulate.
        self.busy = True
        self.status.set("Reading TradeLens and checking freshness…")
        threading.Thread(target=self.work, args=settings, daemon=True).start()

    def work(self, model, threshold, auto_paper):
        try:
            snapshot = fetch_snapshot()
            for line in self.journal.reconcile(snapshot, time.time()):
                self.events.put(("log", line))
            signals = candidates(snapshot, time.time())
            self.events.put(("log", str(len(signals)) + " fresh 10/12-or-higher forex signals; snapshot " + snapshot["updated_at"]))
            count = 0
            started_monitoring = not self.stop.is_set()
            for signal in signals:
                if self.closing or count >= 3 or (started_monitoring and self.stop.is_set()):
                    break
                if self.journal.seen(signal["id"]) or self.journal.has_open(signal["pair"]):
                    continue
                if not signal["news_clear"]:
                    self.journal.save(signal, "WAIT", {"reason": signal["news_reason"]}, time.time())
                    continue
                count += 1
                self.events.put(("status", "Analysing " + signal["pair"] + " with " + model))
                review = analyse(signal, model)
                now = time.time()
                passed, reason = evaluate(snapshot, signal, review, threshold, now)
                data = {"review": review, "reason": reason, "snapshot_at": signal["snapshot_at"]}
                status = "WAIT"
                if passed:
                    data["levels"] = paper_levels(snapshot, signal, now)
                    status = "SIMULATED" if auto_paper and not self.stop.is_set() and not self.closing else "READY"
                self.journal.save(signal, status, data, now)
                self.events.put(("result", signal["pair"] + " " + signal["direction"] + " · " + status + " · score " + str(review["score"])))
            self.events.put(("status", "Check complete. " + ("Monitoring remains on." if not self.stop.is_set() else "Monitoring is stopped.")))
        except Exception as exc:
            self.events.put(("log", "No new simulated entries from this failure: " + str(exc)))
            self.events.put(("status", "Check failed; no broker orders exist. See details."))
        finally:
            self.events.put(("finished", None))

    def refresh_journal(self):
        self.table.delete(*self.table.get_children())
        self.records = {r["id"]: r for r in self.journal.records()}
        for key, record in self.records.items():
            data = record["data"]
            levels = data.get("levels", {})
            def price(name):
                value = levels.get(name)
                return "" if value is None else format(value, ".3f" if record["pair"].endswith("/JPY") else ".5f")
            self.table.insert("", "end", iid=key, values=(record["pair"], record["direction"], record["status"],
                data.get("review", {}).get("score", ""), price("entry"), price("tp"), price("sl")))

    def show_detail(self, _=None):
        selection = self.table.selection()
        if selection:
            self.log(json.dumps(self.records[selection[0]]["data"], indent=2))

    def drain(self):
        if self.closing:
            return
        try:
            while True:
                kind, data = self.events.get_nowait()
                if kind == "models":
                    self.model_box["values"] = data
                    self.log("Installed models: " + (", ".join(data) or "None. Download a model in Ollama first."))
                elif kind == "status":
                    self.status.set(data)
                elif kind in ("log", "result"):
                    self.log(data)
                    if kind == "result":
                        self.root.bell()
                elif kind == "finished":
                    self.busy = False
                    self.refresh_journal()
        except queue.Empty:
            pass
        self.root.after(150, self.drain)

    def schedule(self):
        if self.closing:
            return
        if not self.stop.is_set() and not self.busy:
            self.check()
        self.root.after(60000, self.schedule)

    def close(self):
        self.closing = True
        self.stop.set()
        self.root.destroy()


if __name__ == "__main__":
    window = tk.Tk()
    ttk.Style(window).theme_use("clam")
    App(window)
    window.mainloop()
