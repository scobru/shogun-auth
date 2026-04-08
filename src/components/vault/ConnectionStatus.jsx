import React, { useState, useEffect } from "react";
import { DEFAULT_RELAYS } from "../../config";

const ConnectionStatus = ({ shogun }) => {
  const [stats, setStats] = useState({
    connected: false,
    peerCount: 0,
    relays: [],
    lastUpdate: null
  });

  useEffect(() => {
    if (!shogun) return;

    const updateStats = () => {
      const gun = shogun.gun || (shogun.db && shogun.db.gun);
      if (!gun) return;

      // Gun doesn't always expose peer list easily in a standard way, 
      // but we can try to look into the internal structure
      const peers = gun._?.opt?.peers || {};
      const activeRelays = Object.keys(peers);
      
      setStats({
        connected: activeRelays.length > 0,
        peerCount: activeRelays.length,
        relays: activeRelays.length > 0 ? activeRelays : DEFAULT_RELAYS,
        lastUpdate: new Date().toLocaleTimeString()
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [shogun]);

  return (
    <div className="card vault-card p-6 bg-base-200/50 border-none">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold">Network Status</h3>
          <p className="text-sm text-base-content/50">Real-time connection details</p>
        </div>
        <div className={`badge-custom ${stats.connected ? 'success' : 'error'}`}>
          <span className="badge-dot" />
          <span>{stats.connected ? 'Dynamic' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-base-300/30 border border-base-content/5">
          <span className="text-xs uppercase tracking-widest text-base-content/40 font-bold mb-1 block">Peers Count</span>
          <span className="text-2xl font-mono text-primary">{stats.peerCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-base-300/30 border border-base-content/5">
          <span className="text-xs uppercase tracking-widest text-base-content/40 font-bold mb-1 block">Last Heartbeat</span>
          <span className="text-sm font-mono opacity-80">{stats.lastUpdate || 'Checking...'}</span>
        </div>
      </div>

      <div className="mt-6">
        <span className="text-xs uppercase tracking-widest text-base-content/40 font-bold mb-3 block">Connected Relays</span>
        <div className="space-y-2">
          {stats.relays.map((relay, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-base-100/50 border border-base-content/5 overflow-hidden">
              <div className="w-2 h-2 rounded-full bg-success shrink-0" />
              <span className="text-xs font-mono truncate flex-1 opacity-70" title={relay}>{relay}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-base-content/5 flex justify-between items-center">
        <span className="text-[10px] text-base-content/30 italic">Encryption: GunDB SEA (AES + SHA-256)</span>
        <button 
           onClick={() => window.location.reload()}
           className="btn btn-xs btn-ghost gap-1 opacity-50 hover:opacity-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reconnect
        </button>
      </div>
    </div>
  );
};

export default ConnectionStatus;
