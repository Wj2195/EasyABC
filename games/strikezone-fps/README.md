# STRIKEZONE FPS — Solo + Online Multiplayer v3.39

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.39

Original browser-based 3D FPS with offline AI operations and private-room online Team Deathmatch.

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


## v3.14 — Fallen soldier animation and temporary bodies

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.14

When a soldier is eliminated, the humanoid model topples to the ground over approximately **0.42 seconds**, then **remains lying on the ground for a full 2 seconds**. The body disappears afterward, before the existing bot respawn at 2.7 seconds after elimination. Soldiers stop targeting, firing and taking hits immediately on elimination; the temporary body is visual only.

- Enhanced WebGL2 soldiers fall with their whole body, tactical outfit, shield/weapon and limbs. Shadow placement is kept separate from the tilted body.
- Legacy WebGL and software renderers also show a fallen pose by transforming soldier part positions and dimensions.
- Respawning restores the upright animation, footsteps, weapon visibility and all existing AI behavior.
- A match reset removes previous fallen bodies. Blue and red team uniforms remain distinct.

**Verification:** Inline game JavaScript and enhanced WebGL2 renderer passed syntax checks. Simulated death timing and fallback mesh rendering verified intermediate falling, a completed fallen pose, corpse visibility during the two-second resting interval and removal before respawn. Actual GPU/mobile playback still needs visual confirmation.


## v3.15 — AEGIS shield: zero damage on protected hits

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.15

This supersedes the previous v3.13 partial-damage/durability rules. When the AEGIS S8 is equipped, **any incoming damage intercepted from the front or sides** to the chest, abdomen, arms or legs is **completely blocked (0 HP damage)**. This includes conventional bullets, shotgun pellets, energy-cannon splash damage and close-range bashes.

**Exceptions:** **Headshots always deal damage**, even from the front. **Attacks originating from behind** bypass the shield and deal normal damage at every body zone. The rear 120-degree cone is considered "behind"; the front and sides (remaining 240 degrees) are protected. The shield no longer loses durability from intercepted hits and cannot break through sustained fire. The weapon HUD shows **SHD ∞** and **BODY BLOCKED · HEAD / REAR EXPOSED** instead of misleading shield health. Protected player shots display **SHIELD BLOCKED +0 DMG**.

Damage calculation is shared by player and bot soldiers. For shotguns, head-hit pellets and body-hit pellets are applied separately: a headshot pellet cannot cause blocked body pellets to slip past the shield. Energy splash is tested against the **actual blast location**, rather than against the shooter position. Shockwave physical displacement may still occur even when the shield prevents HP damage.

**Verification:** Direct simulations confirmed zero damage from front/side body, arm and leg hits, front blast damage, no shield wear, normal front headshot damage and full rear damage. WebGL/compatibility assets and previous weapon/AI behaviors remain unchanged. In-browser playtesting still recommended.


## v3.16 — Lower ADS gun models; keep crosshair and target visible

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.16

**Problem fixed:** Screenshots showed the JUDGE 12 shotgun and SPECTRE P9 pistol obstructing the reticle and forward view in aim-down-sights (ADS) mode. Some rifles similarly placed their receivers directly in front of the camera.

- Enhanced WebGL2 first-person models now sit **lower, slightly right and farther away from the camera** while ADS is active. Shotgun and pistol have individually tuned offsets. ADS weapon geometry is also scaled down slightly to reduce obstruction.
- The first-person crosshair has a higher overlay priority and greater visual contrast while aiming, without changing bullet trajectory, weapon damage, spread, headshot regions, health, bot AI or physics.
- Classic WebGL and software fallback use equivalent lower-right ADS positions for the same weapons.
- PHANTOM SR and RANGER DMR continue using their transparent 2x/4x/8x and 1.5x/2x/4x precision scopes, hiding the 3D model while scoped. AEGIS S8 shield still retains its protective appearance.
- Versioned script assets v3.16 bypass older cached v3.13 weapon-rig assets.

**Verification:** JS syntax validation passed; all eight procedural 3D weapon models were constructed and updated. Position tests showed pistol and shotgun shifting below center during ADS, and sniper/DMR hidden in the scope mode. Death and respawn model visibility passed. Full visual browser QA and mobile touch checks should be done on the target devices.


## v3.17 — Weapon-aware multi-shot bot AI

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.17

The solo-training bots now fire **multiple shots per engagement**, rather than treating all conventional weapons like single-shot guns. Each bot tracks its current burst, recoil progression, target, next-fire cooldown and pause between bursts:

- **VORTEX AR:** controlled bursts of **3–6 rounds**.
- **RAPTOR SMG:** longer automatic bursts of **5–10 rounds**.
- **RANGER DMR:** measured bursts of **2–3 rounds**.
- **SPECTRE P9 pistol:** quick **2–4-round** strings.
- **JUDGE 12 shotgun** and **PHANTOM sniper:** one deliberate shot per attack, with longer pauses appropriate for their weapons.
- **NOVA PULSE:** retains its two-second charge-and-release projectile and shockwave.
- **AEGIS S8 shield:** retains its single close-range bash.

