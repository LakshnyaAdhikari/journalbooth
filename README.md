

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Keeping the free Supabase project awake

Free Supabase projects pause after ~7 days of inactivity. Add this GitHub Action
to any repo you own (`.github/workflows/keepalive.yml`) to ping your project
twice a week:

```yaml
name: Supabase keep-alive
on:
  schedule:
    - cron: "0 6 * * 1,4"
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping REST API
        run: |
          curl -sS -o /dev/null -w "%{http_code}\n" \
            "$SUPABASE_URL/rest/v1/photos?select=id&limit=1" \
            -H "apikey: $SUPABASE_ANON_KEY"
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as repository secrets. A `401`
response still counts as activity, so RLS-protected tables are fine.

## Install as an app

AltCam ships a web app manifest (`public/manifest.webmanifest`) and icons, so
it can be installed to a phone home screen or desktop from the browser menu.
