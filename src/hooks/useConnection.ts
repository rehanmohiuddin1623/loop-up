import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { peerConnectionConfig, signalingServerUrl } from '../utils/signaling-server';
import { generateRoomId, getOrCreatePeerId } from '../utils';
type ROOM_STATUS = "ROOM_JOINED" | "ROOM_CREATED" | "ROOM_LEFT" | "IDLE"
type UserDetail = {
    userName: string | null,
    userId: string | null
}
function useConnection(_roomId: string) {
    // Combined state object to reduce multiple state updates
    const [state, setState] = useState({
        connectionStatus: 'disconnected' as 'disconnected' | 'connecting' | 'connected',
        callStatus: 'idle' as 'idle' | 'calling' | 'connected' | 'failed',
        isMuted: false,
        roomId: _roomId,
        roomStatus: { status: "IDLE" as ROOM_STATUS, message: null as string | null },
        users: [] as UserDetail[],
        messages: [] as Record<string, any>[],
    });

    // User details as separate state since it's updated less frequently
    const [userDetails, setUserDetails] = useState({
        userName: null as string | null,
        userId: getOrCreatePeerId()
    });

    // Refs don't cause re-renders when modified
    const localAudioRef = useRef<HTMLAudioElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    // Store latest state in ref to avoid stale closure issues
    const stateRef = useRef(state);
    stateRef.current = state;

    // Helper function to update part of the state
    const updateState = useCallback((updates: Partial<typeof state>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    console.log({ userDetails, })

    // WebSocket message handling - memoized to prevent recreation
    const handleWebSocketMessage = useCallback(async (messageData: string) => {
        try {
            const data = JSON.parse(messageData);

            switch (data.type) {
                case 'offer':
                    await handleOffer(data.offer);
                    updateState({ callStatus: 'connected' });
                    break;

                case 'answer':
                    await handleAnswer(data.answer);
                    updateState({ callStatus: 'connected' });
                    break;

                case 'candidate':
                    if (data.candidate && data.candidate.candidate) {
                        await handleCandidate(data.candidate);
                    }
                    break;

                case 'room-created': {
                    updateState({
                        roomStatus: {
                            status: "ROOM_CREATED",
                            message: `room created!`
                        },
                    });
                    break;
                }

                case 'room-joined': {
                    if (data.userId !== userDetails.userId) {
                        updateState({
                            roomStatus: {
                                status: "ROOM_JOINED",
                                message: `${data.userName} just joined!`
                            },
                        });
                    }
                    break;
                }
                case 'room-members':
                    console.log("Members : ", data.members)
                    const members = data.members ? (data.members as { userDetails: UserDetail }[]) : []
                    updateState({
                        roomStatus: {
                            status: "ROOM_LEFT",
                            message: null
                        },
                        users: members.map(member => member.userDetails)
                    });
                    break;
                case 'room-left':
                    updateState({
                        roomStatus: {
                            status: "ROOM_LEFT",
                            message: `${data.userName} just left!`
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    }, [userDetails.userId, updateState]);

    // Initialize WebSocket connection - memoized
    const initializeConnection = useCallback(() => {
        updateState({ connectionStatus: 'connecting' });

        // Create WebSocket connection
        ws.current = new WebSocket(signalingServerUrl + `?roomId=${_roomId}&userId=${userDetails.userId}`);

        ws.current.onopen = () => {
            updateState({ connectionStatus: 'connected' });
        };

        ws.current.onclose = () => {
            updateState({ connectionStatus: 'disconnected' });
        };

        ws.current.onerror = () => {
            updateState({
                connectionStatus: 'disconnected',
                callStatus: 'failed'
            });
        };

        ws.current.onmessage = (message) => {
            handleWebSocketMessage(message.data);
        };
    }, [_roomId, userDetails.userId, handleWebSocketMessage, updateState]);

    // Close all connections - memoized
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

        updateState({
            callStatus: 'idle',
            connectionStatus: 'disconnected'
        });
    }, [updateState]);

    // Set up WebRTC event handlers - memoized
    const setupPeerConnectionEventHandlers = useCallback(() => {
        if (!peerConnection.current) return;

        // Handle ICE connection state changes
        peerConnection.current.oniceconnectionstatechange = () => {
            const iceState = peerConnection.current?.iceConnectionState;

            if (iceState === 'disconnected' || iceState === 'failed') {
                updateState({ callStatus: 'failed' });
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
    }, [updateState]);

    // WebSocket message sending - memoized
    const sendMessage = useCallback((data: Record<string, any>) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        }
    }, []);

    // Room management functions - memoized
    const createRoom = useCallback((roomId: string) => {
        sendMessage({ type: "create-room", room: roomId, ...userDetails });
    }, [sendMessage, userDetails]);

    const joinRoom = useCallback((roomId: string, userId: string) => {
        sendMessage({ type: "join-room", room: roomId, ...userDetails });
    }, [sendMessage, userDetails]);

    const leaveRoom = useCallback((roomId: string, userId: string) => {
        sendMessage({ type: "leave-room", room: roomId, ...userDetails });
    }, [sendMessage, userDetails]);

    const sendChatMessage = useCallback((roomId: string, userId: string, message: Record<string, any>) => {
        sendMessage({ type: "message", room: roomId, userId, message });
    }, [sendMessage]);

    // Handle received offer - memoized
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
            updateState({ callStatus: 'failed' });
        }
    }, [setupPeerConnectionEventHandlers, updateState]);

    // Handle received answer - memoized
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

    // Handle ICE candidate - memoized
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

    // Start audio call - memoized
    const startAudioCall = useCallback(async () => {
        if (state.connectionStatus !== 'connected') {
            console.warn("Not connected to signaling server");
            return;
        }

        // Batch state updates
        updateState({ callStatus: 'calling' });

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
                updateState({ callStatus: 'failed' });
            }
        } catch (err) {
            console.error("Error starting audio call:", err);
            updateState({ callStatus: 'failed' });
        }
    }, [state.connectionStatus, setupPeerConnectionEventHandlers, updateState]);

    // Toggle mute - memoized
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();

            audioTracks.forEach(track => {
                track.enabled = state.isMuted;
            });

            updateState({ isMuted: !state.isMuted });
        }
    }, [state.isMuted, updateState]);

    // End call - memoized
    const endCall = useCallback(() => {
        closeConnection();
        initializeConnection();
    }, [closeConnection, initializeConnection]);

    // Initialize connection on mount
    useEffect(() => {
        initializeConnection();
        return () => {
            closeConnection();
        };
    }, [initializeConnection, closeConnection]);

    // Create a stable reference to the state values we want to expose
    const stateValues = useMemo(() => ({
        userDetails,
        roomStatus: state.roomStatus,
        roomId: state.roomId,
        connectionStatus: state.connectionStatus,
        callStatus: state.callStatus,
        isMuted: state.isMuted,
        localAudioRef,
        localStreamRef,
        remoteAudioRef,
        users: state.users
    }), [
        userDetails,
        state.roomStatus,
        state.roomId,
        state.connectionStatus,
        state.callStatus,
        state.isMuted,
        state.users
    ]);

    // Create a stable reference to the actions we want to expose
    const actions = useMemo(() => ({
        initializeConnection,
        closeConnection,
        toggleMute,
        endCall,
        handleAnswer,
        startAudioCall,
        createRoom,
        joinRoom,
        leaveRoom,
        setUserDetails
    }), [
        initializeConnection,
        closeConnection,
        toggleMute,
        endCall,
        handleAnswer,
        startAudioCall,
        createRoom,
        joinRoom,
        leaveRoom
    ]);

    return [stateValues, actions] as const;
}

export default useConnection;