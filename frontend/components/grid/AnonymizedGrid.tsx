import { Room, CommonArea, FacultyRef } from '@/types';
import { Bath, BookOpen, Users } from 'lucide-react';

interface AnonymizedRoomBoxProps {
    room: Room;
    isHighlighted: boolean;
    publicMode?: boolean;
}

export function AnonymizedRoomBox({ room, isHighlighted, publicMode = false }: AnonymizedRoomBoxProps) {
    const facultyColor = (room.allocation?.faculty && typeof room.allocation.faculty === 'object') 
        ? (room.allocation.faculty as FacultyRef).color 
        : '#cbd5e1'; // Fallback to slate-300
    
    return (
        <div
            className={`relative flex flex-col items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-[20px] p-4 transition-all duration-500 overflow-hidden ${isHighlighted
                ? 'scale-110 z-20 shadow-[0_0_40px_rgba(0,0,0,0.15)] ring-4 ring-offset-2 ring-blue-500/30'
                : 'opacity-80'
                } pointer-events-none`}
            style={{ 
                backgroundColor: isHighlighted ? '#2563eb' : facultyColor,
                border: isHighlighted ? '2px solid #60a5fa' : '1.5px solid rgba(0,0,0,0.05)'
            }}
        >
            {isHighlighted && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent_50%)] pointer-events-none" />
            )}

            <div className="flex flex-col items-center justify-center relative z-10">
                <span className={`text-4xl font-black tracking-tighter ${isHighlighted || facultyColor ? 'text-white drop-shadow-sm' : 'text-slate-400'}`}>
                    {room.allocation?.year || '?'}
                </span>
                <span className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${isHighlighted ? 'text-blue-100' : 'text-white/80'}`}>
                    Room {room.roomNumber}
                </span>
            </div>
        </div>
    );
}

interface AnonymizedCommonAreaBoxProps {
    area: CommonArea;
}

export function AnonymizedCommonAreaBox({ area }: AnonymizedCommonAreaBoxProps) {
    const getIcon = () => {
        switch (area.type) {
            case 'Washroom':
                return <Bath size={24} className="text-slate-400" />;
            case 'Study Room':
                return <BookOpen size={24} className="text-slate-400" />;
            default:
                return <Users size={24} className="text-slate-400" />;
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center w-28 h-28 md:w-32 md:h-32 bg-slate-50 rounded-[20px] border-[1.5px] border-slate-200 p-4 opacity-50 grayscale pointer-events-none">
            <div className="p-3 bg-white rounded-2xl shadow-sm mb-2 border border-slate-100">
                {getIcon()}
            </div>
            <span className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-wider">
                {area.name}
            </span>
        </div>
    );
}
