# Evergrove v0.6 — Browser Game

Play: https://wj2195.github.io/EasyABC/Evergrove/

An offline-capable pixel-art farming, life simulation, RPG, sandbox and creature collecting game. Currently single-player; 2–10 player multiplayer rooms are planned, not active.

## Controls
- **Arrow keys:** Move
- **Z:** Talk, interact, confirm highlighted menu option
- **X:** Use tool, close a menu / go back
- **A / S:** Previous / next tool, or move through menu choices
- **1–8:** Select a tool directly
- **Esc:** Open settings or close menus
- **E / F:** Previous talk/use shortcuts are retained

PC displays the key guide inside the full-screen game viewport. Mobile landscape uses a translucent left joystick plus TALK/USE and tool controls on the right.

## Releases and saves
The page is served by GitHub Pages from this folder in the EasyABC repository. For updates, change the game files and increment the version in sw.js (currently evergrove-pages-v0.6.0). The updater offers a Save & Update prompt when new service worker content is ready.

Save data remains local to each browser using key `evergrove_offline_save_v1`. Export JSON backup in Settings before switching devices or clearing browser data. GitHub Pages hosting is free, subject to GitHub usage policies.


## Keyboard menu navigation (v0.7)

While a menu or conversation choice panel is open, **Up / Down** (also A / S) moves the highlighted choice, **Z / Right** confirms it and **X / Left / Escape** goes back. When no menu is open, the arrow keys move the character. Returning from a nested menu such as quests or gifts preserves the previous conversation.


## v0.8 PC readability and locked menu choices

- Up / Down (or A / S) now highlights *all* visible menu options, including disabled actions; locked actions remain unavailable.
- Z / Right confirms the highlighted option. Trying a locked action displays its reason.
- X / Left returns to the previous menu.
- Desktop dialogue, HUD, and menu text are larger; phone landscape stays compact.
- Save data is unchanged. Service worker cache version: evergrove-pages-v0.8.0.
