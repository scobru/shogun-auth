## 2024-02-12 - Debug Globals Exposure
**Vulnerability:** Global exposure of critical application state (`window.shogun`, `window.gun`) in production builds.
**Learning:** Development tools often expose sensitive data; ensure they are stripped in production using build-time constants.
**Prevention:** Wrap debug code in `if (import.meta.env.DEV) { ... }` or similar build-time checks.
