import React, { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

const InputFromModal = ({ children, onSubmit }: { children: React.ReactNode, onSubmit: (userName: string) => void }) => {
  const [open, setOpen] = useState(false);
  const userName = useRef('');

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submitted name:', userName.current);
    onSubmit(userName.current)
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-md p-6 max-w-md w-full data-[state=open]:animate-contentShow">
          <Dialog.Title className="text-xl font-bold mb-4">
            Enter Your Name
          </Dialog.Title>
          <Dialog.Description className="text-gray-600 mb-5">
            Please provide your name in the field below.
          </Dialog.Description>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                defaultValue={userName.current}
                onChange={(e) => userName.current = e.target.value}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                color='blue'
                type="submit"
                className="text-white bg-blue-500 rounded hover:bg-blue-600 rounded-md"
                style={{ padding: 12 }}
              >
                Done
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default InputFromModal;