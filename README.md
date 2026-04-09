# Shogun Auth & Vault

A premium, decentralised authentication and secure data vault application built on the Shogun ecosystem. Shogun Auth provides a unified login experience across multiple protocols while offering an end-to-end encrypted dashboard for personal data management.

## 🌟 Key Features

- **Multi-Protocol Authentication**
  - 📧 **Traditional**: Secure Username/Password auth.
  - 🦊 **Web3**: Seamless integration with MetaMask and Ethereum wallets.
  - 🔐 **WebAuthn**: Passkey and biometric (TouchID/FaceID) support.
  - ⚡ **Nostr**: Native Nostr protocol event-based login.
  - 📱 **Magic Links**: URL-based login for fast transfers and cross-device access.

- **Encrypted Data Vault**
  - 🔒 **End-to-End Encryption**: Data is encrypted using SEA (Security, Encryption, Authorization) before leaving the browser.
  - 📁 **Categorized Storage**: Dedicated sections for Passwords, Secure Notes, and OAuth credentials.
  - 🔄 **Real-time Sync**: Distributed data persistence across valid GunDB relays.
  - 🛠️ **Identity Management**: View and export your public keys (PUB) and identity metadata.

- **Cross-Service Ecosystem**
  - ⛓️ **Dynamic Relay Management**: Automatic discovery and status monitoring of GunDB peer nodes.
  - 🔗 **Secure Credential Handover**: PostMessage API for safe communication between the vault and third-party apps.
  - 📲 **QR Identity Transfer**: Export/Import your cryptographic identity via secure QR codes.

- **Design & UX**
  - 🎨 **Premium Aesthetics**: Glassmorphic UI with dynamic gradients and smooth animations.
  - 🌓 **Intelligent Themes**: Full support for dark and light modes via Tailwind CSS & DaisyUI.
  - 📱 **Mobile First**: Fully responsive layout optimized for all screen sizes.

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/scobru/shogun-core
cd shogun-2/shogun-auth

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be accessible at `http://localhost:8080`.

### Scripts

- `npm run dev`: Starts the Vite dev server on port 8080.
- `npm run build`: Generates a production-ready build in the `/dist` folder.
- `npm run preview`: Serves the production build locally.
- `npm run auth`: Utility script to remind you of the auth URL.

## 🔧 Technical Architecture

### Core Initialization

The app uses `shogunConnector` to bridge the React UI with the underlying Shogun SDK. It features a robust initialization sequence that first discovers healthy relays before starting the GunDB instance.

```javascript
// Initialization pattern (simplified from App.jsx)
const { core: shogunCore } = await shogunConnector({
  appName: "Shogun Auth App",
  gunInstance: new Gun({ peers: relays }),
  web3: { enabled: true },
  webauthn: { enabled: true },
  nostr: { enabled: true },
  deterministicAuth: { enabled: true }
});
```

### Magic Link System

Shogun Auth supports a `?magic=` parameter in the URL. This permits logging in with a pre-authorised pair or transferring identity context.

```javascript
// Example Magic Link Structure
const link = `${window.location.origin}?magic=${encodedAuthData}`;
```

The auth data is a URL-safe Base64 encoded JSON object containing the user's cryptographic parameters.

## 🏗️ Project Structure

```text
shogun-auth/
├── src/
│   ├── components/
│   │   ├── ui/               # Primary UI elements (Buttons, Cards, Toggles)
│   │   ├── vault/            # Vault logic (DataManager, ConnectionStatus)
│   │   ├── UserInfo.jsx      # Identity display & metadata management
│   │   └── QRCodeAuth.jsx    # QR-based identity export/import
│   ├── hooks/
│   │   └── (integrated via shogun-button-react)
│   ├── config.js             # Relay peers and auth constants
│   ├── index.css             # Tailwind and global styles
│   └── App.jsx               # Main application and routing logic
├── tailwind.config.js        # Design tokens and theme configuration
└── vite.config.js            # Build system and polyfills
```

## 🔌 Integration for Developers

### Redirect Flow

Redirect users to Shogun Auth to handle authentication for your application:

```text
https://shogun-auth.vercel.app?redirect=https://your-app.com/callback
```

### PostMessage API

When integrated as an iframe or popup, Shogun Auth broadcasts the user's session once authenticated:

```javascript
window.addEventListener("message", (event) => {
  if (event.data.type === "shogun:auth:credentials") {
    const { pair, userPub } = event.data.data;
    // Initialise your local Shogun instance with the received pair
  }
});
```

## 🤝 Shogun Ecosystem

This module is a core part of the larger Shogun network:
- **[shogun-core](../shogun-core)**: The underlying SDK.
- **[shogun-button-react](../shogun-button-react)**: The unified UI component.
- **[shogun-relays](../shogun-relays)**: Network peer management.

---

Built with ❤️ by [scobru](https://github.com/scobru).
Pioneering Decentralised Identity since 2024.

For more information about the Shogun ecosystem, visit [shogun-info.vercel.app](https://shogun-info.vercel.app)

