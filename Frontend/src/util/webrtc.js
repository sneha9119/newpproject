import createPeerShim, { Peer } from './simple-peer-shim';

/**
 * WebRTC utilities for media handling
 */

// Default constraints for media
const DEFAULT_VIDEO_CONSTRAINTS = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 24, max: 30 }
};

const DEFAULT_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
};

/**
 * Get user media stream (audio and/or video)
 * @param {boolean} isVideoCall Whether to include video in the stream
 * @param {Object} videoConstraints Additional video constraints
 * @param {Object} audioConstraints Additional audio constraints
 * @returns {Promise<MediaStream>} Media stream
 */
export const getMediaStream = async (isVideoCall = true, videoConstraints = {}, audioConstraints = {}) => {
  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not supported in this browser');
    }

    const constraints = {
      audio: { ...DEFAULT_AUDIO_CONSTRAINTS, ...audioConstraints },
      video: isVideoCall ? { ...DEFAULT_VIDEO_CONSTRAINTS, ...videoConstraints } : false
    };

    console.log('Getting media with constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error getting media stream:', error);
    
    // Try fallback to audio only if video fails
    if (isVideoCall) {
      console.log('Trying fallback to audio only');
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { ...DEFAULT_AUDIO_CONSTRAINTS, ...audioConstraints },
          video: false
        });
        return audioStream;
      } catch (audioError) {
        console.error('Fallback to audio only also failed:', audioError);
        throw audioError;
      }
    }
    
    throw error;
  }
};

/**
 * Check if device has multiple cameras
 * @returns {Promise<boolean>} Whether device has multiple cameras
 */
export const hasMultipleCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
    return videoInputDevices.length > 1;
  } catch (error) {
    console.error('Error checking for multiple cameras:', error);
    return false;
  }
};

/**
 * Creates a peer connection with ICE servers
 * @returns {RTCPeerConnection} Peer connection
 */
export const createPeerConnection = () => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];
  
  return new RTCPeerConnection({ iceServers });
};

/**
 * Helper to safely stop all tracks in a stream
 * @param {MediaStream} stream Media stream to stop
 */
export const stopMediaStream = (stream) => {
  if (!stream) return;
  
  try {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  } catch (error) {
    console.error('Error stopping media stream:', error);
  }
};

export const createPeer = (stream, initiator, onSignal, onStream) => {
  const peer = createPeerShim({
    initiator,
    trickle: false,
    stream
  });

  peer.on('signal', (data) => {
    onSignal(data);
  });

  peer.on('stream', (stream) => {
    onStream(stream);
  });

  peer.on('error', (err) => {
    console.error('Peer error:', err);
  });

  peer.on('close', () => {
    console.log('Peer connection closed');
  });

  return peer;
}; 