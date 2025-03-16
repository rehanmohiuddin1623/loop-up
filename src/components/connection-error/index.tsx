import { Cross2Icon } from '@radix-ui/react-icons'
import { Dialog } from 'radix-ui'
import { CALL_STATUS } from '../../@types';

type Props = {
    endCall: () => void;
    callStatus: CALL_STATUS
};


const ConnectionError = ({ callStatus, endCall }: Props) => {
    return (
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
    )
}

export default ConnectionError
