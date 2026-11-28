"""Analysis-only outbox for later integrations. These files are not orders."""
import json
from datetime import datetime, timezone
from pathlib import Path


def export_analysis(home, signal, data, status, provider, now):
    outbox = Path(home) / "analysis-outbox"
    outbox.mkdir(parents=True, exist_ok=True)
    signal_id = signal["id"]
    if len(signal_id) != 64 or any(c not in "0123456789abcdef" for c in signal_id):
        raise ValueError("Invalid analysis identity")
    result = {"kind": "tradelens_analysis", "schema_version": 1,
        "signal_id": signal_id, "pair": signal["pair"], "direction": signal["direction"],
        "snapshot_at": signal["snapshot_at"],
        "analysed_at": datetime.fromtimestamp(now, timezone.utc).isoformat(),
        "provider": provider, "status": status, "analysis": data,
        "execution_authorized": False}
    destination = outbox / (signal_id + ".json")
    temporary = destination.with_suffix(".tmp")
    temporary.write_text(json.dumps(result, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")
    temporary.replace(destination)
    return destination
