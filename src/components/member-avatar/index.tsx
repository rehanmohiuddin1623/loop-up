import { Avatar } from 'radix-ui'
import React from 'react'
import { getAvatarInitial } from '../../utils'

function MemberAvatar({ userName }: { userName: string }) {
    return (
        <div className="flex flex-col items-center">
            <Avatar.Root className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 overflow-hidden">
                <Avatar.Fallback className="text-green-500 text-xl font-semibold">
                    {getAvatarInitial(userName)}
                </Avatar.Fallback>
            </Avatar.Root>
            <div className={`text-gray-500 rounded-full w-20 flex items-center justify-center mt-2 text-sm font-medium capitalize`}>
                {userName}
            </div>
        </div>
    )
}

export default MemberAvatar
