# Sprint 1 — Product foundation

## Goal

Create a reproducible monorepo and prove the first project-agnostic Mission Engine can be consumed by an application.

## Definition of done

- pnpm workspace with `apps` and `packages`
- strict TypeScript configuration
- core mission contracts with no Camping dependency
- deterministic creation and coordinate validation
- automated unit tests
- Studio web shell consuming the engine
- repository builds and type-checks from a clean install

## User verification

1. Start the Studio with `pnpm dev`.
2. Confirm the V2 landing screen opens on desktop and mobile widths.
3. Confirm it displays a DRAFT mission and VALID result.
