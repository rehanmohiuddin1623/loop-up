import { Button, Flex } from '@radix-ui/themes';
import { ForwardedRef, forwardRef } from 'react'
import MemberAvatar from '../components/member-avatar';
import { CALL_STATUS, UserDetail } from '../@types';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import VoiceSpeakingAvatar from '../components/voice-avatar';

interface MeetViewProps {
    callStatus: CALL_STATUS; users: UserDetail[];
    userDetails: UserDetail; toggleMute: () => void;
    isMuted: boolean; endCall: () => void;
    closeAudioContext: () => void;
    setLoading: (loading: boolean) => void;
    startAudioCall: () => void;
    localAudioRef: ForwardedRef<HTMLAudioElement>;
    remoteAudioRef: ForwardedRef<HTMLAudioElement>;
    audioLevels: Record<string, number>
}

const MeetView = forwardRef<HTMLAudioElement, MeetViewProps>(({ audioLevels, callStatus, users, userDetails, toggleMute, isMuted, endCall, closeAudioContext, setLoading, startAudioCall, localAudioRef, remoteAudioRef }: MeetViewProps) => {
    return (
        <Flex direction={"column"} gap={"3"} style={{ padding: 40 }} className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col items-center gap-4">
                {/* User avatars */}
                <div className="flex justify-center gap-8 mb-4">

                    {callStatus === 'connected' && (
                        <div className="flex gap-2 items-center">
                            {users.map(user => user.userId !== userDetails.userId ? (
                                user.userId ? <VoiceSpeakingAvatar voiceLevel={audioLevels[user.userId]} userName={user.userName || ""} /> : <></>
                            ) : <></>)}
                        </div>
                    )}
                </div>

                {/* Call controls */}
                <div className="flex flex-col gap-4 w-full ">
                    {callStatus === 'connected' ? (
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
        </Flex>
    )
})



export default MeetView
