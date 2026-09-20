# IndustryQuest

Skills live in `.claude/skills/<name>/SKILL.md`. Codex also discovers them at `.agents/skills` (a symlink to that folder). When a skill applies, open that file and follow it for the rest of the turn. Do not work from the skill name or from memory. Claude invokes with `/name`. Codex invokes with `$name`.

## Always on

Read these at session start. Keep them on unless the user turns them off.

| Skill | File | When |
| --- | --- | --- |
| unslop | `.claude/skills/unslop/SKILL.md` | Every user-facing sentence |
| ponytail | `.claude/skills/ponytail/SKILL.md` | Every coding task. Default intensity: full |

Ponytail is off only on "stop ponytail" or "normal mode". Switch intensity with `/ponytail lite`, `/ponytail full`, or `/ponytail ultra`.

## On request

Read the matching skill, then do only what it says. One-shot skills do not stay on after the reply.

| User says | Skill |
| --- | --- |
| `/ponytail-review`, review for over-engineering, what can we delete, is this over-engineered | `.claude/skills/ponytail-review/SKILL.md` |
| `/ponytail-audit`, audit this codebase, find bloat, what can I delete from this repo | `.claude/skills/ponytail-audit/SKILL.md` |
| `/ponytail-debt`, ponytail debt, what did ponytail defer, list the shortcuts | `.claude/skills/ponytail-debt/SKILL.md` |
| `/ponytail-gain`, ponytail gain, what does ponytail save, ponytail scoreboard | `.claude/skills/ponytail-gain/SKILL.md` |
| `/ponytail-help`, ponytail help, what ponytail commands, how do I use ponytail | `.claude/skills/ponytail-help/SKILL.md` |
| `/bro`, bro, say that in plain language | `.claude/skills/bro/SKILL.md` |
| `/briefly`, briefly, short answer | `.claude/skills/briefly/SKILL.md` |

`bro` and `briefly` are never auto-on. They fire only when the user invokes them.

## Do not

- Copy skill text into this file or into the reply.
- Skip reading a skill because you think you already know it.
- Invent a skill that is not in `.claude/skills/`.

## Dev

Monorepo: pnpm workspaces + Turborepo. The build plan lives in `IndustryQuest_PRD.md` §21, core loop only for now.

| Path | What it holds |
| --- | --- |
| `apps/web` | Next.js app (App Router). Deploys to Cloudflare Workers through `@opennextjs/cloudflare` |
| `packages/core` | Pure business rules (XP, levels, transitions, rubric, mastery, eligibility). No I/O |
| `packages/db` | Drizzle schema, migrations, seed |

Commands, run from the repo root:

```sh
pnpm db:up        # start Postgres 17 in Docker (container iq-pg, port 5432)
pnpm db:migrate   # apply migrations
pnpm db:seed      # fictional demo data
pnpm dev          # next dev on :3000, with Cloudflare bindings emulated
pnpm test         # vitest in every package
pnpm typecheck
pnpm --filter web preview   # build and run in the local Workers runtime on :3000 (stop `pnpm dev` first)
```

Cloudflare bindings are declared in `apps/web/wrangler.jsonc`: `HYPERDRIVE` (Postgres) and `FILES` (R2). Run `pnpm --filter web cf-typegen` after changing that file. Before the first deploy, replace the placeholder Hyperdrive id with the one from `wrangler hyperdrive create`.

Rules the code follows:

- Every protected read or write checks access on the server in `apps/web/src/server/authz.ts`. Disabled buttons don't count as a check.
- Domain mutations are plain functions in `apps/web/src/server/*.ts` taking `(db, actor, input)`. Server Actions only wrap them.
- Anything that awards XP or credentials uses a unique idempotency key, so running it twice is safe.
