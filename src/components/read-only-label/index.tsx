import React from 'react';
import { Label } from '@radix-ui/react-label';
import { EditIcon } from 'lucide-react';
import { Flex } from '@radix-ui/themes';

const ReadOnlyLabelWithIcon = ({ text, readonly = false }: { text: string, readonly?: boolean }) => {
    return (
        <Flex className='p-4 pb-0 flex gap-2 items-center'>
            <Label className={`capitalize text-gray-500 text-sm font-semibold ${!text.length && "text-red-500"}`} style={{ cursor: 'default', userSelect: 'text' }}>
                {!text.length ? "No Name" : text}
            </Label>
            {!readonly ? <EditIcon size={16} className='cursor-pointer ' /> : null}
        </Flex>
    );
};

export default ReadOnlyLabelWithIcon;