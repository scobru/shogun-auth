## 2025-05-27 - [CRITICAL] Hardcoded Secrets in Committed .env
**Vulnerability:** A `.env` file containing sensitive secrets (`VITE_GOOGLE_CLIENT_SECRET`, `VITE_GUN_TOKEN`, `VITE_APP_TOKEN`) was committed to the repository, despite being listed in `.gitignore`.
**Learning:** Adding a file to `.gitignore` does not remove it from the repository if it was already tracked by git. Developers must explicitly remove tracked files from the index using `git rm --cached`.
**Prevention:**
1. Always add `.env` to `.gitignore` BEFORE creating the file or committing anything.
2. Use pre-commit hooks (e.g., `git-secrets`, `trufflehog`) to scan for secrets before commit.
3. Use a template file like `.env.example` committed to the repo, and copy it to `.env` (ignored) locally.
