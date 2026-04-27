'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save, Settings2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface Faculty {
    _id: string;
    name: string;
    facultyCode: string;
    color: string;
}

interface BulkRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomIds: string[];
    onSuccess: () => void;
}

export default function BulkRoomModal({ isOpen, onClose, roomIds, onSuccess }: BulkRoomModalProps) {
    const [formData, setFormData] = useState({
        facultyId: '',
        year: '',
        capacity: '4',
        isGeneral: false,
    });

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isLoadingFaculties, setIsLoadingFaculties] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadFaculties = async () => {
            try {
                setIsLoadingFaculties(true);
                const res = await api.get('/admin/faculties');
                setFaculties(res.data);
            } catch (error) {
                console.error('Failed to load faculties:', error);
                toast.error('Failed to load faculties');
            } finally {
                setIsLoadingFaculties(false);
            }
        };

        if (isOpen) {
            loadFaculties();
            setFormData({
                facultyId: '',
                year: '',
                capacity: '4',
                isGeneral: false,
            });
        }
    }, [isOpen]);

    const handleSave = async () => {
        try {
            setIsSaving(true);

            const payload: any = {
                roomIds,
                year: formData.year || undefined,
                capacity: Number(formData.capacity),
                isGeneral: formData.isGeneral,
            };

            if (formData.isGeneral) {
                payload.facultyId = null;
            } else if (formData.facultyId) {
                payload.facultyId = formData.facultyId;
            }

            await api.put('/admin/rooms/bulk-update', payload);

            toast.success(`Successfully configured ${roomIds.length} rooms`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Bulk update failed:', error);
            // toast is handled by interceptor
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-8"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-8"
                        >
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-[32px] bg-white text-left align-middle shadow-[0_32px_120px_rgb(0,0,0,0.3)] transition-all border border-slate-200/50">

                                {/* Header */}
                                <div className="bg-slate-900 px-8 py-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/30">
                                                <Settings2 className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <Dialog.Title as="h3" className="text-2xl font-black text-white tracking-tight">
                                                    Bulk Configuration
                                                </Dialog.Title>
                                                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                                                    Updating {roomIds.length} Selected Rooms
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="px-10 py-8 space-y-8">
                                    {/* General Mode Toggle */}
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 flex items-center justify-between group hover:border-blue-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl transition-all ${formData.isGeneral ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <label className="block text-lg font-black text-slate-800">General Access</label>
                                                <p className="text-slate-500 text-sm font-medium">Remove faculty restriction for these rooms</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, isGeneral: !formData.isGeneral })}
                                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.isGeneral ? 'bg-blue-600' : 'bg-slate-300'}`}
                                        >
                                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${formData.isGeneral ? 'translate-x-7' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {!formData.isGeneral && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Assign Faculty</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.facultyId}
                                                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                                                    disabled={isLoadingFaculties}
                                                    className="w-full px-5 py-4 rounded-[20px] border-2 border-slate-100 bg-slate-50 text-slate-800 font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all appearance-none disabled:opacity-50"
                                                >
                                                    <option value="">Select Target Faculty...</option>
                                                    {faculties.map((f) => (
                                                        <option key={f._id} value={f._id}>
                                                            {f.name} {f.facultyCode ? `(${f.facultyCode})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    {isLoadingFaculties ? <Loader2 className="w-5 h-5 animate-spin" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Target Year</label>
                                            <select
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                className="w-full px-5 py-4 rounded-[20px] border-2 border-slate-100 bg-slate-50 text-slate-800 font-bold focus:border-blue-500 outline-none transition-all appearance-none"
                                            >
                                                <option value="">Don't Change</option>
                                                {[1, 2, 3, 4].map((y) => (
                                                    <option key={y} value={y.toString()}>Year {y}</option>
                                                ))}
                                                <option value="Postgraduate">Postgraduate</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Capacity</label>
                                            <select
                                                value={formData.capacity}
                                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                                className="w-full px-5 py-4 rounded-[20px] border-2 border-slate-100 bg-slate-50 text-slate-800 font-bold focus:border-blue-500 outline-none transition-all appearance-none"
                                            >
                                                {[2, 4, 6, 8].map((c) => (
                                                    <option key={c} value={c.toString()}>{c} Students Per Room</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                                        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                                        <p className="text-amber-800 text-sm font-semibold leading-relaxed">
                                            This will overwrite allocation rules for <span className="font-black underline">{roomIds.length} rooms</span>. Existing resident assignments will <span className="font-black">not</span> be deleted.
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="bg-slate-50 px-10 py-8 flex items-center justify-end gap-4 border-t border-slate-200">
                                    <button
                                        onClick={onClose}
                                        className="px-8 py-4 rounded-2xl font-black text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || (!formData.isGeneral && !formData.facultyId && !formData.year)}
                                        className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
                                    >
                                        {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                        Apply Config to {roomIds.length} Rooms
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