Burst timing respects each gun's real in-game rate-of-fire, ammunition, reload time and difficulty level. Recoil builds slightly throughout a burst; distant or badly injured bots take shorter bursts. Bots pause and reacquire their target if line of sight is lost, reset bursts on target or weapon changes, and hold fire when a teammate is standing between them and an intended target. They can reposition before shooting again.

**Visuals:** Each bot shot produces a visible tracer. New short-lived muzzle flashes are shown on humanoid weapon models during conventional firing, without altering projectile damage or the player's reticle. Existing shield mechanics, headshots, energy attacks, smart navigation, two-second fallen bodies and mobile controls are unchanged.

**Verification:** Simulated 4.4-second firing sequences validated rapid successive rounds for assault rifles, SMGs, DMRs and pistols and deliberate single-shot patterns for shotgun/sniper. A teammate placed directly in the lane prevented shots; removing it resumed fire. Source syntax checks passed. Full PC and mobile browser gameplay still needs visual/audio testing.


## v3.18 — Fix shield shots from behind

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.18

**Bug:** The 3D soldier mesh was rotated with `-bot.yaw` even though the collision, firing and defensive code all treat `bot.yaw` as facing `(+sin(yaw), +cos(yaw))`. This meant the shield could appear to be facing away from the player while the damage logic considered a shot frontal. The previous 240-degree shield protection arc also extended too far behind the soldier, and the shield bot could turn toward attackers nearly immediately.

**Fix:**
- Enhanced humanoid and compatibility mesh yaw now uses the same heading as projectile collision and shield defense.
- Frontal hits on the body, arms and legs remain **0 damage**; exposed headshots always deal normal damage.
- The shield protects the forward hemisphere with a small side-on tolerance; shots entering from rear quarters or directly behind **deal normal damage**. Shotgun pellets and explosion impact origins continue to use the same logic.
- A shield bot turns at **1.75 radians/second** instead of 5, allowing a legitimate opportunity to reach and fire at its vulnerable back before it can face its shield toward you.
- Blue AI teammates remain non-damageable by player bullets in team-deathmatch mode. Test rear damage against a red enemy shield carrier.

**Verification:** Tested body/head shot ray-sphere intersections and shield damage against defenders facing 0°, 90°, 180° and 270°. Frontal body hits yielded 0 HP damage, rear body/head hits yielded normal damage, and side-on body shots remained blocked. Code syntax checks passed. Actual browser-facing graphics and online page propagation should still be visually verified.


## v3.19 — MAP 001: TRI-SECTOR LABYRINTH (first of three planned maps)

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.19

This is **Map 1 only**. Two further maps can be designed and introduced later.

Inspired by the supplied sketch: a compact **blue team spawn base at the north end**, a much larger **magenta-accented central maze**, and a compact **orange/red team base at the south end**. The map is built into the game's existing offline single-player AI experience.

### Layout and scale

- **Previous map:** approximately 64×64 game units.
- **New central zone:** approximately **108×120 game units**, joined to north and south deployment sectors for an overall map height of **164 units**.
- **North base:** blue-team deployment near Z = -74; protected against side entry with **three passages** into the central arena.
- **South base:** red-team deployment near Z = +74; mirrored connections into the same arena.
- **Main maze:** eight full-sized rooms with multiple entrances, internal wall partitions, rooftop outlines, cover props, alleys, central open command hub, lateral crossing lanes and two long flanking routes.
- **Combat routes:** front assaults, chamber-to-chamber movement, central hard-cover engagements, covered side paths and a flank around both room banks. Solid walls, barriers and crates take real collision and block gunfire.
- **Environment:** new central magenta markings, navy/blue and orange/red base floors, perimeter walls, elevated nonblocking architectural details and matching map signage in enhanced WebGL2. The minimap now shows the tall full-map outline.

### Systems upgraded for a larger map

- Pathfinding grid expanded to **85×85 cells** with 2-unit spacing, correcting the previous 30×30 navigation limit. Full-coverage BFS and route smoothing support long trips and maze turns.
- Movement boundaries, collision resolution, line of sight, safe spawn selection, respawning and unstuck recovery now cover the irregular central rectangle plus narrower team bases.
- Both teams spawn at opposite ends. Blue player and blue allied bots start in the north, red enemy bots at the south. Every spawn entrance and maze chamber is reachable from both ends.
- Match timer extended to **six minutes**, giving more time to move through the substantially larger arena.
- All eight weapon types, advanced multi-shot bot AI, directional shields, energy shockwaves, health regeneration, fullscreen/mobile controls, and fallen-soldier animations are retained.

### Verification

- Parsed updated JavaScript successfully.
- Generated **181 solid collision obstacles**, and checked the resulting walkable grid. All **3,017 traversable navigation cells** belong to a **single connected component** (no isolated walkable pockets).
- Confirmed sample bot routes between both team bases, all four room rows and both flank corridors.
- Enhanced renderer updated for expanded shadows, map signage and draw distance.
- Actual gameplay, device frame rate, and mobile browser touch-control testing remain to be verified in a real browser.


