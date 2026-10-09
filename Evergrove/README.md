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

## v0.11 — Equal running speeds

Option A: PC left-click auto-run speed is **4.7 tiles/second**, matching **Shift + Arrow Keys** exactly. Ordinary arrow keys still walk at **3.1 tiles/second**. Right-click remains Back in menus or Stop during movement; Shift + Left Click still uses the current tool. Previous saves remain compatible.

## v0.12 — Expandable maps and browser map workshop

### World sizes
- Original **Willow Valley**: 68 × 48 tiles (3,264 tiles), each 32 × 32 pixels. The original handcrafted map is not resized by the editor.
- First connected expansion **Autumn Grove**: 42 × 30 tiles (1,260 tiles).
- Total initial connected world: 4,524 tiles across two separately rendered maps.
- New expansion maps can be resized from 12 × 12 to 160 × 120 tiles in the workshop. Large maps can consume significant memory on phones.

### Browser map workshop
Open: https://wj2195.github.io/EasyABC/Evergrove/map-editor.html

Functions: create/delete maps, rename, resize, paint terrain (grass/forest/path/water/stone/cliff/farm), place/remove trees and rocks, set spawn, add/change portals, edit original-world entrances, undo/redo, local drafts, JSON import/export.

Maps are stored in `Evergrove/maps/worlds.json`, rather than being hard-coded in the game. You can add multiple connected maps in this registry. Keep map IDs stable to avoid disrupting old saves.

### Publish changes (GitHub authorization)
1. Open Map Workshop, make changes, use **Export maps JSON**.
2. In your connected GitHub repo `Wj2195/EasyABC`, replace `Evergrove/maps/worlds.json` with the exported file and commit it. This requires GitHub **write access**.
3. Increment `CACHE_NAME` in `Evergrove/sw.js` to the next version so offline browsers reliably install the updated map file.
4. Return to the game and accept **Save & update**.

The workshop page itself is publicly viewable on GitHub Pages. A visitor may create a draft or download JSON locally, but **cannot publish it to your GitHub repository without write permissions**. Never place GitHub passwords or personal access tokens in public HTML/JavaScript.

### Expansion gameplay in v0.12
The current expansion prototype supports exploring painted terrain, blocked water/cliffs/trees/rocks, keyboard or joystick movement, mouse click-to-run, and glowing doorways between maps. The original Willow Village continues supporting farming, NPCs, monsters and other prior gameplay. New-map NPC placement, in-map farming, monster spawning, shops and building interiors are future features.

## v0.13 — World Atlas (player-facing Map button)

- Click the **🗺️ World** button in the in-game right-hand menu or press **M** on PC.
- Opens the World Atlas overlay inside the game, with a selectable region list and a full-sized map preview.
- Lists **every published map** from `maps/worlds.json`, initially Willow Valley (68 × 48) and Autumn Grove (42 × 30). Newly published expansion maps appear automatically.
- Shows **current location**, **visited/unvisited status**, total tiles, entrances and exits, and a player marker for the current map.
- Select a region or gateway to preview it, **without teleporting**. Travel still requires walking through its actual in-game portal.
- Use **Up/Down and Z** or mouse to choose a region; **X**, **Esc**, right-click or the close button to return to play. Landscape mobile users can tap the World button and region cards.
- Discovered expansion regions are stored in the existing local save. No save migration required.
- Offline cache version `evergrove-pages-v0.13.0` includes the new World Atlas JS and CSS.


## v0.14 — Four-way world map expansion

**Five connected playable maps** (8,888 tiles total):
| Compass position | World area | Tiles |
|---|---|---|
| Center (0,0) | Willow Valley | 68 × 48 |
| North (0,-1) | Starglow Highlands | 48 × 34 |
| East (1,0) | Autumn Grove | 42 × 30 |
| South (0,1) | Moonlit Coast | 46 × 32 |
| West (-1,0) | Sunmeadow Plains | 42 × 30 |

Each map has **four fixed cardinal gateway positions**, always centered on its **north/east/south/west borders**. Active gateways transport to their neighbors; unavailable sides show dormant/OPEN markers reserved for future expansions. Gateways are reciprocal and lead to a safe location a few tiles inside the destination.

The player-facing **World Atlas** now renders a compass-style connection diagram linking the actual map positions. Select any region to view its preview, or select an outer map to see nearby empty slots for future additions. Map previews never teleport the player.

