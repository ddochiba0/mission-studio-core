# Sprint 8 — Offline-first synchronization foundation

## Goal

Preserve every local edit immediately and prepare deterministic retries through a replaceable server Connector.

## Included

- server-vendor-neutral remote Connector contract
- local-first repository decorator
- persistent upsert/delete operation queue
- retry attempts and failure reporting
- clear local-saved/server-unconnected UI state
- fake server automatic tests

## Explicitly not complete

No real server is connected in this Sprint. Supabase schema, authentication, and remote policies belong to the deployment Connector and must be verified separately.

## User verification

1. Create and edit a mission and confirm local-save time changes.
2. Confirm the server-unconnected status and pending count are visible.
3. Refresh and confirm missions remain available.
