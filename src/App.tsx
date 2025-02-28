import { useEffect, useRef, useState } from "react";
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Progress from '@radix-ui/react-progress';
import * as Separator from '@radix-ui/react-separator';
import * as Avatar from '@radix-ui/react-avatar';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Button, Flex } from "@radix-ui/themes";
import { Mic, MicOff, PhoneCall, PhoneOff } from "lucide-react";
import useConnection from "./hooks/useConnection";
import { signalingServerUrl } from "./utils/signaling-server";



export default function App() {

  const audioAnalyser = useRef<AnalyserNode | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const [{ localAudioRef, localStreamRef, remoteAudioRef, callStatus, connectionStatus, isMuted }, { endCall, startAudioCall, toggleMute, initializeConnection }] = useConnection()

  const closeAudioContext = () => {
    // Close audio context
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
      audioAnalyser.current = null;
    }
  }


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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-10">
      <Flex direction={"column"} gap={"3"} style={{ padding: 12 }} className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Loop Up Audio Call</h1>

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
                  <span className="mt-2"></span>

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
                  <Button
                    color='blue'
                    onClick={startAudioCall}
                    disabled={connectionStatus !== 'connected'}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <PhoneCall />
                    Start Call
                  </Button>
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
                      {isMuted ? <MicOff /> : <Mic />}
                    </Button>

                    <Button
                      color='gray'
                      onClick={() => {
                        endCall();
                        closeAudioContext()
                      }}
                      className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                    >
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
          </Tabs.Content>

          <Tabs.Content value="settings" className="pt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Signaling Server URL</label>
                <input
                  type="text"
                  value={signalingServerUrl.replace(signalingServerUrl, "******")}
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
      </Flex>

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