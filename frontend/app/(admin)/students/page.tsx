'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import { Upload, FileUp, Users as UsersIcon, Loader2, AlertCircle, CheckCircle2, UserPlus, X, Filter, ChevronRight, Combine, Search, Building2, Pencil, Trash2, GraduationCap, Mars, Venus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import BulkAllocationModal from '@/components/modals/BulkAllocationModal';
import EditStudentModal from '@/components/modals/EditStudentModal';
import RolloverModal from '@/components/modals/RolloverModal';

interface Student {
    _id: string;
    firstName: string;
    lastName: string;
    name?: string;
    indexNumber: string;
    email?: string;
    faculty?: {
        _id: string;
        name: string;
    };
    year?: string;
    sex: 'Male' | 'Female';
    assignedRoom?: {
        _id: string;
        roomNumber: string;
        hostel: {
            _id: string;
            officialName: string;
        };
    };
}

interface Stats {
    total: number;
    assigned: number;
    unassigned: number;
}

export default function StudentsPage() {
    // List View State
    const [students, setStudents] = useState<Student[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, assigned: 0, unassigned: 0 });
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filters State
    const [filterFaculty, setFilterFaculty] = useState<string>('');
    const [filterYear, setFilterYear] = useState<string>('');
    const [filterSex, setFilterSex] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [faculties, setFaculties] = useState<any[]>([]);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                faculty: filterFaculty,
                year: filterYear,
                sex: filterSex,
                status: filterStatus,
                search: searchQuery
            });

            const res = await api.get(`/admin/students?${params.toString()}`);
            setStudents(res.data.students);
            setStats(res.data.stats);
            setTotalPages(res.data.pagination.pages);
            setTotalResults(res.data.pagination.total);
        } catch (error) {
            console.error('Failed to fetch students', error);
            toast.error('Failed to load student data');
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterFaculty, filterYear, filterSex, filterStatus, searchQuery]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        const fetchFaculties = async () => {
            try {
                const res = await api.get('/admin/faculties');
                setFaculties(res.data);
            } catch (err) {
                console.error('Failed to load faculties:', err);
            }
        };
        fetchFaculties();
    }, []);

    // Single Student Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddingSingle, setIsAddingSingle] = useState(false);
    const [singleStudentData, setSingleStudentData] = useState({
        firstName: '',
        lastName: '',
        indexNumber: '',
        email: '',
        faculty: '',
        year: '',
        sex: 'Male' as 'Male' | 'Female'
    });

    // Smart Allocation State
    const [isBulkAllocationOpen, setIsBulkAllocationOpen] = useState(false);

    // Edit/Delete/Rollover State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string, indexNumber: string) => {
        if (!confirm(`Are you sure you want to delete student ${indexNumber}? This will also free up any room they occupy.`)) return;
        try {
            await api.delete(`/admin/students/${id}`);
            toast.success('Student record deleted');
            fetchStudents();
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to delete student');
        }
    };

    const handleSingleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingSingle(true);
        try {
            await api.post('/admin/student', singleStudentData);
            toast.success(`Student ${singleStudentData.indexNumber} registered successfully!`);
            setSingleStudentData({ firstName: '', lastName: '', indexNumber: '', email: '', faculty: '', year: '', sex: 'Male' });
            setIsAddModalOpen(false);
        } catch (error: any) {
            console.error('Failed to add student', error);
            toast.error(error.response?.data?.message || 'Failed to register student');
        } finally {
            setIsAddingSingle(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.type !== 'text/csv' && !selected.name.endsWith('.csv')) {
                toast.error('Please upload a valid CSV file');
                return;
            }
            setFileContents(selected);

            Papa.parse(selected, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data as any[];
                    const mappedData: any[] = data.map((row) => ({
                        firstName: row.firstName || row['First Name'] || '',
                        lastName: row.lastName || row['Last Name'] || '',
                        indexNumber: row.indexNumber || row['Index Number'] || row.Index || '',
                        email: row.email || row.Email || '',
                        faculty: row.faculty || row.Faculty || '',
                        year: row.year || row.Year || '',
                        sex: row.sex || row.Sex || row.gender || row.Gender || 'Male'
                    }));

                    if (mappedData.length > 0 && !mappedData[0].indexNumber) {
                        toast.error('CSV format invalid. Make sure there is an "indexNumber" column.');
                        setParsedData([]);
                    } else {
                        setParsedData(mappedData);
                        toast.success(`Successfully parsed ${mappedData.length} students`);
                    }
                },
                error: (error) => {
                    toast.error(`Error parsing CSV: ${error.message}`);
                }
            });
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleBulkUpload = async () => {
        if (parsedData.length === 0) return;

        try {
            setIsUploading(true);
            await api.post('/admin/students/bulk', { students: parsedData });
            toast.success('Students successfully uploaded and registered!');
            handleCancelUpload();
            fetchStudents(); // Refresh the main list
        } catch (error) {
            console.error('Bulk upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancelUpload = () => {
        setFileContents(null);
        setParsedData([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast('Upload cleared', { icon: '🗑️' });
    };

    // CSV Logic moved to modal or kept separate
    const [fileContents, setFileContents] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUploadUI, setShowUploadUI] = useState(false);

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-2">Student Command Center</h1>
                    <p className="text-slate-500 text-lg">Manage resident records and track allocation progress.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setIsRolloverModalOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                    >
                        <GraduationCap className="w-5 h-5" /> Rollover
                    </button>
                    <button
                        onClick={() => setShowUploadUI(!showUploadUI)}
                        className={`font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${showUploadUI ? 'bg-slate-800 text-white shadow-slate-900/20' : 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50'}`}
                    >
                        <FileUp className="w-5 h-5" /> {showUploadUI ? 'Close Import' : 'Import Students'}
                    </button>
                    <button
                        onClick={() => setIsBulkAllocationOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 group"
                    >
                        <Combine className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Smart Allocate
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                        <UserPlus className="w-5 h-5" /> Add Student
                    </button>
                </div>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50 pointer-events-none group-hover:bg-indigo-100 transition-colors" />
                    <div className="relative">
                        <div className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-1">Total Students</div>
                        <div className="text-5xl font-black text-slate-800">{stats.total}</div>
                        <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm font-semibold">
                            <UsersIcon className="w-4 h-4" /> Global Roster
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-green-300 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full opacity-50 pointer-events-none group-hover:bg-green-100 transition-colors" />
                    <div className="relative">
                        <div className="text-sm font-bold text-green-600 uppercase tracking-wider mb-1">Assigned</div>
                        <div className="text-5xl font-black text-slate-800">{stats.assigned}</div>
                        <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Bunks Secured
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full opacity-50 pointer-events-none group-hover:bg-amber-100 transition-colors" />
                    <div className="relative">
                        <div className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1">Unassigned</div>
                        <div className="text-5xl font-black text-slate-800">{stats.unassigned}</div>
                        <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm font-bold">
                            <AlertCircle className="w-4 h-4" /> Pending Action
                        </div>
                    </div>
                </div>
            </div>

            {/* Optional Import Section */}
            {showUploadUI && (
                <div className="bg-slate-900 rounded-[24px] p-8 mb-8 relative overflow-hidden animate-in slide-in-from-top duration-300">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-2">Import Student Dataset</h2>
                            <p className="text-slate-400 text-sm mb-4">Upload a CSV with <code>indexNumber</code>, <code>firstName</code>, <code>lastName</code>, <code>faculty</code>, and <code>year</code>.</p>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${fileContents ? 'border-blue-400 bg-blue-500/10' : 'border-slate-700 hover:border-blue-500'}`}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                                {fileContents ? (
                                    <div className="text-blue-400 font-bold">{fileContents.name}</div>
                                ) : (
                                    <div className="text-slate-500 font-bold">Click to upload Roster CSV</div>
                                )}
                            </div>
                        </div>
                        {parsedData.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleBulkUpload}
                                    disabled={isUploading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                                    Commit {parsedData.length} records
                                </button>
                                <button onClick={handleCancelUpload} className="text-slate-400 hover:text-white font-bold text-sm">Cancel Import</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Advanced Filter Bar */}
            <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-center">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 appearance-none"
                            value={filterFaculty}
                            onChange={(e) => { setFilterFaculty(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Faculties</option>
                            {faculties.map((f: any) => (
                                <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 appearance-none"
                        value={filterYear}
                        onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">All Years</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                        <option value="Postgraduate">Postgraduate</option>
                    </select>

                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 appearance-none"
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Unassigned</option>
                    </select>

                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 appearance-none"
                        value={filterSex}
                        onChange={(e) => { setFilterSex(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">All Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Search name or index..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />

                    <div className="text-right text-xs font-bold text-slate-400">
                        {totalResults} matches found
                    </div>
                </div>
            </div>


            {/* Main Student List Table */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-500 font-bold">Synchronizing command center...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 min-h-[400px] p-10">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">No Students Found</h3>
                            <p className="max-w-xs text-center font-medium">No records match your current filters. Try adjusting your selection or search query.</p>
                            <button
                                onClick={() => { setFilterFaculty(''); setFilterYear(''); setFilterStatus('all'); setSearchQuery(''); }}
                                className="mt-6 text-blue-600 font-bold hover:underline"
                            >
                                Reset all filters
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="py-5 px-8 bg-slate-50/50 font-bold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">Student Identity</th>
                                    <th className="py-5 px-8 bg-slate-50/50 font-bold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">Index Number</th>
                                    <th className="py-5 px-8 bg-slate-50/50 font-bold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">Academic Info</th>
                                    <th className="py-5 px-8 bg-slate-50/50 font-bold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">Allocation Status</th>
                                    <th className="py-5 px-8 bg-slate-50/50 font-bold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => (
                                    <tr key={student._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                                                    {(student.firstName?.[0] || student.name?.[0] || '?').toUpperCase()}
                                                    {(student.lastName?.[0] || '').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">
                                                        {student.firstName || student.lastName ?
                                                            `${student.firstName || ''} ${student.lastName || ''}`.trim() :
                                                            student.name || 'Unknown Student'}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-medium">{student.email || 'No email registered'}</div>
                                                </div>
                                                <div className="ml-2">
                                                    {student.sex === 'Male' ? (
                                                        <Mars className="w-4 h-4 text-blue-500" />
                                                    ) : (
                                                        <Venus className="w-4 h-4 text-pink-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-8">
                                            <span className="font-mono font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm">
                                                {student.indexNumber}
                                            </span>
                                        </td>
                                        <td className="py-4 px-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{student.faculty?.name || 'Unassigned Faculty'}</span>
                                                <span className="text-xs text-slate-400 font-semibold">{student.year || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-8">
                                            {student.assignedRoom ? (
                                                <Link
                                                    href={`/dashboard/${student.assignedRoom.hostel?._id || ''}?room=${student.assignedRoom.roomNumber}`}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl font-black text-xs border border-green-100 hover:bg-green-100 transition-colors"
                                                >
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    Room {student.assignedRoom.roomNumber}
                                                    <ChevronRight className="w-3 h-3 ml-0.5" />
                                                </Link>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl font-black text-xs border border-red-100">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-8 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Student"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student._id, student.indexNumber)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Student"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="text-sm text-slate-500 font-bold">
                            Showing <span className="text-slate-900">{students.length}</span> of <span className="text-slate-900">{totalResults}</span> results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-600 rotate-180" />
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${currentPage === i + 1
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Individual Student Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-blue-500" />
                                    Register Individual Student
                                </h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSingleStudentSubmit} className="p-6 space-y-4 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={singleStudentData.firstName}
                                            onChange={(e) => setSingleStudentData({ ...singleStudentData, firstName: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={singleStudentData.lastName}
                                            onChange={(e) => setSingleStudentData({ ...singleStudentData, lastName: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Index Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={singleStudentData.indexNumber}
                                            onChange={(e) => setSingleStudentData({ ...singleStudentData, indexNumber: e.target.value.toUpperCase() })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700 uppercase"
                                            placeholder="e.g. 21/ENG/001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Email Address (Optional)</label>
                                        <input
                                            type="email"
                                            value={singleStudentData.email}
                                            onChange={(e) => setSingleStudentData({ ...singleStudentData, email: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                            placeholder="student@univ.edu"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Faculty (Optional)</label>
                                        <select
                                            value={singleStudentData.faculty}
                                            onChange={(e) => setSingleStudentData({ ...singleStudentData, faculty: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 appearance-none"
                                        >
                                            <option value="">Select Faculty</option>
                                            {faculties.map((f: any) => (
                                                <option key={f._id} value={f.name}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Year (Optional)</label>
                                        <select
                                            value={singleStudentData.year}
                                            onChange={(e) => setSingleStudentData({ ...singleStudentData, year: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 appearance-none"
                                        >
                                            <option value="">Select Year</option>
                                            <option value="1">Year 1</option>
                                            <option value="2">Year 2</option>
                                            <option value="3">Year 3</option>
                                            <option value="4">Year 4</option>
                                            <option value="Postgraduate">Postgraduate</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Sex</label>
                                        <select
                                            value={singleStudentData.sex}
                                            onChange={(e) => setSingleStudentData({ ...singleStudentData, sex: e.target.value as 'Male' | 'Female' })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 appearance-none"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAddingSingle || !singleStudentData.firstName || !singleStudentData.lastName || !singleStudentData.indexNumber}
                                        className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                                    >
                                        {isAddingSingle ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <BulkAllocationModal
                isOpen={isBulkAllocationOpen}
                onClose={() => setIsBulkAllocationOpen(false)}
                onSuccess={fetchStudents}
            />

            <EditStudentModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingStudent(null); }}
                student={editingStudent}
                onUpdate={fetchStudents}
            />

            <RolloverModal
                isOpen={isRolloverModalOpen}
                onClose={() => setIsRolloverModalOpen(false)}
                onSuccess={fetchStudents}
            />
        </div >
    );
}
