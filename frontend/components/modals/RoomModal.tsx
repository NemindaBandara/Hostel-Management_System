import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Room, AssetRecord } from '@/types';
import { X, Save, User, Settings2, Loader2, Copy, Combine, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface Student {
    _id: string;
    name: string;
    indexNumber: string;
    faculty: FacultyRef;
    year: string;
}

interface Faculty {
    _id: string;
    name: string;
    facultyCode: string;
    color: string;
}

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room | null;
    onUpdate: () => void; // Trigger a refresh of the grid
}

export default function RoomModal({ isOpen, onClose, room, onUpdate }: RoomModalProps) {
    const [activeTab, setActiveTab] = useState<'allocation' | 'assets'>('allocation');

    const [formData, setFormData] = useState({
        faculty: '',
        year: 1,
    });
    const [assets, setAssets] = useState<any[]>([]);

    const DEFAULT_ASSETS = ['beds', 'lockers', 'tables', 'chairs', 'racks', 'fans', 'lights', 'plugs'];

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isLoadingFaculties, setIsLoadingFaculties] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [hasCopied, setHasCopied] = useState(false);
    const [hasPasted, setHasPasted] = useState(false);

    // Student Assignment State
    const [searchQuery, setSearchQuery] = useState('');
    const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
    const [isSearchingStudents, setIsSearchingStudents] = useState(false);
    const [isAllocating, setIsAllocating] = useState(false);
    const [isUnassigning, setIsUnassigning] = useState<string | null>(null);

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
            setActiveTab('allocation');
            setHasCopied(false);
            setHasPasted(false);
            setSearchQuery('');
            setUnassignedStudents([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const searchStudents = async () => {
            if (activeTab !== 'allocation' || !isOpen) return;

            try {
                setIsSearchingStudents(true);
                const params: any = { search: searchQuery };

                if (room?.allocation?.faculty) {
                    params.faculty = typeof room.allocation.faculty === 'string'
                        ? room.allocation.faculty
                        : room.allocation.faculty._id;
                }
                if (room?.allocation?.year) {
                    params.year = room.allocation.year;
                }

                const res = await api.get('/admin/students/unassigned', { params });
                setUnassignedStudents(res.data);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsSearchingStudents(false);
            }
        };

        const timeoutId = setTimeout(() => {
            searchStudents();
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, activeTab, isOpen, room?.allocation?.faculty, room?.allocation?.year, room?._id]);

    useEffect(() => {
        if (room) {
            const facultyData: any = room.allocation?.faculty;
            const facultyId = facultyData?._id || (typeof facultyData === 'string' ? facultyData : '');

            setFormData({
                faculty: facultyId,
                year: Number(room.allocation?.year || 1),
            });

            const assetObj = room.assets || {};
            const assetsArray = DEFAULT_ASSETS.map((name) => {
                const existing = assetObj[name];
                return {
                    name,
                    working: existing ? existing.working : 0,
                    total: existing ? existing.total || (existing.working + (existing.notWorking || 0)) : 0
                };
            });

            setAssets(assetsArray);
        }
    }, [room]);

    if (!room) return null;

    const handleAssetChange = (index: number, field: 'working' | 'total', value: number) => {
        const updatedAssets = [...assets];
        updatedAssets[index][field] = value;
        // ensure working is not greater than total
        if (updatedAssets[index].working > updatedAssets[index].total) {
            updatedAssets[index].working = updatedAssets[index].total;
        }
        setAssets(updatedAssets);
    };

    const handleCopyTemplate = () => {
        const templatePayload: Record<string, { working: number; notWorking: number }> = {};
        assets.forEach(a => {
            templatePayload[a.name] = { working: a.working, notWorking: a.total - a.working };
        });

        // Save to browser LocalStorage securely cross-sessions
        localStorage.setItem('HMS_ASSET_TEMPLATE', JSON.stringify(templatePayload));
        setHasCopied(true);
        toast.success("Room Asset Layout Copied!");
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handlePasteTemplate = () => {
        const stored = localStorage.getItem('HMS_ASSET_TEMPLATE');
        if (!stored) {
            toast.error("No template found in clipboard!");
            return;
        }

        try {
            const parsedTemplate = JSON.parse(stored);

            // Map the clipboard template object backwards over the state array bounds
            const newArray = DEFAULT_ASSETS.map(name => {
                const tpl = parsedTemplate[name];
                return {
                    name,
                    working: tpl ? tpl.working : 0,
                    total: tpl ? (tpl.working + tpl.notWorking) : 0
                };
            });

            setAssets(newArray);
            setHasPasted(true);
            toast.success("Template Pasted! Don't forget to save.");
            setTimeout(() => setHasPasted(false), 2000);
        } catch (e) {
            toast.error("Failed to parse clipboard template.");
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            // Reconstruct the array back into the backend expected object dict map with correct `{working, notWorking}`
            const assetPayload: Record<string, { working: number, notWorking: number }> = {};
            assets.forEach(a => {
                assetPayload[a.name] = { working: a.working, notWorking: (a.total - a.working) };
            });

            // Note: Our Backend PUT requires {assets, faculty, year} directly
            await api.put(`/admin/room/${room?._id}`, {
                faculty: formData.faculty,
                year: formData.year,
                assets: assetPayload,
            });
            toast.success('Room updated successfully');
            onUpdate(); // refresh grid
            onClose();
        } catch (error) {
            console.error(error);
            // Error toast handled by axios interceptor
        } finally {
            setIsSaving(false);
        }
    };

    const handleAssign = async (studentIndex: string) => {
        if (!room) return;

        // Frontend Capacity Check
        const currentCount = room.students?.length || 0;
        const capacity = room.allocation?.capacity || 4;

        if (currentCount >= capacity) {
            toast.error(`Room is full (${currentCount}/${capacity}). Cannot assign more students.`);
            return;
        }

        try {
            setIsAllocating(true);
            await api.post(`/admin/room/${room?._id}/allocate`, { studentIndex });
            toast.success('Student allocated successfully');
            setSearchQuery('');
            onUpdate(); // refresh grid
        } catch (error) {
            console.error(error);
        } finally {
            setIsAllocating(false);
        }
    };

    const handleUnassign = async (studentId: string, studentName: string) => {
        if (!window.confirm(`Are you sure you want to unassign ${studentName} from this room?`)) return;

        try {
            setIsUnassigning(studentId);
            await api.put(`/admin/student/${studentId}/unassign`);
            toast.success('Student unassigned');
            onUpdate(); // refresh grid
        } catch (error) {
            console.error(error);
        } finally {
            setIsUnassigning(null);
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[24px] bg-white text-left align-middle shadow-2xl transition-all">

                                {/* Header */}
                                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between">
                                    <div className="absolute inset-0 bg-white/10 pattern-grid-lg opacity-20 pointer-events-none" />
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-bold leading-6 text-white flex items-center gap-3 relative z-10"
                                    >
                                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                            <Settings2 className="w-6 h-6 text-white" />
                                        </div>
                                        Manage Room {room.roomNumber}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors relative z-10"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="px-8 py-6 space-y-8">
                                    {/* Tabs */}
                                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                        <button
                                            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === 'allocation' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                            onClick={() => setActiveTab('allocation')}
                                        >
                                            Room Allocation
                                        </button>
                                        <button
                                            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === 'assets' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                            onClick={() => setActiveTab('assets')}
                                        >
                                            Assets & Condition
                                        </button>
                                    </div>

                                    {activeTab === 'allocation' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Assigned Faculty</label>
                                                    <div className="relative">
                                                        <select
                                                            value={formData.faculty}
                                                            onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                                            disabled={isLoadingFaculties}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white disabled:opacity-50 disabled:bg-slate-50"
                                                        >
                                                            <option value="">Select Faculty...</option>
                                                            {faculties.map((f) => (
                                                                <option key={f._id} value={f._id}>
                                                                    {f.name} {f.facultyCode ? `(${f.facultyCode})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {isLoadingFaculties && (
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                                            </div>
                                                        )}
                                                        {!isLoadingFaculties && (
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Year Level</label>
                                                    <select
                                                        value={formData.year}
                                                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                                    >
                                                        {[1, 2, 3, 4].map((y) => (
                                                            <option key={y} value={y}>Year {y}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <hr className="border-slate-100" />

                                            {/* Search & Assign Student */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-bold text-slate-800">Assign Student</h4>
                                                </div>
                                                <div className="relative">
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search student by Name or Index..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                                        />
                                                        {isSearchingStudents && (
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Results Dropdown */}
                                                    {searchQuery.length > 0 && unassignedStudents.length > 0 && (
                                                        <div className="absolute z-[10000] top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[240px] overflow-y-auto custom-scrollbar">
                                                            {unassignedStudents.map((s) => {
                                                                const isRoomFull = (room.students?.length || 0) >= (room.allocation?.capacity || 4);

                                                                return (
                                                                    <button
                                                                        key={s._id}
                                                                        onClick={() => handleAssign(s.indexNumber)}
                                                                        disabled={isAllocating || isRoomFull}
                                                                        className={`w-full px-5 py-4 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors ${isRoomFull ? 'opacity-75 cursor-not-allowed group' : 'disabled:opacity-50'}`}
                                                                    >
                                                                        <div>
                                                                            <p className="font-bold text-slate-800">{s.name}</p>
                                                                            <p className="text-xs text-slate-500 font-medium">{s.indexNumber} • {s.faculty?.name} • Year {s.year}</p>
                                                                        </div>
                                                                        <div className={`${isRoomFull ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'} px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider`}>
                                                                            {isRoomFull ? "Room Full" : "Assign"}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {searchQuery.length > 0 && unassignedStudents.length === 0 && !isSearchingStudents && (
                                                        <div className="absolute z-[10000] top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xl">
                                                            <p className="text-slate-500 font-medium">No unassigned students found for this filter.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <hr className="border-slate-100" />

                                            {/* Occupants */}
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                        Current Occupants
                                                    </h4>
                                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                                        {room.students?.length || 0} / {room.allocation?.capacity || 4}
                                                    </span>
                                                </div>
                                                <div className="bg-white border border-slate-200 rounded-2xl p-2 hidden">
                                                    {/* Render students here if needed, currently list is empty or IDs */}
                                                </div>
                                                {!room.students || room.students.length === 0 ? (
                                                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                        <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-slate-500 text-sm font-medium">Room is currently vacant</p>
                                                    </div>
                                                ) : (
                                                    <ul className="space-y-3">
                                                        {(room.students as any).map((student: any) => (
                                                            <li key={student._id || student} className="flex items-center justify-between p-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-slate-300 transition-all">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs shadow-inner">
                                                                        {student.name ? student.name.substring(0, 2).toUpperCase() : 'ST'}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-800">{student.name || `Student ${student}`}</p>
                                                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">{student.indexNumber || 'ID: ' + student}</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUnassign(student._id, student.name)}
                                                                    disabled={isUnassigning === student._id}
                                                                    className="px-4 py-2 text-red-600 hover:bg-red-50 font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-red-100 disabled:opacity-50"
                                                                >
                                                                    {isUnassigning === student._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'assets' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {/* Copied Template Action Block */}
                                            <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100 border-dashed">
                                                <div className="flex items-center gap-3 text-sm text-blue-800">
                                                    <Info className="w-5 h-5 text-blue-600" />
                                                    <span className="font-medium">You can clone room layouts to speed up design.</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyTemplate}
                                                        className="px-3 py-2 bg-white text-slate-600 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2"
                                                    >
                                                        {hasCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                        {hasCopied ? "Copied" : "Copy "}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handlePasteTemplate}
                                                        className="px-3 py-2 bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-blue-200 shadow-sm hover:border-blue-300 hover:bg-blue-200 transition-all flex items-center gap-2"
                                                    >
                                                        {hasPasted ? <CheckCircle2 className="w-4 h-4" /> : <Combine className="w-4 h-4" />}
                                                        {hasPasted ? "Pasted" : "Paste"}
                                                    </button>
                                                </div>
                                            </div>

                                            {assets.length === 0 ? (
                                                <p className="text-slate-500 text-sm">No assets configured for this room.</p>
                                            ) : (
                                                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {assets.map((asset, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                            <span className="font-semibold text-slate-700 capitalize w-1/3">{asset.name}</span>
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex flex-col items-center">
                                                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Working</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={asset.total}
                                                                        value={asset.working}
                                                                        onChange={(e) => handleAssetChange(idx, 'working', parseInt(e.target.value) || 0)}
                                                                        className="w-20 px-3 py-2 text-center rounded-lg border border-slate-200 font-semibold focus:border-blue-500 outline-none"
                                                                    />
                                                                </div>
                                                                <span className="text-slate-300 font-light text-2xl">/</span>
                                                                <div className="flex flex-col items-center">
                                                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={asset.total}
                                                                        onChange={(e) => handleAssetChange(idx, 'total', parseInt(e.target.value) || 0)}
                                                                        className="w-20 px-3 py-2 text-center rounded-lg border border-slate-200 font-semibold focus:border-blue-500 outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-end gap-3 rounded-b-[24px]">
                                    <button
                                        type="button"
                                        className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.39)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleSave}
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
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
