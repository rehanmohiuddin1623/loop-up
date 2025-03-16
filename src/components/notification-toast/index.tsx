import React, { createContext, useState, useContext, useCallback } from 'react';
import { XIcon, CheckIcon, InfoIcon, AlertTriangle } from 'lucide-react';
import * as ToastPrimitive from '@radix-ui/react-toast';

// Toast types
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
    id: string;
    title: string;
    description?: string;
    variant?: ToastVariant;
    action?: {
        label: string;
        onClick: () => void;
    };
    duration?: number;
    icon?: React.ReactNode;
    open: boolean;
}

interface ToastContextType {
    addToast: (toast: Omit<ToastData, 'id' | 'open'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
    addToast: () => { },
    removeToast: () => { }
});

// Single Toast component to fix the hook issue
const Toast: React.FC<{
    toast: ToastData;
    onOpenChange: (open: boolean) => void;
}> = ({ toast, onOpenChange }) => {
    const getVariantStyles = (): { bgColor: string; borderColor: string; icon: React.ReactNode } => {
        switch (toast.variant) {
            case 'success':
                return {
                    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
                    borderColor: 'border-l-4 border-emerald-500',
                    icon: toast.icon || <CheckIcon className="w-5 h-5 text-emerald-500" />,
                };
            case 'error':
                return {
                    bgColor: 'bg-red-50 dark:bg-red-900/30',
                    borderColor: 'border-l-4 border-red-500',
                    icon: toast.icon || <AlertTriangle className="w-5 h-5 text-red-500" />,
                };
            case 'warning':
                return {
                    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
                    borderColor: 'border-l-4 border-amber-500',
                    icon: toast.icon || <AlertTriangle className="w-5 h-5 text-amber-500" />,
                };
            default:
                return {
                    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
                    borderColor: 'border-l-4 border-blue-500',
                    icon: toast.icon || <InfoIcon className="w-5 h-5 text-blue-500" />,
                };
        }
    };

    const variantStyles = getVariantStyles();

    return (
        <ToastPrimitive.Root
            className={`${variantStyles.bgColor} ${variantStyles.borderColor} rounded shadow-lg p-4 flex items-start gap-3 w-full max-w-sm data-[state=open]:animate-slideIn data-[state=closed]:animate-slideOut data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform data-[swipe=end]:animate-swipeOut`}
            open={toast.open}
            onOpenChange={onOpenChange}
            duration={toast.duration || 5000}
        >
            <div className="flex-shrink-0 mt-0.5">
                {variantStyles.icon}
            </div>

            <div className="flex-1 pt-0.5">
                <ToastPrimitive.Title className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {toast.title}
                </ToastPrimitive.Title>

                {toast.description && (
                    <ToastPrimitive.Description className="text-sm text-gray-600 dark:text-gray-300">
                        {toast.description}
                    </ToastPrimitive.Description>
                )}

                {toast.action && (
                    <ToastPrimitive.Action className="mt-2" asChild altText={toast.action.label}>
                        <button
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800/50 dark:text-blue-300 dark:hover:bg-blue-800/70 transition-colors"
                            onClick={toast.action.onClick}
                        >
                            {toast.action.label}
                        </button>
                    </ToastPrimitive.Action>
                )}
            </div>

            <ToastPrimitive.Close className="flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                <XIcon className="w-4 h-4" />
            </ToastPrimitive.Close>
        </ToastPrimitive.Root>
    );
};

// Provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    // Add a new toast
    const addToast = useCallback((toast: Omit<ToastData, 'id' | 'open'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prevToasts) => [...prevToasts, { ...toast, id, open: true }]);
    }, []);

    // Handle toast open state change
    const handleOpenChange = useCallback((id: string, open: boolean) => {
        if (open) return;

        setToasts((prevToasts) =>
            prevToasts.map((toast) =>
                toast.id === id ? { ...toast, open: false } : toast
            )
        );

        // Remove toast after animation completes
        setTimeout(() => {
            setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
        }, 300);
    }, []);

    // Remove a toast by ID
    const removeToast = useCallback((id: string) => {
        setToasts((prevToasts) =>
            prevToasts.map((toast) =>
                toast.id === id ? { ...toast, open: false } : toast
            )
        );

        // Remove after animation completes
        setTimeout(() => {
            setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
        }, 300);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            <ToastPrimitive.Provider swipeDirection="right">
                {children}

                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        onOpenChange={(open) => handleOpenChange(toast.id, open)}
                    />
                ))}

                <ToastPrimitive.Viewport className="fixed bottom-4 flex flex-col gap-2 w-full max-w-sm z-50 justify-center items-center" />
            </ToastPrimitive.Provider>
        </ToastContext.Provider>
    );
};

// Custom hook for using toast
export const useToast = () => useContext(ToastContext);
