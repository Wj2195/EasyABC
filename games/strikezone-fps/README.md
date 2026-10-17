# STRIKEZONE FPS — Solo AI Edition · Phase 2 (v1.4)

Original browser FPS prototype inspired by the arena-shooter genre. Single-player versus AI bots only — no online matchmaking or multiplayer server.

## Play
https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=1.4

## Features
- Three AI game modes: Team Deathmatch, Free for All, Gun Race
- Five weapons: VORTEX AR, RAPTOR SMG, RANGER DMR, JUDGE 12, SPECTRE P9
- Rookie, Regular and Veteran bot difficulty, browser-local XP and training record
- Phase 2 procedural 3D arena detail: temple reliefs, stonework, towers, floodlights, barrels, pallets, rocks, rooftop details and ridges
- Enhanced soldier models with armor, helmets, goggles, equipment and procedural walking motion
- Detailed weapon rails, optics, grips, muzzle hardware, upgraded sparks, new shading and sky
- Canvas 2D compatibility rendering now clips geometry near the camera and depth-sorts actors with scenery, improving occlusion behind walls
- No third-party art required; everything lives in one HTML file

## Controls
WASD to move, mouse to look, left mouse to fire, right mouse to aim, Shift sprint, Space jump, C crouch, R reload, 1–5 change weapon, P or Esc pause.

## Browser compatibility
The game attempts WebGL first, automatically falling back to a slower software-based renderer if WebGL is unavailable. Browser tests passed for the compatibility renderer; the available test environment could not provide a WebGL context for an end-to-end WebGL visual test. Graphics remain stylized low-poly, rather than AAA photorealistic. Mobile controls are preliminary.

## Local save
Training progress is stored on this browser only and can be lost if site data is cleared.
