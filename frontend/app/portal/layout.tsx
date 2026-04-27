'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Map, User, LogOut, Menu, X, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { clearAuthData, getAuthUser } from '@/lib/auth';
import ConfirmationModal from '@/components/ConfirmationModal';
import SettingsModal from '@/components/modals/SettingsModal';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = getAuthUser();
        setUser(currentUser);
    }, []);

    const navItems = [
        { name: 'Home', href: '/portal', icon: Home },
        { name: 'Explorer', href: '/portal/explorer', icon: Map },
        { name: 'My Room', href: '/portal/my-room', icon: User },
    ];

    const isActive = (href: string) => pathname === href;

    const handleLogout = () => {
        clearAuthData();
        router.push('/login');
    };

    return (
        <ProtectedRoute allowedRoles={['Student', 'SuperAdmin', 'Admin']}>
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16 items-center">
                            <div className="flex items-center gap-2">
                                <Link href="/" className="flex items-center gap-2 group">
                                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                        <Home className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-lg font-black tracking-tight text-slate-800">
                                        <span className="text-blue-600">HMS</span> Portal
                                    </span>
                                </Link>
                            </div>

                            {/* Desktop Nav */}
                            <div className="hidden md:flex items-center gap-4">
                                <nav className="flex items-center gap-1">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                                    isActive(item.href)
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </nav>
                                <div className="h-6 w-[1px] bg-slate-200" />
                                <button 
                                    onClick={() => setIsSettingsModalOpen(true)}
                                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                                    title="Settings"
                                >
                                    <Settings className="w-5 h-5 text-slate-400" />
                                </button>
                                <button 
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="md:hidden flex items-center gap-2">
                                <button 
                                    onClick={() => setIsSettingsModalOpen(true)}
                                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    <Settings className="w-5 h-5 text-slate-400" />
                                </button>
                                <button 
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                                >
                                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Nav */}
                    {isMenuOpen && (
                        <div className="md:hidden bg-white border-b border-slate-100 animate-in slide-in-from-top-4 duration-300">
                            <div className="px-4 pt-2 pb-6 space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                                                isActive(item.href)
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-slate-500'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </header>

                <main className="flex-1 flex flex-col">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-slate-200 py-8">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-slate-400 text-sm font-medium">
                            &copy; 2026 HMS Student Portal. All rights reserved.
                        </p>
                    </div>
                </footer>

                <ConfirmationModal
                    isOpen={isLogoutModalOpen}
                    onClose={() => setIsLogoutModalOpen(false)}
                    onConfirm={handleLogout}
                    title="Sign Out"
                    message="Are you sure you want to sign out from the portal?"
                    confirmText="Sign Out"
                    variant="danger"
                />

                {user && (
                    <SettingsModal
                        isOpen={isSettingsModalOpen}
                        onClose={() => setIsSettingsModalOpen(false)}
                        user={{
                            name: user.name,
                            email: user.email
                        }}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}
