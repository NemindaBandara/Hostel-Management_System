'use client';

import React from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning',
    isLoading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: AlertCircle,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700 shadow-red-200',
        },
        warning: {
            icon: AlertTriangle,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            buttonBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200', // Using blue for standard confirmation
        },
        info: {
            icon: AlertCircle,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            buttonBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
        }
    };

    const style = variantStyles[variant];
    const Icon = style.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 ${style.iconBg} rounded-2xl flex items-center justify-center ${style.iconColor}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <button 
                            onClick={onClose}
                            disabled={isLoading}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{title}</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
                </div>

                <div className="p-8 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all disabled:opacity-50 active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 py-4 ${style.buttonBg} text-white font-black rounded-2xl shadow-lg transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2`}
                    >
                        {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
