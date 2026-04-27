'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save, User, Settings2, Loader2, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface Faculty {
    _id: string;
    name: string;
    facultyCode: string;
}

interface Student {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    indexNumber: string;
    faculty?: any;
    year?: string;
}

interface EditStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    onUpdate: () => void;
}

export default function EditStudentModal({ isOpen, onClose, student, onUpdate }: EditStudentModalProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        indexNumber: '',
        email: '',
        faculty: '',
        year: '1',
        sex: 'Male'
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
            } finally {
                setIsLoadingFaculties(false);
            }
        };

        if (isOpen) {
            loadFaculties();
        }
    }, [isOpen]);

    useEffect(() => {
        if (student) {
            const facultyId = typeof student.faculty === 'object' ? student.faculty._id : student.faculty;
            setFormData({
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                indexNumber: student.indexNumber || '',
                email: student.email || '',
                faculty: facultyId || '',
                year: student.year || '1',
                sex: student.sex || 'Male'
            });
        }
    }, [student]);

    const handleSave = async () => {
        if (!student) return;

        try {
            setIsSaving(true);
            await api.put(`/admin/students/${student._id}`, formData);
            toast.success('Student details updated');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Update failed:', error);
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
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-[24px] bg-white text-left align-middle shadow-2xl transition-all">
                                {/* Header */}
                                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-white flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        Edit Student
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="px-8 py-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Index Number</label>
                                            <input
                                                type="text"
                                                value={formData.indexNumber}
                                                onChange={(e) => setFormData({ ...formData, indexNumber: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                                placeholder="student@university.com"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Faculty</label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.faculty}
                                                        onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                                        disabled={isLoadingFaculties}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white disabled:opacity-50"
                                                    >
                                                        <option value="">Select Faculty...</option>
                                                        {faculties.map((f) => (
                                                            <option key={f._id} value={f._id}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        {isLoadingFaculties ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Academic Year</label>
                                                <select
                                                    value={formData.year}
                                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                                >
                                                    {[1, 2, 3, 4].map((y) => (
                                                        <option key={y} value={y.toString()}>Year {y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Sex</label>
                                                <select
                                                    value={formData.sex}
                                                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                                >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex justify-end gap-3">
                                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors">Cancel</button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Changes
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
