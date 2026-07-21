# Sprint 7 — Map contracts and adapter

## Goal

Remove the map vendor from the Studio application and define a reusable map contract for future SIA projects.

## Included

- vendor-neutral Map contracts
- independent Leaflet/OpenStreetMap Adapter
- click-selection input/result boundary
- automatic viewport fitting after checkpoints change
- Studio consumes the Adapter without importing Leaflet

## User verification

1. Select a mission with no checkpoints and click the map to add one.
2. Confirm the map centers and zooms to the first point.
3. Add a distant second point and confirm both fit on screen.
4. Confirm existing checkpoint reorder and delete features still work.
