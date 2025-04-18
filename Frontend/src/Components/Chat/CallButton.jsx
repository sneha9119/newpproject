import React, { useState } from 'react';
import { FaPhone, FaVideo } from 'react-icons/fa';
import './CallButton.css';

const CallButton = ({ recipientId, onCallStart }) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleVideoCall = () => {
    setShowOptions(false);
    onCallStart(recipientId, true);
  };

  const handleAudioCall = () => {
    setShowOptions(false);
    onCallStart(recipientId, false);
  };

  return (
    <div className="call-button-container">
      <button 
        className="call-button"
        onClick={() => setShowOptions(!showOptions)}
        title="Start a call"
      >
        <FaPhone />
      </button>
      
      {showOptions && (
        <div className="call-options">
          <button 
            className="call-option video-call"
            onClick={handleVideoCall}
            title="Video call"
          >
            <FaVideo />
            <span>Video Call</span>
          </button>
          <button 
            className="call-option audio-call"
            onClick={handleAudioCall}
            title="Audio call"
          >
            <FaPhone />
            <span>Audio Call</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CallButton; 