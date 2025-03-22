import { Button, Flex } from '@radix-ui/themes'
import React from 'react'

const InvalidRoom = ({ returnToHome }: { returnToHome: () => void }) => {
    return (
        <Flex direction={"column"} justify={"center"} align={"center"} className='p-4'>
            <div className='p-4 font-semibold text-2xl'>Invalid Room.</div>
            <Button onClick={returnToHome} className='w-24'>Return To Home Screen</Button>
        </Flex>
    )
}

export default InvalidRoom
