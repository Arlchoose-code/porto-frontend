"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/shared/sidebar";
import Footer from "@/components/shared/footer";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GenerateIndicator from "@/components/shared/generate-indicator";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            setChecking(false);
        }
    }, [router]);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-8 h-8 text-blue-500" />
                </motion.div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <Sidebar />
        <div className="lg:pl-60 transition-all duration-300 flex flex-col min-h-screen">
            <div className="lg:hidden h-14 shrink-0" />
            <AnimatePresence mode="wait">
                <motion.main
                    key={pathname}
                    className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-screen-xl w-full mx-auto"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                    {children}
                </motion.main>
            </AnimatePresence>
            <Footer />
        </div>
        <GenerateIndicator /> {/* ← tambah ini */}
    </div>
);
}