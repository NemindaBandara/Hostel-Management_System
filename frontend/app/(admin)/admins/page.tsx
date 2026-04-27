'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, ShieldCheck, Mail, Lock, Building2, Pencil, Trash2, X, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface Hostel {
    _id: string;
    officialName: string;
    alias: string;
}

interface AdminUser {
    _id: string;
    email: string;
    name: string;
    role: string;
    managedHostelIds: Hostel[];
}

export default function ManageAdminsPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    
    // Form State
    const [adminData, setAdminData] = useState({
        email: '',
        name: '',
        password: '',
        managedHostelIds: [] as string[]
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [adminsRes, hostelsRes] = await Promise.all([
                api.get('/admin/admins'),
                api.get('/admin/hostels')
            ]);
            setAdmins(adminsRes.data);
            setHostels(hostelsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/admins', adminData);
            toast.success('Admin created successfully');
            setIsAddModalOpen(false);
            setAdminData({ email: '', name: '', password: '', managedHostelIds: [] });
            fetchData();
        } catch (error: any) {
            console.error('Error creating admin:', error);
        }
    };

    const handleUpdateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAdmin) return;
        try {
            await api.put(`/admin/admins/${selectedAdmin._id}`, {
                name: adminData.name,
                email: adminData.email
            });
            toast.success('Admin details updated');
            setIsEditModalOpen(false);
            setSelectedAdmin(null);
            fetchData();
        } catch (error) {
            console.error('Error updating admin:', error);
        }
    };

    const handleDeleteAdmin = async (admin: AdminUser) => {
        if (!window.confirm(`Are you sure you want to permanently delete Admin "${admin.name}"? This will also remove them from any assigned hostels.`)) return;
        
        try {
            await api.delete(`/admin/admins/${admin._id}`);
            toast.success('Admin deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting admin:', error);
            toast.error('Failed to delete admin');
        }
    };

    const handleToggleHostel = async (adminId: string, currentIds: string[], targetId: string) => {
        let newIds;
        if (currentIds.includes(targetId)) {
            newIds = currentIds.filter(id => id !== targetId);
        } else {
            newIds = [...currentIds, targetId];
        }
        
        try {
            await api.put(`/admin/admins/${adminId}/hostel`, { managedHostelIds: newIds });
            toast.success('Admin assignments updated');
            fetchData();
        } catch (error) {
            console.error('Error updating assignment:', error);
            toast.error('Update failed');
        }
    };

    const openEditModal = (admin: AdminUser) => {
        setSelectedAdmin(admin);
        setAdminData({
            name: admin.name || '',
            email: admin.email || '',
            password: '', // Hidden for edit
            managedHostelIds: admin.managedHostelIds?.map(h => h._id) || []
        });
        setIsEditModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manage Admins</h1>
                    <p className="text-slate-500 font-medium mt-1">Create and assign wardens to hostels</p>
                </div>
                <button
                    onClick={() => {
                        setAdminData({ email: '', name: '', password: '', managedHostelIds: [] });
                        setIsAddModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" /> Create New Admin
                </button>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Name & Email</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Assigned Hostels</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {admins.map((admin) => (
                            <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                                            {admin.name?.[0] || 'A'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 leading-none mb-1">{admin.name || 'Unnamed Admin'}</p>
                                            <p className="text-xs text-slate-500 font-medium">{admin.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {hostels.map((hostel) => {
                                            const isAssigned = admin.managedHostelIds?.some(h => h._id === hostel._id);
                                            return (
                                                <button
                                                    key={hostel._id}
                                                    onClick={() => handleToggleHostel(admin._id, admin.managedHostelIds?.map(h => h._id) || [], hostel._id)}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                                                        isAssigned 
                                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {hostel.alias || hostel.officialName.split(' ')[0]}
                                                </button>
                                            );
                                        })}
                                        {(!admin.managedHostelIds || admin.managedHostelIds.length === 0) && (
                                            <span className="text-[10px] font-bold text-slate-400 italic">None</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">Active</span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => openEditModal(admin)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                            title="Settings"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteAdmin(admin)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Admin Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">New Admin</h2>
                                <p className="text-sm font-medium text-slate-500 mt-1">Set up login credentials</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAdmin} className="p-8 space-y-5">
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={adminData.name}
                                        onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={adminData.email}
                                        onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="admin@hms.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Initial Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={adminData.password}
                                        onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Assign Hostels</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                                    {hostels.map((hostel) => (
                                        <label key={hostel._id} className="flex items-center gap-2 p-2 hover:bg-white rounded-xl cursor-pointer transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={adminData.managedHostelIds.includes(hostel._id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked 
                                                        ? [...adminData.managedHostelIds, hostel._id]
                                                        : adminData.managedHostelIds.filter(id => id !== hostel._id);
                                                    setAdminData({ ...adminData, managedHostelIds: ids });
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                                                {hostel.officialName}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-5 h-5" /> Confirm & Create
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Admin Modal (Settings) */}
            {isEditModalOpen && selectedAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Edit Admin</h2>
                                <p className="text-sm font-medium text-slate-500 mt-1">Update profile information</p>
                            </div>
                            <button onClick={() => { setIsEditModalOpen(false); setSelectedAdmin(null); }} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateAdmin} className="p-8 space-y-5">
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={adminData.name}
                                        onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={adminData.email}
                                        onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="admin@hms.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-2 ml-1 uppercase tracking-wider">Assigned Hostels</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                                    {hostels.map((hostel) => (
                                        <label key={hostel._id} className="flex items-center gap-2 p-2 hover:bg-white rounded-xl cursor-pointer transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={adminData.managedHostelIds.includes(hostel._id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked 
                                                        ? [...adminData.managedHostelIds, hostel._id]
                                                        : adminData.managedHostelIds.filter(id => id !== hostel._id);
                                                    setAdminData({ ...adminData, managedHostelIds: ids });
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                                                {hostel.officialName}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" /> Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
