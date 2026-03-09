import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Hostel Management System',
    description: 'Manage hostels, students, and assets efficiently.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            zIndex: 99999, // Ensure it's above modals
                        },
                    }}
                />
                {children}
            </body>
        </html>
    );
}
