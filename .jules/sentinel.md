## 2025-05-23 - Unused Secrets and Dead Insecure Code
**Vulnerability:** Found hardcoded Google Client Secrets in `.env` and an insecure HTML sanitization utility (`src/utils/renderHtml.jsx`).
**Learning:** Both were unused in the codebase. This highlights how deprecated features or copy-pasted configurations can leave security artifacts behind.
**Prevention:** Regularly audit configuration files for unused variables and scan for dead code that might contain security risks. Use tools like `knip` or manual grep searches before assuming code is used.
