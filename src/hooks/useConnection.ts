import React, { useEffect, useRef, useState } from 'react'
import { peerConnectionConfig, signalingServerUrl } from '../utils/signaling-server';

function useConnection() {
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'failed'>('idle');
    const [isMuted, setIsMuted] = useState(false);

    const localAudioRef = useRef<HTMLAudioElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);



    // Initialize WebRTC connection
    useEffect(() => {
        initializeConnection();

        return () => {
            closeConnection();

        };
    }, []);

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

    return [{ connectionStatus, callStatus, isMuted, localAudioRef, localStreamRef, remoteAudioRef }, { initializeConnection, closeConnection, toggleMute, endCall, handleAnswer, startAudioCall }] as const
}

export default useConnection
