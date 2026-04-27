import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}>
            <div className="flex min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
                <Sidebar />
                <main className="flex-1 ml-64 overflow-y-auto">
                    {/* Subtle top decoration bar */}
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full sticky top-0 z-10" />
                    <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-4px)]">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