## v3.20 — Map 001 Urban Warfare Rebuild

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.20

The size and two-end team spawn layout of v3.19 are unchanged. The main arena has been visually and structurally rebuilt to evoke a dense, modern military FPS city district instead of repetitive toy-like square rooms. This is original artwork/geometry rather than copied Call of Duty assets or maps.

### Eight enterable buildings

Each former empty square now has themed facade colors, 4 usable entrances, true window openings at weapon sight height, interior walls/partition routes, floor materials, raised roof detail, cornices, signage, overhead ventilation and distinctive cover:

1. **Freight Depot:** loading racks, shelving and generators.
2. **Comms Center:** tactical workstations, consoles, monitors and security lockers.
3. **Vehicle Garage:** original modeled military utility vehicle, rack storage and repair equipment.
4. **Field Clinic:** beds, treatment screens and storage.
5. **Operations Offices:** partitioned offices, desks, cabinets and computers.
6. **Night Market:** shop stalls, striped awnings, counters and cafe-style kitchen.
7. **Barracks:** bunks, lockers and troop storage.
8. **Power Station:** diesel generators, pipework, machine housings and service racks.

Buildings are all on the existing **ground-floor play plane**; roof terraces and elevated bridges are architectural details rather than enterable upper floors. Doorways are physically open and wide enough for player/bot movement. Window openings expose firing lanes above low sills; upper trim/awnings are visual-only to avoid invisible movement blockers.

### Surrounding streets and GPU graphics

- Long decorated facade rows with window openings, pilasters and weathered plaster/brick.
- Streetlights, footpaths, curb and crossing paint, checkpoint barricades, service corridors, storefront canopies, external AC units, rooftop fans and pipework.
- New original material IDs for slate, pale plaster, tactical olive, safety yellow, glass, brick, tar roofing, rust, tiled floors and teal.
- Canvas-generated worn masonry, stained plaster, ribbed steel and safety-striping textures in enhanced WebGL2; fallback WebGL palette also updated.
- Distinct labeled signs at both ends of all eight buildings and translucent glass panes in the GPU renderer. Transparent panes are visual and do not prevent bullets from passing through an aperture.
- Static scenery is batched in the existing renderer; no additional third-party game assets, textures or accounts required.

### Navigation and compatibility

The full footprint is still roughly **108×164 game units**, with **Blue** and **Red** spawning at opposite ends, 6-minute matches, and the 85×85 AI grid. A static simulation generated **329 obstacle colliders** and **2,536 architecture/detail pieces**; all **2,946 walkable grid cells** formed one connected navigable area. Both team bases reached all eight building centers in path tests. Existing eight weapons, intelligent burst-fire bots, shield mechanics, scope aiming, mobile controls and 2-second fallen-body persistence are retained.

**Limitations:** Code parsing and collision/navigation simulation were verified. Final visual quality, frame rates and touch performance should be tested in a Chrome/Android browser. This upgrade adds original detailed procedural 3D geometry; it is not a fully photorealistic AAA asset/lighting pipeline.


## v3.21 — Dense Urban Combat / 13 Enterable Buildings

**Play:** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.21

Built from the user's approved Map 1 room plan; **only Map 001** was modified. This release preserves the existing **108×164-unit footprint** and the north/south opposing spawn positions, but it is more enclosed and intentionally tactical.

### Building and section layout

- The existing eight themed buildings (depot, comms, garage, clinic, offices, market, barracks and power station) remain enterable.
- Five **additional enterable central buildings**: North Security Checkpoint, Armory & Stores, Tactical Command, Maintenance Works and South Security Checkpoint.
- All **13 primary buildings** feature genuine openings, roof/overhang detailing, walkable ground floors, and interior obstructions providing cover and choices. The new five center interiors have offset doorways, partitions, workstations, lockers and industrial equipment.
- Two robust sector boundaries divide the map into **three major combat districts**. Players can cross the sector lines through controlled central building entry/exit corridors. Other alleys include barriers and short bends to eliminate long straight firing lanes.
- Streets feature additional cover, security barricades, overhead service piping, rooftop equipment, fluorescent strips, thin glazed window visuals, restrained new signage, and higher architectural density.
- These assets are original procedural geometry and materials, not copied Call of Duty maps or licensed 3D assets. **This is not photorealistic AAA art**; the focus is believable and playable enclosed layouts rather than blocks placed at random.

### Neutral-color team spawns

- Blue and red retain distinct north/south starts, but the large colored walls, floor patches, columns and partitions were replaced with **neutral plaster/concrete/tile/steel**.
- Only small floor stripes, signs and checkpoint panels communicate team color.
- Respawn coordinates remain safely inside their bases, and neither base has an artificial team-colored arena covering the whole sector.

### Verified movement and AI

