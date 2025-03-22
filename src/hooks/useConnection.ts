import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { peerConnectionConfig, signalingServerUrl } from '../utils/signaling-server';
import { getOrCreatePeerId } from '../utils';
import { CALL_STATUS, ROOM_STATUS, UserDetail } from '../@types';

function useConnection(_roomId: string) {
    // Split state into smaller, more focused pieces to prevent unnecessary re-renders
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [callStatus, setCallStatus] = useState<CALL_STATUS>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [roomStatus, setRoomStatus] = useState<{ status: ROOM_STATUS; message: string | null }>({ status: "IDLE", message: null });
    const [users, setUsers] = useState<UserDetail[]>([]);
    const [messages, setMessages] = useState<Record<string, any>[]>([]);
    const [audioLevels, setAudioLevels] = useState<Record<string, number>>({});


    // User details in a ref since it's mostly stable and causes fewer re-renders when updated
    const userDetailsRef = useRef({
        userName: null as string | null,
        userId: getOrCreatePeerId()
    });

    // Store roomId in a ref since it's provided as a parameter and shouldn't change
    const roomIdRef = useRef(_roomId);

    // Refs don't cause re-renders when modified
    const localAudioRef = useRef<HTMLAudioElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    // WebSocket message handling
    const handleWebSocketMessage = useCallback(async (messageData: string) => {
        try {
            const data = JSON.parse(messageData);

            switch (data.type) {
                case 'offer':
                    await handleOffer(data.offer);
                    setCallStatus('connected');
                    break;

                case 'answer':
                    await handleAnswer(data.answer);
                    setCallStatus('connected');
                    break;

                case 'candidate':
                    if (data.candidate && data.candidate.candidate) {
                        await handleCandidate(data.candidate);
                    }
                    break;

                case 'room-created': {
                    setRoomStatus({
                        status: "ROOM_CREATED",
                        message: `room created!`
                    });
                    break;
                }

                case 'room-joined': {
                    if (data.userId !== userDetailsRef.current.userId) {
                        setRoomStatus({
                            status: "ROOM_JOINED",
                            message: `${data.userName} just joined!`
                        });
                    }
                    break;
                }
                case 'room-members': {
                    console.log("Members : ", data.members);
                    const members = data.members ? (data.members as { userDetails: UserDetail }[]) : [];
                    setUsers(members.map(member => member.userDetails));
                    break;
                }
                case 'room-left': {
                    console.log("left data : ", data);
                    setRoomStatus({
                        status: "ROOM_LEFT",
                        message: `${data.userDetails.userName} just left!`
                    });
                    break;
                }
                case 'invalid-room': {
                    setRoomStatus({
                        status: "INVALID_ROOM",
                        message: `Invalid call`
                    });
                    break;
                }
                case 'audio-level': {
                    if (data.userId && typeof data.level === 'number') {
                        setAudioLevels(prev => ({
                            ...prev,
                            [data.userId]: data.level
                        }));
                    }
                    break;
                }
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    }, []);

    // Setup PeerConnection event handlers
    const setupPeerConnectionEventHandlers = useCallback(() => {
        if (!peerConnection.current) return;

        // Handle ICE connection state changes
        peerConnection.current.oniceconnectionstatechange = () => {
            const iceState = peerConnection.current?.iceConnectionState;

            if (iceState === 'disconnected' || iceState === 'failed') {
                setCallStatus('failed');
            }
        };

        // Handle signaling state changes
        peerConnection.current.onsignalingstatechange = () => {
            // Only log, no state updates
            console.log('Signaling State:', peerConnection.current?.signalingState);
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate && ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
            }
        };

        // Handle remote tracks
        peerConnection.current.ontrack = (event) => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
            }
        };
    }, []);

    // WebSocket message sending
    const sendMessage = useCallback((data: Record<string, any>) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        }
    }, []);

    // Initialize WebSocket connection
    const initializeConnection = useCallback(() => {
        setConnectionStatus('connecting');

        // Create WebSocket connection
        ws.current = new WebSocket(signalingServerUrl + `?roomId=${roomIdRef.current}&userId=${userDetailsRef.current.userId}`);

        ws.current.onopen = () => {
            setConnectionStatus('connected');
        };

        ws.current.onclose = () => {
            setConnectionStatus('disconnected');
        };

        ws.current.onerror = () => {
            setConnectionStatus('disconnected');
            setCallStatus('failed');
        };

        ws.current.onmessage = (message) => {
            handleWebSocketMessage(message.data);
        };
    }, [handleWebSocketMessage]);

    // Handle received offer
    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
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
    }, [setupPeerConnectionEventHandlers]);

    // Handle received answer
    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
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
    }, []);

    // Handle ICE candidate
    const handleCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        if (!peerConnection.current) {
            console.error("Peer connection is null when handling ICE candidate");
            return;
        }

        try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    }, []);

    // Close all connections
    const closeConnection = useCallback(() => {
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

        setCallStatus('idle');
        setConnectionStatus('disconnected');
    }, []);

    // Room management functions
    const createRoom = useCallback((roomId: string) => {
        sendMessage({ type: "create-room", room: roomId, ...userDetailsRef.current });
    }, [sendMessage]);

    const joinRoom = useCallback((roomId: string) => {
        sendMessage({ type: "join-room", room: roomId, ...userDetailsRef.current });
    }, [sendMessage]);

    const leaveRoom = useCallback((roomId: string) => {
        console.log("left : ", userDetailsRef.current);
        sendMessage({ type: "leave-room", room: roomId, ...userDetailsRef.current });
    }, [sendMessage]);

    const sendAudioLevel = useCallback((level: number) => {
        console.log("left : ", userDetailsRef.current);
        sendMessage({ type: "audio-level", room: _roomId, level, ...userDetailsRef.current, });
    }, [sendMessage]);

    const sendChatMessage = useCallback((roomId: string, userId: string, message: Record<string, any>) => {
        sendMessage({ type: "message", room: roomId, userId, message });
    }, [sendMessage]);

    // Start audio call
    const startAudioCall = useCallback(async () => {
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
    }, [connectionStatus, setupPeerConnectionEventHandlers]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();

            audioTracks.forEach(track => {
                track.enabled = isMuted;
            });

            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    // End call
    const endCall = useCallback(() => {
        leaveRoom(roomIdRef.current);
        closeConnection();
        initializeConnection();
    }, [closeConnection, initializeConnection, leaveRoom]);

    // Update user details function
    const updateUserDetails = useCallback((details: Partial<typeof userDetailsRef.current>) => {
        userDetailsRef.current = { ...userDetailsRef.current, ...details };
    }, []);

    // Initialize connection on mount
    useEffect(() => {
        initializeConnection();
        return () => {
            closeConnection();
        };
    }, [initializeConnection, closeConnection]);

    // Return values and functions as a stable reference
    return useMemo(() => {
        const stateValues = {
            userDetails: userDetailsRef.current,
            roomStatus,
            roomId: roomIdRef.current,
            connectionStatus,
            callStatus,
            isMuted,
            localAudioRef,
            localStreamRef,
            remoteAudioRef,
            users,
            audioLevels
        };

        const actions = {
            initializeConnection,
            closeConnection,
            toggleMute,
            endCall,
            handleAnswer,
            startAudioCall,
            createRoom,
            joinRoom,
            leaveRoom,
            setUserDetails: updateUserDetails,
            sendAudioLevel
        };

        return [stateValues, actions] as const;
    }, [
        connectionStatus,
        callStatus,
        isMuted,
        roomStatus,
        users,
        audioLevels,
        initializeConnection,
        closeConnection,
        toggleMute,
        endCall,
        handleAnswer,
        startAudioCall,
        createRoom,
        joinRoom,
        leaveRoom,
        updateUserDetails,
        sendAudioLevel
    ]);
}

export default useConnection;