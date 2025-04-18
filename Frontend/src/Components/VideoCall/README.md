# VideoCall Component

This component provides real-time video and audio calling functionality using WebRTC and Socket.io for SkillSwap.

## Features

- One-to-one video/audio calls
- Mute/unmute audio
- Enable/disable video
- Camera switching (if multiple cameras available)
- Call status indicators
- Call duration timer

## Usage

To use the VideoCall component, import and include it in your component:

```jsx
import VideoCall from '../VideoCall/VideoCall';

// In your component's render function:
<VideoCall
  socket={socket}
  recipientId="user123"
  recipientName="John Doe"
  recipientImage="/path/to/image.jpg"
  isVideoCall={true}
  onCallEnd={() => console.log('Call ended')}
/>
```

## Required Props

- `socket`: Socket.io connection instance
- `recipientId`: ID of the user being called
- `recipientName`: Name of the recipient
- `recipientImage`: URL to recipient's profile image (optional)
- `isVideoCall`: Boolean to determine if it's a video call (default: true)
- `onCallEnd`: Callback function when call ends

## Architecture

The VideoCall component uses:
1. **WebRTC** (via simple-peer): For peer-to-peer media streaming
2. **Socket.io**: For signaling to establish the connection
3. **React hooks**: For state management and lifecycle events

## Troubleshooting

### Call not connecting

- Check socket connection is active
- Verify STUN/TURN servers are reachable
- Ensure media permissions are granted in browser

### No video/audio

- Check if browser has camera/microphone permissions
- Verify the device has working camera/microphone
- Try switching camera if available

### Call disconnecting

- Check network connectivity
- Ensure socket server is running correctly
- Verify no firewall is blocking WebRTC traffic

## Development Notes

Socket events used:
- `callUser`: Emit when initiating a call
- `callAccepted`: Listen for when call is accepted
- `callRejected`: Listen for when call is rejected
- `endCall`: Emit/listen for call termination

WebRTC signaling flow:
1. Caller gets local media and creates peer connection
2. Caller sends offer signal to recipient via socket
3. Recipient creates peer and sends answer signal back
4. Connection established, media streams exchanged 