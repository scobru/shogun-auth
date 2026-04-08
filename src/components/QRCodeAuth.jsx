import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrReader } from "react-qr-reader";
import { useShogun } from "shogun-button-react";
import Modal from "./ui/Modal";
import { encodeAuthData } from "../config";

/**
 * Component for exporting and importing authentication keys via QR code
 * Allows users to export their keys as QR code and scan QR code to login on another device
 */
const QRCodeAuth = ({ isOpen, onClose }) => {
  const { core } = useShogun();
  const [mode, setMode] = useState("export"); // 'export' or 'import'
  const [exportFormat, setExportFormat] = useState("json"); // 'json' or 'link'
  const [exportKeys, setExportKeys] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Export user's SEA pair as QR code
   */
  useEffect(() => {
    if (mode !== "export" || !core || !isOpen) {
      setExportKeys(null);
      return;
    }

    try {
      // Access Gun instance from SDK
      const gun = core.gun || (core.db && core.db.gun);
      if (!gun) {
        throw new Error("Gun instance not available");
      }

      const user = gun.user();
      if (!user || !user.is || !user.is.pub) {
        throw new Error("User not authenticated");
      }

      // Try multiple methods to get the SEA pair:
      // 1. SDK storage (recommended method)
      // 2. localStorage fallback
      // 3. Internal Gun user properties (legacy)
      let seaPair = null;

      // Method 1: Use SDK storage (the proper way)
      if (core.storage && typeof core.storage.getPairSync === 'function') {
        seaPair = core.storage.getPairSync();
      }

      // Method 2: Fallback to localStorage
      if (!seaPair) {
        try {
          const storedPair = localStorage.getItem('shogun_keypair');
          if (storedPair) {
            seaPair = JSON.parse(storedPair);
          }
        } catch (e) {
          console.warn("Could not read keypair from localStorage:", e);
        }
      }

      // Method 3: Legacy - try internal Gun properties
      if (!seaPair) {
        seaPair = (core.user && core.user._ && core.user._.sea) || user._?.sea;
      }

      if (!seaPair || !seaPair.pub || !seaPair.priv || !seaPair.epub || !seaPair.epriv) {
        throw new Error("SEA pair not available - try logging in again");
      }

      // Create export data with metadata
      const exportData = {
        type: "shogun-auth-pair",
        version: "1.0",
        pair: {
          pub: seaPair.pub,
          priv: seaPair.priv,
          epub: seaPair.epub,
          epriv: seaPair.epriv,
        },
        username: user.is.alias || user.is.pub.substring(0, 10),
        exportedAt: Date.now(),
      };

      const jsonString = JSON.stringify(exportData);

      if (exportFormat === 'link') {
        // Generate Magic Link
        // Use window.location.origin to point to the current app instance
        // Encode data as Base64 to be url-safe using our central utility
        const base64Data = encodeAuthData(exportData);
        const url = new URL(window.location.origin);
        url.searchParams.set("magic", base64Data);
        setExportKeys(url.toString());
      } else {
        // Default JSON
        setExportKeys(jsonString);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error exporting keys:", err);
      setError(err.message || "Failed to export keys");
      setExportKeys(null);
    }
  }, [core, mode, isOpen, exportFormat]);

  /**
   * Handle QR code scan result
   */
  const handleScan = async (data) => {
    if (!data) return;

    setScanning(false);
    setLoading(true);
    setError(null);

    try {
      // Parse the scanned data
      const scanData = JSON.parse(data);

      if (scanData.type !== "shogun-auth-pair") {
        throw new Error("Invalid QR code format");
      }

      if (!scanData.pair || !scanData.pair.pub || !scanData.pair.priv) {
        throw new Error("Invalid key pair structure");
      }

      // Login with the imported pair using gun.user().auth()
      const gun = core.gun || (core.db && core.db.gun);
      if (!gun) {
        throw new Error("Gun instance not available");
      }

      const user = gun.user();
      
      await new Promise((resolve, reject) => {
        user.auth(scanData.pair, (ack) => {
          if (ack.err) {
            reject(new Error(ack.err));
            return;
          }
          resolve(ack);
        });
      });

      // Success - close modal and show success message
      alert("✅ Login completato con successo! Le tue chiavi sono state importate.");
      onClose();
      // Reload page to refresh auth state
      window.location.reload();
    } catch (err) {
      console.error("Error importing keys:", err);
      setError(err.message || "Failed to import keys from QR code");
      setLoading(false);
    }
  };

  /**
   * Handle scan error
   */
  const handleScanError = (err) => {
    console.error("QR scan error:", err);
    setError("Errore durante la scansione. Assicurati che la fotocamera sia disponibile.");
  };

  /**
   * Copy QR data to clipboard
   */
  const copyToClipboard = () => {
    if (exportKeys) {
      navigator.clipboard.writeText(exportKeys);
      alert("✅ Dati copiati negli appunti!");
    }
  };

  /**
   * Download QR data as JSON file
   */
  const downloadKeys = () => {
    if (!exportKeys) return;

    try {
      const blob = new Blob([exportKeys], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shogun-keys-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading keys:", err);
      setError("Errore durante il download");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>QR Code Authentication</Modal.Header>
      <Modal.Body>
        <div className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex p-1 bg-base-300/50 rounded-full gap-1">
          <button
            className={`btn btn-sm flex-1 rounded-full border-none shadow-none ${mode === "export" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => {
              setMode("export");
              setError(null);
              setScanning(false);
            }}
          >
            📤 Export Keys
          </button>
          <button
            className={`btn btn-sm flex-1 rounded-full border-none shadow-none ${mode === "import" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => {
              setMode("import");
              setError(null);
              setScanning(false);
            }}
          >
            📥 Import Keys
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error rounded-2xl shadow-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Export Mode */}
        {mode === "export" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-base-content/60 mb-6">
                Scan this QR code with another device to log in automatically.
              </p>
              
              {/* Export Format Toggle */}
              <div className="flex justify-center mb-6">
                <div className="join bg-base-300/50 p-1 rounded-full">
                  <button 
                    className={`join-item btn btn-xs rounded-full px-4 border-none shadow-none ${exportFormat === 'json' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setExportFormat('json')}
                  >
                    JSON
                  </button>
                  <button 
                    className={`join-item btn btn-xs rounded-full px-4 border-none shadow-none ${exportFormat === 'link' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setExportFormat('link')}
                  >
                    Magic Link
                  </button>
                </div>
              </div>

              {exportKeys ? (
                <div className="flex flex-col items-center space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] border-4 border-base-content/5">
                    <QRCodeSVG
                      value={exportKeys}
                      size={256}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      className="btn btn-sm btn-outline btn-primary rounded-full px-6"
                      onClick={copyToClipboard}
                    >
                      {exportKeys.startsWith('http') ? '🔗 Copy Link' : '📋 Copy JSON'}
                    </button>
                    {!exportKeys.startsWith('http') && (
                      <button
                        className="btn btn-sm btn-outline btn-primary rounded-full px-6"
                        onClick={downloadKeys}
                      >
                        💾 Download JSON
                      </button>
                    )}
                  </div>

                  <div className="alert alert-warning rounded-[1.5rem] shadow-none bg-warning/10 border-warning/20 text-warning-content">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span className="text-xs font-bold leading-tight">
                      ⚠️ WARNING: {exportKeys.startsWith('http') ? 'This link' : 'This QR code'} contains your private keys. 
                      NEVER share it publicly!
                    </span>
                  </div>
                </div>
              ) : (
                <div className="alert alert-error rounded-2xl shadow-none">
                  <span className="font-medium">Failed to export keys. Ensure you are authenticated.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import Mode */}
        {mode === "import" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-base-content/60 mb-6">
                Scan the QR code from the device containing the keys to import.
              </p>

              {!scanning ? (
                <button
                  className="btn btn-primary rounded-full w-full py-4 h-auto text-lg font-bold shadow-none"
                  onClick={() => setScanning(true)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-custom"></span>
                      Loading...
                    </>
                  ) : (
                    "📷 Start Scanning"
                  )}
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="relative overflow-hidden rounded-[2rem] border-4 border-primary/20 bg-black" style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
                    <QrReader
                      delay={300}
                      onError={handleScanError}
                      onScan={handleScan}
                      style={{ width: "100%" }}
                      facingMode="environment"
                    />
                  </div>
                  
                  <button
                    className="btn btn-sm btn-ghost rounded-full w-full font-bold text-error"
                    onClick={() => {
                      setScanning(false);
                      setError(null);
                    }}
                  >
                    ❌ Cancel Scan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </Modal.Body>
    </Modal>
  );
};

export default QRCodeAuth;
