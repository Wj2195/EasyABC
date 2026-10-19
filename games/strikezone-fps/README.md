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


## v3.6 — Grounded soldiers and smarter solo AI

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.6

- Soldier boots track the raised 0.60m central temple floor and its stepped entrances. The old 0.32m cap on cosmetic vertical correction was removed, so legs should no longer disappear into the temple floor. These changes affect 3D graphics only, not character collisions or movement.
- Bots evaluate line-of-sight and prioritize visible threats, change strafing direction, keep a preferred shooting distance, approach or retreat as appropriate, and seek cover near crates and columns when badly injured.
- Bots use recent target-position memory, navigation waypoints, local teammate separation, and blocked-movement recovery instead of pushing against walls indefinitely.
- Shooting now includes reaction delay and distance/movement accuracy adjustments. Rookie, Regular, and Veteran difficulties still differ.
- Walking gait is advanced only when the bot travels, reducing visible sliding and stationary marching.
- Desktop/mobile controls, audio, health recovery, graphics quality, and single-player modes are unchanged.

**Verification:** The deployed code was fetched back from GitHub. JavaScript syntax and deterministic floor-height tests passed; a simulated bot engagement showed movement, target tracking and attack behavior. Visual confirmation on the user's Chrome GPU remains outstanding.


## v3.8 — Armory and anatomical damage

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.8

Six independent firearm profiles are selectable using number keys **1–6**, the mobile **SWAP** button, or the main-menu **Starting Weapon** selector. Gun Race upgrades weapons automatically.

| Weapon | Base damage / projectile | Head multiplier | Magazine | |
| --- | ---: | ---: | ---: | --- |
| VORTEX AR | 28 | 2.20× | 30 | Balanced rifle |
| RAPTOR SMG | 19 | 1.95× | 40 | Fast close-range SMG |
| RANGER DMR | 53 | 2.45× | 12 | Accurate marksman rifle |
| JUDGE 12 | 11 × 8 pellets | 1.65× | 8 | Spread shotgun |
| SPECTRE P9 | 35 | 2.10× | 18 | Compact sidearm |
| PHANTOM SR | 85 | 2.60× | 5 | Precision sniper rifle |

**Body-zone multipliers before distance falloff:** Head uses each weapon's multiplier; chest armor ×0.82, abdomen ×1.00, arms ×0.66, legs ×0.52. Actual applied damage also accounts for the range falloff configured per gun and remaining enemy health.

Each gunshot consumes one round. Shotgun shells fire eight independently aimed pellets and total their damage on each target. Projectiles compare the nearest hit zone with the nearest solid wall, and the temporary feedback displays HEADSHOT!, ARMOR HIT, BODY HIT, ARM HIT or LEG HIT with damage points.

All six guns have unique weapon silhouettes. The change preserves gun race, bots, solo matches, PC and mobile controls, health regeneration, audio and graphics. Verification included Javascript parsing, anatomical ray tests (including raised temple ground) and scripted firing/damage tests for all six guns. A full visual GPU playtest on the user's machine is still needed.


## v3.9 — Realistic tactical weapon graphics

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.9

- Six new original 3D first-person firearms replace the flat box models in enhanced WebGL2 mode: VORTEX AR, RAPTOR SMG, RANGER DMR, JUDGE 12, SPECTRE P9, and PHANTOM SR.
- Gun-specific geometry includes metallic receivers and ejection ports, barrel and muzzle attachments, stocks, tactical rails, optics/scopes, grips, magazines (or under-barrel shotgun tube), vent slots, screws and detailed silhouette shaping. Gloved hands/arms hold the weapons.
- Procedural PBR material maps give polymer, brushed metal, rubber, tan/olive finishes, and skin/gloves more visible contrast. A new opposing light improves readability.
- The new graphics module has persistent/cached models; it does not regenerate triangle meshes per frame. ADS aligns sights with the crosshair; gun motion follows recoil, walking and reloading. Muzzle flash is modeled separately for the active gun.
- Graphics load from weapon-rig.js (version 3.9.1). If the new module fails to load or the browser cannot support enhanced WebGL2, the original lightweight weapon model remains the fallback.
- Damage profiles, headshot zones, ammo, gun race, bots, phone controls, floor physics, and sound effects remain unchanged.

