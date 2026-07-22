# Sprint 11 — Bidirectional mission synchronization

## Goal

Download server missions on sign-in and reconnect while preserving unsent local work.

## Included

- vendor-neutral remote snapshot and pull contracts
- latest-server-version merge into the raw local repository
- pending local edit protection and visible conflict count
- soft-delete tombstones to propagate deletion across devices
- Supabase snapshot query mapping isolated in the Connector
- automatic push-then-pull cycle after sign-in and reconnect
- synchronized download/delete result display

## Safety policy

- a pending local edit is never silently overwritten
- a pending local deletion is never resurrected by a server download
- remote data is written directly to the raw local repository and is not queued as a new upload
- deletion tombstones are applied only when they are at least as new as the local record

## Explicitly not complete

The tombstone migration has not been applied to the Mission Studio Supabase project. Real PC/mobile bidirectional synchronization and account-isolation behavior remain unverified.

## User verification after deployment

1. Apply both migrations in timestamp order.
2. Create a mission on PC A and confirm it appears on mobile B after login.
3. Edit it on mobile B and confirm PC A receives the newer version after reconnect.
4. Delete it on PC A and confirm it disappears on mobile B without reappearing.
5. Make offline edits on both devices and confirm the unsent local version is preserved with a conflict notice.
