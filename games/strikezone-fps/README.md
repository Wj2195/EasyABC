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


## v2.4 graphics control fix

The bottom-right **ENHANCED WEBGL2** label is now an interactive graphics control whenever the mouse cursor is available. During pointer-lock shooting, the cursor is captured by the game, so **press G** instead. Each press cycles **FAST → HIGH → ULTRA → FAST**; from HIGH a single press selects ULTRA.

You can also press **P/Esc** to pause and select FAST, HIGH or ULTRA with visible buttons, or use the lobby graphics options. Quality preference is saved in this browser.

ULTRA now uses genuine 2x internal pixel-resolution scaling (rather than being capped by devicePixelRatio on 1x displays), 2048px directional-shadow maps, and extra GPU work. HIGH uses 1.5x resolution and 1024px shadow maps. FAST disables dynamic shadows and uses 0.95x resolution. If the enhanced WebGL2 engine is unavailable, these GPU-only upgrades cannot take effect; the game shows an explicit message instead of silently failing.


## v3.0 major art upgrade (October 2026)

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.0

The enhanced WebGL2 scene now has bump-relief masonry, wood and metal materials; additional illuminated fixtures; elevated fabric awnings; rooftop ventilation and antenna details; distant palms and suspended cables; more detailed enemy helmets, armor packs, knee pads, and team markings; first-person optic and rail details; and pooled weapon tracers.

These visual objects are decorative, **not extra collision boxes**. The existing safe-spawn and movement system remain unchanged. The corrected desktop mouse directions, A/D strafe, graphics-mode keyboard shortcut (**G**), live graphics status button, and pause-menu quality controls are preserved.

**GPU mode:** FAST (0.95x, shadows off), HIGH (1.5x, 1024px shadows), ULTRA (2.0x, 2048px shadows). The enhanced scene uses Three.js 0.160.1 loaded from public CDN endpoints when WebGL2 is available. If that code cannot load, the classic renderer remains the fallback, which will not show the new Three.js scenery. No multiplayer is included.

**Validation:** After GitHub upload, the HTML and renderer module were fetched back successfully and inspected for the new art code and existing control fixes. A full visual WebGL2 playtest on the user's GPU is still outstanding.


## v3.1 Mobile fullscreen, controls and sound

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.1

- Fullscreen buttons are available in the lobby and top-right in a match. Keyboard **F** also toggles fullscreen on compatible browsers.
- On Android Chrome, tap FULLSCREEN and rotate the phone to landscape. The game attempts to lock landscape when permitted.
- On **iPhone Safari**, ordinary browser tabs may not allow page fullscreen. Tap Safari **Share → Add to Home Screen**, then open STRIKEZONE from its home-screen icon for a standalone, app-like display. A manifest and SVG icon are included; behavior depends on iOS version and browser.
- Right-half touch swipe now matches the corrected PC camera direction. Swipe right to look right, up to look up. Camera and joystick gestures are independently captured so players can aim and move with two thumbs; both reset when gestures are interrupted or the device rotates.
- Web Audio synthesizes weapon-dependent gunshots, magazine manipulation and the final reload click. Sound is on by default; SOUND buttons in the lobby and HUD can mute it. Mobile audio is unlocked by a user gesture when the game starts or FIRE is tapped.
- Existing keyboard mouse, safe respawn, A/D strafe and graphics quality controls are unchanged.

**Testing:** GitHub source integrity, JavaScript syntax and the directional math were checked. Actual fullscreen behavior and audio volume must be tested on the target phone. No online multiplayer is included.

## v3.3 — Mobile combat layout and health regeneration

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.3

- Ammo count reduced to 27 px on desktop and 19 px on touch devices; reserve numbers and icons are also more compact.
- On touch devices, JUMP and CROUCH appear side-by-side near the bottom center. **Tap CROUCH once to crouch; tap again to stand.** CROUCH resets on respawn.
- AIM is positioned next to FIRE on the right, with RELOAD and WEAPON SWAP nearby. The mobile controls use safe-area padding and have an independent look-swipe zone.
- Health begins restoring **4 seconds after the most recent hit**, at **10 HP per second**, stopping at 100 HP. Taking another hit restarts the delay; health does not restore while dead or paused.
- Preserves fullscreen, Web Audio effects, safe spawns, keyboard aiming/strafe corrections, and graphics selection on the main dashboard only.

**Verification:** Repository file contents were fetched back and checked for the new control layout, regenerated health logic and preserved features. JavaScript parsed successfully and regeneration timing was simulated. In-device layout and gameplay should still be checked on your phone.

## v3.5 — semi-realistic tactical operators (Option B)

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.5

WebGL2/Three.js enemy characters now use original procedurally modeled humanoid anatomy instead of the prior voxel-like bot meshes: curved head and torso, proportional arms and legs, articulated hip/knee/elbow animation, gloves, boots, fabric camouflage (separate team palettes), cap/helmet and communication headset, tactical plate carrier with MOLLE-style pouches, and a rifle with recognizable receiver, magazine, stock, sights, and barrel.

Detailed accessories use distance-based visibility to reduce GPU cost. All 3D character pieces are generated in JavaScript, with no added network asset downloads or third-party character models. Hit detection, bot AI, safe spawning, damage, mobile controls, health regeneration, ammo and fullscreen are unchanged.

If the enhanced WebGL2 graphics path fails, the existing procedural bot rendering remains available. Character visuals have been syntax/integration-verified on GitHub, but they have not yet been visually confirmed on the player's actual GPU. This is a **semi-realistic stylized model**, not a photorealistic recreation of the reference image.