- The **2-unit navigation grid** now includes cached collision-checked edges. This prevents bots from "pathing" through a thin wall between two clear grid nodes, a problem the previous version could encounter at the new checkpoint walls.
- Physical movement checks use 0.36-radius collision and 0.18-unit incremental steps along waypoints. Tested routes from **both team spawn areas to each of the 13 building centers**.
- Narrow unreachable alcoves around the south transition were corrected by aligning a checkpoint wall with the existing facade.
- The existing eight weapons, burst-fire AI, directional shield protection, charged energy weapon, headshot damage, temporary downed bodies, mobile controls, minimap and 6-minute match timer remain intact.

**Validation:** Source JavaScript parses successfully. Geometric and collision/nav graph integration tests should be rerun on the final release version. GitHub commit does not guarantee immediate GitHub Pages publication; browser caches may require using the versioned link above.


## v3.26 — Operation: Zombie & Monster (October 2026)

The fourth operation is a **two-team Overlord boss race** on the existing 13-building connected urban map. ALPHA (the player + four allied bots) and DELTA (five bots) compete for the final blow; the team that kills the boss wins. No timer or deathmatch score can end this operation while the boss lives.

- **Overlord:** one giant, armored monster spawning randomly at a collision-checked navigable location across all three combat sectors. 5,200 HP shown on a dedicated top-of-screen boss health bar. It pursues soldiers and deals a sweeping **22-damage multi-target** attack within its 7-unit radius (with line-of-sight checks). The minimap shows its location.
- **Zombies:** 23 roaming undead, five of them agile runners. Regular zombies use close-range melee attacks, while runners pursue at almost twice the speed and strike faster. They can injure the player and bots on **both teams**, and respawn after a delay. The minimap distinguishes normal, agile and boss enemies.
- **Lightsaber:** the ninth weapon, available from starting-loadout selection and the **9** keyboard key. No ammunition/reload; short-range cyan energy-blade swings harm the boss, zombies or opponents in other operations. Procedural models are available both in the enhanced 3D renderer and the fallback renderer.
- **Damage accounting:** blue and red HUD scores display total damage dealt to the Overlord, but the **last damaging hit**, not highest damage, wins the match.
- **Enhanced rendering:** procedural Overlord and undead actors, raised limbs and animated movement, blade model and swings, red boss area-attack indicator. WebGL2 is optional; fallback geometry remains provided.
- **Legacy operations unchanged:** Team Deathmatch, Free For All, Gun Race, shield durability, respawns, shooting/energy cannon, soldier AI and existing map layout remain available.

### Verification

- Main JavaScript syntax and module JavaScript syntax validated.
- Tested 60 safe Overlord spawn candidates across the northern, central and southern map sections, plus 73 valid zombie spawn points.
- Simulated Overlord death by **last-hit red bot**, repeated blue-team damage without early victory, zombie death and respawn, and multi-target sweep hurting both teams.
- GitHub Pages deployment confirmed separately by its latest workflow; manual live browser performance/balance testing remains recommended.



## v3.27 — Zombie & Monster: PvP / 50,000 HP boss / ammo looting

- **Blue vs Red PvP is active:** in Zombie & Monster, human player and red bots, as well as opposing blue/red bots, can hurt and eliminate one another. Allied blue operators remain protected from accidental friendly fire from player shots, energy explosions and allied bot shots.
- **Overlord HP is 50,000:** the boss remains the only win condition, with no time limit. The team delivering the **final blow** wins, regardless of team damage totals.
- **Bigger horde:** 48 simultaneously spawned zombies, including 10 agile runners, roaming and respawning throughout the map. Spawn selection avoids crowding nearby living zombies when alternative safe positions are available.
- **Guaranteed ammo drop after EVERY zombie kill**, no matter which team kills it. A glowing ammo crate remains on the ground for 48 seconds or until collected. Anyone from either team picks it up automatically when within ~2m. Regular zombies drop one magazine for the current ranged weapon; agile zombies drop two magazines. If wielding the shield or Lightsaber, ammo applies to the last selected ranged weapon, or VORTEX AR by default. Drops refill the clip first and place overflow into reserve.
- **3D loot:** cyan ammo boxes and golden highlights for agile-zombie drops are rendered by the enhanced WebGL2 path, fallback meshes and minimap.

**Validation:** Main, enhanced renderer and weapon rig JavaScript syntax verified. Simulated Blue and Red bot targeting, direct player rifle damage to Red while sparing Blue, normal and agile ammo collection by player/bots, boss survival at 100 HP, and final Red-team victory from the 50,000-HP boss. Manual live browser FPS/AI balancing is still recommended.



## v3.28 — Intelligent Zombie Suppression and Overlord Chain Lightning

