# CapApp-SPM

Swift Package Manager (SPM) wrapper used by **Capacitor** to pull in native iOS dependencies for this app.

## What this folder is

- Generated/managed by **Capacitor** as part of the iOS project.  
- Hosts SPM **`Package.swift`** and related sources so Xcode can resolve Capacitor’s native packages.

## What you should do

- **Do not hand-edit** `Package.swift`, `Sources/`, or other contents unless you know exactly why — Capacitor and **`bunx cap sync`** expect a consistent layout.  
- After changing **Capacitor plugins** or **`capacitor.config.ts`**, run from the **`nudge/`** app root:

  ```bash
  bun run mobile:sync
  ```

  That rebuilds the web bundle and runs **`bunx cap sync`** so iOS (including SPM state) stays in sync.

## Where to read more

- **Repository overview:** **[`../../../../README.md`](../../../../README.md)** (monorepo root).  
- **Frontend (Bun, web, Capacitor):** **[`../../../README.md`](../../../README.md)** (`nudge/README.md`).  
- [Capacitor iOS documentation](https://capacitorjs.com/docs/ios)
