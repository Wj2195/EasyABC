# STRIKEZONE FPS — v1.6 (Contrast & Collision)

Original browser-based single-player FPS against AI bots. No multiplayer, backend, or external art assets.

## Play

https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=1.6

## Changes in v1.6

- Prevents player and AI respawns inside walls, buildings, sandbags or other solid objects by searching for sufficiently clear spawn points.
- Replaces the old movement resolution with a circle-based collision test, small sweep steps, and smooth axis sliding along walls and barricades.
- Adds **U** as an emergency position-recovery key, with a prompt after sustained blocked movement.
- Introduces greater visual contrast: light textured masonry, blue window panels, dark industrial steel, brown wooden crates, yellow caution decals, and stronger outline separation.
- Adds procedural cached Canvas textures in the software fallback and updates WebGL material shading.
- Adds backface culling and texture budgets for better performance in the software rendering mode.

## Controls

WASD move, mouse look, left click fire, right click aim, Shift sprint, Space jump, C crouch, R reload, number keys 1–5 switch weapon, P or Esc pause, **U** unstick / recover.

## Why the game may still look low-poly

The browser automatically uses a software renderer when it cannot initialize WebGL. If a banner says **SOFTWARE GRAPHICS MODE**, try enabling Chrome Settings > System > Use graphics acceleration when available, restart Chrome and ensure graphics drivers are up to date. WebGL may be unavailable on some devices or restricted browsers.

The software renderer is a compatibility mode and cannot match modern engine rendering quality. This remains a procedural, low-poly FPS prototype.

## Checks

Tested in automated Chromium without WebGL: three game modes, start/pause/menu/weapon controls and 120 forced player respawns with no spawn collisions; wall-sliding remained outside collision bounds. JavaScript had no uncaught errors. WebGL visual testing on a hardware-accelerated PC is still needed.
