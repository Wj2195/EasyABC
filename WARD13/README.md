# WARD 13 — The Awakening (early playable prototype)

A standalone first-person 3D psychological hospital horror prototype, hosted in a separate folder of the EasyABC GitHub Pages repository.

## Gameplay
- First-person keyboard/mouse and landscape mobile controls
- Explore Saint Mercy Hospital's ground floor and basement
- Collect a security access card and fuse; restore emergency power; escape via the ambulance bay
- Nurse and Patient AI, ambient hauntings, hiding, breath control, movable props, flashlights, flares and capture
- Six-slot equipment inventory, keys stored separately, local autosave/manual save
- Story / Survival / Nightmare difficulty, adjustable while safe

**Scope:** This is an early playable gameplay slice, NOT the intended 4–6 hour campaign or the two-player online mode. 3D models and environment are procedural placeholders; recorded voice performances, full animation assets and upper floors are not yet included.

The 3D rendering engine is loaded from jsDelivr on initial launch. After first load, the service worker attempts to cache the game and module for offline use. Offline availability depends on browser cache retention. Save files are stored locally and can be exported in-game.

## Controls
- WASD move; mouse look; Shift sprint; Ctrl crouch
- E interact; F flashlight; G throw bottle; H hide or exit hiding
- M map; I inventory; P pause; Esc pointer unlock/pause
- Mobile: joystick on left, look by dragging right-hand screen; right-side action buttons
