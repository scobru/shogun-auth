## 2025-02-18 - Unstable Context Provider Props
**Learning:** The application was passing a new object reference (`providerOptions`) to `ShogunButtonProvider` on every render of `ShogunApp`. This likely caused unnecessary re-renders of the entire authentication context consumer tree.
**Action:** Always memoize configuration objects passed to Context Providers, especially at the root level.
