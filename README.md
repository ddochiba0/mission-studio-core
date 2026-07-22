# Mission Studio Core V2

Mission Studio Core V2 is a product-grade, project-agnostic platform for building and operating location-based missions. GitHub is the source of truth; ZIP archives are release artifacts only.

## Monorepo

```text
apps/
  studio-web/          Mission authoring application
packages/
  core/                Domain types and policies
  mission-engine/      Mission creation and validation engine
  sync-engine/         Offline-first bidirectional synchronization
  auth-engine/         Authentication contracts and state
```

Camping is the first adapter/use case. The core packages must not depend on camping, tourism, festivals, schools, or experience-village concepts.

## Development

```bash
pnpm install
pnpm test
pnpm check:env-example
pnpm build
pnpm dev
```

Node.js 22 or later and pnpm 10 or later are required.

## Server configuration

Copy `apps/studio-web/.env.example` to `.env.local`, then enter the Supabase project URL and Publishable Key. Never commit `.env.local`, database passwords, or secret/service-role keys.

## Current status

Sprint 13 adds continuous integration and deployment readiness checks. Real Supabase migration, account isolation, and PC/mobile acceptance testing remain required before an operational release.
