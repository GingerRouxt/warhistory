# WarHistory

Interactive 3D globe of 6,000 years of warfare. React + TypeScript + Vite + CesiumJS.

## API keys and required restrictions

**Read this before creating any key.** Copy `.env.example` to `.env` and fill it in.

Every `VITE_*` variable is inlined as a literal string into the built JavaScript
by Vite. The deployed bundle is public, so **these keys are public**. That is
inherent to client-side map SDKs and is not something application code can fix:
you cannot hide a key that the browser has to send. The only real control is a
restriction applied to the key in the provider's console. If you skip the
restriction step, the key is free money for anyone who greps the bundle.

`vercel.json` sets `Referrer-Policy: strict-origin-when-cross-origin`, which is
what makes the HTTP-referrer restriction below actually work — do not weaken it
to `no-referrer`, or Google will not see the referrer it is checking against.

### `VITE_GOOGLE_TILES_KEY` — Google Photorealistic 3D Tiles (billable)

Used at `src/components/Globe.tsx:127`. This is the expensive one: Photorealistic
3D Tiles is metered per request and the key travels in a URL query string, so it
is trivially harvested from a single network capture.

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
open the key and set **both** restrictions:

1. **Application restrictions → Websites (HTTP referrers).** Add:
   - `https://warhistory.app/*`
   - `https://*.warhistory.app/*`
   - `https://*.vercel.app/*` *only* if you need preview deployments to render
     tiles; leave it off otherwise, as it allows any Vercel-hosted site.
   - For local dev, use a **separate** key restricted to `http://localhost:5173/*`.
     Do not add localhost to the production key.
2. **API restrictions → Restrict key**, and select **Map Tiles API** only.

Then, under **Billing → Budgets & alerts**, create a budget with email alerts at
50% / 90% / 100%. Referrer restrictions are spoofable by a determined attacker
(a referrer header is client-supplied), so the budget alert is the backstop that
tells you if it happens.

The app degrades gracefully with no key at all — the globe still works, just
without photorealistic tiles. If the budget alert ever fires, pulling the env var
and redeploying is a safe emergency stop.

### `VITE_CESIUM_ION_TOKEN` — Cesium Ion

Used at `src/main.tsx:11` and `src/config.ts:2`. In the
[Cesium Ion access tokens page](https://ion.cesium.com/tokens), edit the token and:

1. Scope it to **only** the assets this app uses (world terrain, and asset id 3
   for the dark imagery layer — see `Globe.tsx:119`). Do not use the default
   token, which has access to your whole account.
2. Add `warhistory.app` to the token's allowed domains.

### Verifying a restriction is live

After applying restrictions, confirm from a machine that is not an allowed
referrer:

```sh
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://tile.googleapis.com/v1/3dtiles/root.json?key=YOUR_KEY"
```

A properly restricted key returns `403`. A `200` means the restriction is not
applied and the key is still open — fix it before shipping.

## Development

```sh
npm install
npm run dev      # vite dev server
npm run build    # tsc -b && vite build
npm run lint
```

---

## Template notes

This project started from the Vite React+TS template; the notes below are from
that template.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
