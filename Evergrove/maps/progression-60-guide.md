# Evergrove — 60-Level / 21-Town World Design

**Status:** Planning/data foundation only. This document and `progression-60.json` do **not** replace the current 5-area playable map registry `worlds.json`, change `index.html`, trigger monsters, or change anyone's save. All new maps require tilemap generation, city scene rendering and travel integration in later development.

## Full world sequence

**Willow Valley (T00)** → 3 exploration levels → **Safe Town 01** → 3 exploration levels → **Safe Town 02** → … → Level 60 → **Crownspire Capital (T20)**.

The user's ring illustration is represented as **nested world progression bands**. The individual maps are distinct 68 × 48-tile scenes, connected by reciprocal travel entrances along their north and south edges. The atlas can later display the full chain as bands/rings instead of forcing 81 maps into the old four-neighbor compass grid.

| Chapter | Level maps | Exploration areas in order | Safe destination town | Biome |
|---|---:|---|---|---|
| 01 | 1–3 | Mosspath Meadow → Fernbrook Trail → Old Timber Road | Oakcross Village | temperate-forest |
| 02 | 4–6 | Frostpine Path → Icebrook Crossing → Whitefang Pass | Frosthollow | snowy-forest |
| 03 | 7–9 | Sunscar Dunes → Mirage Track → Scorpion Ridge | Dunespice Bazaar | desert |
| 04 | 10–12 | Reedwater Bank → Fisherman's Bend → Mistshore Crossing | Mistlake Port | lakeside |
| 05 | 13–15 | Quarry Foot → Ironcliff Trail → Forge Ridge | Ironroot Borough | rocky-highland |
| 06 | 16–18 | Cracked Avenue → Hollow Square → Ash Alley | Ashveil Refuge | abandoned-city |
| 07 | 19–21 | Bloomfield Road → Honeywind Lane → Petalstep Path | Sunpetal City | flower-meadow |
| 08 | 22–24 | Guardstone Road → Bastion Walk → Sentinel Rise | Stonewatch Keep | fortified-plain |
| 09 | 25–27 | Saltwind Shore → Coral Way → Seabreak Point | Moonreef Haven | coast |
| 10 | 28–30 | Sakura Road → Lantern Walk → Quiet Temple Lane | Sakura Lantern Town | ornamental-woodland |
| 11 | 31–33 | Murkroot Marsh → Bogstep Hollow → Witchfen Road | Gloomstep Quarter | swamp |
| 12 | 34–36 | Red Mesa Trail → Copper Gulch → Broken Spur | Goldmesa Crossing | red-canyon |
| 13 | 37–39 | Highwind Path → Cloudstep Ridge → Eagleview Trail | Cloudrest Terrace | alpine-grassland |
| 14 | 40–42 | Shimmerdune → Prism Flats → Mirage Glassway | Glassdune Oasis | crystal-desert |
| 15 | 43–45 | Riverveil Road → Floodgate Walk → Canal Crossing | Rivercrown City | river-canals |
| 16 | 46–48 | Emberfield → Cinder Road → Magma Scar Pass | Embergate | volcanic |
| 17 | 49–51 | Pineveil Track → Deertrail Hollow → Winterbark Path | Pinebloom Borough | taiga |
| 18 | 52–54 | Starfall Ruins → Moondial Road → Astral Causeway | Starfall Enclave | ancient-ruins |
| 19 | 55–57 | Hollowmist Road → Veilwater Reach → Dreadwillow Lane | Hollowmere City | foggy-lake |
| 20 | 58–60 | King's Approach → Crownfield Avenue → Imperial Gate Path | Crownspire Capital | royal-road |

## Counts and design conventions

| Property | Value |
|---|---|
| Total maps | **81** |
| Starting respawn town | **1**: Willow Valley |
| Progression towns | **20**: one after every 3 levels |
| All safe-zone areas | **21** (starting town + 20 towns) |
| Exploration levels | **60**, sequentially numbered |
| Standard map size | **68 × 48 tiles**, each 32 game pixels |
| Total designed tile capacity | **264,384** |
| Service types in every city | **10** |
| Exterior building slots per town | **24** |
| Total planned town building exteriors | **504** |
| Reciprocal directed portal records | **160** (80 adjacent pairs) |
| Monster spawns in this new manifest | **0** across all maps |
| Existing legacy playable areas | **Unchanged** |

