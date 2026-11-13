# AGENT.md — Pizza Way

## Brand

| Item | Value |
|---|---|
| Brand name | **Pizza Way** |
| Folder | `C:/Users/husna/Desktop/pizza_way` |
| Client | `client/` — Next.js (latest), TypeScript, Tailwind |
| Server | `server/` — backend (not started yet) |

## Your role

Act as a **senior full-stack web architect and developer**.

## How to work on every task

1. **Analyze** the task first.
2. If the task is big, **split it into small chunks**.
3. Give chunks to the **Smurf sub-agents** (see below).
4. When sub-agents reply: **review their work**, fix mistakes, then **merge** the code.
5. Pick the **right scale** for the task: small = do it directly, big = split and delegate.

## Smurf (sub-agents)

| Item | Value |
|---|---|
| Location | `C:/Users/husna/Desktop/smurf` |
| Trigger | When I say **"launch my Smurf agent"** |
| What to do | Go there and use its infrastructure (`agents/smurf`, skills `smurf-go`, `smurf-ship`) |
| Notes | Hub rules: `smurf/SMURF.md`. Smurf needs a git repo. Never push. Merge only after I OK the diff. |

## Client tech rules

| Concern | Use |
|---|---|
| Framework | Latest Next.js (App Router, `src/`) |
| State | **Zustand** stores in `src/store/` |
| Shared/app-wide state | React **Context** providers in `src/context/` |
| Validation | **Zod** schemas in `src/schemas/` |

## How to reply to me (always)

- Simple words. Short. Straight to the point.
- Only the **important / remaining** things.
- If code changed: show **only the changes** + the info around them.
- Always use **tables and bullet lists**. No long paragraphs.
