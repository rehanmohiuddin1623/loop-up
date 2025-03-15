import React, { useEffect, useState } from 'react';
import InputFromModal from '../input-from-modal';
import { useNavigate } from 'react-router';
import VoiceSpeakingAvatar from '../voice-avatar';

interface UserProfileCardProps {
    name: string;
    connectionStatus: string;
    avatarUrl?: string;
    isOnline?: boolean;
    reconnect: () => void;
    handleDetailSubmit: (name: string) => void;
    voiceLevel: number
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
    name,
    connectionStatus,
    voiceLevel,
    isOnline = true,
    reconnect,
    handleDetailSubmit
}) => {
    const [showInputModal, setInputModal] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!name || !name.length) {
            setInputModal(true)
        }
    }, [name])

    const connectionSignalStyle = `${connectionStatus === 'connected' ? 'bg-green-500' :
        connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
        }`

    return (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 my-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-gray-900">Hey!</h2>
                    <h1 className="text-4xl font-black text-gray-900">{name}</h1>
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
                    <VoiceSpeakingAvatar userName={name} voiceLevel={voiceLevel} />
                    {/* <Avatar.Root className="flex relative inline-flex h-16 w-16 rounded-full bg-blue-100 text-center items-center">
                        <Avatar.Fallback className="flex items-center justify-center h-full w-full text-center object-cover rounded-full text-blue-500 text-xl font-semibold">
                            {getAvatarInitial(name)}
                        </Avatar.Fallback>
                        {connectionStatus === "connected" && (
                            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
                        )}
                    </Avatar.Root> */}
                </div>
            </div>
            <InputFromModal open={showInputModal} onSubmit={(...args) => {
                handleDetailSubmit(...args)
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