### Default town services

Hospital, Coffee Shop, Bar, Weapon Shop, Seed Shop, Town Hall, Inn, Hostel, Brothel (adult venue exterior only; no interiors/content yet), and Restaurant.

Each town uses the same service categories in consistent 6 × 5-tile building footprints with tight adjacent building rows, street-facing doors, a central landmark and side-by-side shopfronts. The architectural style, color palette, landmarks, decorations, ambience and proposed population differ by destination. Fourteen additional residential exteriors fill the remaining city building slots. `services[].availableWhenInteriorsAdded` is **future metadata**, not a working business.

### Default wilderness layout

Each level's metadata describes a unique biome, visual scene, palette, seeded terrain recipe, traversable north–south path, clear entrance approaches, optional branch paths, landmark placement, reserved resource types and possible **future** combat capacity. **No monsters, hostile damage, or harvestable items are activated yet** by this manifest. Future monsters may only be enabled on level maps; respawn and city maps stay permanently safe.

### Map connections

- Every intermediate map has a **south gateway to the previous map** and a **north gateway to the next map**.
- First town T00 has only the north progression gateway; final town T20 has only the south return gateway.
- North gateway tile **(34, 2)**; enter the next map from the south near **(34.5, 42.5)**.
- South gateway tile **(34, 45)**; enter the previous map from the north near **(34.5, 5.5)**.
- Coordinates are world-tile coordinates, **not** the old grid `{x,y}` map-placement coordinates.
- Additional east/west branches can be created later, but are not linked by this first manifest.

## JSON files and API

- **Manifest:** `maps/progression-60.json`
- **Optional read-only loader/validator:** `maps/progression-loader-v1.js`
- **This guide:** `maps/progression-60-guide.md`
- **Existing playable world:** `maps/worlds.json` (remains the current 5-map game)

The loader is intentionally **not linked** from the current game HTML. To use it when the future progression engine is implemented:

```html
<script src="./maps/progression-loader-v1.js"></script>
```

```javascript
// Only after the page has loaded the script:
const plannedWorld = await EvergroveProgression.load();
const safeTown = EvergroveProgression.get("town-01");
const firstLevel = EvergroveProgression.getNext("base");
const nextTown = EvergroveProgression.getNext("level-03");
const isSafe = EvergroveProgression.isSafeZone("town-20");
const reverseRoute = EvergroveProgression.connectedTo("level-24");
```

The loader validates all counts, safe-zone and monster flags, reciprocal travel links, 24 non-overlapping building footprints per town, ten services per town and overall progression order before accepting data.

## Suggested safe implementation order

1. **Tile generator:** Paint each 68 × 48 level from its `layout.generation` seed and biome-specific `terrain` metadata. Preserve a traversable center route and gateway approach.
2. **Town generator:** Paint each city's roads, exterior service buildings, residences and decorations from `layout.buildings` and `visual` metadata. Doorways are *visually placed but not enterable yet*.
3. **Map scene transitions:** Add a new progression-world state and routing layer. Keep current five legacy maps intact until a deliberate travel/save migration is designed.
4. **World Atlas:** Group maps by level-three/town chapter and present the nested bands in the map UI.
5. **Population/gameplay later:** Enable city NPCs and enterable interiors later; **do not spawn monsters at this stage**.

## Save compatibility and existing monsters

The earlier four expansion areas (Autumn Grove, Starglow Highlands, Sunmeadow Plains, Moonlit Coast) still exist separately in the **live** `worlds.json` and can contain monsters from the previous game update. The newly planned **81-map progression has zero monster spawns**, but that rule does not retroactively remove monsters from the old playable areas.

**No current browser saves or movement controls were edited in this data-only release.** The developer can implement the new progression engine in stages, and should back up the existing local save before switching any live map IDs.
