# Sprint 4 — Map authoring and lifecycle

## Goal

Let authors place checkpoints visually and control the mission lifecycle with enforceable domain rules.

## Included

- OpenStreetMap/Leaflet authoring adapter for key-free MVP validation
- click-to-create checkpoints with numbered map markers
- mission lifecycle transitions: draft, published, archived
- publishing guard requiring at least one checkpoint
- visible save-completion time

The map implementation remains in the application layer. Core and Mission Engine do not depend on Leaflet or a map vendor.

## User verification

1. Select a mission and click the map to create two checkpoints.
2. Confirm both numbered markers appear.
3. Publish a mission with checkpoints.
4. Confirm an empty mission cannot be published.
5. Confirm the save-completion indicator updates after changes.
