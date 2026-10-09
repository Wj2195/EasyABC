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

## v0.9 — PC Click-to-Move

- **Left click anywhere in the visible map:** Character automatically walks toward the chosen spot.
- **Route planning:** Walks around houses, trees, rocks, fences and water using the game's collision rules.
- **Click a villager or building:** Walk toward them and automatically start talking/open the building when close enough.
- **Arrow keys:** Instantly interrupt autopilot for direct movement.
- **Shift + Left Click:** Use the currently selected tool on a nearby tile, as in previous versions.
- **Right click:** Existing Talk/Interact shortcut still works.
- **Click another location:** Replaces the earlier walking route.
- **Touchscreen phones:** Keep the existing virtual joystick controls. Automatic click-to-walk only activates on fine-pointer desktop devices.

No saved-game migration required. GitHub Pages v0.9.0 service worker precaches the click-to-move script for offline play.

## v0.10 — Mouse click-to-run and right-click Back

- **Left click in the world:** Automatically **run** to that destination at 5.8 tiles/second (previously 3.1).
- **Arrow keys:** Continue using normal walking speed and interrupt automatic movement.
- **Right-click while a menu, NPC conversation, or shop is open:** Go back to the previous selection, or close the menu at its top level.
- **Right-click during gameplay:** Cancel the automatic running route. It no longer activates Talk/Interact.
- **Shift + Left Click:** Use the selected tool on a nearby tile.
- **Mobile controls:** Unchanged, still use the in-game joystick and touch buttons.
- **Save data:** Unchanged; offline service worker cache version v0.10.0.