**Map Workshop:** https://wj2195.github.io/EasyABC/Evergrove/map-editor.html
To create a new connected map, select **Connect from existing region**, choose an **Available side** (N/E/S/W), then click **Create map on selected side**. The editor assigns grid coordinates and both gateways automatically and exports the `worlds.json` registry. This browser tool does not publish directly: update `Evergrove/maps/worlds.json` in GitHub and bump the `CACHE_NAME` version in `sw.js` to deploy new maps and offline cache. Only people with GitHub write permissions can publish.

Older browser saves keep the same key and remain compatible. The original Willow Valley retains its 68 × 48 legacy map and current NPC/farming RPG functionality. New areas currently support terrain, obstacles, running, click-to-move, world travel, and previews; their NPCs, farming, and interior gameplay are still future work.


## v0.15 — All maps now 68 × 48; easier gateways and assisted travel

All five maps are the **same 68 × 48 tile size**: Willow Valley, Autumn Grove, Starglow Highlands, Sunmeadow Plains, and Moonlit Coast. At 32 pixels per tile, each map covers 2,176 × 1,536 world pixels; total published world = **16,320 tiles**.

### What caused the confusing entrances?
In v0.14, portals were drawn at the outermost tile (for example, north y=0, west x=0), with entry requiring the player to approach within less than half a tile of the exact gate center. They could technically be reached, but the edges and tiny activation radius made them difficult to spot and activate. The game's original-world paths were not specifically cleared to the outer entrances.

### Fixed
- The four cardinal gateway markers now sit **two tiles inside** their map boundaries, still centered on north/east/south/west.
- Walking within approximately one tile of the correct gate triggers entry automatically.
- A clear, marked entry lane is carved around every entrance in the original valley, and a connected walkable central cross-path is present in the expansion maps.
- **World Atlas → select your current map → 🏃 Go to gateway** guides the character along a valid route without teleporting (supports PC and phone; manual directional input cancels the route).
- Exact reciprocal entrances/exits remain connected to their corresponding neighbor.
- All terrain and placed objects from smaller expansion maps are centered and preserved wherever possible.
- Existing saves in a previous expansion map are migrated once using each map's original dimension offset. Key `evergrove_offline_save_v1` is unchanged, and a new `mapLayoutRevision` marker avoids repeated shifts.
- Map Workshop now defaults new maps to fixed **68 × 48** and prevents inadvertent resizing.

**To enter a different area:** play, open **🗺️ World (M)**, select the **current area**, and click its **Go to gateway** button for the desired destination. The atlas closes and the character runs to the corresponding portal. Alternatively, walk to the glowing gateway with normal movement controls.

These changes are in GitHub as version 0.15. The offline worker cache version is `evergrove-pages-v0.15.0`. Accept the **Save & update** prompt or reload after publication. GitHub Pages publication may lag GitHub commits.


## v0.16 — Original farming and adventure mechanics inspired by classic GBA games

This is an original Evergrove gameplay upgrade informed by the high-level mechanics of *Harvest Moon: Friends of Mineral Town* and *The Legend of Zelda: The Minish Cap*. **No original ROM sprites, audio, proprietary code, text/dialogue, characters or map layouts were copied into this repository.**

### Farming
- Original seed-pouch types: Turnip (Spring / Autumn; 4 watered days), Carrot (Spring / Autumn; 6 days), Sun Corn (Summer; 8 days with three-day regrowth), Moon Pumpkin (Autumn; 9 days).
- Prepare individual soil plots with Hoe **1**. One seed bag can scatter seeds to **up to nine prepared tiles** in a 3 × 3 area using tool **2**. One seed bag is spent for the patch.
- Use Water **3** once per day (or let rainy weather water the crops), sleep at your cottage to grow crops, then use Water or interact to harvest them.
- **R** cycles the seed bag on PC. The visible in-game season/seed button also cycles seeds on phones. You can buy seed bags at Willow Market and sell harvested produce.
- The game uses 30-day seasons. Existing crop saves are migrated lazily to the new growth fields.

### Living NPCs and town atmosphere
- Original new villagers Elara (market gardener), Bram (village guard), and Sora (herbalist) join the existing NPCs.
- NPCs have daytime destinations and navigate around buildings using basic route planning; character facing and walking animation are updated.
- Added original pixel-drawn market stalls, lanterns, a produce cart and a sign to the Willow Valley town square.
- Dialogue/friendship, gift preferences and existing NPC interaction remain integrated with the old systems.

