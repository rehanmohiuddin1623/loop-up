import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Button, Flex } from "@radix-ui/themes";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import useConnection from "./hooks/useConnection";
import { generateRoomId, shareContent } from "./utils";
import { useSearchParams } from "react-router-dom";
import { useToast } from "./components/notification-toast";
import UserProfileCard from "./components/user-profile-card";
import MemberAvatar from "./components/member-avatar";
import VoiceCallButton from "./components/voice-call-start";



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
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100 p-10">
      <UserProfileCard voiceLevel={audioLevel} name={userDetails.userName || ""} isOnline reconnect={initializeConnection} connectionStatus={connectionStatus} handleDetailSubmit={(userName) => setUserDetails({ ...userDetails, userName })} />


      {callStatus === "connected" ?
        <Flex direction={"column"} gap={"3"} style={{ padding: 12 }} className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
          {/* <h1 className="text-2xl font-bold mb-4 text-center">Loop Up Audio Call</h1> */}

          {/* <Separator.Root className="h-px bg-gray-200 my-4" /> */}

          <div className="flex flex-col items-center gap-4">
            {/* User avatars */}
            <div className="flex justify-center gap-8 mb-4">

              {callStatus === 'connected' && (
                <div className="flex gap-2 items-center">
                  {users.map(user => user.userId !== userDetails.userId ? (
                    <MemberAvatar userName={user.userName || ""} />
                  ) : <></>)}
                </div>
              )}
            </div>

            {/* Call controls */}
            <div className="flex flex-col gap-4 w-full ">
              {callStatus === 'calling' ? (
                <div className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-full">
                  <span>Calling...</span>
                </div>
              ) : callStatus === 'connected' ? (
                <Flex gap={"3"} align={"center"} justify={"center"} className="justify-center w-full" >
                  <Button
                    color='gray'
                    onClick={toggleMute}
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-500'} text-white shadow-md hover:opacity-90`}
                  >
                    {isMuted ? <MicOff /> : <Mic />}
                  </Button>

                  <Button
                    color='red'
                    onClick={() => {
                      endCall();
                      closeAudioContext()
                      setLoading(false)
                    }}
                    style={{ width: "20vw" }}
                    className="flex-1 items-center justify-center w-full h-12 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                  >
                    <span>End Call</span>
                    {/*@ts-ignore */}
                    <PhoneOff style={{ transform: 'rotate(135deg)' }} />
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



          {/* Hidden audio elements */}
          <audio ref={localAudioRef} autoPlay muted className="hidden" />
          <audio ref={remoteAudioRef} autoPlay className="hidden" />
        </Flex> :
        <Flex className="w-full p-2" direction={"row"} justify={"center"}  >
          <VoiceCallButton callStatus={callStatus} onClick={initiateCallAction} roomId={roomId} shareAction={handleShare} />
        </Flex>
      }

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