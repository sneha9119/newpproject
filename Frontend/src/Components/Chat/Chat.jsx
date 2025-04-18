import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../../util/UserContext';
import VideoCall from '../VideoCall/VideoCall';
import CallButton from './CallButton';
import axios from 'axios';
import { socket } from '../../util/socket';
import './Chat.css';

const Chat = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [recipientData, setRecipientData] = useState(null);
  const [messages, setMessages] = useState([]);
  const { chatId } = useParams();
  const { user } = useUser();

  useEffect(() => {
    // Fetch chat and recipient data
    const fetchChatData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/chats/${chatId}`);
        const chatData = response.data;
        
        // Get recipient data (the other user in the chat)
        const recipient = chatData.participants.find(p => p._id !== user._id);
        setRecipientData(recipient);
        
        // Fetch messages
        const messagesResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/messages/${chatId}`);
        setMessages(messagesResponse.data);
      } catch (error) {
        console.error('Error fetching chat data:', error);
      }
    };

    fetchChatData();
  }, [chatId, user._id]);

  const handleCallStart = (recipientId, isVideo) => {
    console.log("Starting call with:", recipientId, "Video:", isVideo);
    setIsVideoCall(isVideo);
    setIsCallActive(true);
  };

  const handleCallEnd = () => {
    setIsCallActive(false);
  };

  if (!recipientData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="chat-container">
      {isCallActive ? (
        <VideoCall
          socket={socket}
          recipientId={recipientData._id}
          recipientName={recipientData.name}
          recipientImage={recipientData.profilePicture}
          isVideoCall={isVideoCall}
          onCallEnd={handleCallEnd}
        />
      ) : (
        <>
          <div className="chat-header">
            <div className="chat-header-info">
              <img 
                src={recipientData.profilePicture || '/default-avatar.png'} 
                alt={recipientData.name}
                className="profile-picture"
              />
              <div className="user-info">
                <h2>{recipientData.name}</h2>
                <span className="status">{recipientData.status || 'offline'}</span>
              </div>
            </div>
            <div className="chat-header-actions">
              <CallButton 
                recipientId={recipientData._id}
                onCallStart={handleCallStart}
              />
              {/* Add other header actions here */}
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message._id}
                className={`message ${message.sender === user._id ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  {message.content}
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input">
            {/* Add your chat input component here */}
          </div>
        </>
      )}
    </div>
  );
};

export default Chat; 