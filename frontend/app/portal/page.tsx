'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowRight, UserCircle, ShieldCheck } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function SearchLandingPage() {
    const [indexNumber, setIndexNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!indexNumber.trim()) return;

        try {
            setIsLoading(true);
            const res = await api.get(`/students/find/${indexNumber}`);
            
            // Store the index number in session/local storage for the "My Room" page to use
            // Or just redirect with the index number in the URL or state
            // For now, let's use localStorage as a simple "session" for the student
            localStorage.setItem('studentIndex', indexNumber);
            
            toast.success('Room assignment found!');
            router.push('/portal/my-room');
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 404) {
                toast.error(err.response.data.message || "Index number not found.");
            } else {
                toast.error("An error occurred during search. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.05),transparent_50%)] pointer-events-none" />
            
            <div className="max-w-2xl w-full text-center relative z-10">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-blue-500/10 flex items-center justify-center mx-auto mb-8 border border-slate-100">
                    <UserCircle className="w-10 h-10 text-blue-600" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4 leading-tight">
                    Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Room Assignment</span>
                </h1>
                <p className="text-lg text-slate-500 font-medium mb-12 max-w-lg mx-auto">
                    Enter your student Index Number to securely locate your assigned room and manage your assets.
                </p>

                <form onSubmit={handleSearch} className="relative group max-w-md mx-auto">
                    <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 transition duration-1000 group-hover:opacity-30 ${isLoading ? 'opacity-40 animate-pulse' : ''}`}></div>
                    <div className="relative bg-white rounded-2xl p-2 flex items-center shadow-xl border border-slate-200">
                        <div className="pl-4 pr-2 text-slate-400">
                            <Search className="w-6 h-6" />
                        </div>
                        <input
                            type="text"
                            placeholder="Enter Index Number"
                            value={indexNumber}
                            onChange={(e) => setIndexNumber(e.target.value)}
                            className="flex-1 w-full bg-transparent py-4 px-2 text-xl font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-medium"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !indexNumber}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/30"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                        </button>
                    </div>
                </form>

                <div className="mt-12 flex items-center justify-center gap-6 text-slate-400">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Access
                    </div>
                </div>
            </div>
        </div>
    );
}
