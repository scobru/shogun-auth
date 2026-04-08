import React, { useState, useEffect, useMemo } from "react";

// Encrypted Data Manager component
const EncryptedDataManager = ({ shogun, authStatus, category = "all" }) => {
  const [dataKey, setDataKey] = useState("");
  const [dataValue, setDataValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [storedData, setStoredData] = useState({});
  const [decryptedData, setDecryptedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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

      // Use shogun.gun.user() to access the current user
      const user = shogun.gun.user();
      if (!user || !user.is) return;

      user.get("shogun/encryptedData").once((userData) => {
        const data = {};
        if (userData) {
          Object.entries(userData).forEach(([key, value]) => {
            if (key !== "_" && value !== null) {
              data[key] = value;
            }
          });
        }
        setStoredData(data);
        setLoading(false);
      });
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data: " + err.message);
      setLoading(false);
    }
  };

  // Filter and Search Logic
  const filteredData = useMemo(() => {
    return Object.entries(storedData).filter(([key]) => {
      const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (category === "all") return true;
      if (category === "passwords") return key.toLowerCase().includes("pass") || key.toLowerCase().includes("login");
      if (category === "notes") return !key.toLowerCase().includes("pass") && !key.toLowerCase().includes("login");
      
      return true;
    });
  }, [storedData, searchTerm, category]);

  // Save encrypted data to user's Gun space
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dataKey.trim() || !dataValue.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const user = shogun.gun.user();
      const pair = (user._?.sea || user.is?.sea) || null;
      if (!pair) throw new Error("User pair not available");

      const SEA = shogun.db.sea || shogun.gun.SEA || window.SEA;
      const encryptedValue = await SEA.encrypt(dataValue, pair);

      user.get("shogun/encryptedData").get(dataKey).put(encryptedValue);
      
      setStoredData(prev => ({ ...prev, [dataKey]: encryptedValue }));
      setDataKey("");
      setDataValue("");
      setShowAddForm(false);
    } catch (err) {
      setError("Failed to save: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecrypt = async (key) => {
    try {
      const encryptedValue = storedData[key];
      const user = shogun.gun.user();
      const pair = (user._?.sea || user.is?.sea) || null;
      const SEA = shogun.db.sea || shogun.gun.SEA || window.SEA;
      
      const decrypted = await SEA.decrypt(encryptedValue, pair);
      setDecryptedData(prev => ({ ...prev, [key]: decrypted }));
    } catch (err) {
      setError("Decrypt failed: " + err.message);
    }
  };

  const handleDelete = async (key) => {
    try {
      const user = shogun.gun.user();
      user.get("shogun/encryptedData").get(key).put(null);
      setStoredData(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      setError("Delete failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Search in ${category}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-12 rounded-2xl bg-base-200/50 border-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`btn btn-primary rounded-2xl px-6 gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 transition-all ${showAddForm ? 'btn-ghost' : ''}`}
        >
          {showAddForm ? 'Cancel' : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Item
            </>
          )}
        </button>
      </div>

      {/* Add New Item Form - Pop-over style */}
      {showAddForm && (
        <div className="card vault-card p-6 animate-in slide-in-from-top-4 fade-in duration-300">
          <h3 className="text-xl font-bold mb-4">Add New {category === "all" ? "Data" : category.slice(0, -1)}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Key (e.g., 'Github Password')"
              value={dataKey}
              onChange={(e) => setDataKey(e.target.value)}
              className="input input-bordered w-full rounded-xl bg-base-200/50 border-none"
              required
            />
            <textarea
              placeholder="Secure value"
              value={dataValue}
              onChange={(e) => setDataValue(e.target.value)}
              className="textarea textarea-bordered w-full rounded-xl bg-base-200/50 border-none min-h-[100px]"
              required
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary w-full rounded-xl"
            >
              {isSubmitting ? <span className="loading loading-spinner" /> : "Encrypt & Store"}
            </button>
          </form>
        </div>
      )}

      {error && <div className="alert-custom error">{error}</div>}

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center p-20"><span className="loading loading-large" /></div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-24 glass-panel border-dashed border-2">
          <div className="opacity-30 mb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-base-content/50 font-medium">No items found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(([key, encryptedValue]) => (
            <div key={key} className="vault-card group animate-in zoom-in-95 duration-300">
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    {key.toLowerCase().includes("pass") ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="dropdown dropdown-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </label>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 border border-base-content/5">
                      <li><a onClick={() => handleDelete(key)} className="text-error">Delete Item</a></li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-bold text-lg mb-2 truncate" title={key}>{key}</h4>
                
                <div className="flex-1 mt-4">
                  {decryptedData[key] ? (
                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                      <p className="text-sm font-mono break-all text-primary font-bold">{decryptedData[key]}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-base-200/50 border border-base-content/5 rounded-xl">
                      <p className="text-xs text-base-content/30 font-mono truncate">••••••••••••••••</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleDecrypt(key)}
                  className={`btn btn-sm w-full mt-6 rounded-xl ${decryptedData[key] ? 'btn-ghost' : 'btn-outline border-base-content/10'}`}
                >
                  {decryptedData[key] ? 'Hide' : 'Reveal'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EncryptedDataManager;
