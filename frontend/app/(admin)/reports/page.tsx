'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileBarChart, Wrench, AlertTriangle, Loader2, Filter, AlertCircle, ChevronRight, Search } from 'lucide-react';
import api from '@/lib/axios';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface MaintenanceIssue {
    _id: string;
    locationDetails: string;
    assetKey: string;
    locationType: 'Room' | 'CommonArea';
    status: 'Pending' | 'Resolved';
    reportedBy: {
        name: string;
        indexNumber: string;
    };
    reportedAt: string;
    resolvedAt?: string;
}

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [issues, setIssues] = useState<MaintenanceIssue[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const limit = 15;

    // Filters
    const [filterIssueType, setFilterIssueType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('Pending'); 

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/reports/maintenance', {
                params: {
                    page: currentPage,
                    limit: limit,
                    status: filterStatus === 'all' ? undefined : filterStatus,
                    issueType: filterIssueType === 'all' ? undefined : filterIssueType
                }
            });

            setIssues(res.data.issues);
            setTotalPages(res.data.totalPages);
            setTotalResults(res.data.totalCount);
        } catch (err) {
            console.error('Failed to load maintenance reports', err);
            toast.error('Failed to sync maintenance data');
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterIssueType, filterStatus]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleResolve = async (ticketId: string) => {
        try {
            setResolvingId(ticketId);
            await api.patch(`/admin/reports/${ticketId}/resolve`);
            toast.success('Asset updated and issue resolved');
            fetchReports();
        } catch (err: any) {
            console.error('Failed to resolve issue', err);
            toast.error(err.response?.data?.message || 'Failed to resolve issue');
        } finally {
            setResolvingId(null);
        }
    };

    const handleExportCSV = async () => {
        try {
            setIsExporting(true);
            toast.loading('Preparing high-volume export...', { id: 'csv-export' });

            // Fetch all data for export by passing status=all (or current filters)
            const res = await api.get('/admin/reports/maintenance', {
                params: {
                    status: filterStatus === 'all' ? undefined : filterStatus,
                    issueType: filterIssueType === 'all' ? undefined : filterIssueType,
                    limit: 1000 // Large enough for export
                }
            });

            const exportData = res.data.issues.map((i: MaintenanceIssue) => ({
                Location: i.locationDetails,
                Asset: i.assetKey,
                Status: i.status,
                'Reported By': i.reportedBy?.name || 'Unknown',
                'Reported At': new Date(i.reportedAt).toLocaleString(),
                'Resolved At': i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : 'N/A'
            }));

            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];

            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Maintenance_Report_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Report downloaded successfully', { id: 'csv-export' });
        } catch (err) {
            console.error('CSV Export failed', err);
            toast.error('Export failed. Please try again.', { id: 'csv-export' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-2">Maintenance Reports</h1>
                    <p className="text-slate-500 text-lg">System-wide overview of reported damages and resolution tracking.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative group">
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm hover:border-slate-300 pr-10"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Pending">Pending Only</option>
                            <option value="Resolved">Resolved Only</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Filter className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <select
                            value={filterIssueType}
                            onChange={(e) => { setFilterIssueType(e.target.value); setCurrentPage(1); }}
                            className="bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm hover:border-slate-300"
                        >
                            <option value="all">All Issue Types</option>
                            <option value="fans">Fans</option>
                            <option value="lights">Lights</option>
                            <option value="beds">Beds</option>
                            <option value="lockers">Lockers</option>
                            <option value="tables">Tables</option>
                            <option value="chairs">Chairs</option>
                            <option value="plugs">Power Plugs</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                        </div>
                    </div>

                    <button
                        onClick={handleExportCSV}
                        disabled={isExporting || issues.length === 0}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        Export CSV
                    </button>
                </div>
            </div>

            {loading && issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[32px] border border-slate-200 shadow-sm">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-6" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Compiling realtime reports...</p>
                </div>
            ) : issues.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-20 flex flex-col items-center text-center shadow-sm">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
                        <span className="text-5xl">✨</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Queue Empty</h3>
                    <p className="text-slate-500 max-w-sm">No maintenance issues found for the current filter selection.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Summary Sidebar */}
                    <div className="col-span-1 space-y-6">
                        <div className={`rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden transition-colors duration-500 ${filterStatus === 'Resolved' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                            <Wrench className="w-12 h-12 text-white/20 absolute -top-2 -right-2 rotate-12 scale-150" />
                            <div className="relative z-10">
                                <p className="text-white/70 font-black uppercase tracking-widest text-xs mb-1">
                                    {filterStatus === 'Resolved' ? 'Completed Tasks' : 'Pending Action'}
                                </p>
                                <p className="text-6xl font-black tracking-tighter mb-8">
                                    {totalResults}
                                </p>
                                <div className="space-y-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase text-white/60">Tickets Count</span>
                                        <span className="text-lg font-black">{totalResults}</span>
                                    </div>
                                    <p className="text-xs font-bold text-white/50 leading-relaxed italic">
                                        Each ticket represents one reporting event from a student.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-300 transition-colors group">
                            <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <AlertCircle className="w-6 h-6 text-blue-500 group-hover:text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1 leading-none">Auto-Sync</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">Resolving a ticket automatically increments the room's working asset count.</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="col-span-1 lg:col-span-3 pb-20">
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-black text-slate-800">Maintenance Queue</h2>
                                    <span className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">{totalResults} Tickets</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="py-5 px-8 bg-slate-50/30 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 italic">Location & Reporter</th>
                                            <th className="py-5 px-8 bg-slate-50/30 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 italic">Asset</th>
                                            <th className="py-5 px-8 bg-slate-50/30 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 italic">Reported At</th>
                                            <th className="py-5 px-8 bg-slate-50/30 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 italic text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {issues.map((item) => (
                                            <tr key={item._id} className="hover:bg-slate-50/70 transition-all duration-200 group">
                                                <td className="py-5 px-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-700 leading-tight group-hover:text-blue-600 transition-colors">
                                                            {item.locationDetails}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                                                            By: {item.reportedBy?.name} ({item.reportedBy?.indexNumber})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-8">
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-tighter group-hover:bg-slate-200 transition-colors">
                                                        {item.assetKey}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-8">
                                                    <p className="text-xs font-bold text-slate-400 italic">
                                                        {new Date(item.reportedAt).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-[10px] text-slate-300 font-medium">
                                                        {new Date(item.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>
                                                <td className="py-5 px-8 text-right">
                                                    {item.status === 'Pending' ? (
                                                        <button
                                                            onClick={() => handleResolve(item._id)}
                                                            disabled={resolvingId === item._id}
                                                            className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-600/20 transition-all duration-300 font-bold text-xs"
                                                        >
                                                            {resolvingId === item._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <span>Resolve</span>
                                                                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-400 px-4 py-2 rounded-xl border border-slate-100 font-bold text-[10px] uppercase tracking-widest">
                                                            Resolved
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <div className="text-xs text-slate-400 font-black uppercase tracking-widest">
                                        Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2.5 rounded-xl border border-slate-200 hover:bg-white hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                                        >
                                            <ChevronRight className="w-5 h-5 text-slate-600 rotate-180" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2.5 rounded-xl border border-slate-200 hover:bg-white hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                                        >
                                            <ChevronRight className="w-5 h-5 text-slate-600" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
