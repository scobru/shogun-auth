import React, { useState, useMemo } from 'react';
import { gunAvatar } from 'gun-avatar';
import QRCodeAuth from './QRCodeAuth';

/**
 * Component to display user information
 * @param {Object} props - Component props
 * @param {Object} props.user - User data
 * @param {Function} props.onLogout - Logout function
 */
const UserInfo = ({ user, onLogout }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) {
    return null;
  }

  const { email, name, picture, userPub, username } = user;
  const displayName = name || username || email || 'User';
  
  // Create a generated avatar if no picture is available
  const avatarContent = useMemo(() => {
    if (picture) {
      return <img src={picture} alt={displayName} className="object-cover" />;
    }
    
    if (userPub) {
      try {
        const avatarSrc = gunAvatar({ pub: userPub, size: 128 });
        if (avatarSrc) {
          const cleanAvatarSrc = typeof avatarSrc === 'string'
            ? avatarSrc.replace(/[\n\r]/g, '').replace(/-/g, '+').replace(/_/g, '/')
            : avatarSrc;
          return <img src={cleanAvatarSrc} alt={displayName} className="object-cover" />;
        }
      } catch (e) {
        console.error("Error generating gun-avatar:", e);
      }
    }
    
    return (
      <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
        {displayName.substring(0, 2).toUpperCase()}
      </div>
    );
  }, [picture, userPub, displayName]);

  const copyPublicKey = () => {
    if (userPub) {
      navigator.clipboard.writeText(userPub);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-content/5 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent"></div>
      
      <div className="px-8 pb-8 -mt-10">
        <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
          <div className="avatar">
            <div className="w-24 rounded-[2rem] bg-base-100 p-1 border border-base-content/10 shadow-lg">
              <div className="w-full h-full rounded-[1.75rem] overflow-hidden">
                {avatarContent}
              </div>
            </div>
          </div>
          
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
              <div className="badge badge-primary badge-outline badge-xs opacity-50 font-mono">Vault Identity</div>
            </div>
            <p className="text-sm text-base-content/50 font-medium">{email || username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button 
            onClick={() => setShowQRModal(true)}
            className="btn btn-sm btn-ghost bg-base-200/50 hover:bg-primary/10 hover:text-primary rounded-xl border-none gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Sync with QR
          </button>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-sm btn-ghost bg-base-200/50 rounded-xl border-none gap-2"
          >
            {showDetails ? 'Hide Metadata' : 'Show Metadata'}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-base-content/5 animate-vault-in">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 px-1">Security Public Key (PUB)</label>
              <div 
                onClick={copyPublicKey}
                className="group relative cursor-pointer p-3 rounded-xl bg-base-200/30 border border-base-content/5 font-mono text-[10px] break-all hover:bg-primary/5 hover:border-primary/20 transition-all"
              >
                {userPub}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] bg-primary text-primary-content px-2 py-1 rounded-lg shadow-sm">
                    {copied ? 'Copied!' : 'Copy'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold opacity-60 italic">Session Persistence: Active</span>
              <span className="text-[10px] opacity-40">Connected to GunDB Cluster</span>
            </div>
          </div>
        )}

        <div className="mt-8">
           <button 
            className="btn btn-sm btn-error btn-ghost bg-error/5 hover:bg-error hover:text-white rounded-xl w-full border-none transition-all duration-300"
            onClick={onLogout}
          >
            Terminal Logout
          </button>
        </div>
      </div>
      
      <QRCodeAuth isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
};

export default UserInfo;