**Verification:** Six weapon meshes initialized (559 model components), switched, aimed, reloaded and disposed in a mocked renderer runtime. JavaScript and integration checks passed. The final appearance and frame rate should be confirmed on the target PC and phone with the WebGL2 renderer.


## v3.10 — Respawn weapon visibility and real sniper zoom

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.10

- Fixed an invisible first-person gun after dying/respawning with the same weapon. Weapon rig now re-enables visibility on each alive frame and resets its cached active weapon on death.
- The PHANTOM SR sniper ADS mode is a clear scope viewport with magnification levels **2×, 4×, 8×** (perspective fields of view: 36°, 20°, 11°). The first-person sniper model is hidden while aiming through the scope; other guns remain visible while aiming.
- **Desktop:** Right-click and hold to aim, then use the **mouse wheel** to zoom in/out, or **Z** to increase and **X** to decrease magnification. **V** can toggle aiming. The zoom starts at 4× and resets on respawn.
- **Phone:** Tap **AIM** with the sniper selected, then tap the **+ / −** controls near the top right of the scope. Tap AIM again to lower the scope.
- A transparent circular lens, reticle, zoom readout and light outside vignette show your current aim. Zoom works in enhanced WebGL2 and original WebGL compatibility renderers; the fallback 2D renderer follows the same FOV.
- Existing six-gun base damage, anatomical headshots, enemy AI, control directions, floor positioning, fullscreen, audio, and regeneration are unchanged.

**Verification:** JavaScript syntax checks passed for the page, enhanced renderer, and detailed weapon rig. Simulated weapon visibility cycles passed for draw→death→respawn, scoped sniper, returning to hipfire and switching models. Scope visibility/FOV simulations passed for all three zoom levels and states. Actual scope visuals, pointer lock and mobile zoom buttons still require testing on the target devices.


## v3.11 — Clear DMR optics and precision aiming

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.11

**Bug fixed:** A screenshot in v3.10 showed the opaque rear of the RANGER DMR scope filling the crosshair. The problem was caused by the gun rig using capped cylinders for scope glass and excluding the DMR from the precision-scoped camera mode.

- The RANGER DMR now uses an unobstructed, transparent precision sight with **1.5× / 2× / 4×** magnification, 2× default, a reticle, zoom readout and lighter peripheral vignette. The PHANTOM SR sniper retains its **2× / 4× / 8×** scope, 4× default.
- Scoped DMR and sniper weapon meshes are suppressed **only while precision aiming**, so neither the opaque optic nor the rifle receiver can hide targets. Non-precision rifles remain visible while aiming.
- The base optics on all six detailed models now have open sight rings instead of opaque cylinder end caps, so their reticles no longer point at a solid disc.
- Both precision weapons use Z/X or mouse wheel to change zoom on PC; touch browsers use +/−. The enhanced WebGL2 renderer, legacy WebGL renderer and software fallback use matching magnification and gun hiding.
- Respawn weapon visibility, six independent firearm damage profiles, headshots, floor physics, solo AI and audio have been preserved.

**Checks:** JavaScript syntax passed; scoped/unscoped state and field-of-view tests passed for DMR, sniper, assault rifle, death and return to hip fire. In-game visual verification in Chrome and phone browsers remains necessary.


## v3.12 — NOVA PULSE energy cannon

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.12

A new **seventh weapon**, **NOVA PULSE**, is available as the starting loadout, by pressing **7** on PC, or using **SWAP** on mobile. It is a charge-and-release energy launcher rather than a normal hitscan gun.