- **Zombie-aware rapid fire AI:** soldiers handling hordes now prefer automatic SMG/AR weapons when at least two zombies are nearby, fire much longer controlled multi-round bursts, pause less between bursts, reacquire new undead targets faster and shoot more accurately. Existing PvP and boss-target gun profiles remain less aggressive.
- **Overlord lightning attack:** every approximately 5.7–7.5 seconds when it has targets in sight, the boss charges for ~0.87 seconds with an electrical warning and ground glow. It then fires a long-range electrical bolt up to 36 units, capable of chaining through up to three additional soldiers within 11.5 units of the previous target. Damage decreases across links (35, 23, 17, 12); every link checks wall obstruction. Either team may be struck; shields absorb frontal strikes until broken.
- **Visible lightning:** animated cyan/violet jagged world-space energy arcs, electrical charging glow and 3D light on the enhanced WebGL2 engine, plus fallback effect geometry on WebGL1/Canvas2D.
- **Kept unchanged:** 50,000 HP Overlord, 48 simultaneous zombies (10 agile), guaranteed ammo pickups, cross-team PvP and final-hit-only boss victory.

**Validation:** JavaScript main game and enhanced renderer parse successfully. Isolated firing simulation over 2.4 seconds yielded 29 zombie-rapid rounds vs 24 ordinary burst rounds with the same weapon and mock target. Verified the boss warning, charge timing, chaining to blue/red soldiers, LOS blocking of a soldier behind cover, cooldown and lightning expiry. Browser playtesting is still necessary for actual frame rates, appearance and balance.


## v3.29 — Boss-first soldier objective and huge electric lightning

- **Mission-first navigation:** Zombie & Monster AI now routes directly toward the living 50,000 HP Overlord instead of pursuing every wandering zombie. Unlike v3.28, its firing target and its movement objective are independent.
- **Short defensive engagements:** Bots only turn their guns onto visible zombies / rival soldiers within close danger range (8m for regular undead, 10m for agile undead, 12m for rivals; recently damaging attackers can be engaged within 17m). Their navigation goal remains the Overlord even while suppressing a close threat.
- **Aggressive pursuit:** Bots move 14% faster toward the boss in this operation, preserve wall-aware navigation routes while firing, and switch to direct boss combat when close enough. Normal Deathmatch / Free For All / Gun Race pathing remains unchanged.
- **Giant lightning visuals:** Enhanced WebGL2 now renders the boss's electrical strike as pooled, fully 3D **thick segmented cylinders**: white-hot center, bright cyan middle and wide violet additive glow. It uses large zig-zag distortion, a glowing charge orb, a larger ground ring and brighter electrical lighting. Its visible duration is 1.05 seconds. WebGL1/Canvas fallback lightning was thickened as well.
- The prior behavior remains: random boss spawning, 48 zombies (10 agile), bot rapid-fire defense, ammo drops, Blue vs Red PvP, chain lightning across up to four exposed soldiers and final-boss-hit victory.

**Validation:** JavaScript parses; unit simulations confirmed a bot selects close zombie and rival threats but refocuses on the Overlord when they are distant; its path destination remains the boss while shooting an immediate zombie; enhanced graphics module passes syntax validation. Full browser gameplay/visual testing remains recommended.


## v3.30 — Online Multiplayer Beta (room-code matchmaking, browser-to-browser)

An initial **free 2–6 human player private-room Team Deathmatch** is available inside the same browser game. The lobby features CREATE PRIVATE ROOM, six-character room codes, copyable invite URLs, JOIN ROOM and HOST START.

