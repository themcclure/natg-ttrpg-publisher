# NATG TTRPG Publisher

A static-site publisher that turns a sanitized Obsidian vault into a public, player-facing encyclopedia for the Star Trek TTRPG campaign *Not All That Glitters Is Latinum* (NATG).

The full design lives under [`specs/`](specs/) — this README covers operation only. See [CLAUDE.md](CLAUDE.md) for the working agreement.

## How it works

```
Obsidian vault            this repo                     Vercel
 (read-only)               npm run sync           npm run build
   │  authored by    ───►    │  copies to    ───►    │  static
   │  publish skill          │  src/content/         │  dist/
   │  agent                  │  + public/_assets/    │
   ▼                         ▼                       ▼
 sanitized                git-tracked              live site
 markdown                 build artifacts          (CSP-headered)
```

`src/content/` and `public/_assets/` are **build artifacts** — they get fully overwritten by `npm run sync` and committed so the Vercel build is reproducible without access to the vault. Never hand-edit them.

## Setup

Requires Node 24 (LTS). Pinned via [.nvmrc](.nvmrc) and `engines` in [package.json](package.json).

```sh
nvm use            # or `nvm install` if 24 isn't installed yet
npm install
cp .env.example .env.local   # then point NATG_SOURCE at your vault path
npm run sync       # populates src/content/ and public/_assets/ from the vault
npm run build      # produces dist/
npm run dev        # local dev server
```

If `NATG_SOURCE` is unset, sync defaults to the in-repo [fixtures/natg-vault/](fixtures/natg-vault/) — handwritten placeholder content used for development and tests.

## Useful scripts

| Script              | What it does                                                                |
|---------------------|------------------------------------------------------------------------------|
| `npm run sync`      | Copies the vault into `src/content/` and mirrors assets to `public/_assets/`. |
| `npm run dev`       | Astro dev server with HMR.                                                  |
| `npm run build`     | Runs `verify-content` then `astro build`. Output in `dist/`.                |
| `npm run check`     | `astro check` — type-checks `.astro` and content schemas.                  |
| `npm run verify`    | Cross-file content consistency checks (e.g. episode/folder match).         |

## Deploy

Connected to Vercel via Vercel's native GitHub integration (see [ADR-0001](specs/adr/0001-hosting.md)). Pushing to `main` triggers a build and deploy automatically. Security headers are applied via [vercel.json](vercel.json) (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy — see R-NF-14).

## License

Dual-licensed. See [ADR-0005](specs/adr/0005-license-model.md) for the rationale.

- **Publisher code** (Astro site, scripts, config) — MIT, see [LICENSE](LICENSE).
- **Campaign content** (everything under `src/content/` and `fixtures/natg-vault/`) — rights retained by Mike McClure. Not open-licensed.

## Disclaimer

Unofficial fan project. Star Trek and related marks are trademarks of Paramount/CBS. Not affiliated with or endorsed by the rights holders.
