import React from 'react';

const VoiceSpeakingAvatar = ({ voiceLevel, userName = 'You' }: { voiceLevel: number; userName: string }) => {


    // Calculate ripple size based on voice level
    const getRippleSize = (level: number) => {
        // Base size plus additional based on voice level
        return 100 + (level * 0.5);
    };

    // Generate multiple ripples
    const rippleCount = 2;

    return (
        <div className="relative flex items-center justify-center w-20 h-20">
            {/* Ripple effects */}
            {[...Array(rippleCount)].map((_, index) => {
                const delay = index * 0.3; // Stagger the animations
                const opacity = Math.max(0, (voiceLevel / 100) - (index * 0.2));
                const size = getRippleSize(voiceLevel);

                return (
                    <div
                        key={index}
                        className="absolute rounded-full bg-green-500 animate-pulse"
                        style={{
                            width: `${size}%`,
                            height: `${size}%`,
                            opacity: opacity,
                            animationDelay: `${delay}s`,
                            animationDuration: '1.5s',
                            transition: 'all 0.2s ease-out',
                        }}
                    />
                );
            })}

            {/* Avatar */}
            <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-green-100 overflow-hidden">
                <div className="text-green-500 text-xl font-semibold">
                    {userName}
                </div>
            </div>

            {/* Voice level indicator (optional) */}
            {/* <div className="absolute -bottom-6 left-0 w-full text-xs text-center text-green-700">
                {voiceLevel}%
            </div> */}
        </div>
    );
};

export default VoiceSpeakingAvatar;