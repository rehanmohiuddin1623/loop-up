import { Flex } from "@radix-ui/themes";
import { ArrowRight, PhoneOutgoing } from "lucide-react";
import { CALL_STATUS } from "../../@types";
import { useEffect, useState } from "react";

const VoiceCallButton = ({ onClick, roomId, callStatus, loading }: { onClick: () => void; roomId: string; callStatus: CALL_STATUS; loading: boolean }) => {

    const [dots, setDots] = useState(".");

    useEffect(() => {
        if (callStatus === "calling" || loading) {
            const interval = setInterval(() => {
                setDots((prev) => (prev.length < 3 ? prev + "." : "."));
            }, 500);
            return () => clearInterval(interval);
        }
    }, [callStatus, loading]);

    return callStatus === "calling" ?
        <div className="max-w-md w-full rounded-lg flex flex-col items-center justify-center w-48 p-4 text-slate-600 bg-white">
            <div className="p-6 bg-blue-500 rounded-full shadow-lg animate-pulse">
                <PhoneOutgoing size={50} className="text-slate-100" />
            </div>
            <p className="mt-4 text-xl font-semibold">Waiting to join{dots}</p>
        </div>
        : (
            <div className="flex items-center flex-col w-full"
            >
                <div
                    onClick={onClick}
                    className="flex items-center justify-between w-full max-w-md p-4 bg-blue-600 text-white rounded-2xl shadow-md cursor-pointer hover:bg-blue-700 transition-all"
                >
                    {loading ? <p className="text-xl font-semibold">Connecting{dots}</p>
                        :
                        <>
                            <div className="flex items-center gap-3">
                                <div className="text-left">
                                    <p className="font-semibold">Start Voice Call</p>
                                    <Flex className="w-full" gap={"2"} align={"center"} >
                                        <div className="text-md">{roomId}</div>
                                    </Flex>
                                </div>
                            </div>
                            <Flex className="text-white text-sm">
                                <ArrowRight size={36} className="bg-white text-slate-500 p-2 rounded-md" />
                            </Flex>
                        </>

                    }

                </div>
            </div>
        );
};

export default VoiceCallButton;
