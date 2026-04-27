'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, ArrowRight, Building2, Loader2, LogOut } from 'lucide-react';
import { isAuthenticated, getAuthUser, clearAuthData } from '@/lib/auth';

export default function Home() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        setIsMounted(true);
        if (isAuthenticated()) {
            const authUser = getAuthUser();
            setUser(authUser);
            if (authUser.isFirstLogin) {
                router.push('/change-password');
            }
        }
    }, [router]);

    const handleLogout = () => {
        clearAuthData();
        setUser(null);
        router.refresh();
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">

            {/* Decorative Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />

            <div className="max-w-4xl w-full bg-white rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200/60 relative z-10 overflow-hidden">
                
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 mb-8 transform hover:scale-105 transition-transform duration-500">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">
                        Hostel Management System
                    </h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
                        Seamlessly manage student residences and hostel facilities in one centralized platform.
                    </p>
                </div>

                {user ? (
                    <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-200/50 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                    {user.email[0].toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Welcome back,</p>
                                    <p className="text-slate-900 font-black text-lg truncate max-w-[200px]">{user.email}</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white mt-1">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Link 
                                    href={user.role === 'Student' ? '/portal' : '/dashboard'}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20"
                                >
                                    Enter Portal <ArrowRight className="w-4 h-4" />
                                </Link>
                                <button 
                                    onClick={handleLogout}
                                    className="p-3.5 text-red-500 hover:bg-red-50 rounded-2xl transition-colors border border-transparent hover:border-red-100"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                        <Link
                            href="/login"
                            className="group relative p-8 rounded-[32px] border-2 border-slate-100 hover:border-blue-500/50 bg-slate-50/50 hover:bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-500 shadow-sm">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Admin Portal</h2>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">System administration, student allocation, and facility management.</p>
                        </Link>

                        <Link
                            href="/login"
                            className="group relative p-8 rounded-[32px] border-2 border-slate-100 hover:border-indigo-500/50 bg-slate-50/50 hover:bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:-rotate-6 transition-transform duration-500 shadow-sm">
                                <User className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Student Portal</h2>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">Find your hall and room assignments, or report maintenance tasks.</p>
                        </Link>
                    </div>
                )}

                <div className="text-center pt-8 border-t border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">University Residence Division</p>
                </div>
            </div>
        </div>
    );
}
