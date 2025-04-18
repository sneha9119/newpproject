import React, { createContext, useContext, useState } from 'react';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [currentCall, setCurrentCall] = useState(null);

  const startCall = (recipientId, isVideo) => {
    setIsVideoCall(isVideo);
    setIsCallActive(true);
    setCurrentCall({
      recipientId,
      isVideoCall: isVideo,
      startTime: new Date()
    });
  };

  const endCall = () => {
    setIsCallActive(false);
    setCurrentCall(null);
  };

  return (
    <CallContext.Provider
      value={{
        isCallActive,
        isVideoCall,
        currentCall,
        startCall,
        endCall
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}; 