'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Combine, Loader2, CheckCircle2, ChevronRight, AlertTriangle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface BulkAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface SummaryItem {
    matched: number;
    totalAvailable: number;
}

interface AllocationStats {
    totalUnassigned: number;
    potentialAllocations: number;
    summary: Record<string, SummaryItem>;
}

export default function BulkAllocationModal({ isOpen, onClose, onSuccess }: BulkAllocationModalProps) {
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState<AllocationStats | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPreview();
        }
    }, [isOpen]);

    const fetchPreview = async () => {
        try {
            setIsLoadingPreview(true);
            const res = await api.post('/admin/allocate/bulk-smart', { dryRun: true });
            setStats(res.data.stats);
        } catch (error) {
            console.error('Failed to fetch allocation preview', error);
            toast.error('Failed to generate preview');
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleExecute = async () => {
        try {
            setIsProcessing(true);
            const res = await api.post('/admin/allocate/bulk-smart', { dryRun: false });
            toast.success(res.data.message);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Bulk allocation failed', error);
            toast.error(error.response?.data?.message || 'Bulk allocation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-[28px] bg-white text-left align-middle shadow-2xl transition-all border border-slate-200">

                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
                                                <Combine className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-2xl font-black text-slate-800 tracking-tight">
                                                    Smart Allocation
                                                </Dialog.Title>
                                                <p className="text-slate-500 font-medium">Automatic Faculty-Year Matching</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {isLoadingPreview ? (
                                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Analyzing Students & Rooms...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {stats?.potentialAllocations === 0 ? (
                                                <div className="p-8 bg-amber-50 border border-amber-100 rounded-3xl text-center">
                                                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                                                    <h4 className="font-bold text-amber-800 mb-1">No Matches Found</h4>
                                                    <p className="text-amber-700/70 text-sm">We couldn't find any unassigned students that match configured room constraints.</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Main Hero Card */}
                                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[28px] p-8 text-white relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none" />
                                                        <div className="relative z-10">
                                                            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Potential Moves</div>
                                                            <div className="flex items-baseline gap-3">
                                                                <span className="text-5xl font-black tracking-tighter">{stats?.potentialAllocations}</span>
                                                                <span className="text-xl font-bold text-slate-400 tracking-tight">students</span>
                                                            </div>
                                                            <div className="mt-6 flex items-center gap-4">
                                                                <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2">
                                                                    <Users className="w-3.5 h-3.5 text-blue-400" />
                                                                    {stats?.totalUnassigned} Unassigned
                                                                </div>
                                                                <div className="w-1 h-1 bg-white/20 rounded-full" />
                                                                <div className="text-xs font-bold text-blue-400">Pairing Optimized</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Details Table */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest px-1">Allocation Breakdown</h4>
                                                        <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                                            {stats && Object.entries(stats.summary).map(([key, data]: [string, any]) => (
                                                                <div key={key} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                                        <span className="font-bold text-slate-700">{key}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-right">
                                                                            <span className="text-blue-700 font-black text-lg">{data.matched}</span>
                                                                            <span className="text-slate-300 mx-1.5 font-light">/</span>
                                                                            <span className="text-slate-500 font-bold">{data.totalAvailable}</span>
                                                                        </div>
                                                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">Beds</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
                                                        <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                                        <p className="text-sm text-blue-800 font-medium">
                                                            Matching is performed based on Faculty and Year. Room capacities are strictly respected.
                                                        </p>
                                                    </div>
                                                </>
                                            )}

                                            <div className="flex gap-4 pt-2">
                                                <button
                                                    onClick={onClose}
                                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    disabled={isProcessing || !stats || stats.potentialAllocations === 0}
                                                    onClick={handleExecute}
                                                    className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                                                >
                                                    {isProcessing ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5" />
                                                    )}
                                                    {isProcessing ? "Processing..." : "Confirm & Allocate"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
