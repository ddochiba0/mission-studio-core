# Architecture

## Dependency rule

Dependencies point inward: applications depend on engines, and engines depend on the project-agnostic core. Core never imports an app or adapter.

```text
apps/studio-web -> packages/mission-engine -> packages/core
future adapters -> packages/mission-engine -> packages/core
```

## Boundaries

- `core`: immutable domain contracts and shared policies
- `mission-engine`: use cases and validation; receives clock and ID generation as dependencies
- `apps`: UI, persistence wiring, authentication, and project adapters
- `browser-repository`: versioned browser persistence adapter; replaceable by a server adapter
- `template-engine`: project-agnostic duplication and validated exchange format
- `map-contracts`: map-vendor-neutral points, viewport, and selection contracts
- `map-adapter-leaflet`: replaceable Leaflet/OpenStreetMap UI adapter
- `sync-engine`: offline-first queueing and server-connector orchestration
- `browser-sync-queue`: browser persistence Adapter for pending server operations
- `supabase-mission-connector`: optional deployment Connector; owns Supabase row mapping
- `auth-engine`: vendor-neutral authentication state and actions
- `supabase-auth-adapter`: optional Supabase session/login implementation

Application-specific words and rules belong outside `core` and `mission-engine`.
