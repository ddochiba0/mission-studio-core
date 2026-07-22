# Sprint 12 — Safe conflict resolution and sync orchestration

## Goal

Prevent silent cross-device overwrites and let users resolve a real conflict without understanding synchronization internals.

## Included

- reusable pull-before-push Bidirectional Sync Engine
- structured conflict results containing local and remote versions
- reusable conflict resolver with explicit local/server choices
- forced upload only after the user chooses the local version
- queued local operation removal when the server version is chosen
- large PC/mobile conflict comparison controls
- one-button manual synchronization
- simple status wording for pending, error, conflict, and completion

## Safety policy

- uploads stop before a newer server version can be overwritten
- both versions remain unchanged until the user chooses
- conflict decisions are handled by the Engine, not embedded in the screen
- choosing a server deletion removes the raw local copy without creating another upload

## Explicitly not complete

Real-device conflict creation and resolution have not been verified against the Mission Studio Supabase project because its migrations and environment configuration are not connected in this workspace.

## User verification after deployment

1. Edit the same mission offline on PC and mobile.
2. Reconnect the first device, then the second device.
3. Confirm the second device shows both versions without automatic overwrite.
4. Test `내 작업 유지` and confirm that version reaches the other device.
5. Repeat and test `서버 작업 사용`.
6. Confirm `지금 동기화` gives an understandable completion or error status.
