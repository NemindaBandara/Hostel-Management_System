'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, ArrowRight, Eye, LayoutDashboard } from 'lucide-react';
import api from '@/lib/axios';
import { getAuthUser } from '@/lib/auth';

interface Hostel {
    _id: string;
    officialName: string;
    alias: string;
    gender: 'Male' | 'Female' | 'Mixed';
    numberOfFloors: number;
}

interface CapacityStats {
    hostels: Array<{
        _id: string;
        name: string;
        alias: string;
        totalCapacity: number;
        filledBeds: number;
        availableBeds: number;
        occupancyRate: number;
    }>;
    global: {
        totalCapacity: number;
        filledBeds: number;
        availableBeds: number;
        occupancyRate: number;
    };
}

export default function DashboardPage() {
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [stats, setStats] = useState<CapacityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const user = getAuthUser();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [hostelsRes, statsRes] = await Promise.all([
                    api.get('/admin/hostels'),
                    api.get('/admin/hostels/capacity-stats')
                ]);
                setHostels(hostelsRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getProgressColor = (rate: number) => {
        if (rate >= 100) return 'bg-red-500';
        if (rate >= 80) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-2">Hostel Dashboard</h1>
                    <p className="text-slate-500 text-lg">Select a registered campus building to manage its layout and residents.</p>
                </div>

                {hostels.length === 0 && user?.role === 'SuperAdmin' && (
                    <Link
                        href="/hostel-design"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                        <LayoutDashboard className="w-5 h-5" /> Design New Hostel
                    </Link>
                )}
            </div>

            {/* Capacity Analytics Summary */}
            {stats && (
                <div className="mb-12 space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* Global System Card */}
                        <div className="xl:col-span-1 bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">System Capacity</p>
                                <div className="flex items-end gap-2 mb-6">
                                    <h2 className="text-5xl font-black tracking-tighter">
                                        {Math.round(stats.global.occupancyRate)}%
                                    </h2>
                                    <span className="text-slate-500 font-bold mb-1.5 uppercase text-sm">Occupied</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-1000"
                                            style={{ width: `${stats.global.occupancyRate}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span>{stats.global.filledBeds} Filled</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                                            <span>{stats.global.totalCapacity} Total</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Individual Hostel Stats */}
                        <div className="xl:col-span-3 bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hostel Occupancy</h3>
                                <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Normal
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" /> 80%+ Full
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500" /> 100% Full
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {stats.hostels.map(h => (
                                    <div key={h._id} className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">{h.alias || 'Building'}</p>
                                                <h4 className="font-bold text-slate-800 line-clamp-1 truncate w-32">{h.name}</h4>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-sm font-black ${h.occupancyRate >= 100 ? 'text-red-600' : h.occupancyRate >= 80 ? 'text-amber-600' : 'text-slate-800'}`}>
                                                    {Math.round(h.occupancyRate)}%
                                                </span>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{h.filledBeds}/{h.totalCapacity} beds</p>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${getProgressColor(h.occupancyRate)}`}
                                                style={{ width: `${h.occupancyRate}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {hostels.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {user?.role === 'SuperAdmin' ? 'No Hostels Registered Yet' : 'No Hostels Assigned'}
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {user?.role === 'SuperAdmin' 
                            ? 'Your dashboard is empty. Head over to the Hostel Design dashboard to register your first building and configure its floor plans.'
                            : 'You are not currently assigned to manage any hostels. Please contact the Super Admin for building assignments.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {hostels.map((hostel) => (
                        <Link
                            key={hostel._id}
                            href={`/dashboard/${hostel._id}`}
                            className="group"
                        >
                            <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 hover:-translate-y-1">
                                {/* Decorative Background Vector */}
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 rounded-full opacity-50 pointer-events-none group-hover:bg-blue-100 transition-colors" />

                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${hostel.gender === 'Female' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                        hostel.gender === 'Male' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                            'bg-purple-50 text-purple-700 border-purple-100'
                                        }`}>
                                        {hostel.gender}
                                    </div>
                                </div>

                                <div className="relative z-10 mb-6">
                                    <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1" title={hostel.officialName}>
                                        {hostel.officialName}
                                    </h3>
                                    <p className="font-semibold text-slate-500">
                                        {hostel.alias || 'No Alias'}
                                    </p>
                                </div>

                                <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-sm">
                                    <div className="font-bold text-slate-600">
                                        {hostel.numberOfFloors} Floor{hostel.numberOfFloors !== 1 ? 's' : ''}
                                    </div>
                                    <div className="flex items-center text-blue-600 font-bold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        Manage <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
