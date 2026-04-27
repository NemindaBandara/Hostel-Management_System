import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, AlertTriangle, Loader2, GraduationCap, ArrowRight, Building2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface Faculty {
    _id: string;
    name: string;
}

interface RolloverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RolloverModal({ isOpen, onClose, onSuccess }: RolloverModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isLoadingFaculties, setIsLoadingFaculties] = useState(false);

    // Targeted State
    const [selectedFaculty, setSelectedFaculty] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');
    const [roomStrategy, setRoomStrategy] = useState('none');

    useEffect(() => {
        const fetchFaculties = async () => {
            try {
                setIsLoadingFaculties(true);
                const res = await api.get('/admin/faculties');
                setFaculties(res.data);
            } catch (error) {
                console.error('Failed to fetch faculties', error);
            } finally {
                setIsLoadingFaculties(false);
            }
        };
        if (isOpen) {
            fetchFaculties();
        }
    }, [isOpen]);

    const handleRollover = async () => {
        if (!selectedYear) {
            toast.error('Please select an action/year to rollover');
            return;
        }

        try {
            setIsProcessing(true);
            const res = await api.post('/admin/students/rollover', {
                facultyId: selectedFaculty,
                year: selectedYear,
                roomStrategy: roomStrategy
            });
            toast.success(res.data.message || 'Rollover Successful!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Rollover failed:', error);
            toast.error(error.response?.data?.message || 'Rollover failed');
        } finally {
            setIsProcessing(false);
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
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-8"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-8"
                        >
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-[32px] bg-white p-8 text-center shadow-[0_32px_120px_rgb(0,0,0,0.3)] transition-all border border-slate-200">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-6 border border-amber-200">
                                    <AlertTriangle className="h-8 w-8" />
                                </div>

                                <Dialog.Title as="h3" className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">
                                    Targeted Academic Rollover
                                </Dialog.Title>
                                <p className="text-slate-500 mb-8 font-medium">Configure which students will be promoted or graduated.</p>

                                <div className="space-y-6 text-left">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-blue-500" /> Target Faculty
                                            </label>
                                            <select
                                                value={selectedFaculty}
                                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 bg-slate-50 font-semibold text-slate-700 outline-none transition-all"
                                                disabled={isLoadingFaculties}
                                            >
                                                <option value="all">All Faculties</option>
                                                {faculties.map((f) => (
                                                    <option key={f._id} value={f._id}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-indigo-500" /> Scope / Action
                                            </label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 bg-slate-50 font-semibold text-slate-700 outline-none transition-all"
                                            >
                                                <option value="all">Global (All Years)</option>
                                                <option value="1">Year 1 → Year 2</option>
                                                <option value="2">Year 2 → Year 3</option>
                                                <option value="3">Year 3 → Year 4</option>
                                                <option value="4">Year 4 (Graduation/Delete)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <ArrowRight className="w-4 h-4 text-emerald-500" /> Room Assignment Strategy
                                        </label>
                                        <select
                                            value={roomStrategy}
                                            onChange={(e) => setRoomStrategy(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 bg-slate-50 font-semibold text-slate-700 outline-none transition-all"
                                        >
                                            <option value="none">No Change (Keep Current Assignments)</option>
                                            <option value="vacate">Vacate Rooms (Make Students Unassigned)</option>
                                            <option value="upgrade">Upgrade Room Year Designation (e.g. Y1 → Y2)</option>
                                        </select>
                                        <p className="text-[11px] text-slate-500 font-medium px-1">
                                            {roomStrategy === 'vacate' ? 'Students will be moved to "Unassigned" to allow complete reallocation.' :
                                                roomStrategy === 'upgrade' ? 'Assigned rooms will be updated to match the students\' new year level.' :
                                                    'Students will stay in their current rooms with current designations.'}
                                        </p>
                                    </div>

                                    {/* Dynamic Warning Card */}
                                    <div className={`p-6 rounded-2xl border transition-all ${selectedYear === '4' || selectedYear === 'all' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                                        <div className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest mb-3 ${selectedYear === '4' || selectedYear === 'all' ? 'text-red-700' : 'text-blue-700'}`}>
                                            <AlertTriangle className="w-4 h-4" />
                                            {selectedYear === '4' || selectedYear === 'all' ? 'Critical Deletion Warning' : 'Promotion Preview'}
                                        </div>

                                        {selectedYear === 'all' ? (
                                            <p className="text-red-800 text-sm font-bold leading-relaxed">
                                                All Year 4 students will be <span className="underline decoration-2">permanently deleted</span>. Years 1-3 will be promoted. This action is irreversible.
                                            </p>
                                        ) : selectedYear === '4' ? (
                                            <p className="text-red-800 text-sm font-bold leading-relaxed">
                                                Selected Year 4 students will be <span className="underline decoration-1.5 underline-offset-2">permanently removed</span> from the system to vacate rooms.
                                            </p>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <p className="text-blue-800 text-sm font-bold leading-relaxed flex-1">
                                                    Students in Year {selectedYear} will be promoted to Year {parseInt(selectedYear) + 1}.
                                                </p>
                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                                                    <span className="text-xs font-black text-slate-400">Y{selectedYear}</span>
                                                    <ArrowRight className="w-3 h-3 text-blue-500" />
                                                    <span className="text-xs font-black text-blue-600">Y{parseInt(selectedYear) + 1}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col gap-3">
                                    <button
                                        onClick={handleRollover}
                                        disabled={isProcessing}
                                        className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ${selectedYear === '4' || selectedYear === 'all' ? 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'}`}
                                    >
                                        {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <GraduationCap className="w-6 h-6" />}
                                        {selectedYear === '4' ? 'Execute Graduation' : selectedYear === 'all' ? 'Execute Global Rollover' : 'Promote Students'}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        disabled={isProcessing}
                                        className="w-full py-4 rounded-2xl font-black text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all font-sans"
                                    >
                                        Cancel
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
