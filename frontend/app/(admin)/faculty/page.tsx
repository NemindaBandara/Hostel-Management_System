'use client';

import { useState, useEffect } from 'react';
import { UserCog, Plus, Loader2, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface Faculty {
    _id: string;
    name: string;
    color: string;
    facultyCode: string;
}

export default function FacultyPage() {
    const [loading, setLoading] = useState(false);
    const [faculties, setFaculties] = useState<Faculty[]>([]);

    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        color: '#3b82f6', // Default blue
        facultyCode: ''
    });

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/admin/faculties');
            setFaculties(res.data);
        } catch (err) {
            console.error('Failed to load faculties:', err);
        }
    };

    useEffect(() => {
        fetchFaculties();
    }, []);

    const handleCreateFaculty = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/admin/faculty', formData);
            toast.success(`Faculty ${formData.name} added successfully!`);
            setFormData({ name: '', color: '#3b82f6', facultyCode: '' });
            setIsAddModalOpen(false);
            fetchFaculties();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to add faculty');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateFaculty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFaculty) return;

        setLoading(true);
        try {
            await api.put(`/admin/faculty/${editingFaculty._id}`, {
                name: editingFaculty.name,
                color: editingFaculty.color,
                facultyCode: editingFaculty.facultyCode
            });
            toast.success('Faculty updated securely.');
            setEditingFaculty(null);
            fetchFaculties();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update faculty.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFaculty = async (id: string, name: string) => {
        if (!window.confirm(`DANGER: Are you sure you want to completely delete the Faculty "${name}"? This action cannot be undone.`)) return;

        try {
            await api.delete(`/admin/faculty/${id}`);
            toast.success(`Faculty ${name} removed.`);
            fetchFaculties();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete faculty.');
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-10">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                    <UserCog className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-1">Faculty Setup</h1>
                    <p className="text-slate-500 text-lg">Define organizational zones and color-code room allocations.</p>
                </div>
            </div>

            {/* Full Width Card */}
            <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/40 relative flex flex-col min-h-[500px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UserCog className="w-6 h-6 text-indigo-500" />
                        Manage Faculties
                    </h2>
                    <button
                        onClick={() => { setFormData({ name: '', color: '#3b82f6', facultyCode: '' }); setIsAddModalOpen(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="w-5 h-5" /> Add Faculty
                    </button>
                </div>

                <div className="flex-1 overflow-auto bg-slate-50 border border-slate-200 rounded-2xl max-h-[600px]">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Faculty Identity</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-32 text-center">Brand Color</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-32 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {faculties.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium">No faculties registered yet.</td>
                                </tr>
                            ) : faculties.map((faculty) => (
                                <tr key={faculty._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 text-base">{faculty.name}</p>
                                        <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-md mt-1 border border-indigo-100 uppercase tracking-wide">Code: {faculty.facultyCode}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-md shadow-sm border border-slate-200"
                                                style={{ backgroundColor: faculty.color }}
                                                title={faculty.color}
                                            />
                                            <span className="text-xs font-mono font-bold text-slate-500 uppercase">{faculty.color}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 flex justify-end gap-2 items-center">
                                        <button
                                            onClick={() => setEditingFaculty(faculty)}
                                            className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                            title="Edit Faculty Details"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteFaculty(faculty._id, faculty.name)}
                                            className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                            title="Delete Faculty Permanently"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Faculty Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-500" />
                                Register New Faculty
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateFaculty} className="p-6 space-y-5 text-left">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Official Faculty Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-slate-700"
                                    placeholder="e.g. Faculty of Engineering"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Faculty Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.facultyCode}
                                        onChange={(e) => setFormData({ ...formData, facultyCode: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-700 uppercase"
                                        placeholder="e.g. ENG"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Brand Color</label>
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2 w-full h-[50px]">
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0 flex-shrink-0"
                                        />
                                        <span className="font-mono text-slate-600 font-bold uppercase text-xs truncate">{formData.color}</span>
                                    </div>
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
                                    disabled={loading || !formData.name || !formData.facultyCode}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Faculty Modal */}
            {editingFaculty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-indigo-500" />
                                Edit Faculty Details
                            </h3>
                            <button onClick={() => setEditingFaculty(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateFaculty} className="p-6 space-y-5 text-left">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Official Faculty Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingFaculty.name}
                                    onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-slate-700"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Faculty Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingFaculty.facultyCode}
                                        onChange={(e) => setEditingFaculty({ ...editingFaculty, facultyCode: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-700 uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Brand Color</label>
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2 w-full h-[50px]">
                                        <input
                                            type="color"
                                            value={editingFaculty.color}
                                            onChange={(e) => setEditingFaculty({ ...editingFaculty, color: e.target.value })}
                                            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0 flex-shrink-0"
                                        />
                                        <span className="font-mono text-slate-600 font-bold uppercase text-xs truncate">{editingFaculty.color}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingFaculty(null)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !editingFaculty.name || !editingFaculty.facultyCode}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
