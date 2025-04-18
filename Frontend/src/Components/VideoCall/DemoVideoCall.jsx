import React, { useEffect, useRef, useState } from 'react';
import './VideoCall.css';

/**
 * A simplified demo version of the video call component
 * that works without requiring a socket connection
 */
const DemoVideoCall = ({ recipientName, recipientImage, onCallEnd }) => {
  const [localStream, setLocalStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState(null);
  
  const localVideoRef = useRef();
  const timerRef = useRef();
  
  // Get camera access on mount
  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access failed:', err);
        setError(`Camera access failed: ${err.message}`);
      }
    };
    
    getCamera();
    
    // Start a timer for the demo call
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    // Clean up on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Format the call duration as mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle mute state
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle video state
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  // End the demo call
  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (onCallEnd) {
      onCallEnd();
    }
  };
  
  return (
    <div className="video-call-container">
      <div className="call-background">
        {/* Remote video area (shows a placeholder in demo mode) */}
        <div className="remote-video-wrapper">
          <div className="video-placeholder">
            <div className="mock-call-message">
              <h2>Demo Mode</h2>
              <p>This is a demonstration of the video call interface.</p>
              <p>In a real call, your contact's video would appear here.</p>
              {error && <p className="error-text">{error}</p>}
            </div>
          </div>
        </div>
        
        {/* Local video preview */}
        <div className="local-video-wrapper">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
            />
          ) : (
            <div className="camera-placeholder">
              <p>{error || "Camera initializing..."}</p>
            </div>
          )}
        </div>
        
        {/* Call controls overlay */}
        <div className="call-overlay">
          <div className="call-header">
            <div className="call-info">
              <h2>{recipientName || "Demo Call"}</h2>
              <p className="call-status">
                Demo Mode • {formatDuration(callDuration)}
              </p>
            </div>
          </div>
          
          <div className="call-actions">
            <div className="action-row">
              <button
                className="action-btn"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                disabled={!localStream}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button
                className="action-btn"
                onClick={toggleVideo}
                title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                disabled={!localStream}
              >
                {isVideoEnabled ? '📹' : '🎦'}
              </button>
            </div>
            <div className="action-row">
              <button
                className="end-call-btn"
                onClick={handleEndCall}
                title="End call"
              >
                📞
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoVideoCall; 