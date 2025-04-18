import React, { useEffect, useState, useRef } from "react";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Form from "react-bootstrap/Form";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../util/UserContext";
import Spinner from "react-bootstrap/Spinner";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import ScrollableFeed from "react-scrollable-feed";
import RequestCard from "./RequestCard";
import "./Chats.css";
import Modal from "react-bootstrap/Modal";
import { FaPaperclip, FaFile, FaImage, FaVideo, FaLink, FaReply, FaCheck, FaCheckDouble, FaCalendarAlt } from "react-icons/fa";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from 'emoji-picker-react';
import VideoCall from "../../components/VideoCall/VideoCall";
import { socket } from "../../util/socket";

// Remove or comment out any existing socket initialization
// var socket;

const Chats = () => {
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [showRequests, setShowRequests] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [acceptRequestLoading, setAcceptRequestLoading] = useState(false);

  const [scheduleModalShow, setScheduleModalShow] = useState(false);
  const [requestModalShow, setRequestModalShow] = useState(false);

  // to store selected chat
  const [selectedChat, setSelectedChat] = useState(null);
  // to store chat messages
  const [chatMessages, setChatMessages] = useState([]);
  // to store chats
  const [chats, setChats] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatMessageLoading, setChatMessageLoading] = useState(false);
  // to store message
  const [message, setMessage] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);

  const { user, setUser } = useUser();

  const navigate = useNavigate();

  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const messageEndRef = useRef(null);

  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [selectedChatForCall, setSelectedChatForCall] = useState(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    console.log("Socket connected:", socket?.id);
    
    // Add message received handler
    const handleMessageReceived = (newMessage) => {
      console.log("New Message Received:", newMessage);
      
      // Only process the message if selectedChat exists and IDs match
      if (selectedChat && newMessage?.chatId?._id && selectedChat.id === newMessage.chatId._id) {
        setChatMessages((prevState) => [...prevState, newMessage]);
        
        // Scroll to bottom when new message arrives
        setTimeout(scrollToBottom, 100);
      }
    };
    
    // Set up socket listeners
    if (socket) {
      socket.on("message received", handleMessageReceived);
      
      socket.on("typing", () => {
        // Handle typing indicator
        console.log("User is typing...");
      });
      
      socket.on("stop typing", () => {
        // Handle stop typing
        console.log("User stopped typing...");
      });

      socket.on("callRequest", (data) => {
        console.log("Call request received:", data);
        // Handle incoming call request
      });
    }

    // Clean up socket listeners on component unmount
    return () => {
      if (socket) {
        socket.off("message received", handleMessageReceived);
        socket.off("typing");
        socket.off("stop typing");
        socket.off("callRequest");
      }
    };
  }, [selectedChat]); // Re-run when selectedChat changes

  const fetchChats = async () => {
    try {
      setChatLoading(true);
      const tempUser = JSON.parse(localStorage.getItem("userInfo"));
      const { data } = await axios.get("http://localhost:8000/chat");
      // console.log("Chats", data.data);
      toast.success(data.message);
      if (tempUser?._id) {
        const temp = data.data.map((chat) => {
          return {
            id: chat._id,
            name: chat?.users.find((u) => u?._id !== tempUser?._id).name,
            picture: chat?.users.find((u) => u?._id !== tempUser?._id).picture,
            username: chat?.users.find((u) => u?._id !== tempUser?._id).username,
          };
        });
        setChats(temp);
      }
      // console.log(temp);
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message === "Please Login") {
          localStorage.removeItem("userInfo");
          setUser(null);
          await axios.get("/auth/logout");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleScheduleClick = () => {
    setScheduleModalShow(true);
  };

  const handleChatClick = async (chatId) => {
    try {
      setChatMessageLoading(true);
      const { data } = await axios.get(`http://localhost:8000/message/getMessages/${chatId}`);
      setChatMessages(data.data);
      // console.log("Chat Messages:", data.data);
      setMessage("");
      // console.log("Chats: ", chats);
      const chatDetails = chats.find((chat) => chat.id === chatId);
      setSelectedChat(chatDetails);
      // console.log("selectedChat", chatDetails);
      // console.log("Data", data.message);
      socket.emit("join chat", chatId);
      toast.success(data.message);
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message === "Please Login") {
          localStorage.removeItem("userInfo");
          setUser(null);
          await axios.get("/auth/logout");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setChatMessageLoading(false);
    }
  };

  const sendMessage = async (e) => {
    try {
      // Safely emit stop typing event if selectedChat exists
      if (selectedChat && selectedChat._id) {
        socket.emit("stop typing", selectedChat._id);
      }
      
      // Validate message is not empty
      if (!message || message.trim() === "") {
        toast.error("Message is empty");
        return;
      }
      
      // Validate selectedChat exists
      if (!selectedChat || !selectedChat.id) {
        toast.error("No chat selected");
        return;
      }
      
      const { data } = await axios.post("/message/sendMessage", { chatId: selectedChat.id, content: message });
      
      // Only emit new message if data.data exists
      if (data?.data) {
        socket.emit("new message", data.data);
        setChatMessages((prevState) => [...prevState, data.data]);
      }
      
      setMessage("");
      
      if (data?.message) {
        toast.success(data.message);
      }
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response?.data?.message === "Please Login") {
          await axios.get("/auth/logout");
          setUser(null);
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const getRequests = async () => {
    try {
      setRequestLoading(true);
      const { data } = await axios.get("/request/getRequests");
      setRequests(data.data);
      console.log(data.data);
      toast.success(data.message);
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message === "Please Login") {
          await axios.get("/auth/logout");
          setUser(null);
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setRequestLoading(false);
    }
  };

  const handleTabClick = async (tab) => {
    if (tab === "chat") {
      setShowChatHistory(true);
      setShowRequests(false);
      await fetchChats();
    } else if (tab === "requests") {
      setShowChatHistory(false);
      setShowRequests(true);
      await getRequests();
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setRequestModalShow(true);
  };

  const handleRequestAccept = async (e) => {
    console.log("Request accepted");

    try {
      setAcceptRequestLoading(true);
      const { data } = await axios.post("/request/acceptRequest", { requestId: selectedRequest._id });
      console.log(data);
      toast.success(data.message);
      // remove this request from the requests list
      setRequests((prevState) => prevState.filter((request) => request._id !== selectedRequest._id));
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message === "Please Login") {
          await axios.get("/auth/logout");
          setUser(null);
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setAcceptRequestLoading(false);
      setRequestModalShow(false);
    }
  };

  const handleRequestReject = async () => {
    console.log("Request rejected");
    try {
      setAcceptRequestLoading(true);
      const { data } = axios.post("/request/rejectRequest", { requestId: selectedRequest._id });
      console.log(data);
      toast.success(data.message);
      setRequests((prevState) => prevState.filter((request) => request._id !== selectedRequest._id));
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message === "Please Login") {
          await axios.get("/auth/logout");
          setUser(null);
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setAcceptRequestLoading(false);
      setRequestModalShow(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Automatically send the file
      sendFile(file);
    }
  };

  const sendFile = async (file) => {
    try {
      // Validate file and selectedChat exist
      if (!file) {
        toast.error("No file selected");
        return;
      }
      
      if (!selectedChat || !selectedChat.id) {
        toast.error("No chat selected");
        return;
      }
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", selectedChat.id);
      
      if (message && message.trim() !== "") {
        formData.append("content", message);
      }

      const { data } = await axios.post("/message/sendMessage", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Only emit new message if data.data exists
      if (data?.data) {
        socket.emit("new message", data.data);
        setChatMessages((prevState) => [...prevState, data.data]);
      }
      
      setMessage("");
      setSelectedFile(null);
      
      if (data?.message) {
        toast.success(data.message);
      }
    } catch (err) {
      console.log(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response?.data?.message === "Please Login") {
          await axios.get("/auth/logout");
          setUser(null);
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const renderFilePreview = (file) => {
    if (!file) return null;
    
    const fileType = file.type.split("/")[0];
    const fileSize = (file.size / (1024 * 1024)).toFixed(2); // Convert to MB

    return (
      <div className="file-preview">
        {fileType === "image" ? (
          <FaImage className="file-icon" />
        ) : fileType === "video" ? (
          <FaVideo className="file-icon" />
        ) : (
          <FaFile className="file-icon" />
        )}
        <span className="file-name">{file.name}</span>
        <span className="file-size">({fileSize} MB)</span>
        <button className="remove-file" onClick={() => setSelectedFile(null)}>
          ×
        </button>
      </div>
    );
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleMessageLongPress = (message) => {
    setIsSelectionMode(true);
    setSelectedMessages([message._id]);
  };

  const handleMessageClick = (message) => {
    if (isSelectionMode) {
      if (selectedMessages.includes(message._id)) {
        setSelectedMessages(prev => prev.filter(id => id !== message._id));
        if (selectedMessages.length === 1) {
          setIsSelectionMode(false);
        }
      } else {
        setSelectedMessages(prev => [...prev, message._id]);
      }
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    setIsSelectionMode(false);
    setSelectedMessages([]);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const renderMessageContent = (message) => {
    const isSelected = selectedMessages.includes(message._id);
    
    return (
      <div 
        className={`message-container ${isSelected ? 'selected' : ''}`}
        onClick={() => handleMessageClick(message)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleMessageLongPress(message);
        }}
      >
        {message.replyTo && (
          <div className="reply-preview">
            <div className="reply-content">
              <small>Replying to {message.replyTo.sender.name}</small>
              <p>{message.replyTo.content}</p>
            </div>
          </div>
        )}
        
        {message.messageType === 'text' && (
          <span className="message-text">{message.content}</span>
        )}
        
        {message.file && (
          <div className="message-file">
            {message.messageType === 'image' && (
              <img 
                src={`data:${message.file.mimetype};base64,${message.file.data}`}
                alt={message.file.originalname}
                className="message-image"
              />
            )}
            
            {message.messageType === 'video' && (
              <video controls className="message-video">
                <source 
                  src={`data:${message.file.mimetype};base64,${message.file.data}`}
                  type={message.file.mimetype}
                />
                Your browser does not support video playback.
              </video>
            )}
            
            {message.messageType === 'document' && (
              <div 
                className="document-preview"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:${message.file.mimetype};base64,${message.file.data}`;
                  link.download = message.file.originalname;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <FaFile className="file-icon" />
                <div className="file-info">
                  <span className="file-name">{message.file.originalname}</span>
                  <span className="file-size">
                    {(message.file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="message-meta">
          <small className="message-time">
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </small>
          {message.sender._id === user._id && (
            <span className="message-status">
              {message.readBy?.length > 0 ? (
                <FaCheckDouble className={message.readBy.length > 1 ? "read" : ""} />
              ) : (
                <FaCheck />
              )}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleVideoCall = (recipientId) => {
    console.log("Starting video call with:", recipientId);
    
    // Validate recipient ID
    if (!recipientId) {
      toast.error("Invalid recipient. Cannot start video call.");
      return;
    }
    
    // Make sure we have the required data
    if (!selectedChat || !selectedChat.username) {
      toast.error("Missing chat details. Cannot start video call.");
      return;
    }
    
    setIsVideoCallActive(true);
    
    // Store the selected user info for the call
    setSelectedChatForCall({
      id: recipientId,
      name: selectedChat.username,
      image: selectedChat.picture || '/default-avatar.png'
    });
    
    // Log that we're starting the call
    console.log("Video call initialized with:", {
      id: recipientId,
      name: selectedChat.username
    });
  };

  const handleVideoCallEnd = () => {
    setIsVideoCallActive(false);
    setSelectedChatForCall(null);
  };

  return (
    <div className="container-overall">
      <div className="container-right">
        {/* Chat History */}
        <div className="container-left">
          {/* Tabs */}
          <div className="tabs">
            <Button
              className="chatButton"
              variant="secondary"
              style={{
                borderTop: showChatHistory ? "1px solid lightgrey" : "1px solid lightgrey",
                borderRight: showChatHistory ? "1px solid lightgrey" : "1px solid lightgrey",
                borderLeft: showChatHistory ? "1px solid lightgrey" : "1px solid lightgrey",
                borderBottom: "none",
                backgroundColor: showChatHistory ? "#3bb4a1" : "#2d2d2d",
                color: showChatHistory ? "black" : "white",
                cursor: "pointer",
                minWidth: "150px",
                padding: "10px",
                borderRadius: "5px 5px 0 0",
              }}
              onClick={() => handleTabClick("chat")}
            >
              Chat History
            </Button>
            <Button
              className="requestButton"
              variant="secondary"
              style={{
                borderTop: showRequests ? "1px solid lightgrey" : "1px solid lightgrey",
                borderRight: showRequests ? "1px solid lightgrey" : "1px solid lightgrey",
                borderLeft: showRequests ? "1px solid lightgrey" : "1px solid lightgrey",
                borderBottom: "none",
                backgroundColor: showChatHistory ? "#2d2d2d" : "#3bb4a1",
                color: showChatHistory ? "white" : "black",
                cursor: "pointer",
                minWidth: "150px",
                padding: "10px",
                borderRadius: "5px 5px 0 0",
              }}
              onClick={() => handleTabClick("requests")}
            >
              Requests
            </Button>
          </div>

          {/* Chat History or Requests List */}
          {showChatHistory && (
            <div className="container-left">
              <ListGroup className="chat-list">
                {chatLoading ? (
                  <div className="row m-auto mt-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <>
                    {chats.map((chat) => (
                      <ListGroup.Item
                        key={chat.id}
                        onClick={() => handleChatClick(chat.id)}
                        style={{
                          cursor: "pointer",
                          marginBottom: "10px",
                          padding: "10px",
                          backgroundColor: selectedChat?.id === chat?.id ? "#3BB4A1" : "lightgrey",
                          borderRadius: "5px",
                        }}
                      >
                        {chat.name}
                      </ListGroup.Item>
                    ))}
                  </>
                )}
              </ListGroup>
            </div>
          )}
          {showRequests && (
            <div className="container-left">
              <ListGroup style={{ padding: "10px" }}>
                {requestLoading ? (
                  <div className="row m-auto mt-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <>
                    {requests.map((request) => (
                      <ListGroup.Item
                        key={request.id}
                        onClick={() => handleRequestClick(request)}
                        style={{
                          cursor: "pointer",
                          marginBottom: "10px",
                          padding: "10px",
                          backgroundColor:
                            selectedRequest && selectedRequest.id === request.id ? "#3BB4A1" : "lightgrey",
                          borderRadius: "5px",
                        }}
                      >
                        {request.name}
                      </ListGroup.Item>
                    ))}
                  </>
                )}
              </ListGroup>
            </div>
          )}
          {requestModalShow && (
            <div className="modalBG" onClick={() => setRequestModalShow(false)}>
              <div className="modalContent">
                <h2 style={{ textAlign: "center" }}>Confirm your choice?</h2>
                {selectedRequest && (
                  <RequestCard
                    name={selectedRequest?.name}
                    skills={selectedRequest?.skillsProficientAt}
                    rating="4"
                    picture={selectedRequest?.picture}
                    username={selectedRequest?.username}
                    onClose={() => setSelectedRequest(null)} // Close modal when clicked outside or close button
                  />
                )}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button className="connect-button" style={{ marginLeft: "0" }} onClick={handleRequestAccept}>
                    {acceptRequestLoading ? (
                      <div className="row m-auto ">
                        <Spinner animation="border" variant="primary" />
                      </div>
                    ) : (
                      "Accept!"
                    )}
                  </button>
                  <button className="report-button" onClick={handleRequestReject}>
                    {acceptRequestLoading ? (
                      <div className="row m-auto ">
                        <Spinner animation="border" variant="primary" />
                      </div>
                    ) : (
                      "Reject"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Right Section */}
        <div className="container-chat">
          {/* Profile Bar */}
          <div className="profile-header">
            {/* Profile Info (Placeholder) */}
            {selectedChat && (
              <>
                <div className="user-profile">
                  <img
                    src={selectedChat?.picture ? selectedChat.picture : "https://via.placeholder.com/150"}
                    alt="Profile"
                    style={{ width: "40px", height: "40px", borderRadius: "50%", marginRight: "10px" }}
                  />
                  <span style={{ fontFamily: "Montserrat, sans-serif", color: "#2d2d2d" }}>
                    {selectedChat?.username}
                  </span>
                </div>
                <div className="chat-actions">
                  <button 
                    className="video-call-btn"
                    onClick={() => {
                      if (selectedChat && selectedChat.id) {
                        handleVideoCall(selectedChat.id);
                      } else {
                        toast.error("No chat selected or invalid chat data");
                      }
                    }}
                    title="Start Video Call"
                  >
                    <FaVideo size={20} />
                    <span className="video-call-badge"></span>
                  </button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleScheduleClick}
                    style={{ marginLeft: '10px' }}
                  >
                    Schedule Meeting
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Chat Interface */}
          <div className="chat-interface">
            {/* Messages */}
            <div className="messages-container">
              <ScrollableFeed forceScroll={true}>
                {chatMessages.map((message, index) => (
                  <div
                    key={message._id}
                    className={`message ${
                      message.sender._id === user._id ? "sent" : "received"
                    }`}
                  >
                    {renderMessageContent(message)}
                  </div>
                ))}
                <div ref={messageEndRef} />
              </ScrollableFeed>
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="reply-bar">
                <div className="reply-preview">
                  <div className="reply-content">
                    <small>Replying to {replyingTo.sender.name}</small>
                    <p>{replyingTo.content}</p>
                  </div>
                  <button className="cancel-reply" onClick={cancelReply}>×</button>
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="chat-input-container">
              <button 
                className="emoji-button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <BsEmojiSmile />
              </button>
              
              {showEmojiPicker && (
                <div className="emoji-picker-container">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              />
              
              <button 
                className="attach-file-btn"
                onClick={() => fileInputRef.current.click()}
              >
                <FaPaperclip />
              </button>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    // Only call sendMessage if a chat is selected and message isn't empty
                    if (selectedChat && message && message.trim() !== "") {
                      sendMessage();
                    } else if (!selectedChat) {
                      toast.error("No chat selected");
                    } else if (!message || message.trim() === "") {
                      toast.error("Message is empty");
                    }
                  }
                }}
              />

              <button 
                className="send-btn"
                onClick={() => {
                  // Only call sendMessage if a chat is selected and message isn't empty
                  if (selectedChat && (message?.trim() !== "" || selectedFile)) {
                    sendMessage();
                  } else if (!selectedChat) {
                    toast.error("No chat selected");
                  } else if (!message?.trim() && !selectedFile) {
                    toast.error("Message is empty");
                  }
                }}
                disabled={!selectedChat || (!message?.trim() && !selectedFile)}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Video Call Modal */}
      {scheduleModalShow && !isVideoCallActive && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: "500",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "#2d2d2d",
              color: "#3BB4A1",
              padding: "50px",
              borderRadius: "10px",
              zIndex: "1001",
            }}
          >
            <h3>Request a Meeting</h3>
            <Form>
              <Form.Group controlId="formDate" style={{ marginBottom: "20px", zIndex: "1001" }}>
                <Form.Label>Preferred Date</Form.Label>
                <Form.Control
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                />
              </Form.Group>

              <Form.Group controlId="formTime" style={{ marginBottom: "20px", zIndex: "1001" }}>
                <Form.Label>Preferred Time</Form.Label>
                <Form.Control
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                />
              </Form.Group>

              <Button
                variant="success"
                type="submit"
                onClick={async (e) => {
                  e.preventDefault();
                  if (scheduleForm.date === "" || scheduleForm.time === "") {
                    toast.error("Please fill all the fields");
                    return;
                  }

                  scheduleForm.username = selectedChat.username;
                  try {
                    const { data } = await axios.post("/user/sendScheduleMeet", scheduleForm);
                    toast.success("Request mail has been sent successfully!");
                    setScheduleForm({
                      date: "",
                      time: "",
                    });
                  } catch (error) {
                    console.log(error);
                    if (error?.response?.data?.message) {
                      toast.error(error.response.data.message);
                      if (error.response.data.message === "Please Login") {
                        localStorage.removeItem("userInfo");
                        setUser(null);
                        await axios.get("/auth/logout");
                        navigate("/login");
                      }
                    } else {
                      toast.error("Something went wrong");
                    }
                  }
                  setScheduleModalShow(false);
                }}
              >
                Submit
              </Button>
              <Button variant="danger" onClick={() => setScheduleModalShow(false)} style={{ marginLeft: "10px" }}>
                Cancel
              </Button>
            </Form>
          </div>
        </div>
      )}

      {/* Selection Mode Actions */}
      {isSelectionMode && (
        <div className="selection-actions">
          <button onClick={() => handleReply(selectedMessages[0])}>
            <FaReply /> Reply
          </button>
          {/* Add more actions as needed */}
        </div>
      )}

      {/* Add VideoCall Component */}
      {isVideoCallActive && selectedChatForCall && (
        <VideoCall
          socket={socket}
          recipientId={selectedChatForCall.id}
          recipientName={selectedChatForCall.name}
          recipientImage={selectedChatForCall.image}
          isVideoCall={true}
          onCallEnd={handleVideoCallEnd}
        />
      )}
    </div>
  );
};

export default Chats;
