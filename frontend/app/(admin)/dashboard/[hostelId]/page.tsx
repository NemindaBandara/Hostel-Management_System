'use client';

import { use } from 'react';
import HostelGrid from '@/components/grid/HostelGrid';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage({ params }: { params: Promise<{ hostelId: string }> }) {
    const unwrappedParams = use(params);
    const activeHostelId = unwrappedParams.hostelId;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-500 hover:text-blue-600 mb-3 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to All Hostels
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-2">Building Layout</h1>
                    <p className="text-slate-500 text-lg">Manage room assignments, students, and asset conditions.</p>
                </div>
            </div>

            {/* The Core Dynamic Grid */}
            <HostelGrid hostelId={activeHostelId} />
        </div>
    );
}
