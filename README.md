# Arcade Nexus — Low-Poly Game Hub

A lightweight browser-based 3D arcade hub built with **Three.js**, **JavaScript** and **Vite**.

## Status

All five cabinets are playable using lightweight procedural Three.js scenes. Scores, coins, play counts, and achievements persist in browser localStorage.

## Requirements
Node.js 20.19+ or 22.12+ (compatible with Vite 7), npm, and a modern browser.

## Run locally
```bash
npm install
npm run dev
```
Open the localhost address printed in your terminal.

## Build and preview
```bash
npm run build
npm run preview
```
Deploy the generated `dist/` folder to Netlify or Vercel (build command: `npm run build`, output directory: `dist`).

## Controls

- **Neon Rush:** A/D or arrows steer; Shift triggers nitro.
- **Target Ops:** Mouse aim and click shoot moving practice drones.
- **Sky Jumper:** A/D moves; Space jumps between islands.
- **Shadow Protocol:** WASD moves; E interacts; Q/E/R/F completes the hack.
- **Cyber Dash:** arrows change lanes; Space jumps.
- **Shared:** P pauses and R restarts.

## Features

- Five responsive game cards, live player statistics, and real gameplay-driven achievements.
- Raycasting-based shooting with timed accuracy scoring.
- Procedural platform jumping, gravity, landing checks, collectibles, and finish portal.
- Escape state progression: keycard → terminal → QTE hack → exit door.
- Progressive runner/car hazards, local scores, lightweight Web Audio, and cleanup of loops, listeners, canvases, geometry, and materials when switching games.

## Architecture
`src/main.js` contains the shared game lifecycle plus five independent game classes. The base class owns the renderer, delta-time loop, resize handling, listeners, and cleanup.

## Note for portfolios
This is a prototype, not an Unreal Engine project. Do not claim Unreal Engine, rigging, MetaHuman, or skeletal animation features. The current car game uses procedural transforms and simple geometric models.
