# Arcade Nexus — 3D & Retro Game Hub

A lightweight, high-performance browser-based arcade hub built with **Three.js**, **Libretro WebAssembly**, **JavaScript**, and **Vite**.

## Status

All six arcade cabinets are fully playable:
- **5 Procedural 3D Games** built directly in Three.js.
- **1 Retro Game Vault** powered by Libretro WebAssembly (`nostalgist`), featuring built-in GBA & NES homebrew games plus support for custom ROM uploads.
- Player stats, coins, high scores, and 7 gameplay achievements persist in `localStorage`.

## Included Games & Cabinets

1. **Neon Rush:** 🏎️ Highway runner. A/D or arrows steer; Shift triggers nitro boost.
2. **Target Ops:** 🎯 Accuracy shooter. Mouse aim and click to shoot floating practice drones.
3. **Sky Jumper:** ☁️ 3D platformer. A/D moves; Space jumps between floating islands to reach the portal.
4. **Shadow Protocol:** 🔐 Cyber infiltration. WASD moves; E interacts; Q/E/R/F completes the terminal hack.
5. **Cyber Dash:** ⚡ Futuristic endless sprint. Arrow keys switch lanes; Space jumps hazards.
6. **Retro Vault:** 👾 Full-fledged Libretro emulator cabinet:
   - **🗡️ Anguna: Warriors of Faith** (Game Boy Advance RPG)
   - **🐱 Sushi The Cat** (Game Boy Advance Platformer)
   - **🛡️ Alwa's Awakening** (NES 8-bit Demo)
   - **📁 Custom ROM Loader:** Upload any `.gba`, `.nes`, `.sfc`, `.gbc`, or `.zip` file from your device.
   - **Controls:** D-Pad (Arrow keys), A (X), B (Z), Start (Enter), Select (Shift), L/R (Q/W).
   - **Features:** In-browser state saving (`💾 Save`), loading (`📂 Load`), reset (`🔄 Reset`), and fullscreen (`⛶`).

## Requirements
Node.js 20+ or 22+, npm, and any modern web browser.

## Run Locally
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## Build and Preview
```bash
npm run build
npm run preview
```

## Free 1-Click Deployment (Zero Server Cost)

This project is 100% client-side and requires no backend servers, databases, or VPS:

### Vercel
1. Push your repository to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. The included [vercel.json](file:///c:/apps/arcade-nexus/vercel.json) automatically configures the required cross-origin headers for WebAssembly SharedArrayBuffer.
4. Click **Deploy**.

### Netlify
1. Connect your repo in [Netlify](https://netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. The included `public/_headers` handles cross-origin headers automatically.
