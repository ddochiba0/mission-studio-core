# Sprint 3 — Persistent missions and checkpoints

## Goal

Keep authored missions across browser restarts and provide checkpoint editing without coupling the engine to a map or application type.

## Included

- versioned browser persistence adapter (`schemaVersion: 1`)
- persistence corruption and unsupported-version detection
- checkpoint service use cases
- checkpoint add, delete, move up, and move down UI
- responsive desktop/mobile workspace

## User verification

1. Create a mission, refresh the browser, and confirm it remains.
2. Add two checkpoints using valid latitude and longitude values.
3. Change their order with the arrow buttons.
4. Delete one checkpoint and confirm the count updates.