- **Charge:** Press and hold FIRE for a continuous **2 seconds**. The on-screen charge meter fills and changes to **FULL CHARGE — RELEASE FIRE**. Release FIRE to discharge. Releasing early cancels without consuming ammo. Moving while charging is 40% slower. Switching weapons, pausing, losing focus, death and respawn cancel an unfinished charge.
- **Projectile:** Each shot consumes one energy cell (4 magazine / 20 reserve, 3.3-second reload). It travels at **39 game units/second**, exactly 65% of the defined 60-unit/second comparison speed; the six traditional guns remain instant-hit hitscan, so there is no actual bullet flight speed to multiply. Energy cells are visible luminous orbs and collide with the environment, soldiers or their maximum 80-unit range.
- **Impact:** Releases an expanding **5.4-unit radius cyan shockwave** with a maximum **24 splash damage** (decreasing toward the edge) against enemies. The blast knocks **all** players and bots inside the radius away, including allied soldiers and the shooter. Allies and the shooter experience knockback without friendly-fire damage. Knockback creates a short airborne arc and respects movement collision constraints.
- **Presentation:** New 3D energy cannon with luminous magnetic rails, cyan coils and charging core, synthesized charging/impact sound, animated projectile glow, shockwave rings and HUD charge meter. Enhanced WebGL2, legacy WebGL and software-mode visual fallbacks are supported.
- **AI/gameplay:** Existing weapon damage, accuracy, headshot detection, team modes, mobile controls, fullscreen, respawn, player floor positioning and AI behavior stay in place.

**Testing:** JavaScript syntax passed for HTML, renderer and 3D weapon rig. Seven weapon meshes initialized and updated. Deterministic simulations verified early-charge cancellation, 2-second charge release, 39-unit/sec projectile travel, enemy damage, allied and player knockback, airborne bots and targets outside the blast radius. Final visual/audio and mobile multitouch testing still requires playing on real devices.


## v3.13 — AEGIS S8 shield and adaptive eight-weapon AI

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.13

### Eighth weapon: AEGIS S8
- A new original **police-style tactical ballistic shield** is available as starting equipment or by pressing **8** on desktop. On mobile, use **SWAP** to cycle to the shield. FIRE executes a close-range shield bash; holding FIRE repeats bashes at the weapon's cooldown.
- **Front-facing defense:** A shield protects a 130° front arc when held toward incoming bullets. It absorbs up to 92% of incoming body/head damage while shield health lasts. Exposed leg hits have reduced protection (56% absorption). Side and rear attacks remain unblocked. A shield has **360 shield-health points** and regenerates after seven seconds without shield damage while equipped. The shield movement penalty is 27%, and it has a 23-damage close-range shield bash.
- Distinct models in enhanced WebGL2 and classic renderers include a reinforced dark frame, upper visor, support bars and transparent viewing panel. Equipped shield-health is shown in the weapon HUD instead of ammunition.

### Bots understand all eight weapons
- Each bot begins with one of the eight weapon roles. Bots adjust their preferred distance and movement: SMG and shotgun rush at shorter ranges, rifle and pistol favor medium range, DMR and sniper aim at long range, energy-cannon bots charge for two seconds and launch slow-moving shockwave projectiles, and shield-equipped bots face threats, advance defensively and bash at short range.
- AI supports weapon-specific firing cadence, magazine ammunition, reloads, tactical weapon swapping, a backup weapon when out of ammunition or when the shield breaks, cover-seeking at low health, shield flanking, dodging incoming energy orbs, aim reaction delays and teammate collision avoidance.
- Bot-fired energy waves now have actual ownership, can injure the player if fired by an enemy, and preserve team-aware splash-damage rules. Shockwaves can still knock friends and enemies back without friendly-fire damage.
- The bot models reflect their selected equipment: shield, pistol, glowing energy cannon, shortened SMG, shotgun, long DMR and sniper shapes; uniform shirts retain blue/red team identification.
- Solo/offline matches, modes, previous six conventional guns, charged NOVA PULSE, headshot damage, collision positioning, 3D graphics, sound and mobile controls remain intact.

**Checks:** Source JavaScript parsing passed for the HTML, GPU renderer and 3D weapon rig. Directional protection tests verified front/side/rear/leg hits and depleted shield durability. Eight-role AI simulations ran through all weapon indices, consumed ammunition and fired a charged energy shot. Owner-aware energy splash tests verified enemy damage to player, no allied damage and knockback. The eighth player weapon model passed simulated weapon switching, death and respawn. Actual GPU rendering and touch controls still require playtesting on the user's devices.