- **Host:** opens Online Room, creates a private room, shares its room code/link, waits for up to five friends, then clicks START ONLINE MATCH. Hosting relies on keeping the host browser connected.
- **Guests:** use the same GitHub Pages link, enter the code (or open the host's invite link) and select JOIN ROOM; match starts when the host clicks START. The game assigns teams automatically, and friends replace AI soldier slots. Existing AI fills vacant slots.
- **Synchronized:** host controls AI, movement snapshots, player/bot avatars, hits, HP and destructible shield, ammunition/reload counts, respawns, red/blue scores and end-of-match results. Guests send their own movement and fire commands; host resolves damage. Weapon options include melee/light saber and the energy weapon (currently instant launch for online guests rather than an authoritative charge sequence).
- **Network:** the online system uses PeerJS 1.5.5 and the public free PeerServer cloud for signaling, plus encrypted WebRTC data channels for browser-to-browser real-time gameplay. No account signup, paid server or installed game client required. PeerJS loads only when the user opens a room, so solo/offline play does not depend on the service.
- **Limitations:** Beta is **private online Team Deathmatch only**. The Zombie & Monster boss operation remains offline while its 48 zombies, boss fight, projectiles and AI require a future authoritative multiplayer synchronization pass. There is no public matchmaking, reconnect/resume, dedicated server, cross-NAT TURN relay, competitive anti-cheat, or server-host migration. Some corporate/mobile/router networks may block peer connections. Online results require two distinct browsers/devices to test live.
- **Controls:** when a guest's match launches remotely, click the game canvas once if the browser has not yet granted mouse pointer lock.

### Validation
- Main game HTML/JavaScript parsed successfully.
- Mocked room host test: remote slot assignment, movement replication, PvP hit to the host and world snapshot passed.
- Mocked room guest test: welcome/start, synced bot + host avatar, fire transmission, death and health/ammo restored on respawn passed.
- No two-device WebRTC gameplay test has been performed by ChatGPT; treat this as a functional beta requiring real player testing.


## v3.31 — Denser urban tactical arena (Map 1)

Play: https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.31

Built on top of the existing v3.30 version, preserving nine weapons and the previous map improvements.

- Adds **four new enclosed and enterable service annex rooms** in formerly open flank areas, with framed doorways on opposite walls, windows, interior props, industrial roof elements and true obstacle collision.
- Adds a pair of security gate choke-point partitions between the central district and the northern/southern approaches.
- Adds nonblocking street fixtures and small room identity details without creating the huge unbroken blocks that previously obscured forward visibility.
- **Spawn areas remain primarily neutral concrete**, using narrow blue/red accent markings, not large team-colored walls or floors.
- Keeps the existing map dimensions, two opposed team spawns, main urban buildings, dense center rooms, navigation, AI, and weapons unchanged.

**Validation:** Main JavaScript parses. Real collision-navigation simulations tested routes from both bases to all four new service rooms and the central hub; all 10 sampled routes reached their destination and none of the tested interior locations are blocked. Full browser performance/visual QA still required.


## v3.32 — Mobile joystick, camera swipe, compact boss HUD and automatic landscape

- **Mobile left-stick input repaired:** a physically grounded, radius-aware virtual joystick now provides independent forward, backward, left, right and diagonal directions with a dead zone. Its active pointer is followed at window level so dragging outside the joystick circle does not freeze or force forward movement. Thumb movement and camera look have independent pointer IDs and remain active simultaneously.
- **Mobile swipe look:** the transparent camera touch region spans the open gameplay area starting 31% from the left edge (behind the other higher-priority controls). Sliding another finger across the screen rotates the player's view/body horizontally, and dragging vertically adjusts pitch. Touch movement remains active even when the finger leaves its original region. Touch aim sensitivity updated to 0.0062 radians per pixel.
- **No mobile pointer lock:** phone touch gestures no longer compete with desktop mouse pointer locking when Deploy is pressed or the game canvas is tapped.
- **Mobile boss health bar:** overrides high-DPI, wide-screen landscape breakpoints for coarse-pointer devices and displays a compact, unobtrusive max ~290px (34vw) status strip immediately below the top scoreboard; secondary text is hidden only on touch screens. The crosshair and main sightline are clear.
- **Auto fullscreen and landscape:** tapping **DEPLOY NOW** requests the native Fullscreen API within the user gesture, followed by `screen.orientation.lock('landscape')` where supported. The same is attempted when joining an online room. The existing PWA manifest already declares fullscreen display and landscape orientation. Unsupported browsers show rotate-phone guidance; web pages cannot physically rotate the device against browser restrictions.
- **Regression checks:** JavaScript syntax validated; cardinal/diagonal/neutral joystick tests; world movement heading tests in normal and enhanced WebGL rendering; independent joystick and second-finger swipe event simulation; fullscreen and landscape API mock sequence verified. Live testing on the player's specific phone/browser remains to be done.



## v3.33 — Eleven-point mobile HUD remap and local discovery minimap

Applied the mobile-landscape reference layout (the user's numbered screenshot):

1. Compact left-bottom health panel, HP and shield status in a short strip.
2. Larger, lower movement joystick for all directions.
3. Added a small secondary FIRE control in the upper-left play region, near the minimap. Both fire buttons share independent touch state so releasing one doesn't interrupt the other.
4. Reduced minimap to roughly 64–83 CSS pixels and replaced full-map rendering with a **47-unit, player-centered local minimap**. Player movement reveals nearby 3.5-unit map cells; previously explored cells remain discovered for the match. Reset on new match. Enemy/boss and ammo markers are only displayed in discovered regions.
5. Larger main FIRE button on the mid-right.
6. Smaller AIM button near the upper-right edge.
7. Compact right-bottom weapon/ammo/reload HUD.
8. JUMP repositioned along the lower-right row.
9. CROUCH next to JUMP.
10. SWAP next to CROUCH.
11. RELOAD next to SWAP.

The new positions activate for touch/coarse-pointer **landscape mobile view**, without changing desktop controls. Existing mobile full-screen and landscape requests remain available.

**Checks:** Embedded script syntax validation; test that local minimap explores new cells (38 initial, 74 after moving in a synthetic scenario), preserves visited tiles and resets between rounds; test that both FIRE buttons can be held simultaneously and independently released; CSS checks for all 11 layout targets. Device-specific landscape visual testing is still recommended.


## v3.34 — SHIELD POWER (separate defensive ability)

- **New operative ability:** Shield Power is not in the weapon inventory and never participates in weapon swap. Press **Q** on desktop, or tap the cyan **◈ SHIELD** button on mobile. A conspicuous spherical barrier surrounds the operative for exactly **3 seconds**, blocking all incoming damage from shots, melee attacks, headshots, zombies, the Overlord's shockwaves/lightning and energy explosions, regardless of impact direction.
- **Recharge:** 60 seconds from each activation. Cooldown does not reset upon dying and respawning; starting a fresh match restores it. The UI shows READY, the live active duration, or remaining cooldown. A subtle border glow reinforces first-person activation.
- **Bot intelligence:** AI soldiers gain the same ability, and activate it in response to recent major damage/low health, imminent nearby threats, dense zombie swarms or an Overlord lightning warning. Bots respect the same 3-second duration and 60-second cooldown. The protection is evaluated centrally in both player and bot damage functions.
- **Visible barrier to other players:** the enhanced 3D engine pools up to 12 translucent full-body spherical shields with bright rotating rings and a mesh glow. Friendly shields appear cyan and opponents' shields are pink; the classic rendering fallback has glowing ring/arc geometry.
- **Blast effects:** protected soldiers also ignore energy shockwave knockback, boss melee sweep knockback, Overlord lightning pushback and shield bash knockback.
- **Private online rooms:** host-authoritative activation for joining players, replicated duration/cooldown in snapshots, and visible barriers around host, guests, and AI combatants. PvP and existing guns still follow prior rules.

**Automated checks:** HTML game JS and enhanced 3D renderer both passed syntax validation; unit tests verified 3-second immunity, damage resuming after expiry, 60-second cooldown, reactive bot activation, and 14 integration checks for UI, rendering, multiplayer replication, and collision/damage handling. Live two-device multiplayer and mobile graphical testing are still recommended.

## v3.35 — Mobile Menu Redesign and Vertical Scrolling

- Fixes mobile menu content getting cut off and unable to scroll. When the main menu is visible on a phone/tablet or a narrow browser viewport, **#mainMenu** becomes its own viewport-height vertical scroll container with `overflow-y:auto`, momentum scrolling, touch-action `pan-y`, and a bottom safe-area buffer; the actual 3D game stays full-screen/non-scrollable.
- Reorders the existing, original control elements without breaking their JS event handlers via responsive CSS `display:contents` on the menu content wrapper. Mobile section order: compact branded header; shortened introductory hero; four operation selections; starting weapon; Field Training / match settings; training record; controls/online/fullscreen/sound buttons; and footer.
- Replaces overlapping absolute settings sidebar with a full-width responsive card; restores readable buttons/labels for bot difficulty, shield durability, graphics quality and horizontal look. Training record remains visible below the settings.
- Operations become a one-column stack on narrow portrait phones, with a two-column layout on larger mobile/tablet widths.
- A large **DEPLOY NOW** button remains fixed at the screen bottom, respecting the phone's safe area. Scrollable menu content includes extra bottom padding so all settings and controls can still be reached.
- Room invitation dialog also receives overflow scrolling so it doesn't become trapped on short phone displays. Desktop game and in-match HUD styles are unchanged.
- JavaScript syntax and mobile CSS rule consistency verified; live phone appearance/scroll checks remain recommended.

## v3.36 — Accounts, usernames, guests, Friends list and game invitations

### Implemented in the GitHub Pages client
- **Register/Login:** users register with a unique 3–20 character username (case-insensitive, letter first) and password of at least 8 characters. Log back in later using username + password. Password hashing and sessions are handled exclusively by Supabase Auth, NOT browser localStorage or GitHub code. The client stores only Supabase session tokens under an isolated STRIKEZONE auth storage key.
- **Guest users:** choose "PLAY AS GUEST" to receive a random name such as \`GUEST-KM7EP\`. The name stays stable within that browser tab/session. Guests can play offline and **JOIN** a private online room when given its code, but cannot create/host rooms, send game invitations or manage friends.
- **Friends:** registered users may request friends by their exact username. Other users accept or decline pending requests. Accepted friends appear in the Friends list.
- **Game invitation:** a registered host creates an Online Room, opens Friends, and selects INVITE next to an accepted friend. Invites are stored in Supabase with a 15-minute expiration. The recipient may accept (join the existing PeerJS room) or decline. Clients check pending requests/invitations about every 12 seconds; no open websocket is needed.
- **Multiplayer identity:** the host and guests show chosen account/guest names in the room lobby and bot/avatar labels. PeerJS display names are client-provided labels in this beta, NOT independently verified authentication claims. Actual friend requests and game invitations are restricted by Supabase Row Level Security / authenticated database functions.
- **Account UI:** persistent account and Friends controls are added to the desktop and scrollable mobile menu; the new menus scroll correctly on phones.

### REQUIRED backend activation before accounts or Friends can actually work
1. Open the STRIKEZONE database setup file: [supabase_social_setup.sql](./supabase_social_setup.sql).
2. Run the SQL in the Supabase project used by STRIKEZONE. This sets up the profiles, username uniqueness constraint, friend requests, accepted friendships and room invites, security-definer invitation methods, Auth sign-up trigger, row-level security and **explicit** data API permissions. No password table is created; passwords remain with Supabase Auth.
3. STRIKEZONE currently uses the existing EasyABC Supabase publishable URL/key in \`social.js\`. **Important security consideration:** username-only sign-up maps usernames to synthetic Auth email addresses (\`sz_<username>@accounts.strikezone.invalid\`). To complete such sign-ups, the Supabase Auth provider must NOT require email confirmation. Disabling email confirmation changes authentication behavior for **all apps using that Supabase project**, not only STRIKEZONE. **Do not disable verification globally on the shared EasyABC project unless you intentionally accept that impact.** Recommended for production: create a dedicated STRIKEZONE Supabase project, update \`SB_URL\`/\`SB_KEY\` in \`social.js\`, run the SQL there, and enable username-only registration on that separate project. Alternatively, add verified real-email registration/recovery in a future version.
4. STRIKEZONE must have new-user sign-up enabled and normal Supabase abuse protection / CAPTCHA / rate limits configured. Before opening registration publicly, test real two-device sign-up/login, concurrent username collision, and guest/registered permissions.
5. There is currently **no password recovery** for synthetic-email accounts. Warn players to keep passwords securely until a real recovery method is implemented.

### Status
GitHub client and SQL setup are committed, but **database migration execution and Supabase Auth configuration are not yet verified or activated** from this chat. Account registration/invitations must not be represented as functioning live until those backend operations succeed and a real signup test passes.

## v3.37 — Dedicated Singapore Supabase Auth Project Connected (2026-10-21)

- Supabase project **STRIKEZONE**, reference `txcgpfbnpaewggxdseeo`, created in organization EasyABC, region `ap-southeast-1` (Singapore), quoted US$0/month on its Free plan.
- Installed database migration `strikezone_social_accounts_v1` successfully: `public.sz_profiles`, `public.sz_friend_requests`, `public.sz_friendships` and `public.sz_room_invites`; all four have RLS enabled. Verified six `sz_*` functions and username availability query.
- `social.js` now uses the **new** project's URL and public publishable API key. Previously deployed EasyABC site and project remain unchanged.
- **Final required dashboard setting:** In the STRIKEZONE project at https://supabase.com/dashboard/project/txcgpfbnpaewggxdseeo/auth/providers, open Email provider settings and turn **Confirm email** OFF (only for STRIKEZONE). The frontend uses username/password plus synthetic internal Auth addresses on the dedicated project; it cannot deliver confirmation emails. Keep Email authentication and new-user signups enabled.
- Once the above setting is applied, test two real browser registrations, a duplicate username rejection, login, accepted friendships and invitations. These end-to-end flows have not been verified live yet. Password recovery is not supported with synthetic-email accounts.


## v3.38 — Player team selection in online lobby

- Players entering a hosted private room through a friend invitation or six-character room code can now **select BLUE TEAM or RED TEAM** before the match begins.
- The host starts on Blue. Guests are initially assigned to the less populated side, but their selected side is authoritative once accepted by the host.
- Both teams have limited online slots. The host validates every team change, assigns a distinct free soldier slot for that team, and rejects attempts to select a full team. The game still supports **2–6 human players total** with AI soldiers filling unoccupied positions.
- A continuously updated pre-match lobby roster shows each participant's display name and current team. Counts and choice availability update after joins, departures, or team changes.
- Team selection locks on START ONLINE MATCH. The host's chosen team assignment determines the soldier's blue/red allegiance, spawn position, and network snapshot mapping.
- Works for both registered friends and guests who were given a room code; guests still cannot host or invite players.
- Private-room protocol is now v2, so **both host and joining players must refresh the game to v3.38** before connecting.
- Automated mocked host and guest simulations validated team changes, free-slot assignment, full-side rejection, roster updates, and spawning on the confirmed team; physical two-device browser multiplayer still needs live validation.


## v3.39 — AI and hit-point integrity repair (2026-10-21)
- Fix NaN health: rejects invalid incoming damage, repairs corrupted HP before simulation/HUD, and clamps all displayed and applied health to finite values.
- A real enemy shot reduces HP and a lethal shot eliminates the player. Friendly Blue fire is rejected on the online host. Player and bot damage pathways are validated.
- Guest health snapshots are checked for valid numbers; hit feedback now appears when the host reports a legitimate reduction in guest health. Invalid world coordinates are not interpolated into the scene.
- Add nearby reachable patrol fallback destinations and new path goals when bots cannot find a route or get stuck, so AI continues looking for navigable movement instead of remaining idle.
- Real-world geometry/pathfinding simulation: 30/30 random BLUE/RED spawn tests found reachable patrol targets and nearby fallback targets.
- Host-simulated AI movement test across actual game geometry: all 9 autonomous bots moved over a four-second sample. Damage unit simulations validated enemy hits, friendly-fire protection, invalid-damage rejection, and lethal elimination.
- **Both devices must refresh** https://wj2195.github.io/EasyABC/games/strikezone-fps/?v=3.39 and re-create the private room. In-browser two-device validation is still required.
