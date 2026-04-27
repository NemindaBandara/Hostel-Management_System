'use client';

import { useEffect, useState } from 'react';
import { 
    Building2, 
    Users, 
    Bed, 
    Info, 
    Loader2, 
    ChevronRight,
    Search
} from 'lucide-react';
import api from '@/lib/axios';
import { AnonymizedRoomBox, AnonymizedCommonAreaBox } from '@/components/grid/AnonymizedGrid';
import { FacultyRef, FloorData } from '@/types';

interface HostelStats {
    _id: string;
    name: string;
    alias?: string;
    totalCapacity: number;
    filledBeds: number;
    availableBeds: number;
}

export default function ExplorerPage() {
    const [stats, setStats] = useState<HostelStats[]>([]);
    const [faculties, setFaculties] = useState<FacultyRef[]>([]);
    const [selectedHostel, setSelectedHostel] = useState<string | null>(null);
    const [layout, setLayout] = useState<FloorData[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLayoutLoading, setIsLayoutLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [statsRes, facultyRes] = await Promise.all([
                    api.get('/admin/hostels/capacity-stats'), // We can use this as bed counts are public info here
                    api.get('/public/faculties')
                ]);
                setStats(statsRes.data.hostels);
                setFaculties(facultyRes.data);
                
                if (statsRes.data.hostels.length > 0) {
                    handleHostelSelect(statsRes.data.hostels[0]._id);
                }
            } catch (err) {
                console.error('Failed to fetch explorer data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleHostelSelect = async (hostelId: string) => {
        try {
            setSelectedHostel(hostelId);
            setIsLayoutLoading(true);
            const res = await api.get(`/admin/hostel/${hostelId}/layout`);
            setLayout(res.data.floors);
        } catch (err) {
            console.error('Failed to fetch layout:', err);
        } finally {
            setIsLayoutLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                
                {/* Sidebar: Stats & Legend */}
                <div className="lg:col-span-1 space-y-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 mb-6 tracking-tight">Hostel Explorer</h1>
                        <div className="space-y-4">
                            {stats.map((hostel) => (
                                <button
                                    key={hostel._id}
                                    onClick={() => handleHostelSelect(hostel._id)}
                                    className={`w-full text-left p-5 rounded-3xl border-2 transition-all duration-300 ${
                                        selectedHostel === hostel._id
                                            ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10'
                                            : 'bg-slate-50 border-transparent hover:border-slate-200'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${selectedHostel === hostel._id ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 group-hover:text-slate-600'}`}>
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <ChevronRight className={`w-5 h-5 transition-transform ${selectedHostel === hostel._id ? 'text-blue-500 translate-x-1' : 'text-slate-300'}`} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-4">{hostel.name}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Beds</p>
                                            <p className="text-sm font-black text-slate-700">{hostel.totalCapacity}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Available</p>
                                            <p className="text-sm font-black text-emerald-700">{hostel.availableBeds}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Info className="w-4 h-4 text-blue-500" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Faculty Legend</h2>
                        </div>
                        <div className="space-y-3">
                            {faculties.map((fac) => (
                                <div key={fac._id} className="flex items-center gap-3 group">
                                    <div 
                                        className="w-4 h-4 rounded-full border border-black/5 shrink-0 group-hover:scale-125 transition-transform" 
                                        style={{ backgroundColor: fac.color }}
                                    />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                                        {fac.name}
                                    </span>
                                </div>
                            ))}
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 opacity-60">
                                <div className="w-4 h-4 rounded-full bg-slate-200 border border-black/5 shrink-0" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">General / Not Set</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Layout Grid */}
                <div className="lg:col-span-3">
                    {isLayoutLoading ? (
                        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-200 border-dashed">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-400 font-bold">Generating building blueprint...</p>
                        </div>
                    ) : layout ? (
                        <div className="space-y-12">
                            {layout.map((floorData) => (
                                <div 
                                    key={floorData.floor} 
                                    className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-200/80 shadow-xl shadow-slate-200/40 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
                                    
                                    <div className="flex justify-between items-center mb-12 pb-6 border-b border-slate-100 relative z-10">
                                        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Floor <span className="text-blue-600">{floorData.floor}</span></h2>
                                        <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest">
                                            {floorData.rooms.length} Rooms
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-6 md:gap-8 items-start relative z-10 justify-center">
                                        {floorData.rooms.map((room) => (
                                            <AnonymizedRoomBox 
                                                key={room._id} 
                                                room={room} 
                                                isHighlighted={false} 
                                                publicMode={true} 
                                            />
                                        ))}

                                        {floorData.rooms.length > 0 && floorData.commonAreas.length > 0 && (
                                            <div className="hidden md:flex flex-col items-center self-stretch justify-center mx-4">
                                                <div className="h-full w-px bg-slate-100" />
                                            </div>
                                        )}

                                        {floorData.commonAreas.map((area) => (
                                            <AnonymizedCommonAreaBox key={area._id} area={area} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center bg-slate-50 rounded-[40px] border border-slate-200">
                            <Building2 className="w-16 h-16 text-slate-300 mb-6" />
                            <p className="text-slate-500 font-bold text-xl">Select a hostel to explore</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