### Sword combat
- Equip Sword **6** and **tap X, F, Space or mobile USE** for a forward slash.
- **Hold for at least 0.8 seconds and release** for a circular spin slash. Charging shows an indicator, and the spin can hit multiple nearby enemies.
- Sword attacks use an arc/radius hit area, consume stamina, and produce original slash/spin effects.
- Enemy AI patrols, detects the player, pursues, shows a visible red warning circle during wind-up, then strikes after a delay. Enemies can be defeated for XP and drops, with respawn and recovery mechanics.

### Hunting grounds and original monsters
- **Autumn Grove — Bramble Hollow:** Bramble Treants, wood, mushrooms and herbs.
- **Starglow Highlands — Stonefall Ridge:** Craglings, herbs and ore.
- **Sunmeadow Plains — Thornbush Trail:** Thornboars, berries and wild plants.
- **Moonlit Coast — Silverwater Shore:** Tide Wisps, shells and herbs.
- Exploration, gathering and combat use the existing five-map travel system. Tree/rock gathering in expansions persists temporarily in the browser save and refreshes after two game days.
- This is the first implementation, not a full recreation of either reference game. Festivals, livestock, fishing, complex town schedules, bosses, advanced equipment upgrades and new NPC shops in expansions are not yet implemented.

### Compatibility and publishing
- Continues using `evergrove_offline_save_v1` and the existing GitHub Pages URL.
- New JavaScript: `living-world-v016.js`. New CSS: `living-world-v016.css`.
- Service worker release: `evergrove-pages-v0.16.1`. Players may need to accept **Save & update** once.

The v0.16.1 release also includes individually designed NPC outfits, city stalls and walkable placement of all 16 wilderness monster spawns and 12 forage sites. A local logic test validated 3×3 sowing, crop maturity, directional and charged attacks, expansion wood collection, wild mushroom gathering and enemy pursuit/telegraphed attacks.

## v0.17.1 — Willow Valley layered pixel-art redesign

A substantial **playable, original-code** visual redesign was applied to the legacy Willow Valley town. The previous 68 × 48 collision map, five building positions/functional doorways, farming plots, NPCs, enemies, tools, portals, and save key are preserved.

### Layered drawing architecture
- `willow-hd-v017.js`: new procedural Canvas 2D renderer, with **one-time cached 2,176 × 1,536 terrain canvas**, textured grass and stone, dense paths, flowers, water highlights, and a concentric stone plaza.
- Unique per-building **cached pixel-art facades** and red, blue, violet, ochre and teal shingle roofs for cottage, market, inn, archive and crafting hall. Existing interactions use unchanged building IDs and doors.
- Improved cached trees and rocks; y-depth-sorted lanterns, banners, produce stalls, gardens, castle towers and a fortified open southern arch.
- A glowing central crystal fountain with a real collision footprint and particle-style light animation.
- `drawBackground`, `drawBuilding`, `drawTree`, `drawRock`, `propSprites`, `foreground`, `collision`, and `drawMiniMap` exposed through `window.EvergroveHD`. The existing game engine delegates selectively with a legacy fallback.
- World Atlas previews now show the redesigned terrain when high-detail mode is active.
- No external sprites, ROM assets or third-party game illustrations were copied into the shipped game. The user's sample image is used strictly as an aesthetic reference.

### Visual performance and saved progress
- The HD renderer and its resource sprites are lazily generated/cached and render via the existing Canvas at the same logical tile scale.
- **Settings → HD Pixel Art** toggles ON/OFF without changing gameplay or losing progress; the old renderer remains available on slower phones.
- On first HD draw, a player saved on the fountain footprint is relocated to a clear adjacent square and saved automatically.
- v0.17.1 service worker precaches `willow-hd-v017.js` and `willow-hd-v017.css` for offline play.
- This is a visual-first renderer, not a pixel-perfect recreation of the concept screenshot. Richer animated sprite sheets, elaborate water systems and fully editable authored art tiles can be added later.

Game: https://wj2195.github.io/EasyABC/Evergrove/

## World progression blueprint (81-map planning foundation)

**New data-only master plan, not yet playable:** [60-level progression registry](./maps/progression-60.json) · [full design guide](./maps/progression-60-guide.md) · [loader and validator](./maps/progression-loader-v1.js).

Willow Valley respawn and safe town → three exploration maps → a safe town → repeat through **Level 60** and **Crownspire Capital**. This master plan includes **81 maps** (60 levels plus 21 safe towns), all **68 × 48 tiles**, ten standard service types in each town, 24 exterior buildings per safe town, detailed biome themes and reciprocal travel links. The new manifest has **no monster spawning** anywhere. The existing playable five-map registry, old hunting grounds and save data remain unchanged until the new generator and travel system are built.
