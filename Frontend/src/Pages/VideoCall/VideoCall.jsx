import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import { useUser } from '../../util/UserContext';
import { toast } from 'react-toastify';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone, FaPhoneSlash } from 'react-icons/fa';
import './VideoCall.css';

const VideoCall = ({ chatId, recipientId }) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const userVideo = useRef();
  const partnerVideo = useRef();
  const connectionRef = useRef();
  const socket = useRef();
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    socket.current = io(process.env.REACT_APP_BACKEND_URL);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      });

    socket.current.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const callUser = () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCall: recipientId,
        signalData: data,
        from: user._id,
      });
    });

    peer.on("stream", (stream) => {
      partnerVideo.current.srcObject = stream;
    });

    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on("signal", (data) => {
      socket.current.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    navigate('/chats');
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="video-call-container">
      <div className="video-grid">
        {stream && (
          <div className="video-player">
            <video playsInline muted ref={userVideo} autoPlay className="user-video" />
            <div className="video-label">You</div>
          </div>
        )}
        {callAccepted && !callEnded && (
          <div className="video-player">
            <video playsInline ref={partnerVideo} autoPlay className="partner-video" />
            <div className="video-label">Partner</div>
          </div>
        )}
      </div>

      <div className="controls">
        <button onClick={toggleMute} className={`control-btn ${isMuted ? 'active' : ''}`}>
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button onClick={toggleVideo} className={`control-btn ${isVideoOff ? 'active' : ''}`}>
          {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
        </button>
        {!callAccepted ? (
          <button onClick={callUser} className="call-btn">
            <FaPhone />
          </button>
        ) : (
          <button onClick={leaveCall} className="end-call-btn">
            <FaPhoneSlash />
          </button>
        )}
      </div>

      {receivingCall && !callAccepted && (
        <div className="incoming-call">
          <h3>Incoming Call...</h3>
          <button onClick={answerCall} className="answer-btn">
            Answer
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCall; 