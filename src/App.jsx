import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ShogunButtonProvider,
  ShogunButton,
  useShogun,
} from "shogun-button-react";
import { shogunConnector } from "shogun-button-react";
import Gun from "gun";
import "gun/sea"
import { ThemeToggle } from "./components/ui/ThemeToggle";
import EncryptedDataManager from "./components/vault/EncryptedDataManager";
import ConnectionStatus from "./components/vault/ConnectionStatus";
import { DEFAULT_RELAYS, decodeAuthData, APP_NAME } from "./config";

// Lazy load heavy components
const UserInfo = React.lazy(() => import("./components/UserInfo"));
import logo from "./assets/logo.svg";

import "./index.css"; // Import Tailwind CSS
import "shogun-relays";

// Main component che usa direttamente il context auth
const MainApp = ({ shogun, gunInstance, location }) => {
  // PRIMA DI OGNI USO: chiama useShogun
  const { isLoggedIn, userPub, username, logout } = useShogun();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectUrl = searchParams.get("redirect");
  
  // Navigation state for the vault
  const [activeTab, setActiveTab] = useState("all");

  // Reference to track if a success message has been shown
  const authSuccessShown = useRef(false);
  const magicLoginAttempted = useRef(false);

  // Load proofs when logged in
  useEffect(() => {
    // Handle Magic Link Login
    const magicLoginData = searchParams.get("magic") || searchParams.get("magic_login");
    
    if (magicLoginData && !isLoggedIn && !magicLoginAttempted.current && shogun) {
      magicLoginAttempted.current = true;
      console.log("Applying magic login data...");
      
      try {
        const authData = decodeAuthData(magicLoginData);
        if (authData && authData.pair) {
          const gun = shogun.gun || (shogun.db && shogun.db.gun);
          if (gun) {
            gun.user().auth(authData.pair, (ack) => {
              if (ack.err) {
                console.error("Magic login failed:", ack.err);
                navigate({ search: "" }, { replace: true });
              } else {
                console.log("Magic login success!");
                navigate({ search: "" }, { replace: true });
              }
            });
          }
        }
      } catch (e) {
        console.error("Critical error during magic login:", e);
      }
    }

    if (isLoggedIn) {
      // Show a success message if OAuth login was just completed
      if (location?.state?.authSuccess && !authSuccessShown.current) {
        authSuccessShown.current = true;
        console.log("OAuth login completed successfully!");
      }
    }
  }, [isLoggedIn, location, redirectUrl, navigate, searchParams, shogun]);

  const Sidebar = () => (
    <aside className="vault-sidebar">
      <div className="flex items-center gap-3 mb-4">
        <img src={logo} alt="Shogun Vault" className="w-10 h-10" />
        <span className="font-bold text-xl sidebar-text">Vault</span>
      </div>

      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="sidebar-text">All Items</span>
        </div>
        <div 
          className={`nav-item ${activeTab === "passwords" ? "active" : ""}`}
          onClick={() => setActiveTab("passwords")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span className="sidebar-text">Passwords</span>
        </div>
        <div 
          className={`nav-item ${activeTab === "notes" ? "active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="sidebar-text">Secure Notes</span>
        </div>
        <div 
          className={`nav-item ${activeTab === "auth" ? "active" : ""}`}
          onClick={() => setActiveTab("auth")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="sidebar-text">Auth Status</span>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-base-content/5">
        <ThemeToggle />
        <button 
          onClick={logout}
          className="nav-item w-full text-error hover:bg-error/10 mt-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="sidebar-text">Logout</span>
        </button>
      </div>
    </aside>
  );

  // If logged in, show the Vault Layout
  if (isLoggedIn && !redirectUrl) {
    return (
      <div className="vault-layout">
        <Sidebar />
        <main className="vault-content animate-vault-in">
          <header className="p-6 flex justify-between items-center border-b border-base-content/5 bg-base-100/50 backdrop-blur-xl sticky top-0 z-30">
            <h1 className="text-2xl font-bold capitalize">{activeTab.replace("-", " ")}</h1>
            <div className="flex items-center gap-4">
              <div className={`badge-custom success`}>
                <span className="badge-dot" />
                <span>Connected</span>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-8 flex-1">
            {activeTab === 'auth' && (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                <UserInfo user={{ userPub, username }} onLogout={logout} />
                <ConnectionStatus shogun={shogun} />
              </div>
            )}
            {activeTab !== 'auth' && (
              <React.Suspense fallback={<div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>}>
                <EncryptedDataManager
                  shogun={shogun}
                  authStatus={{ user: { userPub, username }, isLoggedIn }}
                  category={activeTab}
                />
              </React.Suspense>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Logged out or redirecting layout (Original clean look)
  return (
    <div className="app-shell justify-center">
      <header className="navbar-custom">
        <div className="navbar-inner">
          <div className="navbar-title">
            <img src={logo} alt="Shogun Auth" className="w-12 h-12" />
            <div>
              <span className="font-semibold">{APP_NAME}</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main flex flex-col justify-center">
        <div className="flex justify-center mb-6">
          <div className={`badge-custom ${isLoggedIn ? "success" : "error"}`}>
            <span className="badge-dot" />
            <span>{isLoggedIn ? "Authenticated" : "Not authenticated"}</span>
          </div>
        </div>

        {/* Display redirect notice if applicable */}
        {isLoggedIn && redirectUrl && (
          <div className="alert-custom success max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-success shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-success text-sm">
              Authentication successful! Redirecting you back...
            </span>
          </div>
        )}

        <div className="auth-card card max-w-lg mx-auto w-full p-4 sm:p-8 overflow-visible border-none bg-base-200/50">
          <div className="card-body overflow-visible p-0">
            <div className="auth-card-header mb-6">
              <div>
                <h2 className="auth-card-title text-xl sm:text-2xl font-bold text-center">Authentication</h2>
                <p className="auth-card-caption text-sm sm:text-base text-base-content/70 text-center">
                  Connect to access your secure vault.
                </p>
              </div>
            </div>

            {isLoggedIn && redirectUrl ? (
              <div className="flex justify-center py-10">
                <div className="text-center">
                  <div className="loading-custom mx-auto"></div>
                  <p className="mt-3 text-primary font-medium">Preparing redirect...</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center shogun-btn-wrapper pb-[340px] sm:pb-[320px]">
                <ShogunButton />
              </div>
            )}
          </div>
        </div>
      </main>

      {!isLoggedIn && (
        <footer className="app-footer">
          <div className="app-footer-inner">
            <p>Built with ❤️ by Shogun</p>
          </div>
        </footer>
      )}
    </div>
  );
};

// Wrapper for the MainApp that provides access to useLocation
const MainAppWithLocation = (props) => {
  const location = useLocation();
  return <MainApp {...props} location={location} />;
};

function ShogunApp({ shogun }) {
  const appOptions = {
    appName: APP_NAME,
    shogun,
    authMethods: [
      { type: "password" },
      { type: "webauthn" },
      { type: "web3" },
      { type: "nostr" },
      { type: "zkproof" },
    ],
    theme: "dark",
  };

  const { isLoggedIn, userPub, username, logout } = useShogun();

  const handleLoginSuccess = (result) => {
    console.log("Login success:", result);
  };
  const handleError = (error) => {
    console.error("Auth error:", error);
  };
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const providerOptions = {
    chain: "gun",
    app: "shogun-vault",
    relays: DEFAULT_RELAYS,
  };

  return (
    <Router>
      <ShogunButtonProvider
        core={shogun}
        options={providerOptions}
        onLoginSuccess={handleLoginSuccess}
        onSignupSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onError={handleError}
      >
        <Routes>
          <Route
            path="/"
            element={
              <MainAppWithLocation
                shogun={shogun}
                gunInstance={shogun?.gun}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ShogunButtonProvider>
    </Router>
  );
}

function App() {
  const [sdk, setSdk] = useState(null);
  const [relays, setRelays] = useState([]);
  const [isLoadingRelays, setIsLoadingRelays] = useState(true);

  // First effect: fetch relays asynchronously
  useEffect(() => {
    async function fetchRelays() {
      try {
        setIsLoadingRelays(true);
        const fetchedRelays = await window.ShogunRelays.forceListUpdate();

        console.log("Fetched relays:", fetchedRelays);

        // Use fetched relays, or fallback to default if empty
        const peersToUse =
          fetchedRelays && fetchedRelays.length > 0
            ? fetchedRelays
            : DEFAULT_RELAYS;

        setRelays(peersToUse);
      } catch (error) {
        console.error("Error fetching relays:", error);
        setRelays(DEFAULT_RELAYS);
      } finally {
        setIsLoadingRelays(false);
      }
    }

    fetchRelays();
  }, []);

  // Second effect: initialize ShogunCore only after relays are loaded
  useEffect(() => {
    if (isLoadingRelays || relays.length === 0) {
      return; // Wait for relays to be loaded
    }

    console.log("relays", relays);

    // Use shogunConnector to initialize ShogunCore with backward compatible configuration
    const initShogun = async () => {
      const gun = new Gun({
        peers: relays,
        localStorage: false,
        radisk: false,
      });

      const { core: shogunCore } = await shogunConnector({
        appName: "Shogun Auth App",
        // Pass explicit Gun instance
        gunInstance: gun,
        // Authentication method configurations
        web3: { enabled: true },
        webauthn: {
          enabled: true,
          rpName: "Shogun Auth App",
        },
        nostr: { enabled: true },
        zkproof: { enabled: true },
        // UI feature toggles
        showWebauthn: true,
        showNostr: true,
        showMetamask: true,
        showZkProof: true,
        // Advanced features (carried through options)
        enableGunDebug: true,
        enableConnectionMonitoring: true,
        defaultPageSize: 20,
        connectionTimeout: 10000,
        debounceInterval: 100,
        deterministicAuth: {
          enabled: true,
          skipValidation: false,
          debug: true,
        },
      });

      // Add debug methods to window for testing
      if (typeof window !== "undefined" && import.meta.env.DEV) {
        // Wait a bit for Gun to initialize
        setTimeout(() => {
          console.log("ShogunCore after initialization:", shogunCore);
          const gunInstance = shogunCore.gun;
          console.log("Gun instance found:", gunInstance);
          console.log("Database details:", {
            db: shogunCore.db,
            dbGun: shogunCore.db?.gun,
            gun: shogunCore.gun,
          });
          
          window.shogunDebug = {
            clearAllData: () => {
              // clearAllStorageData has been removed from shogun-core
              // Use storage.clearAll() or manually clear sessionStorage/localStorage if needed
              if (shogunCore.storage) {
                shogunCore.storage.clearAll();
              }
              // Also clear Gun session data
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('gunSessionData');
              }
            },
            sdk: shogunCore,
            gun: gunInstance,
            relays: relays,
          };

          window.gun = gunInstance;
          window.shogun = shogunCore;
          console.log("Debug methods available at window.shogunDebug");
          console.log("Available debug methods:", Object.keys(window.shogunDebug));
          console.log("Initialized with relays:", relays);
        }, 1000);
      }

      setSdk(shogunCore);
    };

    initShogun();
  }, [relays, isLoadingRelays]);


  if (isLoadingRelays || !sdk) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <span className="loading loading-lg"></span>
        <p className="text-secondary">
          {isLoadingRelays ? "Loading relays..." : "Initializing Shogun..."}
        </p>
      </div>
    );
  }

  return <ShogunApp shogun={sdk} />;
}

export default App;
