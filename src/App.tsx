import { useEffect, useMemo, useRef, useState } from "react";
import { Flex } from "@radix-ui/themes";
import useConnection from "./hooks/useConnection";
import { generateRoomId, getAPIURL, shareContent } from "./utils";
import { useSearchParams } from "react-router-dom";
import { useToast } from "./components/notification-toast";
import UserProfileCard from "./components/user-profile-card";
import VoiceCallButton from "./components/voice-call-start";
import MeetView from "./meet-view";
import Footer from "./components/footer";
import ConnectionError from "./components/connection-error";
import { useQuery } from "@tanstack/react-query";
import InvalidRoom from "./components/invalid-room";
import Layout from "./components/layout";



export default function App() {

  const audioAnalyser = useRef<AnalyserNode | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const roomIdFromParam = searchParams.get("roomId")
  const _roomId = roomIdFromParam || useMemo(() => generateRoomId(), [])
  const [{ audioLevels, users, roomStatus, roomId, localAudioRef, localStreamRef, remoteAudioRef, callStatus, connectionStatus, isMuted, userDetails }, { endCall, startAudioCall, toggleMute, initializeConnection, joinRoom, setUserDetails, createRoom, sendAudioLevel }] = useConnection(_roomId)
  const [pageStatus, setPageStatus] = useState<"IDLE" | "INVALID_ROOM" | "FETCHING" | "READY">(!roomIdFromParam ? "READY" : "IDLE")
  const { addToast } = useToast();

  const { isPending, error, data, refetch } = useQuery({
    queryKey: [roomIdFromParam],
    queryFn: async () => {
      setPageStatus("FETCHING")
      const res = await fetch(getAPIURL("/room", { roomId }), { method: "GET" });
      return res.status;
    },
    enabled: typeof roomIdFromParam === "string" && roomIdFromParam.length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,  // Prevent refetch when tab regains focus
    refetchOnReconnect: false,    // Prevent refetch on internet reconnect
    refetchOnMount: false,
  })

  console.log({ isPending, error, data, userDetails })

  useEffect(() => {
    if (data === 404) {
      addToast({ title: "Invalid Room", variant: "error" });
      setPageStatus("INVALID_ROOM")
    }
  }, [data])

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
      joinRoom(roomIdFromParam)
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
        const finalVal = Math.min(100, average * 1.5)
        setAudioLevel(finalVal); // Scale to 0-100
        sendAudioLevel(finalVal)
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
    <>
      <Layout copyInfo={handleShare} >
        {pageStatus === "INVALID_ROOM" ? <InvalidRoom returnToHome={() => window.location.href = "/"} /> : <></>}

        {pageStatus === "FETCHING" ? <div className="p-4 w-full text-center font-semibold text-xl" >Please Wait...</div> : <></>
        }
        {pageStatus === "READY" ? <div className="flex flex-col items-center min-h-screen md:w-full bg-blue-100 h-full justify-start">
          <UserProfileCard copyInfo={handleShare} voiceLevel={audioLevel} name={userDetails.userName || ""} isOnline reconnect={initializeConnection} connectionStatus={connectionStatus}
            handleDetailSubmit={(userName) => {
              console.log("My Name : ", userName, roomIdFromParam)
              setUserDetails({ ...userDetails, userName })
            }} />


          {callStatus === "connected" ?
            <MeetView
              {...{ audioLevels, localAudioRef, remoteAudioRef, callStatus, userDetails, users, closeAudioContext, isMuted, setLoading, startAudioCall, toggleMute, endCall }}
            /> :
            <Flex className="w-full p-2" direction={"row"} justify={"center"}  >
              <VoiceCallButton loading={loading} callStatus={callStatus} onClick={initiateCallAction} roomId={roomId} />
            </Flex>
          }
          <Footer />
          {/* Connection Status Dialog */}
          <ConnectionError {...{ callStatus, endCall }} />
        </div> : <></>}
      </Layout>
    </>
  )


}