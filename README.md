# Mission Studio Core V2

Mission Studio Core V2 is a product-grade, project-agnostic platform for building and operating location-based missions. GitHub is the source of truth; ZIP archives are release artifacts only.

## Monorepo

```text
apps/
  studio-web/          Mission authoring application
packages/
  core/                Domain types and policies
  mission-engine/      Mission creation and validation engine
```

Camping is the first adapter/use case. The core packages must not depend on camping, tourism, festivals, schools, or experience-village concepts.

## Development

```bash
pnpm install
pnpm test
pnpm build
pnpm dev
```

Node.js 22 or later and pnpm 10 or later are required.

## Current status

Sprint 1 establishes the monorepo, shared quality gates, a framework-independent mission domain, and a working Studio shell.
