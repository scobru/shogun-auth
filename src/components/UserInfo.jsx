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

  if (!user) {
    return null;
  }

  const { email, name, picture, userPub, username } = user;
  const displayName = name || username || email || 'User';
  
  // Create a generated avatar if no picture is available
  const avatarContent = useMemo(() => {
    // If we have a picture, use it
    if (picture) {
      return <img src={picture} alt={displayName} />;
    }
    
    // Use gun-avatar if userPub is available
    if (userPub) {
      try {
        const avatarSrc = gunAvatar({ pub: userPub, size: 64 });
        if (avatarSrc) {
          // Strip any newlines or invalid characters from the base64 string and convert base64url to standard base64
          const cleanAvatarSrc = typeof avatarSrc === 'string'
            ? avatarSrc.replace(/[\n\r]/g, '').replace(/-/g, '+').replace(/_/g, '/')
            : avatarSrc;
          return <img src={cleanAvatarSrc} alt={displayName} />;
        }
      } catch (e) {
        console.error("Error generating gun-avatar:", e);
        // Fallback to initials if gun-avatar fails
      }
    }
    
    // Otherwise generate an avatar with initials
    const generateInitials = (name) => {
      if (!name) return '?';
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };
    const initials = generateInitials(displayName);
    
    return (
      <div 
        style={{ 
          backgroundColor: '#4F6BF6', // A default color
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: '#ffffff',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}
      >
        {initials}
      </div>
    );
  }, [picture, userPub, displayName]);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="card bg-base-200/50 rounded-[2rem] border border-base-content/5 transition-all duration-300">
      <div className="card-body">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-16 rounded-full ring-2 ring-primary/20 ring-offset-base-100 ring-offset-2 transition-all duration-300">
              {avatarContent}
            </div>
          </div>
          <div>
            <h2 className="card-title text-2xl font-bold">{displayName}</h2>
            <p className="text-sm text-base-content/60">{email || username}</p>
          </div>
        </div>

        <div className="divider opacity-50"></div>

        <div className="flex justify-between items-center gap-2">
          <button 
            className="btn btn-sm btn-ghost rounded-full hover:bg-base-300 transition-colors"
            onClick={toggleDetails}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button 
            className="btn btn-sm btn-outline btn-primary rounded-full transition-all duration-200"
            onClick={() => setShowQRModal(true)}
          >
            📱 QR Code
          </button>
          <button 
            className="btn btn-sm btn-soft btn-error rounded-full transition-all duration-200"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 space-y-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 bg-base-300/30 p-5 rounded-[1.5rem] border border-base-content/5">
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="font-semibold text-base-content/70 col-span-1">User ID:</span>
              <span className="truncate col-span-2 font-mono text-xs bg-base-300/50 p-2 rounded-lg">{user.userPub || 'N/A'}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="font-semibold text-base-content/70 col-span-1">Username:</span>
              <span className="col-span-2 font-medium">{user.username}</span>
            </div>
            
          </div>
        )}
      </div>
      
      {/* QR Code Authentication Modal */}
      <QRCodeAuth isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
};

export default UserInfo; 