import { AlertTriangle } from 'lucide-react';
import { Room } from '@/types';

interface RoomBoxProps {
    room: Room;
    onClick: (room: Room, event: React.MouseEvent) => void;
    isSelected?: boolean;
}

export default function RoomBox({ room, onClick, isSelected }: RoomBoxProps) {
    const hasBrokenAssets = room.pendingTickets && room.pendingTickets.length > 0;
    const occupancyCount = room.students?.length || 0;
    const capacity = room.allocation?.capacity || 4; // Default to 4 if not specified

    // Extract populated faculty data if available
    const facultyData: any = room.allocation?.faculty;
    const facultyName = facultyData?.facultyCode || facultyData?.name || (typeof facultyData === 'string' ? facultyData : 'Unassigned');

    return (
        <div
            onClick={(e) => onClick(room, e)}
            className={`relative flex flex-col justify-between w-32 h-32 md:w-36 md:h-36 bg-white rounded-[20px] p-4 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 group overflow-hidden ${isSelected
                    ? 'border-[4px] border-blue-600 ring-4 ring-blue-100 ring-offset-2 scale-[1.02] shadow-lg'
                    : 'border-[1.5px] border-slate-200 hover:border-blue-400'
                }`}
        >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-40 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="flex justify-between items-start relative z-10 w-full">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">{room.roomNumber}</span>
                </div>
                {hasBrokenAssets && (
                    <div
                        className="bg-amber-100/80 text-amber-600 p-1.5 rounded-full animate-bounce shadow-sm backdrop-blur-sm"
                        title="Broken Assets Detected"
                    >
                        <AlertTriangle size={18} strokeWidth={2.5} />
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-auto w-full space-y-3">
                {/* Capacity Indicator using beautiful dots */}
                <div className="flex items-center gap-1.5 h-4">
                    {Array.from({ length: capacity }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-[14px] h-[14px] rounded-[5px] transition-all duration-300 ${i < occupancyCount
                                ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] scale-110'
                                : 'bg-slate-100 border-2 border-slate-200/60'
                                }`}
                        />
                    ))}
                </div>

                {/* Faculty & Year Label */}
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded-[6px] tracking-wider truncate ${facultyName !== 'Unassigned'
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'
                            : 'bg-slate-50 text-slate-400 border border-slate-100'
                            }`}
                    >
                        {facultyName}
                    </span>
                    {room.allocation?.year && (
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100/50 px-1.5 py-1 rounded-[6px] border border-slate-200/50">
                            Y{room.allocation.year}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
