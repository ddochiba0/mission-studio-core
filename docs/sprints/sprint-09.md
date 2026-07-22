# Sprint 9 — Supabase Connector and secured schema

## Goal

Connect the vendor-neutral Sync Engine to Supabase without leaking Supabase row shapes into Core.

## Included

- isolated Supabase Mission Connector
- mission document upsert/delete mapping
- SQL migration with owner-scoped RLS policies
- authenticated-only grants; anonymous access revoked
- optional environment-based application wiring
- reconnect flush and clear sync status badges
- queue compaction for repeated edits to the same mission

## Explicitly not complete

The migration has not been executed against a Mission Studio Supabase project and real authentication has not been verified.

## Required environment names

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## User verification after deployment

1. Run the migration in the intended Supabase project.
2. Sign in as user A and create a mission.
3. Confirm user B cannot read, update, or delete user A's mission.
4. Disconnect the network, edit a mission, reconnect, and confirm the pending count reaches zero.
