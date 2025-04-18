import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../util/UserContext';
import createPeer from '../../util/simple-peer-shim';
import { getMediaStream, stopMediaStream, hasMultipleCameras } from '../../util/webrtc';
import { toast } from 'react-toastify';
import './VideoCall.css';

const VideoCall = ({ socket, recipientId, recipientName, recipientImage, isVideoCall = true, onCallEnd }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, connected, ended
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [peer, setPeer] = useState(null);
  const [multipleDevices, setMultipleDevices] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const navigate = useNavigate();
  const { user } = useUser();
  const durationInterval = useRef();

  // Initial setup
  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Check for multiple cameras
        const hasMultiple = await hasMultipleCameras();
        setMultipleDevices(hasMultiple);
        
        await startCall();
      } catch (error) {
        console.error("Failed to initialize call:", error);
        setCallStatus("failed");
        setTimeout(() => {
          handleEndCall();
        }, 3000);
      }
    };
    
    if (socket) {
      initializeCall();
    } else {
      console.error("Socket connection is not available");
      setCallStatus("failed");
      setTimeout(() => {
        handleEndCall();
      }, 3000);
    }

    return () => {
      stopLocalStream();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('callAccepted', (signal) => {
        console.log("Call accepted, processing signal");
        setCallStatus('connected');
        startTimer();
        if (peer) {
          peer.signal(signal);
        }
      });

      socket.on('callRejected', () => {
        console.log("Call rejected");
        handleEndCall();
      });

      socket.on('callEnded', () => {
        console.log("Call ended by recipient");
        handleEndCall();
      });

      return () => {
        socket.off('callAccepted');
        socket.off('callRejected');
        socket.off('callEnded');
      };
    }
  }, [socket, peer]);

  const startCall = async () => {
    try {
      console.log("Starting call, getting media stream");
      const stream = await getMediaStream(isVideoCall);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Validate recipientId
      if (!recipientId) {
        console.error("Missing recipient ID, cannot make call");
        setCallStatus("failed");
        toast.error("Cannot start call: Missing recipient information");
        setTimeout(() => {
          handleEndCall();
        }, 3000);
        return;
      }
      
      // Validate socket connection
      if (!socket) {
        console.error("Socket not available");
        setCallStatus("failed");
        toast.error("Cannot start call: No socket connection");
        setTimeout(() => {
          handleEndCall();
        }, 3000);
        return;
      }
      
      // Try to reconnect socket if not connected
      if (!socket.connected) {
        console.log("Socket not connected, attempting to reconnect...");
        socket.connect();
        
        // Wait for connection or timeout
        const waitForConnection = new Promise((resolve, reject) => {
          let tries = 0;
          const maxTries = 5;
          const interval = setInterval(() => {
            if (socket.connected) {
              clearInterval(interval);
              resolve();
            } else if (tries++ >= maxTries) {
              clearInterval(interval);
              reject(new Error("Failed to connect socket after multiple attempts"));
            }
          }, 1000);
        });
        
        try {
          await waitForConnection;
          console.log("Socket reconnected successfully");
        } catch (error) {
          console.error(error.message);
          setCallStatus("failed");
          toast.error("Cannot connect to call server. Please try again later.");
          setTimeout(() => {
            handleEndCall();
          }, 3000);
          return;
        }
      }
      
      console.log("Creating peer connection");
      const newPeer = createPeer({
        initiator: true,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      newPeer.on('signal', (signalData) => {
        console.log("Sending signal to recipient", recipientId);
        if (socket && socket.connected) {
          socket.emit('callUser', {
            userToCall: recipientId,
            signalData,
            from: user?._id, 
            name: user?.name,
            isVideoCall
          });
        } else {
          console.error("Socket not connected, cannot send signal");
          toast.error("Cannot connect to call server. Please try again.");
          handleEndCall();
        }
      });

      newPeer.on('stream', (stream) => {
        console.log("Received remote stream");
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      newPeer.on('error', (err) => {
        console.error("Peer connection error:", err);
        setCallStatus("error");
        setTimeout(() => {
          handleEndCall();
        }, 3000);
      });

      setPeer(newPeer);
      setCallStatus('ringing');
    } catch (err) {
      console.error('Error starting call:', err);
      setCallStatus("failed");
      setTimeout(() => {
        handleEndCall();
      }, 3000);
    }
  };

  const stopLocalStream = () => {
    if (localStream) {
      stopMediaStream(localStream);
    }
    if (peer) {
      peer.destroy();
    }
  };

  const startTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && isVideoCall) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const switchCamera = async () => {
    if (!isVideoCall) return;
    
    setIsFrontCamera(!isFrontCamera);
    
    try {
      // Stop current video tracks
      if (localStream) {
        localStream.getVideoTracks().forEach(track => track.stop());
      }
      
      // Get new stream with different camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: isFrontCamera ? 'environment' : 'user' },
        audio: true
      });
      
      // Replace video track in local stream
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }
        
        setLocalStream(newStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }
        
        // Replace track in peer connection if it exists
        if (peer && newVideoTrack) {
          const senders = peer._pc.getSenders();
          const videoSender = senders.find(sender => 
            sender.track && sender.track.kind === 'video'
          );
          
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack);
          }
        }
      }
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    stopLocalStream();
    
    if (socket && socket.connected) {
      socket.emit('endCall', { to: recipientId });
    }
    
    if (onCallEnd) {
      onCallEnd();
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting': return 'Connecting...';
      case 'ringing': return 'Ringing...';
      case 'connected': return 'Connected';
      case 'ended': return 'Call ended';
      case 'failed': return 'Call failed';
      case 'error': return 'Connection error';
      default: return callStatus;
    }
  };

  return (
    <div className="video-call-container">
      <div className="call-background">
        <div className="remote-video-wrapper">
          {remoteStream ? (
            <video
              className="remote-video"
              ref={remoteVideoRef}
              autoPlay
              playsInline
            />
          ) : (
            <div className="video-placeholder">
              {recipientImage ? (
                <img
                  src={recipientImage}
                  alt={recipientName}
                  className="recipient-image large"
                />
              ) : (
                <div className="recipient-avatar large">
                  {recipientName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="local-video-wrapper">
          <video
            className="local-video"
            ref={localVideoRef}
            muted
            autoPlay
            playsInline
          />
        </div>

        <div className="call-overlay">
          <div className="call-header">
            <div className="call-info">
              <h2>{recipientName}</h2>
              <p className="call-status">
                {getStatusText()}
                {callStatus === 'connected' && callDuration > 0 && ` • ${formatDuration(callDuration)}`}
              </p>
            </div>
          </div>

          <div className="call-actions">
            <div className="action-row">
              <button
                className="action-btn"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button
                className="action-btn"
                onClick={toggleVideo}
                title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
              >
                {isVideoEnabled ? '📹' : '🎦'}
              </button>
              {isVideoCall && multipleDevices && (
                <button
                  className="action-btn"
                  onClick={switchCamera}
                  title="Switch camera"
                >
                  🔄
                </button>
              )}
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

export default VideoCall; 