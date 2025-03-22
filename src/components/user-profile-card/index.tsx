import React, { useEffect, useRef, useState } from 'react';
import InputFromModal from '../input-from-modal';
import { useNavigate } from 'react-router';
import VoiceSpeakingAvatar from '../voice-avatar';
import { Share } from 'lucide-react';
import { Flex } from '@radix-ui/themes';

interface UserProfileCardProps {
    name: string;
    connectionStatus: string;
    avatarUrl?: string;
    isOnline?: boolean;
    reconnect: () => void;
    handleDetailSubmit: (name: string) => void;
    voiceLevel: number;
    copyInfo: () => void
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
    name,
    connectionStatus,
    voiceLevel,
    copyInfo,
    reconnect,
    handleDetailSubmit
}) => {
    const [showInputModal, setInputModal] = useState(false)
    const navigate = useNavigate()
    const nameRef = useRef<HTMLHeadingElement>(null)

    useEffect(() => {
        if (!name || !name.length) {
            setInputModal(true)
        }
    }, [name])

    const connectionSignalStyle = `${connectionStatus === 'connected' ? 'bg-green-500' :
        connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
        }`

    return (
        <div className="relative w-full md:max-w-screen max-w-md  bg-blue-100 rounded-lg p-0 my-0">
            <div className="flex items-center justify-between mt-4 p-4 md:p-12">
                <div className="space-y-1">
                    <h2 className="text-4xl font-bold text-gray-900">Hey!</h2>
                    <h1 ref={nameRef} className="text-7xl font-black text-gray-900">{name}</h1>
                    <div className="flex items-center space-x-2 text-gray-500">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${connectionSignalStyle}`} />
                                <span>{
                                    connectionStatus === 'connected' ? 'Online' :
                                        connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'
                                }</span>
                            </div>

                            {connectionStatus === 'disconnected' && (
                                <button
                                    onClick={reconnect}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Reconnect
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className='flex flex-col items-center'>
                    <VoiceSpeakingAvatar userName={"You"} voiceLevel={voiceLevel} />
                </div>
            </div>
            <InputFromModal open={showInputModal} onSubmit={(...args) => {
                handleDetailSubmit(...args)
                if (nameRef.current) {
                    nameRef.current.innerText = args[0]
                }
                setInputModal(false)
            }}
                onCancel={() => {
                    navigate(-1)
                }}
            />
        </div>
    );
};

export default UserProfileCard;