# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

An autonomous, browser-based city simulator in the spirit of SimCity. The city **builds itself** -- the engine lays roads, zones land, develops buildings, and constructs utilities and services on its own. The user is a policy-maker who sets taxation rates, budgets, and service funding via sliders and watches the city grow from bare land, with cars animating along the roads.

## Tech Stack

- **Language:** Vanilla JavaScript (ES modules) -- no framework, no TypeScript.
- **Rendering:** HTML5 Canvas, top-down 2D tile grid.
- **UI:** Plain HTML + CSS for the bottom control panel.
- **Build:** None. Plain `index.html` + ES module files. Zero npm dependencies.
- **Run:** Any static server (ES modules require http, not `file://`), e.g. `python3 -m http.server 8000`.
- **Persistence:** `localStorage` (typed arrays serialized to base64).

## Architecture

Three strictly separated layers:

1. **Model** (`src/model/`, `src/config/`) -- pure data + logic. The grid is Structure-of-Arrays typed arrays (128x128). `City` is the single source of truth for a save. The model advances only in discrete integer **ticks** and knows nothing about the canvas, DOM, or wall-clock time.
2. **Simulation** (`src/sim/`) -- `simulate.tick(city)` runs an ordered per-tick pipeline (land value -> utilities -> services -> demand -> roads -> zoning -> development -> economy -> stats). It is the **only** code that mutates the model on a tick.
3. **Presentation** (`src/render/`, `src/traffic/`, `src/ui/`) -- the renderer reads model state and draws (never mutates it); the UI writes user params into the model and reads stats out.

`src/main.js` owns a **dual loop**: a 60fps `requestAnimationFrame` render loop for smooth car animation, plus a separate speed-controllable tick cadence driven by a time accumulator. Cars animate in real wall-clock time (interpolated between road cells) independent of the simulation tick rate. The autonomous growth engine combines a global RCI (Residential/Commercial/Industrial) demand model with local cellular rules, all governed by tunable constants in `src/config/balance.js`.

## Key Documentation

| File | Purpose |
|------|---------|
| `CURRENT_STATE.md` | Current build status -- read this at the start of every session |
| `docs/development/development-tracker.md` | Phase-by-phase development tracking with change log |
| `docs/development/backlog.md` | Future features, ideas, and deferred work |
| `docs/development/phases/` | Detailed implementation plans for each phase |
| `docs/architecture/decisions.md` | Architectural decision log with reasoning |

## Development Rules

### Initial Project Setup

When this is a new project and a development plan has been created, the FIRST implementation step -- before writing any code -- is to populate the tracking files:

1. Fill in the `{placeholder}` sections of this file (`CLAUDE.md`) with the project overview, tech stack, architecture, and conventions
2. Populate `CURRENT_STATE.md` with the phase overview and first phase details
3. Populate `docs/development/development-tracker.md` with all phases, tasks, and the phase overview table
4. Create phase plan files in `docs/development/phases/` for at least the first phase
5. Log any initial architectural decisions in `docs/architecture/decisions.md`
6. Update `README.md` with the project name, description, and quick start instructions
7. Commit these tracking files before beginning any development work

### HARD RULE: Update Tracking Before Every Commit

**Before staging and committing, you MUST review and update the following files:**

1. **`CURRENT_STATE.md`** -- must reflect the current state of the project
2. **`docs/development/development-tracker.md`** -- must mark completed work, update task statuses, and add a change log entry
3. **`docs/development/backlog.md`** -- if new ideas or future work surfaced during the session, add them here

**This is not a suggestion. This is a required step. Do not stage or commit without updating tracking files first. If tracking files do not reflect the current state of the work, update them before proceeding with the commit.**

### Session Start

1. Read `CURRENT_STATE.md` to understand where the project stands
2. Read the relevant section of `docs/development/development-tracker.md` for detail on the current phase
3. If starting a new phase, check `docs/development/phases/` for a detailed implementation plan

### Session End

1. Update tracking files (see hard rule above)
2. Commit all changes
3. Push to remote

### General Conventions

- Feature branches for new work; merge to main when stable
- Update spec documents in `docs/` if architectural decisions change
- Log all significant architectural decisions in `docs/architecture/decisions.md`

## Project Conventions

- **No build step, no dependencies.** Keep it runnable by opening `index.html` through a static server. Do not introduce npm packages, bundlers, or TypeScript without logging a decision in `docs/architecture/decisions.md`.
- **ES modules only.** Every file under `src/` is an ES module (`import`/`export`). Reference scripts with `<script type="module">`.
- **Layer discipline (enforce strictly):**
  - The model/sim layer must never touch `document`, `window`, `canvas`, or `performance` (except where wall-clock is explicitly the renderer's job). Keep it pure so it can be unit-tested in Node.
  - `simulate.tick(city)` is the only tick-time mutator of model state.
  - The UI writes only to `city.params`; the renderer and traffic system are read-only with respect to the saved model.
- **All tunable numbers live in `src/config/balance.js`.** Never hard-code balance/economy magic numbers inside logic -- add them to `balance.js` and reference them.
- **Determinism.** Every stochastic choice uses the seeded RNG in `src/model/rng.js` (mulberry32) so saves reload identically and bugs reproduce.
- **Performance.** Use typed arrays for the grid; avoid per-frame/per-tick allocation in hot paths (object-pool cars, reuse buffers); use neighbor-iteration callbacks rather than allocating arrays.
- **Style.** Modern JS (`const`/`let`, arrow functions where natural). Two-space indentation. Small, single-responsibility modules matching the file layout in this document. Comment the "why," not the obvious "what."
- **Testing.** Pure model/sim modules can be smoke-tested in Node (`node --input-type=module`). Visual/timing behavior is verified in the browser against each phase's verification checklist in the development tracker.
