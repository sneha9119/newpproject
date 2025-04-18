// This file provides a compatible wrapper for simple-peer in browsers
import Peer from 'simple-peer';

// Configure simple-peer
const wrtc = null; // Browser WebRTC API is used by default

// Create a wrapper around simple-peer that handles browser compatibility
export default function createPeer(options) {
  // Ensure the global object exists
  if (typeof global === 'undefined') {
    window.global = window;
  }
  
  // Create a new peer instance with browser-compatible options
  const peer = new Peer({
    ...options,
    wrtc: wrtc, // Use browser's built-in WebRTC
    sdpTransform: (sdp) => sdp // No transformation by default
  });
  
  return peer;
}

// Re-export other properties from simple-peer
export { Peer }; 