'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, Loader2, Building2, Layers, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { getAuthUser } from '@/lib/auth';

interface Hostel {
    _id: string;
    officialName: string;
    alias: string;
    gender: string;
    numberOfFloors: number;
    isDesigned?: boolean;
    primaryWarden?: string | { _id: string; name: string };
}

interface AdminUser {
    _id: string;
    name: string;
    email: string;
}

export default function HostelDesignPage() {
    const [loading, setLoading] = useState(false);
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
    const user = getAuthUser();
    const isSuperAdmin = user?.role === 'SuperAdmin';

    // Create Hostel State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [hostelData, setHostelData] = useState({
        officialName: '',
        alias: '',
        gender: 'Male',
        numberOfFloors: 1,
        primaryWarden: ''
    });

    // Design Hostel State
    const [selectedHostelId, setSelectedHostelId] = useState('');
    const [floorConfigs, setFloorConfigs] = useState<number[]>([10]); // Default 1 floor, 10 rooms
    const [commonAreas, setCommonAreas] = useState<{ [floor: number]: string[] }>({ 1: ['Washroom'] });
    const [isDesigned, setIsDesigned] = useState(false);

    // Edit/Delete State
    const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/admin/hostels');
            setHostels(res.data);
        } catch (err) {
            console.error('Failed to load hostels', err);
        }
    };

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/admin/admins');
            setAvailableAdmins(res.data);
        } catch (err) {
            console.error('Failed to load admins', err);
        }
    };

    useEffect(() => {
        fetchHostels();
        if (isSuperAdmin) fetchAdmins();
    }, []);

    const handleCreateHostel = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin/hostel', hostelData);
            toast.success(`${hostelData.officialName} registered successfully!`);
            setHostelData({ officialName: '', alias: '', gender: 'Male', numberOfFloors: 1, primaryWarden: '' });
            setIsAddModalOpen(false);
            fetchHostels(); // refresh list
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create hostel');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateHostel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingHostel) return;

        setLoading(true);
        try {
            await api.put(`/admin/hostel/${editingHostel._id}`, {
                officialName: editingHostel.officialName,
                alias: editingHostel.alias,
                gender: editingHostel.gender,
                numberOfFloors: editingHostel.numberOfFloors,
                primaryWarden: typeof editingHostel.primaryWarden === 'object' ? editingHostel.primaryWarden?._id : editingHostel.primaryWarden
            });
            toast.success('Building updated safely.');
            setEditingHostel(null);
            fetchHostels();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update building.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHostel = async (id: string, name: string) => {
        if (!window.confirm(`DANGER: Are you sure you want to permanently delete the building "${name}" AND ALL of its generated rooms/assets? This cannot be undone.`)) return;

        try {
            await api.delete(`/admin/hostel/${id}`);
            toast.success(`Building ${name} deleted.`);
            if (selectedHostelId === id) {
                setSelectedHostelId('');
                setIsDesigned(false);
            }
            fetchHostels();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete building.');
        }
    };

    const handleHostelSelection = async (id: string) => {
        setSelectedHostelId(id);
        const selected = hostels.find(h => h._id === id);
        if (selected) {
            try {
                setLoading(true);
                const layoutRes = await api.get(`/admin/hostel/${id}/layout`);
                const existingLayout = layoutRes.data?.layout;

                if (existingLayout && Object.keys(existingLayout).length > 0) {
                    const arr = [];
                    const areas: { [key: number]: string[] } = {};

                    for (let i = 1; i <= selected.numberOfFloors; i++) {
                        const floorData = existingLayout[i];
                        arr.push(floorData?.rooms?.length || 0);
                        areas[i] = floorData?.commonAreas?.map((ca: any) => ca.type) || [];
                    }
                    setFloorConfigs(arr);
                    setCommonAreas(areas);
                    setIsDesigned(true);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                // Layout might not exist yet, continue
            }

            setIsDesigned(false);
            setLoading(false);

            // Initialize layout arrays based on floor count
            const arr = Array(selected.numberOfFloors).fill(10); // default 10 rooms per floor
            setFloorConfigs(arr);

            const areas: { [key: number]: string[] } = {};
            for (let i = 1; i <= selected.numberOfFloors; i++) {
                areas[i] = ['Washroom'];
            }
            setCommonAreas(areas);
        }
    };

    const handleFloorRoomChange = (floorIndex: number, value: number) => {
        const newConfigs = [...floorConfigs];
        newConfigs[floorIndex] = value;
        setFloorConfigs(newConfigs);
    };

    const updateAreaCount = (floorNum: number, area: string, delta: number) => {
        setCommonAreas(prev => {
            const floorAreas = prev[floorNum] || [];
            if (delta > 0) {
                return { ...prev, [floorNum]: [...floorAreas, area] };
            } else {
                const index = floorAreas.findIndex(a => a === area);
                if (index > -1) {
                    const newAreas = [...floorAreas];
                    newAreas.splice(index, 1);
                    return { ...prev, [floorNum]: newAreas };
                }
                return prev;
            }
        });
    };

    const handleResetDesign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHostelId || !window.confirm('WARNING: This will obliterate this entire floorplan and ALL rooms within it. Proceed?')) return;

        setLoading(true);
        try {
            await api.delete(`/admin/hostel/${selectedHostelId}/design`);
            toast.success('Layout has been completely reset.');
            setIsDesigned(false);
            handleHostelSelection(selectedHostelId); // Re-initialize the blank counters
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset layout.');
        } finally {
            setLoading(false);
        }
    };

    const handleDesignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHostelId) return;

        setLoading(true);
        try {
            await api.post(`/admin/hostel/${selectedHostelId}/design`, {
                floorConfigs,
                commonAreaConfig: commonAreas
            });
            toast.success('Hostel layout generated successfully!');
            setSelectedHostelId('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to generate layout. Rooms may already exist.');
        } finally {
            setLoading(false);
        }
    };

    const availableAreaTypes = ['Washroom', 'Study Room', 'Common Room'];

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-10">

            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                    <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-1">Hostel Setup</h1>
                    <p className="text-slate-500 text-lg">Register physical buildings and map their floor plans.</p>
                </div>
            </div>

            {/* Full Width Card */}
            <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/40 relative flex flex-col min-h-[500px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-green-500" />
                        Manage Buildings
                    </h2>
                    {isSuperAdmin && (
                        <button
                            onClick={() => { setHostelData({ officialName: '', alias: '', gender: 'Male', numberOfFloors: 1, primaryWarden: '' }); setIsAddModalOpen(true); }}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20"
                        >
                            <Plus className="w-5 h-5" /> Add Building
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-auto bg-slate-50 border border-slate-200 rounded-2xl max-h-[600px]">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Building Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-24 text-center">Floors</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-48 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {hostels.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium">No buildings registered yet.</td>
                                </tr>
                            ) : hostels.map((hostel) => (
                                <tr key={hostel._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-slate-800 text-base">{hostel.officialName}</p>
                                            {!hostel.isDesigned && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider tooltip" title="This building needs a floorplan to be usable.">
                                                    <AlertCircle className="w-3 h-3" /> Undesigned
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-slate-500">{hostel.alias} • {hostel.gender}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-bold text-slate-600">
                                        {hostel.numberOfFloors}
                                    </td>
                                    <td className="px-6 py-4 flex justify-end gap-2 items-center">
                                        <button
                                            onClick={() => handleHostelSelection(hostel._id)}
                                            className="h-9 px-3.5 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors text-sm font-bold gap-1.5"
                                            title="Design Floorplan"
                                        >
                                            <Layers className="w-4 h-4" /> Design
                                        </button>
                                        {isSuperAdmin && (
                                            <>
                                                <button
                                                    onClick={() => setEditingHostel(hostel)}
                                                    className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                    title="Edit Building Details"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteHostel(hostel._id, hostel.officialName)}
                                                    className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                                    title="Delete Building Permanently"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Building Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-green-500" />
                                Register New Building
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateHostel} className="p-6 space-y-4 text-left">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Official Name</label>
                                <input
                                    type="text"
                                    required
                                    value={hostelData.officialName}
                                    onChange={e => setHostelData({ ...hostelData, officialName: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Alias (Short)</label>
                                    <input
                                        type="text"
                                        value={hostelData.alias}
                                        onChange={e => setHostelData({ ...hostelData, alias: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 uppercase font-bold text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Gender</label>
                                    <select
                                        value={hostelData.gender}
                                        onChange={e => setHostelData({ ...hostelData, gender: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Co-ed">Co-ed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Total Floors</label>
                                <input
                                    type="number"
                                    min="1" max="20"
                                    required
                                    value={hostelData.numberOfFloors}
                                    onChange={e => setHostelData({ ...hostelData, numberOfFloors: parseInt(e.target.value) || 1 })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Primary Warden (Optional)</label>
                                <select
                                    value={typeof hostelData.primaryWarden === 'object' ? (hostelData.primaryWarden as any)?._id : hostelData.primaryWarden}
                                    onChange={e => setHostelData({ ...hostelData, primaryWarden: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                >
                                    <option value="">Select a Warden</option>
                                    {availableAdmins.map(admin => (
                                        <option key={admin._id} value={admin._id}>{admin.name}</option>
                                    ))}
                                </select>
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
                                    disabled={loading || !hostelData.officialName}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Building Modal */}
            {editingHostel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-blue-500" />
                                Edit Building Details
                            </h3>
                            <button onClick={() => setEditingHostel(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateHostel} className="p-6 space-y-4 text-left">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Official Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingHostel.officialName}
                                    onChange={e => setEditingHostel({ ...editingHostel, officialName: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Alias (Short)</label>
                                    <input
                                        type="text"
                                        value={editingHostel.alias}
                                        onChange={e => setEditingHostel({ ...editingHostel, alias: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 uppercase font-bold text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Gender</label>
                                    <select
                                        value={editingHostel.gender}
                                        onChange={e => setEditingHostel({ ...editingHostel, gender: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Co-ed">Co-ed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Total Floors</label>
                                <input
                                    type="number"
                                    min="1" max="20"
                                    required
                                    value={editingHostel.numberOfFloors}
                                    onChange={e => setEditingHostel({ ...editingHostel, numberOfFloors: parseInt(e.target.value) || 1 })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Primary Warden (Optional)</label>
                                <select
                                    value={typeof editingHostel.primaryWarden === 'object' ? editingHostel.primaryWarden?._id : editingHostel.primaryWarden || ''}
                                    onChange={e => setEditingHostel({ ...editingHostel, primaryWarden: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                >
                                    <option value="">Select a Warden</option>
                                    {availableAdmins.map(admin => (
                                        <option key={admin._id} value={admin._id}>{admin.name}</option>
                                    ))}
                                </select>
                            </div>

                            <p className="text-xs font-semibold text-slate-400 mt-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                Note: Changing the number of floors requires entirely resetting the floorplan.
                            </p>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingHostel(null)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !editingHostel.officialName}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Design Right Drawer */}
            {selectedHostelId && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-lg h-full bg-slate-900 text-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Layers className="w-5 h-5 text-blue-400" />
                                Design Floorplan: {hostels.find(h => h._id === selectedHostelId)?.officialName}
                            </h2>
                            <button onClick={() => { setSelectedHostelId(''); setIsDesigned(false); }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                            <form onSubmit={handleDesignSubmit} className="space-y-6 flex flex-col h-full">
                                <div className="space-y-4 flex-1">
                                    {floorConfigs.map((roomCount, idx) => {
                                        const floorNum = idx + 1;
                                        return (
                                            <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl relative">
                                                <span className="absolute -top-3 left-4 bg-slate-900 px-2 text-xs font-bold text-blue-400 border border-slate-700 rounded-full">Floor {floorNum}</span>

                                                <div className="mb-4 mt-2">
                                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Total Rooms</label>
                                                    <input type="number" min="0" max="100" disabled={isDesigned} required value={roomCount} onChange={e => handleFloorRoomChange(idx, parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm font-bold disabled:opacity-50" />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 mb-2">Common Areas</label>
                                                    <div className="flex flex-col gap-2">
                                                        {availableAreaTypes.map(area => {
                                                            const count = (commonAreas[floorNum] || []).filter(a => a === area).length;
                                                            return (
                                                                <div key={area} className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                                                                    <span className="text-sm font-semibold text-slate-300">{area}</span>
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            type="button"
                                                                            disabled={count === 0 || isDesigned}
                                                                            onClick={() => updateAreaCount(floorNum, area, -1)}
                                                                            className="w-7 h-7 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 text-white font-bold"
                                                                        >-</button>
                                                                        <span className="text-sm font-bold w-4 text-center">{count}</span>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isDesigned}
                                                                            onClick={() => updateAreaCount(floorNum, area, 1)}
                                                                            className="w-7 h-7 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 text-white font-bold"
                                                                        >+</button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="mt-6 flex flex-col gap-3 shrink-0">
                                    <button
                                        type="submit"
                                        disabled={loading || isDesigned}
                                        className={`w-full font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all mt-auto ${isDesigned ? 'bg-slate-800 text-green-400 border border-green-500/30' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'}`}
                                    >
                                        {loading && !isDesigned ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                                        {isDesigned ? 'Grid Layer Already Generated' : 'Auto-Generate Grid Layer'}
                                    </button>

                                    {isDesigned && (
                                        <button
                                            type="button"
                                            onClick={handleResetDesign}
                                            disabled={loading}
                                            className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset & Delete Entire Layout'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
