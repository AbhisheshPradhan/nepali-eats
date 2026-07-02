# web/

Next.js 16 (App Router, RSC) + Tailwind v4 frontend for NepaliEats.

- Setup, env vars, and deploy notes: [root README](../README.md)
- Working notes and architecture decisions: [root CLAUDE.md](../CLAUDE.md)
- ⚠️ This Next.js version has breaking changes vs. common knowledge; read the
  guides in `node_modules/next/dist/docs/` before writing Next-specific code
  (see [AGENTS.md](AGENTS.md)).

```bash
npm install
ln -sfn ../../media public/media   # dev: serve photos locally
npm run dev                        # http://localhost:3000
npx tsc --noEmit                   # typecheck
npm run lint
```

Reads Postgres (Neon) via `lib/queries.ts` (node-postgres, no ORM). Media via
`mediaUrl()` → `/media` symlink in dev, Cloudflare R2 in prod
(`NEXT_PUBLIC_MEDIA_BASE`).
