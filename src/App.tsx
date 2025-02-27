import { useEffect, useRef, useState } from "react";
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Progress from '@radix-ui/react-progress';
import * as Separator from '@radix-ui/react-separator';
import * as Avatar from '@radix-ui/react-avatar';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Button, Flex } from "@radix-ui/themes";

const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3.5C2 3.22386 2.22386 3 2.5 3H5.5C5.77614 3 6 3.22386 6 3.5V12.5C6 12.7761 5.77614 13 5.5 13H2.5C2.22386 13 2 12.7761 2 12.5V3.5ZM3 4V12H5V4H3Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    <path d="M9 1.5C9 1.22386 9.22386 1 9.5 1H12.5C12.7761 1 13 1.22386 13 1.5V12.5C13 12.7761 12.7761 13 12.5 13H9.5C9.22386 13 9 12.7761 9 12.5V1.5ZM10 2V12H12V2H10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

const MicrophoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 1C6.67157 1 6 1.67157 6 2.5V7.5C6 8.32843 6.67157 9 7.5 9C8.32843 9 9 8.32843 9 7.5V2.5C9 1.67157 8.32843 1 7.5 1Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    <path d="M3.5 6.5C3.5 6.22386 3.72386 6 4 6C4.27614 6 4.5 6.22386 4.5 6.5V7.5C4.5 9.433 6.067 11 8 11C9.933 11 11.5 9.433 11.5 7.5V6.5C11.5 6.22386 11.7239 6 12 6C12.2761 6 12.5 6.22386 12.5 6.5V7.5C12.5 9.85652 10.6435 11.7595 8.30493 11.9862L8.30493 13.5C8.30493 13.7761 8.08107 14 7.80493 14H6.69507C6.41893 14 6.19507 13.7761 6.19507 13.5L6.19507 11.9862C3.85652 11.7595 2 9.85652 2 7.5V6.5C2 6.22386 2.22386 6 2.5 6C2.77614 6 3 6.22386 3 6.5V7.5C3 9.433 4.567 11 6.5 11C6.77614 11 7 11.2239 7 11.5V13H7.5V11.5C7.5 11.2239 7.72386 11 8 11C9.933 11 11.5 9.433 11.5 7.5V6.5C11.5 6.22386 11.7239 6 12 6C12.2761 6 12.5 6.22386 12.5 6.5V7.5C12.5 9.98528 10.4853 12 8 12C7.72386 12 7.5 12.2239 7.5 12.5V13H8C8.27614 13 8.5 13.2239 8.5 13.5C8.5 13.7761 8.27614 14 8 14H5.5C5.22386 14 5 13.7761 5 13.5C5 13.2239 5.22386 13 5.5 13H6V12.5C6 12.2239 5.77614 12 5.5 12C3.01472 12 1 9.98528 1 7.5V6.5C1 6.22386 1.22386 6 1.5 6C1.77614 6 2 6.22386 2 6.5V7.5C2 9.433 3.567 11 5.5 11C5.77614 11 6 11.2239 6 11.5V13H6.5V11.5C6.5 11.2239 6.72386 11 7 11C8.933 11 10.5 9.433 10.5 7.5V6.5C10.5 6.22386 10.7239 6 11 6C11.2761 6 11.5 6.22386 11.5 6.5V7.5C11.5 9.98528 9.48528 12 7 12C6.72386 12 6.5 12.2239 6.5 12.5V13H7Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

const MicrophoneOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.14645 1.14645C2.34171 0.951184 2.65829 0.951184 2.85355 1.14645L13.8536 12.1464C14.0488 12.3417 14.0488 12.6583 13.8536 12.8536C13.6583 13.0488 13.3417 13.0488 13.1464 12.8536L12.7536 12.4607C12.2229 13.3049 11.4488 13.9875 10.5104 14.3811C10.2483 14.4897 9.97516 14.5761 9.69335 14.6392C9.65719 14.6475 9.62078 14.6553 9.58414 14.6627L9.58605 14.6636C9.21284 14.7437 8.82457 14.7867 8.42618 14.7867C7.1999 14.7867 6.08312 14.2841 5.26541 13.4617L4.58686 12.7781C3.9746 12.1613 3.54631 11.3989 3.34496 10.5558C3.14361 9.71276 3.17573 8.82741 3.43617 8.00131C3.69661 7.17521 4.17381 6.44206 4.81297 5.8841L2.14645 3.21758C1.95118 3.02232 1.95118 2.70574 2.14645 2.51047C2.34171 2.31521 2.65829 2.31521 2.85355 2.51047L4.37133 4.02826L9.97167 9.6286L10.9393 10.5962L12.1464 11.8033L2.14645 1.14645ZM7.5 2C6.67157 2 6 2.67157 6 3.5V7.1C6 7.37614 6.22386 7.6 6.5 7.6C6.77614 7.6 7 7.37614 7 7.1V3.5C7 3.22386 7.22386 3 7.5 3C7.77614 3 8 3.22386 8 3.5V7.1C8 7.37614 8.22386 7.6 8.5 7.6C8.77614 7.6 9 7.37614 9 7.1V3.5C9 2.67157 8.32843 2 7.5 2ZM3.5 7.5C3.5 7.22386 3.72386 7 4 7C4.27614 7 4.5 7.22386 4.5 7.5V8.5C4.5 10.433 6.067 12 8 12C8.27614 12 8.5 12.2239 8.5 12.5C8.5 12.7761 8.27614 13 8 13C5.51472 13 3.5 10.9853 3.5 8.5V7.5ZM11.5 7.5C11.5 7.22386 11.7239 7 12 7C12.2761 7 12.5 7.22386 12.5 7.5V8.5C12.5 9.43429 12.1408 10.2822 11.5521 10.9211L10.845 10.2141C11.262 9.7608 11.5 9.16169 11.5 8.5V7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

