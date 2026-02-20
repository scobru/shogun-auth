## 2026-02-18 - Exposed Google Client Secret
**Vulnerability:** A hardcoded Google Client Secret (`VITE_GOOGLE_CLIENT_SECRET`) was found in the `.env` file. This variable was exposed to the client-side code due to the `VITE_` prefix, allowing potential attackers to obtain the application's client secret.
**Learning:** The presence of `VITE_` prefix automatically exposes variables to the client, which is a common pitfall when developers copy-paste or misunderstand environment variable scoping in Vite.
**Prevention:** Ensure that client secrets are never prefixed with `VITE_` or similar client-side exposure prefixes. Use server-side environment variables or a backend proxy for sensitive operations.
**Additional Actions:** Removed unused and potentially insecure tokens `VITE_GUN_TOKEN` and `VITE_APP_TOKEN` from `.env` and `env.example`.
