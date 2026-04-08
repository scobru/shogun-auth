/**
 * Global configuration and utilities for Shogun Auth
 */

export const DEFAULT_RELAYS = [
  "https://gun.defucc.me/gun",
  "https://gun.o8.is/gun",
  "https://shogun-relay.scobrudot.dev/gun",
  "https://relay.peer.ooo/gun"
];

/**
 * URL-safe Base64 Encoding
 */
export const encodeAuthData = (data) => {
  const jsonString = JSON.stringify(data);
  // Using btoa and making it url-safe
  return btoa(jsonString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * URL-safe Base64 Decoding
 */
export const decodeAuthData = (encodedData) => {
  try {
    // Restore base64 padding and characters
    let base64 = encodedData
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const jsonString = atob(base64);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to decode auth data:", e);
    return null;
  }
};

export const APP_NAME = "Shogun Auth";
export const VERSION = "1.1.0";
