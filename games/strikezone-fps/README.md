# STRIKEZONE FPS — Solo Training v2.0 (Graphics Engine Upgrade)

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=2.0

Original browser-based 3D FPS for one human player against AI bots. Multiplayer is not included.

## Graphics v2.0

- Optional modern WebGL2 rendering layer using [Three.js](https://threejs.org/) r160.1 (MIT license) loaded from jsDelivr, with unpkg backup. The game remains playable even if the CDN module is unavailable.
- High-quality procedural texture materials with stone masonry, timber, metal, tinted windows and map signage. No commercial game meshes or copyrighted art assets are used.
- Hemisphere lighting, directional sunlight, physically based materials (metalness/roughness), soft shadows, tone mapping, atmospheric fog, sky dome, and additional soldier helmets and accessories when WebGL2 is available.
- Graphics quality selector: FAST / HIGH / ULTRA controls GPU resolution and shadow settings. If hardware acceleration is disabled, the selector is unavailable and the proven software renderer remains active.
- Better-differentiated temple walls, building facade colors, illuminated equipment, marked lanes, industrial props and roof fixtures in **both** renderer paths.
- Preserves v1.6 safe spawn points, wall sliding, manual U unstick, and all three AI modes.

## Enable enhanced graphics

Modern browser graphics need **WebGL2** and an internet connection for loading the Three.js module. In Chrome, use **Settings > System > Use graphics acceleration when available**, restart Chrome, then refresh this page. Browser privacy policy, drivers and device limitations can still prevent WebGL2 from working. If the tag at bottom right says `SOFTWARE GRAPHICS`, the game is in compatibility mode. HIGH / ULTRA rendering needs the tag to say `ENHANCED WEBGL2`.

## Performance

- FAST: fewer shadows, lower internal GPU resolution.
- HIGH: GPU physically based materials plus 1024 px shadow map.
- ULTRA: higher resolution with up to 2048 px shadow map (best for desktop GPUs).

High settings can significantly reduce FPS on modest graphics hardware. These are engine improvements, not photorealistic AAA game assets.

## Controls

WASD move, mouse look, LMB fire, RMB aim, Shift sprint, Space jump, C crouch, R reload, 1–5 weapons, P/Esc pause, U force unstick. Mobile touch controls are preliminary.

## Test status

The core game, menus and legacy renderer have been checked in automated Chromium in software mode, including 65 randomized safe spawn tests across desktop and smaller viewport sizes, with zero errors. Both game JS files pass syntax checks. The optional Three.js GPU engine could not be fully tested in the test environment because of network and WebGL2 restrictions; validate it on a WebGL2-enabled device after deployment.