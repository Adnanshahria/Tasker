import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'red' | 'green' | 'indigo';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'red',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-500',
        green: 'bg-green-600 hover:bg-green-500',
        indigo: 'bg-indigo-600 hover:bg-indigo-500',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-red-500/10 rounded-full">
                        <AlertTriangle size={24} className="text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        <p className="text-slate-400 text-sm mt-1">{message}</p>
                    </div>
                    <button onClick={onCancel} className="p-1 text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onCancel} className="flex-1 py-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors text-sm font-medium">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className={`flex-1 py-2 rounded-md text-white transition-colors text-sm font-medium ${colorClasses[confirmColor]}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
