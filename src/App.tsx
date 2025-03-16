import { useEffect, useMemo, useRef, useState } from "react";
import { Flex } from "@radix-ui/themes";
import useConnection from "./hooks/useConnection";
import { generateRoomId, shareContent } from "./utils";
import { useSearchParams } from "react-router-dom";
import { useToast } from "./components/notification-toast";
import UserProfileCard from "./components/user-profile-card";
import VoiceCallButton from "./components/voice-call-start";
import MeetView from "./meet-view";
import Footer from "./components/footer";
import ConnectionError from "./components/connection-error";



export default function App() {

  const audioAnalyser = useRef<AnalyserNode | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const roomIdFromParam = searchParams.get("roomId")
  const _roomId = roomIdFromParam || useMemo(() => generateRoomId(), [])

  const [{ users, roomStatus, roomId, localAudioRef, localStreamRef, remoteAudioRef, callStatus, connectionStatus, isMuted, userDetails }, { endCall, startAudioCall, toggleMute, initializeConnection, joinRoom, setUserDetails, createRoom, }] = useConnection(_roomId)

  const { addToast } = useToast()

  const closeAudioContext = () => {
    // Close audio context
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
      audioAnalyser.current = null;
    }
  }




  const initiateCallAction = () => {
    setLoading(true)
    if (roomIdFromParam) {
      joinRoom(roomIdFromParam, "")
      return
    }
    createRoom(roomId as string,)
  }

  useEffect(() => {
    console.log({ roomStatus })
    setLoading(false)
    switch (roomStatus.status) {
      case "ROOM_CREATED":
        startAudioCall()
        break;
      case "ROOM_JOINED":
        startAudioCall()
        break;
    }
    if (roomStatus.message) {
      addToast({ title: roomStatus.message })
    }
  }, [roomStatus])

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

  const handleShare = async () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("roomId", _roomId);
    await shareContent({
      title: "📞 Let's Connect!",
      text: "Tap the link below to call me instantly.",
      url: currentUrl.toString(),
    })
  }

  return (
    <div className="flex flex-col items-center min-h-screen md:w-full bg-blue-100 h-full justify-start">
      <UserProfileCard copyInfo={handleShare} voiceLevel={audioLevel} name={userDetails.userName || ""} isOnline reconnect={initializeConnection} connectionStatus={connectionStatus} handleDetailSubmit={(userName) => setUserDetails({ ...userDetails, userName })} />


      {callStatus === "connected" ?
        <MeetView
          {...{ localAudioRef, remoteAudioRef, callStatus, userDetails, users, closeAudioContext, isMuted, setLoading, startAudioCall, toggleMute, endCall }}
        /> :
        <Flex className="w-full p-2" direction={"row"} justify={"center"}  >
          <VoiceCallButton loading={loading} callStatus={callStatus} onClick={initiateCallAction} roomId={roomId} />
        </Flex>
      }
      <Footer />
      {/* Connection Status Dialog */}
      <ConnectionError {...{ callStatus, endCall }} />
    </div>
  );
}