# Sprint 10 — Authentication boundary and Supabase Auth Adapter

## Goal

Add authentication without coupling Core, Mission Engine, or Sync Engine to Supabase.

## Included

- vendor-neutral Auth Engine contracts and state
- isolated Supabase Auth Adapter
- shared Supabase client wiring for authentication and mission synchronization
- email/password login and logout flow
- automatic synchronization only after an authenticated session exists
- local work remains available while signed out or offline
- large responsive controls and actionable Korean errors

## Explicitly not complete

Real-account login, migration execution, and cross-account RLS isolation have not been verified against the Mission Studio Supabase project.

## User verification after deployment

1. Configure the two documented Vite environment values without committing them.
2. Log in as user A, create a mission, and confirm synchronization completes.
3. Log out and confirm local editing remains available while server transfer waits.
4. Log in as user B and confirm user A's server mission is inaccessible.
5. Reconnect after an offline edit and confirm the pending count reaches zero.
