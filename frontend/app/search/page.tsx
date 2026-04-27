'use client';

import { useState } from 'react';
import { Search, Loader2, ArrowRight, ShieldCheck, Home } from 'lucide-react';
import api from '@/lib/axios';
import { FloorData, Room } from '@/types';
import { AnonymizedRoomBox, AnonymizedCommonAreaBox } from '@/components/grid/AnonymizedGrid';
import toast from 'react-hot-toast';

export default function SearchPage() {
    const [indexNumber, setIndexNumber] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [floors, setFloors] = useState<FloorData[] | null>(null);
    const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!indexNumber.trim()) return;

        try {
            setIsSearching(true);
            setFloors(null);
            setHighlightedRoomId(null);

            // In a real scenario, this endpoint might just return the layout and the matched room ID
            // For this demo, we assume the backend endpoint handles the search and provides the layout + room info
            const res = await api.get(`/search?indexNumber=${indexNumber}`);

            const layoutData = res.data?.data?.layout || res.data?.layout || [];
            const userRoomId = res.data?.data?.roomId || res.data?.roomId;

            if (!userRoomId) {
                toast.error('Student not found or not assigned to a room yet.');
                return;
            }

            setFloors(layoutData);
            setHighlightedRoomId(userRoomId);
            toast.success('Room located!');

        } catch (err: any) {
            console.error(err);
            // Actual generic error handled by interceptor, custom handling if needed:
            if (err.response?.status === 404) {
                toast.error("Invalid Index Number or not registered.");
            }
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Public Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full" />
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-800">HMS <span className="text-blue-600">Student Portal</span></span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-sm font-semibold">
                        <ShieldCheck className="w-4 h-4" /> Secure & Anonymous
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">

                {/* Search Hero Section */}
                <div className={`transition-all duration-700 ease-in-out ${floors ? 'max-w-xl mx-auto mb-12' : 'max-w-2xl mx-auto mt-20'}`}>
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4 leading-tight">
                            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Room Assignment</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">
                            Enter your student Index Number to securely locate your assigned room within the hostel layout.
                        </p>
                    </div>

                    <form onSubmit={handleSearch} className="relative group">
                        <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 transition duration-1000 group-hover:opacity-40 ${isSearching ? 'opacity-50 animate-pulse' : ''}`}></div>
                        <div className="relative bg-white rounded-2xl p-2 flex items-center shadow-xl border border-slate-200">
                            <div className="pl-4 pr-2 text-slate-400">
                                <Search className="w-6 h-6" />
                            </div>
                            <input
                                type="text"
                                placeholder="e.g. 19001234"
                                value={indexNumber}
                                onChange={(e) => setIndexNumber(e.target.value)}
                                className="flex-1 w-full bg-transparent py-4 px-2 text-xl font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-medium tracking-wide"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isSearching || !indexNumber}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20"
                            >
                                {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results / Anonymized Grid */}
                {floors && (
                    <div className="animate-in slide-in-from-bottom-12 fade-in duration-1000 ease-out space-y-12">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200 mb-8">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                <p className="text-slate-700 font-bold">Your room is highlighted below</p>
                            </div>
                        </div>

                        {floors.map((floorData, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-200/80 shadow-xl shadow-slate-200/40 relative overflow-hidden"
                            >
                                {/* Decorative background */}
                                <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

                                <div className="flex items-center mb-12 pb-6 border-b border-slate-100 relative z-10">
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                                        Floor {floorData.floor}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap gap-6 md:gap-8 items-start relative z-10 justify-center">
                                    {/* Rooms */}
                                    {floorData.rooms?.map((room) => (
                                        <AnonymizedRoomBox
                                            key={room._id}
                                            room={room}
                                            isHighlighted={room._id === highlightedRoomId}
                                        />
                                    ))}

                                    {/* Separator */}
                                    {floorData.rooms?.length > 0 && floorData.commonAreas?.length > 0 && (
                                        <div className="hidden md:flex flex-col items-center self-stretch justify-center mx-4">
                                            <div className="h-full w-px bg-slate-200" />
                                        </div>
                                    )}

                                    {/* Common Areas */}
                                    {floorData.commonAreas?.map((area) => (
                                        <AnonymizedCommonAreaBox
                                            key={area._id}
                                            area={area}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </main>
        </div>
    );
}
