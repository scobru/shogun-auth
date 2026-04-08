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

        setStoredData(data);
        resolve();
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
    <div className="card mb-6 bg-base-200/50 rounded-[2rem] border border-base-content/5 overflow-hidden">
      <div className="card-body p-4 sm:p-8">
        <h2 className="card-title text-2xl sm:text-3xl font-bold flex items-center gap-3">
          Encrypted Data Vault
        </h2>
        <p className="text-sm sm:text-base text-base-content/60 mb-6 max-w-2xl">
          Store and manage your encrypted data securely.
        </p>

        <div className="card mb-8 bg-base-100 rounded-[1.5rem] border border-base-content/5 shadow-none">
          <div className="card-body p-4 sm:p-6">
            <h3 className="card-title text-lg sm:text-xl font-bold flex items-center gap-2 mb-4">
              Add New Encrypted Data
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="form-control">
                <label htmlFor="dataKey" className="label py-1">
                  <span className="label-text font-bold text-base-content/70">Data Key</span>
                </label>
                <input
                  id="dataKey"
                  type="text"
                  placeholder="e.g., 'password'"
                  value={dataKey}
                  onChange={(e) => setDataKey(e.target.value)}
                  className="input input-bordered w-full rounded-2xl focus:input-primary transition-all bg-base-200/50 border-none"
                  required
                />
              </div>

              <div className="form-control">
                <label htmlFor="dataValue" className="label py-1">
                  <span className="label-text font-bold text-base-content/70">Data Value</span>
                </label>
                <textarea
                  id="dataValue"
                  placeholder="Value to be encrypted"
                  value={dataValue}
                  onChange={(e) => setDataValue(e.target.value)}
                  className="textarea textarea-bordered w-full min-h-[100px] sm:min-h-[120px] rounded-2xl focus:textarea-primary transition-all bg-base-200/50 border-none"
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
                className="btn btn-primary rounded-full w-full py-3 sm:py-4 h-auto text-base sm:text-lg font-bold shadow-none"
              >
                {isSubmitting ? <span className="loading-custom"></span> : null}
                {isSubmitting ? "Storing..." : "Encrypt & Store"}
              </button>
            </form>

            {error && (
              <div className="alert-custom error mt-4 sm:mt-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-5 w-5 sm:h-6 sm:w-6"
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
                <span className="font-medium text-xs sm:text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            Your Encrypted Data
          </h3>

          {Object.keys(storedData).length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-base-100/50 rounded-[2rem] border-2 border-base-content/5 border-dashed animate-in fade-in duration-500">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-base-content/30 mb-2">
                Vault is empty
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {Object.keys(storedData).map((key) => (
                <div className="card bg-base-100 rounded-[1.5rem] border border-base-content/5 shadow-none animate-in slide-in-from-bottom-2 fade-in group" key={key}>
                  <div className="card-body p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 sm:p-3 rounded-2xl bg-primary/10 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg sm:text-xl break-all">
                            {key}
                          </h4>
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <button className="btn btn-xs sm:btn-sm btn-outline btn-primary rounded-full px-4 transition-all" onClick={() => handleDecrypt(key)}>Decrypt</button>
                        <button className="btn btn-xs sm:btn-sm btn-soft btn-error rounded-full px-4 transition-all" onClick={() => handleDelete(key)}>Delete</button>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <h5 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-base-content/40 ml-1">
                          Encrypted preview
                        </h5>
                        <pre className="bg-base-200/50 border border-base-content/5 p-3 sm:p-4 rounded-2xl text-[10px] sm:text-xs overflow-x-auto whitespace-pre-wrap max-h-40 font-mono">
                          {typeof storedData[key] === "string"
                            ? storedData[key].substring(0, 80) + "..."
                            : "..."}
                        </pre>
                      </div>

                      {decryptedData[key] && (
                        <div className="space-y-1 sm:space-y-2 animate-in zoom-in-95 duration-300">
                          <h5 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary ml-1">
                            Decrypted value
                          </h5>
                          <pre className="bg-primary/5 border border-primary/10 p-3 sm:p-4 rounded-2xl text-[10px] sm:text-xs overflow-x-auto whitespace-pre-wrap max-h-40 font-mono text-primary font-bold">
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
