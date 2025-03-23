import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { peerConnectionConfig, signalingServerUrl } from '../utils/signaling-server';
import { getOrCreatePeerId } from '../utils';
import { CALL_STATUS, ROOM_STATUS, UserDetail } from '../@types';

function useConnection(_roomId: string) {
    // Use a more stable state structure with useReducer pattern
    const [state, setState] = useState({
        connectionStatus: 'disconnected' as 'disconnected' | 'connecting' | 'connected',
        callStatus: 'idle' as CALL_STATUS,
        isMuted: false,
        roomStatus: { status: "IDLE" as ROOM_STATUS, message: null as string | null },
        users: [] as UserDetail[],
        audioLevels: {} as Record<string, number>
    });

    // Memoize state update functions to prevent unnecessary re-renders
    const updateState = useCallback((newState: Partial<typeof state>) => {
        setState(prev => ({ ...prev, ...newState }));
    }, []);

    // All refs remain the same as they don't cause re-renders
    const userDetailsRef = useRef({
        userName: null as string | null,
        userId: getOrCreatePeerId()
    });
    const roomIdRef = useRef(_roomId);
    const localAudioRef = useRef<HTMLAudioElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const shareScreenRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const combinedStream = useRef<MediaStream>(new MediaStream());
    const messagesRef = useRef<Record<string, any>[]>([]);

    // WebSocket message handling with stable reference
    const handleWebSocketMessage = useCallback(async (messageData: string) => {
        try {
            const data = JSON.parse(messageData);

            switch (data.type) {
                case 'offer':
                    await handleOffer(data.offer);
                    updateState({ callStatus: 'connected' });
                    break;
                case 'offer-screen':
                    await handleOffer(data.offer, true);
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

                case 'room-created':
                    updateState({
                        roomStatus: {
                            status: "ROOM_CREATED",
                            message: `room created!`
                        }
                    });
                    break;

                case 'room-joined':
                    if (data.userId !== userDetailsRef.current.userId) {
                        updateState({
                            roomStatus: {
                                status: "ROOM_JOINED",
                                message: `${data.userName} just joined!`
                            }
                        });
                    }
                    break;

                case 'room-members':
                    console.log("Members : ", data.members);
                    const members = data.members ? (data.members as { userDetails: UserDetail }[]) : [];
                    updateState({ users: members.map(member => member.userDetails) });
                    break;

                case 'room-left':
                    console.log("left data : ", data);
                    updateState({
                        roomStatus: {
                            status: "ROOM_LEFT",
                            message: `${data.userDetails.userName} just left!`
                        }
                    });
                    break;

                case 'invalid-room':
                    updateState({
                        roomStatus: {
                            status: "INVALID_ROOM",
                            message: `Invalid call`
                        }
                    });
                    break;

                case 'audio-level':
                    if (data.userId && typeof data.level === 'number') {
                        // Use function form of update to avoid stale state closure issues
                        updateState({
                            audioLevels: {
                                ...state.audioLevels,
                                [data.userId]: data.level
                            }
                        });
                    }
                    break;
                case 'stop-screen':
                    if (shareScreenRef.current) {
                        shareScreenRef.current.srcObject = null;
                        shareScreenRef.current.hidden = true
                    }
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    }, []);

    // Setup PeerConnection event handlers - dependency array remains empty
    const setupPeerConnectionEventHandlers = useCallback(() => {
        if (!peerConnection.current) return;

        peerConnection.current.oniceconnectionstatechange = () => {
            const iceState = peerConnection.current?.iceConnectionState;
            if (iceState === 'disconnected' || iceState === 'failed') {
                updateState({ callStatus: 'failed' });
            }
        };

        peerConnection.current.onsignalingstatechange = () => {
            console.log('Signaling State:', peerConnection.current?.signalingState);
        };

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate && ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
            }
        };

        peerConnection.current.ontrack = (event) => {
            console.log("Peer event : ", event.track);
            const remoteStream = event.streams[0];

            if (event.track.kind === "video") {
                if (shareScreenRef.current) {
                    shareScreenRef.current.srcObject = remoteStream;
                    shareScreenRef.current.hidden = true
                    shareScreenRef.current.autoplay = true;
                    shareScreenRef.current.playsInline = true;
                }
            }

            if (event.track.kind === "audio") {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                }
            }
        };
    }, []);

    // WebSocket message sending with stable reference
    const sendMessage = useCallback((data: Record<string, any>) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        }
    }, []);

    // Initialize WebSocket connection with stable reference
    const initializeConnection = useCallback(() => {
        updateState({ connectionStatus: 'connecting' });

        ws.current = new WebSocket(signalingServerUrl + `?roomId=${roomIdRef.current}&userId=${userDetailsRef.current.userId}`);

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
    }, [handleWebSocketMessage]);

    // Handle received offer with stable reference
    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, screenShare?: boolean) => {
        try {
            if (!peerConnection.current) {
                peerConnection.current = new RTCPeerConnection(peerConnectionConfig);
                setupPeerConnectionEventHandlers();
            }

            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const combinedStream = new MediaStream();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
            }

            const micAudioTrack = stream.getAudioTracks()[0];
            if (micAudioTrack) combinedStream.addTrack(micAudioTrack);

            combinedStream.getTracks().forEach(track => {
                if (peerConnection.current) {
                    peerConnection.current.addTrack(track, combinedStream);
                }
            });

            if (screenShare && shareScreenRef.current) {
                shareScreenRef.current.hidden = false
            }

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: "answer", answer }));
            }
        } catch (error) {
            console.error("Error handling offer:", error);
            updateState({ callStatus: 'failed' });
        }
    }, [setupPeerConnectionEventHandlers]);

    // Handle received answer with stable reference
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

    // Handle ICE candidate with stable reference
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

    // Close all connections with stable reference
    const closeConnection = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        updateState({
            callStatus: 'idle',
            connectionStatus: 'disconnected'
        });
    }, []);

    // Room management functions with stable references
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
        sendMessage({
            type: "audio-level",
            room: roomIdRef.current,
            level,
            ...userDetailsRef.current
        });
    }, [sendMessage]);

    const sendChatMessage = useCallback((roomId: string, userId: string, message: Record<string, any>) => {
        sendMessage({ type: "message", room: roomId, userId, message });
        // Store messages in ref to avoid re-renders
        messagesRef.current = [...messagesRef.current, message];
    }, [sendMessage]);

    // Start audio call with stable reference
    const startAudioCall = useCallback(async () => {
        if (state.connectionStatus !== 'connected') {
            console.warn("Not connected to signaling server");
            return;
        }

        updateState({ callStatus: 'calling' });

        try {
            peerConnection.current = new RTCPeerConnection(peerConnectionConfig);
            setupPeerConnectionEventHandlers();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
            }

            combinedStream.current.addTrack(stream.getAudioTracks()[0]);

            combinedStream.current.getTracks().forEach(track => {
                if (peerConnection.current) {
                    peerConnection.current.addTrack(track, combinedStream.current);
                }
            });

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
    }, [state.connectionStatus, setupPeerConnectionEventHandlers]);

    // Toggle mute with stable reference
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            const newMutedState = !state.isMuted;

            audioTracks.forEach(track => {
                track.enabled = !newMutedState;
            });

            updateState({ isMuted: newMutedState });
        }
    }, [state.isMuted]);

    // End call with stable reference
    const endCall = useCallback(() => {
        leaveRoom(roomIdRef.current);
        closeConnection();
        initializeConnection();
    }, [closeConnection, initializeConnection, leaveRoom]);

    // Update user details function with stable reference
    const updateUserDetails = useCallback((details: Partial<typeof userDetailsRef.current>) => {
        userDetailsRef.current = { ...userDetailsRef.current, ...details };
    }, []);

    // Share screen with stable reference
    const shareScreen = useCallback(async () => {
        try {
            setupPeerConnectionEventHandlers();
            const combinedStream = new MediaStream();
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

            const track = screenStream.getVideoTracks()[0];

            track.onended = () => {
                stopScreen();
            };

            combinedStream.getTracks().forEach(track => {
                if (peerConnection.current) {
                    peerConnection.current.addTrack(track, combinedStream);
                }
            });

            if (peerConnection.current) {
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);

                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ type: "offer-screen", offer }));
                } else {
                    console.error("WebSocket not connected");
                    updateState({ callStatus: 'failed' });
                }
            }
        } catch (e) {
            console.log(e);
        }
    }, [setupPeerConnectionEventHandlers]);

    const stopScreen = useCallback(() => {
        try {
            if (shareScreenRef.current) {
                shareScreenRef.current.srcObject = null;
                shareScreenRef.current.hidden = true
                sendMessage({
                    type: "stop-screen",
                    room: roomIdRef.current,
                    ...userDetailsRef.current
                });
            }
        } catch (e) {
            console.log(e);
        }
    }, []);

    // Initialize connection on mount
    useEffect(() => {
        initializeConnection();
        return () => {
            closeConnection();
        };
    }, [initializeConnection, closeConnection]);

    console.log("Re Render")


    // Return values and functions as a stable memoized object
    const stateValues = useMemo(() => ({
        userDetails: userDetailsRef.current,
        roomStatus: state.roomStatus,
        roomId: roomIdRef.current,
        connectionStatus: state.connectionStatus,
        callStatus: state.callStatus,
        isMuted: state.isMuted,
        localAudioRef,
        localStreamRef,
        remoteAudioRef,
        users: state.users,
        audioLevels: state.audioLevels,
        shareScreenRef
    }), [state]);

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
        sendAudioLevel,
        shareScreen,
        stopScreen
    };

    return useMemo(() => [stateValues, actions] as const, [stateValues, actions]);
}

export default useConnection;