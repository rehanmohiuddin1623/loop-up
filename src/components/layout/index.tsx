import { Flex } from '@radix-ui/themes'
import { Share } from 'lucide-react'
import React from 'react'

function Layout({ copyInfo, children }: { copyInfo: () => void, children: React.ReactNode }) {
    return (
        <div>
            <Flex justify={"between"} height={"20"} direction={"row"} className='text-white bg-blue-600 items-center text-center p-4 justify-between w-full h-16'>
                <div className='font-bold text-xl' >LoopUp</div>
                <button
                    onClick={copyInfo}
                    className="flex items-center justify-between p-2 text-sm gap-2 cursor-pointer h-8 rounded-md font-semibold uppercase antialiased proportional-nums tracking-wide">
                    Invite Others
                    <Share size={16} />
                </button>
            </Flex>
            {children}
        </div>
    )
}

export default Layout
