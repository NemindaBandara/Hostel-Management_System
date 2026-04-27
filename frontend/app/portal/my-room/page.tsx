'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Bed, 
    Lock, 
    Table as TableIcon, 
    Layout, 
    Wind, 
    Lightbulb, 
    Zap, 
    AlertTriangle, 
    Loader2, 
    CheckCircle2,
    Building2,
    Calendar,
    GraduationCap,
    UserCircle,
    Wrench
} from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Room, FacultyRef } from '@/types';
import ConfirmationModal from '@/components/ConfirmationModal';

interface StudentInfo {
    name: string;
    indexNumber: string;
    faculty: FacultyRef;
    year: string;
}

export default function MyRoomPage() {
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [reporting, setReporting] = useState<string | null>(null);
    const [confirmingIssue, setConfirmingIssue] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            const index = localStorage.getItem('studentIndex');
            if (!index) {
                toast.error('Please search for your room first.');
                window.location.href = '/portal';
                return;
            }

            try {
                const res = await api.get(`/students/find/${index}`);
                setStudent(res.data.student);
                setRoom(res.data.room);
            } catch (err: any) {
                console.error(err);
                toast.error('Failed to load room details.');
                if (err.response?.status === 404) {
                    window.location.href = '/portal';
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, []);

    const reportIssue = async (assetKey: string) => {
        if (!room || !student) return;
        
        try {
            setReporting(assetKey);
            const res = await api.post('/students/report-damage', {
                locationId: room._id,
                locationType: 'Room',
                assetKey: assetKey,
                indexNumber: student.indexNumber
            });

            // Re-fetch room data to get updated assets and pending tickets
            const freshened = await api.get(`/students/find/${student.indexNumber}`);
            setRoom(freshened.data.room);

            toast.success(`Issue reported for ${assetKey}. Maintenance has been notified.`);
            setConfirmingIssue(null);
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to report issue.');
        } finally {
            setReporting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!room || !student) return null;

    const assetConfig = [
        { key: 'beds', label: 'Bed', icon: Bed },
        { key: 'lockers', label: 'Locker', icon: Lock },
        { key: 'tables', label: 'Study Table', icon: TableIcon },
        { key: 'chairs', label: 'Chair', icon: Layout },
        { key: 'racks', label: 'Rack', icon: Layout },
        { key: 'fans', label: 'Ceiling Fan', icon: Wind },
        { key: 'lights', label: 'Lighting', icon: Lightbulb },
        { key: 'plugs', label: 'Power Plug', icon: Zap },
    ];

    return (
        <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
            {/* Student Info Card */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm mb-12 flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                    <UserCircle2 className="w-12 h-12 text-blue-600" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black text-slate-800 mb-2">{student.name}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 font-medium">
                        <span className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" /> {typeof student.faculty === 'object' ? (student.faculty as any).name : 'Faculty'}
                        </span>
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Year {student.year}
                        </span>
                        <span className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">
                            <Building2 className="w-4 h-4" /> Room {room.roomNumber}
                        </span>
                    </div>
                </div>
                <div className="shrink-0 text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hostel</p>
                    <p className="text-xl font-bold text-slate-800">{(room.hostel as any)?.officialName || 'N/A'}</p>
                </div>
            </div>

            {/* Assets Grid */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Room Assets</h2>
                        <p className="text-slate-500 font-medium">Manage and report issues with your room facilities.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {assetConfig.map((item) => {
                        const Icon = item.icon;
                        const assetData = room.assets?.[item.key] || { working: 0, notWorking: 0 };
                        const hasWorking = assetData.working > 0;
                        const pendingTickets = room.pendingTickets?.filter(t => t.assetKey === item.key) || [];
                        const isReported = pendingTickets.length > 0;
                        
                        return (
                            <div key={item.key} className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-200 transition-all shadow-sm flex flex-col h-full group relative overflow-hidden">
                                {isReported && (
                                    <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-300">
                                        <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center gap-1 border border-amber-200">
                                            <Wrench className="w-2.5 h-2.5" /> Reported
                                        </span>
                                    </div>
                                )}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${hasWorking ? 'bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1">{item.label}</h3>
                                <div className="flex flex-wrap items-center gap-2 mb-6">
                                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                        Working: <span className="text-slate-700">{assetData.working}</span>
                                    </span>
                                    {(assetData.notWorking ?? 0) > 0 && !isReported && (
                                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                                            Issues: {assetData.notWorking}
                                        </span>
                                    )}
                                    {isReported && (
                                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            Warden Notified
                                        </span>
                                    )}
                                </div>
                                
                                <button
                                    onClick={() => setConfirmingIssue(item.key)}
                                    disabled={!hasWorking || reporting === item.key}
                                    className={`mt-auto w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                        hasWorking 
                                        ? 'bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600' 
                                        : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                    }`}
                                >
                                    {reporting === item.key ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            {hasWorking ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                            {hasWorking ? 'Report Issue' : 'All Damaged'}
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Help/Info */}
            <div className="bg-blue-600 rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-black mb-4">Maintenance Information</h2>
                    <p className="text-blue-100 font-medium leading-relaxed mb-6">
                        Reporting an issue automatically creates a maintenance request in the Admin dashboard. Our support team will inspect and repair the reported assets as soon as possible.
                    </p>
                    <div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-4 py-2 rounded-full border border-white/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Real-time maintenance tracking active
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!confirmingIssue}
                onClose={() => setConfirmingIssue(null)}
                onConfirm={() => confirmingIssue && reportIssue(confirmingIssue)}
                isLoading={!!reporting}
                title="Report Issue"
                message={`Are you sure you want to report a maintenance issue for ${assetConfig.find(a => a.key === confirmingIssue)?.label}? This will alert the hostel warden.`}
                confirmText="Report Issue"
                variant="warning"
            />
        </div>
    );
}

// Helper icons placeholder if not found
function UserCircle2(props: any) {
  return <UserCircle {...props} />
}
