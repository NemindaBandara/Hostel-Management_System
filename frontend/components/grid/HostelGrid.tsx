'use client';

import { useState, useEffect, useCallback } from 'react';
import { Room, CommonArea, FloorData } from '@/types';
import RoomBox from './RoomBox';
import CommonAreaBox from './CommonAreaBox';
import RoomModal from '../modals/RoomModal';
import CommonAreaModal from '../modals/CommonAreaModal';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { Loader2, AlertCircle, Combine, MousePointer2, CheckSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';
import BulkRoomModal from '../modals/BulkRoomModal';

interface HostelGridProps {
    hostelId: string;
}

export default function HostelGrid({ hostelId }: HostelGridProps) {
    const [floors, setFloors] = useState<FloorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isPasting, setIsPasting] = useState<number | null>(null);

    // Modal State
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);
    const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

    // Bulk Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
    const [lastSelectedRoomId, setLastSelectedRoomId] = useState<string | null>(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    const searchParams = useSearchParams();
    const targetRoomNumber = searchParams.get('room');

    const fetchLayout = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            setError(false);
            const res = await api.get(`/admin/hostel/${hostelId}/layout`);

            // Handle varying response structures gracefully
            const data = res.data?.data || res.data;
            const layoutFloors = data?.floors || data || [];
            const floorsArray = Array.isArray(layoutFloors) ? layoutFloors : [];
            setFloors(floorsArray);
        } catch (err: any) {
            console.error('Failed to fetch layout:', err);
            setError(true);
            // Error toast is handled globally by axios interceptor
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [hostelId]);

    // Handle deep linking to a specific room
    useEffect(() => {
        if (!loading && floors.length > 0 && targetRoomNumber && !isRoomModalOpen) {
            // Flatten floors to find the room
            for (const floor of floors) {
                const room = floor.rooms.find(r => r.roomNumber === targetRoomNumber);
                if (room) {
                    setSelectedRoom(room);
                    setIsRoomModalOpen(true);
                    // No need for a toast if it's direct navigation
                    break;
                }
            }
        }
    }, [loading, floors, targetRoomNumber, isRoomModalOpen]);

    useEffect(() => {
        if (hostelId) {
            fetchLayout(true);
        }
    }, [hostelId, fetchLayout]);

    // Synchronize selectedRoom when floors are updated (e.g. after a background refresh)
    useEffect(() => {
        if (selectedRoom && floors.length > 0) {
            for (const floor of floors) {
                const updated = floor.rooms.find((r: any) => r._id === selectedRoom._id);
                if (updated) {
                    // Only update if something actually changed to prevent potential loops
                    if (JSON.stringify(updated) !== JSON.stringify(selectedRoom)) {
                        setSelectedRoom(updated);
                    }
                    break;
                }
            }
        }
    }, [floors, selectedRoom]);

    const handleRoomClick = (room: Room, event?: React.MouseEvent) => {
        if (!isSelectionMode) {
            setSelectedRoom(room);
            setIsRoomModalOpen(true);
            return;
        }

        const isShift = event?.shiftKey;
        const roomId = room._id;

        if (isShift && lastSelectedRoomId) {
            // Range logic - sort by room number to match visual layout
            const allRooms = floors
                .flatMap(f => f.rooms)
                .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));

            const index1 = allRooms.findIndex(r => r._id === lastSelectedRoomId);
            const index2 = allRooms.findIndex(r => r._id === roomId);

            if (index1 !== -1 && index2 !== -1) {
                const start = Math.min(index1, index2);
                const end = Math.max(index1, index2);
                const rangeIds = allRooms.slice(start, end + 1).map(r => r._id);

                setSelectedRoomIds(prev => {
                    const next = new Set([...prev, ...rangeIds]);
                    return Array.from(next);
                });
            }
        } else {
            // Toggle logic
            setSelectedRoomIds(prev =>
                prev.includes(roomId)
                    ? prev.filter(id => id !== roomId)
                    : [...prev, roomId]
            );
        }
        setLastSelectedRoomId(roomId);
    };

    const clearSelection = () => {
        setSelectedRoomIds([]);
        setLastSelectedRoomId(null);
    };

    const handleCommonAreaClick = (area: CommonArea) => {
        setSelectedArea(area);
        setIsAreaModalOpen(true);
    };

    const handlePasteToFloor = async (floorNumber: number) => {
        const stored = localStorage.getItem('HMS_ASSET_TEMPLATE');
        if (!stored) {
            toast.error("No template found! Open a Room and click 'Copy Template' first.");
            return;
        }

        const confirmPaste = window.confirm(`Are you sure you want to paste this template onto ALL rooms on Floor ${floorNumber}? This action cannot be undone.`);
        if (!confirmPaste) return;

        try {
            setIsPasting(floorNumber);
            const parsedTemplate = JSON.parse(stored);

            await api.put(`/admin/hostel/${hostelId}/floor/${floorNumber}/bulk-assets`, {
                assets: parsedTemplate
            });

            toast.success(`Successfully mapped template to all rooms on Floor ${floorNumber}!`);
            fetchLayout(); // Refresh entire grid
        } catch (err) {
            console.error("Failed to paste floor template", err);
            toast.error("Failed to apply template onto the floor mapping.");
        } finally {
            setIsPasting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] w-full bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading hostel architecture...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] w-full bg-red-50 rounded-3xl border border-red-100">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-2">Failed to load layout</h3>
                <p className="text-red-600/80">Make sure the backend is running at localhost:5000</p>
            </div>
        );
    }

    if (!floors || floors.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] w-full bg-white rounded-3xl border-2 border-dashed border-slate-200/80 shadow-sm">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-200">
                    <span className="text-5xl opacity-80 mix-blend-luminosity">🏢</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">No Layout Configured</h3>
                <p className="text-slate-500 font-medium max-w-sm text-center">
                    This hostel doesn't have a floor plan yet. Please configure the layout in the Design tab first.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {floors.map((floorData, idx) => (
                <div
                    key={idx}
                    className="bg-white rounded-[24px] p-8 md:p-10 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden"
                >
                    {/* Subtle floor background decoration */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

                    {/* Floor Header */}
                    <div className="flex items-center mb-10 pb-5 border-b border-slate-100 relative z-10 flex-wrap gap-4">
                        <div className="flex items-center">
                            <div className="w-2 h-10 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-5 shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                Floor {floorData.floor}
                            </h2>
                        </div>

                        {/* Floor Action Buttons */}
                        <div className="flex items-center gap-2 md:ml-6">
                            <button
                                onClick={() => setIsSelectionMode(!isSelectionMode)}
                                className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 border shadow-sm ${isSelectionMode ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <MousePointer2 className="w-4 h-4" />
                                {isSelectionMode ? 'Exit Selection' : 'Selection Mode'}
                            </button>

                            <button
                                onClick={() => handlePasteToFloor(floorData.floor)}
                                disabled={isPasting === floorData.floor || isSelectionMode}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 border border-slate-200 shadow-sm disabled:opacity-50"
                                title="Paste clipboard room template to all rooms on this floor"
                            >
                                {isPasting === floorData.floor ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Combine className="w-4 h-4 text-slate-500" />}
                                Paste Template
                            </button>
                        </div>

                        <div className="md:ml-auto flex items-center gap-6 text-sm font-semibold text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100/80">
                            <span className="flex items-center gap-2.5">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                </span>
                                {floorData.rooms?.length || 0} Rooms
                            </span>
                            <div className="w-px h-4 bg-slate-300" />
                            <span className="flex items-center gap-2.5">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-20"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                                </span>
                                {floorData.commonAreas?.length || 0} Areas
                            </span>
                        </div>
                    </div>

                    {/* Grid Content */}
                    <div className="flex flex-wrap gap-5 md:gap-7 items-start relative z-10">
                        {/* Rooms */}
                        {floorData.rooms?.map((room) => (
                            <RoomBox
                                key={room._id}
                                room={room}
                                onClick={handleRoomClick}
                                isSelected={selectedRoomIds.includes(room._id)}
                            />
                        ))}

                        {/* Separator - only show if both types exist and have items */}
                        {floorData.rooms?.length > 0 && floorData.commonAreas?.length > 0 && (
                            <div className="hidden md:flex flex-col items-center self-stretch justify-center mx-2 opacity-50">
                                <div className="h-full w-[2px] bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                            </div>
                        )}

                        {/* Common Areas */}
                        {floorData.commonAreas?.map((area) => (
                            <CommonAreaBox
                                key={area._id}
                                area={area}
                                onClick={handleCommonAreaClick}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {/* Interactive Modals */}
            <RoomModal
                isOpen={isRoomModalOpen}
                onClose={() => setIsRoomModalOpen(false)}
                room={selectedRoom}
                onUpdate={fetchLayout}
            />

            <CommonAreaModal
                isOpen={isAreaModalOpen}
                onClose={() => setIsAreaModalOpen(false)}
                area={selectedArea}
                onUpdate={fetchLayout}
            />

            {/* Bulk Actions Floating Bar */}
            {selectedRoomIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-slate-900 text-white rounded-[24px] shadow-2xl shadow-blue-900/40 p-5 flex items-center gap-8 border border-slate-800 backdrop-blur-md bg-opacity-95">
                        <div className="flex items-center gap-4 border-r border-slate-700 pr-8">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <CheckSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Selection</div>
                                <div className="text-xl font-black">{selectedRoomIds.length} <span className="text-slate-500 text-sm font-bold">Rooms</span></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsBulkModalOpen(true)}
                                className="bg-white text-slate-900 hover:bg-blue-50 font-black py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                Configure Selected
                            </button>
                            <button
                                onClick={clearSelection}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-5 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BulkRoomModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                roomIds={selectedRoomIds}
                onSuccess={() => {
                    clearSelection();
                    fetchLayout();
                }}
            />
        </div>
    );
}
