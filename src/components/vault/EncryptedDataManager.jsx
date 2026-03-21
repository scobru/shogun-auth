import React, { useState, useEffect } from "react";

// Encrypted Data Manager component
const EncryptedDataManager = ({ shogun, authStatus }) => {
  const [dataKey, setDataKey] = useState("");
  const [dataValue, setDataValue] = useState("");
  const [storedData, setStoredData] = useState({});
  const [decryptedData, setDecryptedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user's encrypted data when logged in
  useEffect(() => {
    if (authStatus.isLoggedIn && shogun) {
      loadEncryptedData();
    }
  }, [authStatus.isLoggedIn, shogun]);

  // Load user data from Gun
  const loadEncryptedData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Clear previous data
      setStoredData({});

      // Load data from Gun using new ShogunCore API
      await new Promise(async (resolve) => {
        const data = {};

        // Use shogun.gun.user() to access the current user
        const user = shogun.gun.user();
        if (!user || !user.is) {
          resolve();
          return;
        }

        const userData = await new Promise((resolveData) => {
          user.get("shogun/encryptedData").once((data) => {
            resolveData(data);
          });
        });

        // Handle userData as an object rather than an array
        if (userData) {
          Object.entries(userData).forEach(([key, value]) => {
            if (key !== "_" && value !== null) {
              data[key] = value;
            }
          });
        }

        // Wait a bit to ensure we've loaded all data
        setTimeout(() => {
          setStoredData(data);
          resolve();
        }, 500);
      });
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save encrypted data to user's Gun space
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dataKey.trim() || !dataValue.trim()) {
      setError("Both key and value are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Get current user and pair
      const user = shogun.gun.user();
      if (!user || !user.is) {
        throw new Error("User not logged in");
      }

      // Get user pair from Gun user instance
      const pair = (user._?.sea || user.is?.sea) || null;
      if (!pair) {
        throw new Error("User pair not available");
      }

      // Encrypt data using SEA from db.sea
      const SEA = shogun.db.sea || shogun.gun.SEA || window.SEA;
      if (!SEA) {
        throw new Error("SEA not available");
      }

      const encryptedValue = await SEA.encrypt(dataValue, pair);

      // Save to user's space using new ShogunCore API
      user.get("shogun/encryptedData").get(dataKey).put(encryptedValue);

      // Update local state
      setStoredData((prev) => ({
        ...prev,
        [dataKey]: encryptedValue,
      }));

      // Clear form
      setDataKey("");
      setDataValue("");

      // Reload data to ensure we have the latest
      loadEncryptedData();
    } catch (err) {
      console.error("Error saving data:", err);
      setError("Failed to save data: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decrypt and display data
  const handleDecrypt = async (key) => {
    try {
      const encryptedValue = storedData[key];
      
      // Get current user and pair
      const user = shogun.gun.user();
      if (!user || !user.is) {
        throw new Error("User not logged in");
      }

      // Get user pair from Gun user instance
      const pair = (user._?.sea || user.is?.sea) || null;
      if (!pair) {
        throw new Error("User pair not available");
      }

      // Decrypt data using SEA from db.sea
      const SEA = shogun.db.sea || shogun.gun.SEA || window.SEA;
      if (!SEA) {
        throw new Error("SEA not available");
      }

      const decrypted = await SEA.decrypt(encryptedValue, pair);

      setDecryptedData((prev) => ({
        ...prev,
        [key]: decrypted,
      }));
    } catch (err) {
      console.error("Error decrypting data:", err);
      setError("Failed to decrypt data: " + err.message);
    }
  };

  // Delete data
  const handleDelete = async (key) => {
    try {
      setLoading(true);
      setError(null);

      // Delete from Gun using new ShogunCore API
      const user = shogun.gun.user();
      if (!user || !user.is) {
        throw new Error("User not logged in");
      }
      user.get("shogun/encryptedData").get(key).put(null);

      // Update local state
      setStoredData((prev) => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });

      // Also remove any decrypted data
      setDecryptedData((prev) => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
    } catch (err) {
      console.error("Error deleting data:", err);
      setError("Failed to delete data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-6">
      <div className="card-body">
        <h2 className="card-title text-2xl flex items-center gap-2">
          Encrypted Data Vault
        </h2>
        <p className="text-secondary mb-4">
          Store and manage your encrypted data securely. All data is encrypted
          using your personal keys and stored in GunDB.
        </p>

        <div className="card mb-6">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              Add New Encrypted Data
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label htmlFor="dataKey" className="label">
                  <span className="label-text font-medium">Data Key</span>
                </label>
                <input
                  id="dataKey"
                  type="text"
                  placeholder="e.g., 'password', 'api_key'"
                  value={dataKey}
                  onChange={(e) => setDataKey(e.target.value)}
                  className="input input-bordered w-full focus:input-primary transition-colors bg-base-100/50"
                  required
                />
              </div>

              <div className="form-control">
                <label htmlFor="dataValue" className="label">
                  <span className="label-text font-medium">Data Value</span>
                </label>
                <textarea
                  id="dataValue"
                  placeholder="Value to be encrypted"
                  value={dataValue}
                  onChange={(e) => setDataValue(e.target.value)}
                  className="textarea textarea-bordered w-full min-h-[100px] focus:textarea-primary transition-colors bg-base-100/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !dataKey.trim() ||
                  !dataValue.trim() ||
                  isSubmitting
                }
                className="btn-custom w-full"
              >
                {isSubmitting ? <span className="loading-custom"></span> : null}
                {isSubmitting ? "Encrypting & Storing..." : "Encrypt & Store"}
              </button>
            </form>

            {error && (
              <div className="alert-custom error mt-4">
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
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Your Encrypted Data
          </h3>

          {Object.keys(storedData).length === 0 ? (
            <div className="text-center py-12 bg-base-200/50 rounded-2xl border border-base-300 border-dashed animate-in fade-in duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-base-content/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm uppercase tracking-wider font-semibold text-base-content/50 mb-2">
                Encrypted vault is empty
              </p>
              <p className="text-base-content/60 max-w-sm mx-auto">Add your first encrypted entry using the form above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(storedData).map((key) => (
                <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 border border-base-200 animate-in slide-in-from-bottom-2 fade-in group" key={key}>
                  <div className="card-body p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-lg break-all group-hover:text-primary transition-colors duration-200 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                          {key}
                        </h4>
                        <p className="text-xs text-secondary mt-1">
                          Encrypted item stored in your vault
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="btn btn-sm btn-outline btn-primary transition-transform duration-200 hover:-translate-y-0.5" onClick={() => handleDecrypt(key)}>Decrypt</button>
                        <button className="btn btn-sm btn-soft btn-error transition-transform duration-200 hover:-translate-y-0.5" onClick={() => handleDelete(key)}>Delete</button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-medium mb-1 uppercase tracking-wide text-secondary">
                          Encrypted data (preview)
                        </h5>
                        <pre className="bg-base-300/70 border border-base-300 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-40">
                          {typeof storedData[key] === "string"
                            ? storedData[key].substring(0, 120) +
                              (storedData[key].length > 120 ? "..." : "")
                            : JSON.stringify(storedData[key], null, 2)}
                        </pre>
                      </div>

                      {decryptedData[key] && (
                        <div>
                          <h5 className="text-xs font-medium mb-1 uppercase tracking-wide text-secondary">
                            Decrypted value
                          </h5>
                          <pre className="bg-base-300/70 border border-base-300 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-40">
                            {decryptedData[key]}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncryptedDataManager;