const signalingServerUrl = `${import.meta.env.VITE_BACKEND_URL_WS}/websocket`; // WebSocket signaling server
const peerConnectionConfig = {
  iceServers: [{ urls: import.meta.env.VITE_STUN_SERVER }]
};

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'failed'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const audioAnalyser = useRef<AnalyserNode | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebRTC connection
  useEffect(() => {
    initializeConnection();

    return () => {
      closeConnection();
    };
  }, []);

  // Audio level meter
  useEffect(() => {
    if (localStreamRef.current && !audioAnalyser.current) {
      setupAudioMeter();
    }

    let animationFrame: number;

    const updateAudioLevel = () => {
      if (audioAnalyser.current) {
        const dataArray = new Uint8Array(audioAnalyser.current.frequencyBinCount);
        audioAnalyser.current.getByteFrequencyData(dataArray);

        // Calculate average volume level
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(Math.min(100, average * 1.5)); // Scale to 0-100
      }

      animationFrame = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [localStreamRef.current]);

  // Setup audio level meter
  const setupAudioMeter = () => {
    if (!localStreamRef.current) return;

    audioContext.current = new AudioContext();
    audioAnalyser.current = audioContext.current.createAnalyser();
    audioAnalyser.current.fftSize = 256;

    const source = audioContext.current.createMediaStreamSource(localStreamRef.current);
    source.connect(audioAnalyser.current);
  };

  // Initialize WebSocket and WebRTC connections
  const initializeConnection = () => {
    setConnectionStatus('connecting');

    // Create WebSocket connection
    ws.current = new WebSocket(signalingServerUrl);

    ws.current.onopen = () => {
      console.log("Connected to signaling server");
      setConnectionStatus('connected');
    };

    ws.current.onclose = () => {
      console.log("Disconnected from signaling server");
      setConnectionStatus('disconnected');
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus('disconnected');
      setCallStatus('failed');
    };

    ws.current.onmessage = async (message) => {
      console.log("Received message from Server:", message.data);

      try {
        const data = JSON.parse(message.data);

        if (data.type === 'offer') {
          console.log('Received offer:', data);
          await handleOffer(data.offer);
          setCallStatus('connected');
        } else if (data.type === 'answer') {
          console.log('Received answer:', data);
          await handleAnswer(data.answer);
          setCallStatus('connected');
        } else if (data.type === 'candidate' && data.candidate && data.candidate.candidate) {
          console.log('Received candidate:', data);
          await handleCandidate(data.candidate);
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    };
  };

  // Close all connections
  const closeConnection = () => {
    // Close media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close WebRTC connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Close WebSocket
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    // Close audio context
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
      audioAnalyser.current = null;
    }

    setCallStatus('idle');
    setConnectionStatus('disconnected');
  };

  // Start audio call
  const startAudioCall = async () => {
    if (connectionStatus !== 'connected') {
      console.warn("Not connected to signaling server");
      return;
    }

    setCallStatus('calling');

    try {
      // Create new RTCPeerConnection
      peerConnection.current = new RTCPeerConnection(peerConnectionConfig);

      // Set up event handlers
      setupPeerConnectionEventHandlers();

      // Get user microphone audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      // Add audio tracks to the connection
      stream.getTracks().forEach(track => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });

      // Create and send offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "offer", offer }));
      } else {
        console.error("WebSocket not connected");
        setCallStatus('failed');
      }
    } catch (err) {
      console.error("Error starting audio call:", err);
      setCallStatus('failed');
    }
  };

  // Handle received offer
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      // Create new RTCPeerConnection if not exists
      if (!peerConnection.current) {
        peerConnection.current = new RTCPeerConnection(peerConnectionConfig);
        setupPeerConnectionEventHandlers();
      }

      // Set remote description
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      // Add tracks
      stream.getTracks().forEach(track => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });

      // Create and send answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "answer", answer }));
      }
    } catch (error) {
      console.error("Error handling offer:", error);
      setCallStatus('failed');
    }
  };

  // Handle received answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) {
      console.error("Peer connection is null when handling answer");
      return;
    }

    try {
      if (peerConnection.current.signalingState === 'have-local-offer') {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      } else {
        console.warn(`Cannot set remote description in state: ${peerConnection.current.signalingState}`);
      }
    } catch (error) {
      console.error("Error setting remote description:", error);
    }
  };

  // Handle ICE candidate
  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection.current) {
      console.error("Peer connection is null when handling ICE candidate");
      return;
    }

    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  // Set up WebRTC event handlers
  const setupPeerConnectionEventHandlers = () => {
    if (!peerConnection.current) return;

    // Handle ICE connection state changes
    peerConnection.current.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', peerConnection.current?.iceConnectionState);

      if (peerConnection.current?.iceConnectionState === 'disconnected' ||
        peerConnection.current?.iceConnectionState === 'failed') {
        setCallStatus('failed');
      }
    };

    // Handle signaling state changes
    peerConnection.current.onsignalingstatechange = () => {
      console.log('Signaling State:', peerConnection.current?.signalingState);
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('Sending ICE Candidate:', event.candidate);
        ws.current.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
      }
    };

    // Handle remote tracks
    peerConnection.current.ontrack = (event) => {
      console.log("Received remote track:", event.streams[0]);

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();

      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });

      setIsMuted(!isMuted);
    }
  };

  // End call
  const endCall = () => {
    closeConnection();
    initializeConnection();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-10">
      <div style={{ padding: 12 }} className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">WebRTC Audio Call</h1>

        <Separator.Root className="h-px bg-gray-200 my-4" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            <span>{
              connectionStatus === 'connected' ? 'Connected to server' :
                connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'
            }</span>
          </div>

          {connectionStatus === 'disconnected' && (
            <button
              onClick={initializeConnection}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reconnect
            </button>
          )}
        </div>

        <Tabs.Root defaultValue="call" className="mb-6">
          <Tabs.List className="flex border-b border-gray-200">
            <Flex gap={"3"} align={"center"}>
              <Tabs.Trigger
                value="call"
                className="px-4 py-2 hover:bg-gray-100 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
              >
                Call
              </Tabs.Trigger>
              <Tabs.Trigger
                value="settings"
                className="px-4 py-2 hover:bg-gray-100 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
              >
                Settings
              </Tabs.Trigger>
            </Flex>
          </Tabs.List>

          <Tabs.Content value="call" className="pt-4">
            <div className="flex flex-col items-center gap-4">
              {/* User avatars */}
              <div className="flex justify-center gap-8 mb-4">
                <div className="flex flex-col items-center">
                  <Avatar.Root className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 overflow-hidden">
                    <Avatar.Fallback className="text-blue-500 text-xl font-semibold">You</Avatar.Fallback>
                  </Avatar.Root>
                  <span className="mt-2">You</span>

                  {/* Audio meter */}
                  <Progress.Root
                    className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden mt-2"
                    value={isMuted ? 0 : audioLevel}
                  >
                    <Progress.Indicator
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${isMuted ? 0 : audioLevel}%` }}
                    />
                  </Progress.Root>
                </div>

                {callStatus === 'connected' && (
                  <div className="flex flex-col items-center">
                    <Avatar.Root className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 overflow-hidden">
                      <Avatar.Fallback className="text-green-500 text-xl font-semibold">Peer</Avatar.Fallback>
                    </Avatar.Root>
                    <span className="mt-2">Peer</span>
                  </div>
                )}
              </div>

              {/* Call controls */}
              <div className="flex gap-4">
                {callStatus === 'idle' ? (
                  <button
                    onClick={startAudioCall}
                    disabled={connectionStatus !== 'connected'}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <PhoneIcon />
                    Start Call
                  </button>
                ) : callStatus === 'calling' ? (
                  <div className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-full">
                    <span>Calling...</span>
                  </div>
                ) : callStatus === 'connected' ? (
                  <Flex gap={"3"} align={"center"}>
                    <Button
                      color='gray'
                      onClick={toggleMute}
                      className={`flex items-center justify-center w-12 h-12 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-500'} text-white shadow-md hover:opacity-90`}
                    >
                      {isMuted ? <MicrophoneOffIcon /> : <MicrophoneIcon />}
                    </Button>

                    <Button
                      color='gray'
                      onClick={endCall}
                      className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                    >
                      {/*@ts-ignore */}
                      <PhoneIcon style={{ transform: 'rotate(135deg)' }} />
                    </Button>
                  </Flex >
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-red-500 mb-2">Call Failed</div>
                    <button
                      onClick={startAudioCall}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="settings" className="pt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Signaling Server URL</label>
                <input
                  type="text"
                  value={signalingServerUrl}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">STUN Server</label>
                <input
                  type="text"
                  value="stun:stun.l.google.com:19302"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>

        {/* Hidden audio elements */}
        <audio ref={localAudioRef} autoPlay muted className="hidden" />
        <audio ref={remoteAudioRef} autoPlay className="hidden" />
      </div>

      {/* Connection Status Dialog */}
      <Dialog.Root open={callStatus === 'failed'}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg w-96 max-w-full">
            <Dialog.Title className="text-xl font-bold mb-4">Connection Error</Dialog.Title>
            <Dialog.Description className="mb-6">
              There was a problem with the WebRTC connection. Please check your internet connection and try again.
            </Dialog.Description>
            <div className="flex justify-end">
              <Dialog.Close asChild>
                <button
                  onClick={endCall}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                onClick={endCall}
              >
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}