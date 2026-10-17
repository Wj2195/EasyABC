# STRIKEZONE FPS — Solo AI Edition (v1.1)

An **original**, browser-based first-person shooter prototype hosted on GitHub Pages, with no multiplayer, backend, or external assets. Inspired by the *genre* of arena FPS games, not associated with Hazmob FPS.

## Play

https://wj2195.github.io/EasyABC/games/strikezone-fps/

This is a **single-file** browser build; the game runs from `index.html` using built-in WebGL. For local use, download `index.html` and open it in Chrome or Edge with graphics acceleration enabled. Progress is stored in the browser’s local storage and may be cleared when site storage is cleared.

## Modes

- Team Deathmatch vs computer-controlled opponents (allied bots on your side)
- Free for All vs computer-controlled opponents
- Gun Race (weapon rotates after kills)

## Weapons

VORTEX AR (rifle), RAPTOR SMG, RANGER DMR, JUDGE 12 (shotgun), SPECTRE P9 (pistol). Weapons are original low-poly meshes; the prototype does not contain realistic commercial 3D models.

## Controls

WASD move · mouse look · left-click fire · right-click aim · Shift sprint · C crouch · Space jump · R reload · number keys 1–5 switch weapons · P or Escape pause and view results. Mobile has preliminary touch controls (landscape recommended).

## Training and local progression

Choose Rookie, Regular, or Veteran bot difficulty in the lobby. Match results save XP, kills, deaths, total matches, and best kills locally on the current browser.

## Status

- Pure client-side single-player prototype: **implemented**
- AI bot training, hitscan headshots, HUD, audio synthesis, procedural meshes, recoil and particle effects: **implemented**
- Public online multiplayer, matchmaking, account login, server sync, unlock store: **not implemented**
- Extensive browser/device graphics QA and professionally authored animation/3D models: **not yet completed**

The EasyABC storefront at the repository root is not modified by this game folder.
