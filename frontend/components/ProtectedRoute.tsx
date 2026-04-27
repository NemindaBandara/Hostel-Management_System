'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken, getAuthUser, isAuthenticated } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            if (!isAuthenticated()) {
                router.push(`/login?redirect=${pathname}`);
                return;
            }

            const user = getAuthUser();
            
            // First Login Intercept
            if (user?.isFirstLogin && pathname !== '/change-password') {
                router.push('/change-password');
                return;
            }

            // Role-based redirect if already at login or root but auth exists
            if (pathname === '/login') {
                if (user.role === 'SuperAdmin' || user.role === 'Admin') {
                    router.push('/dashboard');
                } else if (user.role === 'Student') {
                    router.push('/portal');
                }
                return;
            }

            // Role check
            if (allowedRoles && !allowedRoles.includes(user.role)) {
                if (user.role === 'Student') {
                    router.push('/portal');
                } else {
                    router.push('/dashboard');
                }
                return;
            }

            setIsChecking(false);
        };

        checkAuth();
    }, [pathname, router, allowedRoles]);

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
