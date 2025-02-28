export const signalingServerUrl = `${import.meta.env.VITE_BACKEND_URL_WS}/websocket`; // WebSocket signaling server
export const peerConnectionConfig = {
    iceServers: [{ urls: import.meta.env.VITE_STUN_SERVER }]
};