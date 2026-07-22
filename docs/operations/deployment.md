# Deployment readiness

## Safe configuration

1. Copy `apps/studio-web/.env.example` to `apps/studio-web/.env.local`.
2. Enter only the Supabase project URL and Publishable Key.
3. Keep database passwords, Secret Keys, and Service Role Keys in the password manager; never place them in the app or GitHub.
4. Run `pnpm check:env-local`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

## Database order

Apply the migrations in filename order:

1. `202607220001_create_missions.sql`
2. `202607220002_add_mission_tombstones.sql`

Do not declare deployment complete until both migrations and the acceptance checklist have been verified against the intended Supabase project.

## Release rule

GitHub `main` is the source of truth. Create ZIP files only from a verified commit for a named customer test or release, and exclude `.env.local`, passwords, keys, caches, and `node_modules`.
