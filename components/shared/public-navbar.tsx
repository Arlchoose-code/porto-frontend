"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X } from "lucide-react";
import { Settings } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/components/shared/settings-provider";

interface PublicNavbarProps {
    settings: Settings;
}

const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Project", href: "/projects", settingKey: "show_projects" },
    { label: "Blog", href: "/blog", settingKey: "show_blog" },
    { label: "Bookmark", href: "/bookmarks", settingKey: "show_bookmarks" },
    { label: "Contact", href: "/contact", settingKey: "show_contact" },
    { label: "Tools", href: "/tools", settingKey: "show_tools" },
];

export default function PublicNavbar({ settings: settingsProp }: PublicNavbarProps) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { settings: settingsCtx } = useSettings();

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { setMobileOpen(false); }, [pathname]);
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    // Pakai context kalau sudah load (real-time), fallback ke props (SSR)
    const settings = Object.keys(settingsCtx).length > 0 ? settingsCtx : settingsProp;
    const siteName = settings.site_title || "Portfolio";
    const logoUrl = settings.logo_url;

    const visibleLinks = navLinks.filter((link) => {
        if (!link.settingKey) return true;
        const val = settings[link.settingKey as keyof Settings];
        return val === undefined || val === null || val === "" || val === "true";
    });

    return (
        <>
            <nav className={`relative z-50 transition-colors duration-200 lg:bg-transparent ${mobileOpen ? "bg-background" : "bg-transparent"}`}>
                <div className="max-w-6xl mx-auto px-8 sm:px-16">
                    <div className="flex items-center justify-between h-20">

                        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
                            {logoUrl ? (
                                <>
                                    <Image src={logoUrl} alt={siteName} width={32} height={32} className="rounded-md object-contain dark:invert" />
                                    <span className="text-xl font-bold text-foreground group-hover:opacity-70 transition-opacity">{siteName}</span>
                                </>
                            ) : (
                                <span className="text-xl font-bold text-foreground group-hover:opacity-70 transition-opacity">{siteName}</span>
                            )}
                        </Link>

                        {/* Desktop */}
                        <div className="hidden lg:flex items-center gap-0">
                            {mounted ? (
                                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="p-2 mr-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle theme">
                                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>
                            ) : <div className="w-10 h-10 mr-2" />}

                            {visibleLinks.map((link) => (
                                <Link key={link.href} href={link.href}
                                    className={`px-1.5 py-1.5 rounded-md text-base font-medium transition-all duration-150 ${
                                        isActive(link.href) ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                                    }`}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Mobile */}
                        <div className="flex lg:hidden items-center gap-1">
                            {mounted ? (
                                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle theme">
                                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                </button>
                            ) : <div className="w-8 h-8" />}

                            <button onClick={() => setMobileOpen((prev) => !prev)}
                                className="relative w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle menu">
                                <span className={`absolute transition-all duration-200 ${mobileOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}>
                                    <X className="w-5 h-5" />
                                </span>
                                <span className={`absolute transition-all duration-200 ${mobileOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`}>
                                    <Menu className="w-5 h-5" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div key="overlay" className="fixed inset-0 z-40 lg:hidden"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }} onClick={() => setMobileOpen(false)} />

                        <motion.div key="drawer" className="fixed top-20 left-0 right-0 z-50 lg:hidden bg-background border-b border-border shadow-sm"
                            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}>
                            <div className="max-w-6xl mx-auto px-8 sm:px-16 py-4 flex flex-col gap-0.5">
                                {visibleLinks.map((link, i) => (
                                    <motion.div key={link.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.035, duration: 0.2, ease: "easeOut" }}>
                                        <Link href={link.href}
                                            className={`block px-3 py-2.5 rounded-md text-base font-medium transition-colors duration-150 ${
                                                isActive(link.href) ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                                            }`}>
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}