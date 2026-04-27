import { AlertTriangle, Bath, BookOpen, Users } from 'lucide-react';
import { CommonArea } from '@/types';

interface CommonAreaBoxProps {
    area: CommonArea;
    onClick: (area: CommonArea) => void;
}

export default function CommonAreaBox({ area, onClick }: CommonAreaBoxProps) {
    const assetList = Object.values(area.assets || {});
    const hasBrokenAssets = assetList.some((a) => a.notWorking > 0);

    const getIcon = () => {
        switch (area.type) {
            case 'Washroom':
                return <Bath size={32} className="text-cyan-500 drop-shadow-sm" />;
            case 'Study Room':
                return <BookOpen size={32} className="text-emerald-500 drop-shadow-sm" />;
            case 'Common Room':
                return <Users size={32} className="text-purple-500 drop-shadow-sm" />;
            default:
                return <Users size={32} className="text-slate-400 drop-shadow-sm" />;
        }
    };

    const getStyleClasses = () => {
        switch (area.type) {
            case 'Washroom':
                return 'from-cyan-50/80 to-white hover:border-cyan-300 hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)] group-hover:bg-cyan-100';
            case 'Study Room':
                return 'from-emerald-50/80 to-white hover:border-emerald-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] group-hover:bg-emerald-100';
            case 'Common Room':
                return 'from-purple-50/80 to-white hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] group-hover:bg-purple-100';
            default:
                return 'from-slate-50 to-white hover:border-slate-300';
        }
    };

    return (
        <div
            onClick={() => onClick(area)}
            className={`relative flex flex-col items-center justify-center w-32 h-32 md:w-36 md:h-36 bg-gradient-to-b ${getStyleClasses()} rounded-[20px] border-[1.5px] border-slate-200/80 p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 group overflow-hidden`}
        >
            <div className="absolute top-2.5 right-2.5 z-20">
                {hasBrokenAssets && (
                    <div
                        className="bg-amber-100/90 text-amber-600 p-1.5 rounded-full animate-bounce shadow-sm backdrop-blur-sm"
                        title="Broken Assets Detected"
                    >
                        <AlertTriangle size={16} strokeWidth={2.5} />
                    </div>
                )}
            </div>

            <div className="p-3.5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_5px_15px_rgba(0,0,0,0.08)]">
                {getIcon()}
            </div>

            <span className="text-[13px] font-bold text-slate-700 text-center leading-tight max-w-full px-1 truncate relative z-10">
                {area.name}
            </span>

            {/* Decorative subtle pulse rim */}
            <div className="absolute inset-0 border-2 border-transparent rounded-[20px] group-hover:border-white/50 transition-colors duration-500"></div>
        </div>
    );
}
