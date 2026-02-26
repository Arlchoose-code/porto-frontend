"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSettings } from "@/components/shared/settings-provider";
import { useSidebar } from "@/components/shared/sidebar-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, FileText, FolderOpen, Wrench,
    Bookmark, Mail, Star, GraduationCap, Briefcase,
    BookOpen, Tag, User, Settings2, LogOut,
    Sun, Moon, Menu, X, ChevronLeft, User2
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Blogs", href: "/dashboard/blogs", icon: FileText },
    { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
    { label: "Skills", href: "/dashboard/skills", icon: Star },
    { label: "Experiences", href: "/dashboard/experiences", icon: Briefcase },
    { label: "Educations", href: "/dashboard/educations", icon: GraduationCap },
    { label: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { label: "Bookmarks", href: "/dashboard/bookmarks", icon: Bookmark },
    { label: "Contacts", href: "/dashboard/contacts", icon: Mail },
    { label: "Tags", href: "/dashboard/tags", icon: Tag },
    { label: "Tools", href: "/dashboard/tools", icon: Wrench },
    { label: "Profile", href: "/dashboard/profile", icon: User },
    { label: "Users", href: "/dashboard/users", icon: User2 },
    { label: "Settings", href: "/dashboard/settings", icon: Settings2 },
];

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { settings } = useSettings();
    const { collapsed, toggle } = useSidebar();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    useEffect(() => { setMobileOpen(false); }, [pathname]);
    useEffect(() => {
        const handleResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    const isActive = (item: typeof navItems[0]) => {
        if (item.exact) return pathname === item.href;
        return pathname.startsWith(item.href);
    };

    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col h-full">

                {/* LOGO AREA */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">

                    {/* Saat collapsed di desktop: seluruh area jadi tombol expand, logo di tengah */}
                    {!isMobile && collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.button
                                    onClick={toggle}
                                    className="flex items-center justify-center w-full h-full hover:opacity-70 transition-opacity"
                                    whileTap={{ scale: 0.9 }}
                                    title="Expand sidebar"
                                >
                                    {settings.logo_url ? (
                                        <img src={settings.logo_url} alt="Logo" className="w-6 h-6 rounded object-contain" />
                                    ) : (
                                        <LayoutDashboard className="w-5 h-5 text-blue-500" />
                                    )}
                                </motion.button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Expand sidebar</TooltipContent>
                        </Tooltip>
                    ) : (
                        /* Saat expanded (desktop & mobile): logo + nama + chevron di kanan */
                        <>
                            <div className="flex items-center gap-2 overflow-hidden min-w-0">
                                {settings.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-6 h-6 rounded object-contain shrink-0" />
                                ) : (
                                    <LayoutDashboard className="w-5 h-5 text-blue-500 shrink-0" />
                                )}
                                <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                    {settings.site_title || "Dashboard"}
                                </span>
                            </div>
                            {/* Chevron hanya di desktop */}
                            {!isMobile && (
                                <motion.button
                                    onClick={toggle}
                                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                                    whileTap={{ scale: 0.85 }}
                                    title="Collapse sidebar"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </motion.button>
                            )}
                        </>
                    )}
                </div>

                {/* NAV ITEMS */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                    {navItems.map((item, index) => {
                        const active = isActive(item);
                        return (
                            <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03, duration: 0.25 }}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                                                collapsed && !isMobile
                                                    ? "justify-center px-0 py-2.5"
                                                    : "gap-3 px-3 py-2.5"
                                            } ${
                                                active
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                                            }`}
                                        >
                                            {active && (
                                                <motion.span
                                                    layoutId="activeSidebar"
                                                    className="absolute inset-0 bg-blue-600 rounded-lg"
                                                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                                                />
                                            )}
                                            <motion.div className="relative z-10 shrink-0" whileHover={{ scale: 1.1 }} transition={{ duration: 0.15 }}>
                                                <item.icon className="w-4 h-4" />
                                            </motion.div>
                                            <AnimatePresence mode="wait">
                                                {(!collapsed || isMobile) && (
                                                    <motion.span
                                                        className="relative z-10 truncate"
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: "auto" }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        {item.label}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </Link>
                                    </TooltipTrigger>
                                    {collapsed && !isMobile && (
                                        <TooltipContent side="right">{item.label}</TooltipContent>
                                    )}
                                </Tooltip>
                            </motion.div>
                        );
                    })}
                </nav>

                {/* BOTTOM ACTIONS — saat tidak collapsed atau mobile */}
                {(!collapsed || isMobile) && (
                    <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-2 space-y-0.5">
                        {mounted && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <motion.button
                                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <AnimatePresence mode="wait" initial={false}>
                                            {theme === "dark" ? (
                                                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                                                    <Sun className="w-4 h-4" />
                                                </motion.div>
                                            ) : (
                                                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                                                    <Moon className="w-4 h-4" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <span className="truncate">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                                    </motion.button>
                                </TooltipTrigger>
                            </Tooltip>
                        )}
                        <motion.button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ x: 2 }}
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span className="truncate">Logout</span>
                        </motion.button>
                    </div>
                )}

                {/* BOTTOM ACTIONS saat collapsed desktop — hanya icon */}
                {!isMobile && collapsed && (
                    <div className="shrink-0 p-2 space-y-0.5">
                        {mounted && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <motion.button
                                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                        className="w-full flex items-center justify-center p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                    </motion.button>
                                </TooltipTrigger>
                                <TooltipContent side="right">{theme === "dark" ? "Light Mode" : "Dark Mode"}</TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <LogOut className="w-4 h-4" />
                                </motion.button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Logout</TooltipContent>
                        </Tooltip>
                    </div>
                )}

            </div>
        </TooltipProvider>
    );

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <motion.aside
                className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-colors duration-300"
                animate={{ width: collapsed ? 64 : 240 }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
            >
                <SidebarContent />
            </motion.aside>

            {/* MOBILE TOP BAR */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 transition-colors duration-300">
                <div className="flex items-center gap-2">
                    {settings.logo_url ? (
                        <img src={settings.logo_url} alt="Logo" className="w-6 h-6 rounded object-contain shrink-0" />
                    ) : (
                        <LayoutDashboard className="w-5 h-5 text-blue-500 shrink-0" />
                    )}
                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[160px]">
                        {settings.site_title || "Dashboard"}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {mounted && (
                        <motion.button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            whileTap={{ scale: 0.85 }}
                        >
                            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </motion.button>
                    )}
                    <motion.button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        whileTap={{ scale: 0.85 }}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </motion.button>
                </div>
            </div>

            {/* MOBILE OVERLAY */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* MOBILE DRAWER */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.aside
                        className="lg:hidden fixed left-0 top-14 bottom-0 w-64 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden"
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", bounce: 0.1, duration: 0.35 }}
                    >
                        <SidebarContent isMobile />
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}