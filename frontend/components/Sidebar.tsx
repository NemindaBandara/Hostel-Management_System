'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Building2, Users, Settings, LogOut, GraduationCap, ShieldCheck, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';
import { clearAuthData, getAuthUser } from '@/lib/auth';
import ConfirmationModal from './ConfirmationModal';
import SettingsModal from './modals/SettingsModal';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = getAuthUser();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Hostel Design', icon: Building2, path: '/hostel-design', roles: ['SuperAdmin'] },
        { name: 'Student Mgmt', icon: Users, path: '/students', roles: ['SuperAdmin', 'Admin'] },
        { name: 'Maintenance', icon: Settings, path: '/reports', roles: ['SuperAdmin', 'Admin'] },
        { name: 'Faculties', icon: GraduationCap, path: '/faculty', roles: ['SuperAdmin'] },
        { name: 'Manage Admins', icon: ShieldCheck, path: '/admins', roles: ['SuperAdmin'] },
    ];

    const handleLogout = () => {
        clearAuthData();
        router.push('/login');
    };

    const filteredMenuItems = menuItems.filter(item => !item.roles || item.roles.includes(user?.role));

    return (
        <aside className="w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-20 flex flex-col shadow-sm">
            <div className="p-8">
                <div className="flex items-center gap-3 px-2 mb-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black text-slate-800 tracking-tight block leading-none">HMS</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Admin Panel</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {filteredMenuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100/50"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={clsx(
                                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            {item.name}
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="mb-4 px-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                    <p className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">{user?.role}</p>
                </div>
                <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="flex-1 flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
                    >
                        <Settings className="w-5 h-5 text-slate-400" />
                        Settings
                    </button>
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title="Sign Out"
                message="Are you sure you want to sign out? You will need to log in again to access the admin panel."
                confirmText="Sign Out"
                variant="danger"
            />

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                user={{
                    name: user?.name,
                    email: user?.email || ''
                }}
            />
        </aside>
    );
}
