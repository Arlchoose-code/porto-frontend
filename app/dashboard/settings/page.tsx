"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Settings } from "@/lib/types";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Settings2, Loader2, Save, Globe, Search,
    BarChart2, Eye, EyeOff, Mail, AlertTriangle,
    Twitter, Image, FileText, Upload, X
} from "lucide-react";
import { useRef } from "react";
import { useSettings } from "@/components/shared/settings-provider";

export default function SettingsPage() {
    const { refresh } = useSettings();
    const [settings, setSettings] = useState<Settings>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);

    const uploadImage = async (file: File, key: keyof Settings) => {
        setUploadingKey(key);
        try {
            const { compressImage } = await import("@/lib/compress-image");
            const compressed = await compressImage(file);
            const formData = new FormData();
            formData.append("file", compressed);
            formData.append("folder", "settings");
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const url = res.data.data?.url || res.data.url;
            if (url) set(key, url);
            toast.success("Gambar berhasil diupload!");
        } catch {
            toast.error("Gagal upload gambar");
        } finally {
            setUploadingKey(null);
        }
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get("/settings");
                setSettings(res.data.data || {});
            } catch {
                toast.error("Gagal memuat settings");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const set = (key: keyof Settings, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const toggle = (key: keyof Settings) => {
        setSettings((prev) => ({
            ...prev,
            [key]: prev[key] === "true" ? "false" : "true",
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put("/settings", { settings });
            toast.success("Settings berhasil disimpan!");
            refresh(); // update global context → sidebar, favicon, analytics langsung apply
        } catch {
            toast.error("Gagal menyimpan settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="w-8 h-8 text-blue-500" />
                </motion.div>
            </div>
        );
    }

    const visibilityItems: { key: keyof Settings; label: string }[] = [
        { key: "show_blog", label: "Blog" },
        { key: "show_projects", label: "Projects" },
        { key: "show_tools", label: "Tools" },
        { key: "show_bookmarks", label: "Bookmarks" },
        { key: "show_experiences", label: "Experiences" },
        { key: "show_educations", label: "Educations" },
        { key: "show_courses", label: "Courses" },
        { key: "show_skills", label: "Skills" },
        { key: "show_contact", label: "Contact" },
    ];

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 shrink-0" />
                        Settings
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Konfigurasi tampilan dan SEO website kamu</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button
                        type="submit" form="settings-form" disabled={saving}
                        size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                        {saving
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
                            : <><Save className="w-3.5 h-3.5" /> Simpan Settings</>
                        }
                    </Button>
                </motion.div>
            </div>

            <form id="settings-form" onSubmit={handleSubmit} className="space-y-4">

                {/* Card 1: Site */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                            <Globe className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Informasi Website</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Site Title</Label>
                            <Input placeholder="My Portfolio"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.site_title || ""} onChange={(e) => set("site_title", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Site Name <span className="text-gray-400">(dipakai di navbar)</span></Label>
                            <Input placeholder="Arlchoose"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.site_name || ""} onChange={(e) => set("site_name", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Site Author</Label>
                            <Input placeholder="John Doe"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.site_author || ""} onChange={(e) => set("site_author", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Site URL</Label>
                            <Input placeholder="https://example.com"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.site_url || ""} onChange={(e) => set("site_url", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Site Language</Label>
                            <Input placeholder="id"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.site_language || ""} onChange={(e) => set("site_language", e.target.value)} />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Site Description <span className="text-gray-400">(untuk SEO & OG meta tag)</span>
                            </Label>
                            <Textarea placeholder="Deskripsi singkat untuk mesin pencari dan social preview..." rows={2}
                                className="text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
                                value={settings.site_description || ""} onChange={(e) => set("site_description", e.target.value)} />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Home Description <span className="text-gray-400">(tampil di halaman utama)</span>
                            </Label>
                            <Textarea placeholder="Deskripsi yang tampil di hero section halaman home..." rows={2}
                                className="text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
                                value={settings.home_description || ""} onChange={(e) => set("home_description", e.target.value)} />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Keywords</Label>
                            <Input placeholder="portfolio, developer, react, golang"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.site_keywords || ""} onChange={(e) => set("site_keywords", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Logo</Label>
                            <div className="flex items-center gap-2">
                                {settings.logo_url && (
                                    <div className="relative w-9 h-9 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                                        <img src={settings.logo_url} alt="logo" className="w-full h-full object-contain" />
                                        <button type="button" onClick={() => set("logo_url", "")} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"><X className="w-2.5 h-2.5" /></button>
                                    </div>
                                )}
                                <label className="flex-1 flex items-center gap-2 px-3 h-9 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-blue-400 transition-colors text-xs text-gray-400">
                                    {uploadingKey === "logo_url" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    {uploadingKey === "logo_url" ? "Uploading..." : (settings.logo_url ? "Ganti logo" : "Upload logo")}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "logo_url"); }} />
                                </label>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Theme Color</Label>
                            <div className="flex items-center gap-2">
                                <input type="color"
                                    className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer p-1"
                                    value={settings.theme_color || "#3b82f6"}
                                    onChange={(e) => set("theme_color", e.target.value)} />
                                <Input placeholder="#3b82f6"
                                    className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    value={settings.theme_color || ""} onChange={(e) => set("theme_color", e.target.value)} />
                            </div>
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Footer Text</Label>
                            <Input placeholder="© 2026 John Doe. All rights reserved."
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.footer_text || ""} onChange={(e) => set("footer_text", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Contact Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <Input type="email" placeholder="contact@example.com"
                                    className="pl-8 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    value={settings.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Card 2: SEO / OG */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.13 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
                            <Search className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">SEO & Open Graph</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">OG Type</Label>
                            <Input placeholder="website"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.og_type || ""} onChange={(e) => set("og_type", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">OG Locale</Label>
                            <Input placeholder="id_ID"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.og_locale || ""} onChange={(e) => set("og_locale", e.target.value)} />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">OG Image</Label>
                            <div className="flex items-center gap-2">
                                {settings.og_image && (
                                    <div className="relative w-16 h-9 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                                        <img src={settings.og_image} alt="og" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => set("og_image", "")} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"><X className="w-2.5 h-2.5" /></button>
                                    </div>
                                )}
                                <label className="flex-1 flex items-center gap-2 px-3 h-9 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-violet-400 transition-colors text-xs text-gray-400">
                                    {uploadingKey === "og_image" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    {uploadingKey === "og_image" ? "Uploading..." : (settings.og_image ? "Ganti OG image" : "Upload OG image")}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "og_image"); }} />
                                </label>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Twitter Handle</Label>
                            <div className="relative">
                                <Twitter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <Input placeholder="@johndoe"
                                    className="pl-8 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    value={settings.twitter_handle || ""} onChange={(e) => set("twitter_handle", e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Favicon</Label>
                            <div className="flex items-center gap-2">
                                {settings.favicon_url && (
                                    <div className="relative w-9 h-9 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                                        <img src={settings.favicon_url} alt="favicon" className="w-full h-full object-contain" />
                                        <button type="button" onClick={() => set("favicon_url", "")} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"><X className="w-2.5 h-2.5" /></button>
                                    </div>
                                )}
                                <label className="flex-1 flex items-center gap-2 px-3 h-9 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-violet-400 transition-colors text-xs text-gray-400">
                                    {uploadingKey === "favicon_url" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    {uploadingKey === "favicon_url" ? "Uploading..." : (settings.favicon_url ? "Ganti favicon" : "Upload favicon")}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "favicon_url"); }} />
                                </label>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Card 3: Analytics */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                            <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Analytics & Tracking</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Google Analytics ID</Label>
                            <Input placeholder="G-XXXXXXXXXX"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.google_analytics || ""} onChange={(e) => set("google_analytics", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Facebook Pixel ID</Label>
                            <Input placeholder="1234567890"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.facebook_pixel || ""} onChange={(e) => set("facebook_pixel", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Hotjar ID</Label>
                            <Input placeholder="1234567"
                                className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                value={settings.hotjar_id || ""} onChange={(e) => set("hotjar_id", e.target.value)} />
                        </div>
                    </div>
                </motion.div>

                {/* Card 4: Visibility */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.23 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-sky-500" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Visibilitas Halaman</h2>
                        <span className="text-xs text-gray-400 dark:text-gray-500">— tampilkan/sembunyikan section di portfolio</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {visibilityItems.map(({ key, label }) => {
                            const isOn = settings[key] === "true";
                            return (
                                <motion.button
                                    key={key} type="button"
                                    onClick={() => toggle(key)}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                        isOn
                                            ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                                    }`}
                                >
                                    <span>{label}</span>
                                    <div className={`w-8 h-4 rounded-full transition-all relative ${
                                        isOn ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                                    }`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${
                                            isOn ? "left-4" : "left-0.5"
                                        }`} />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Card 5: Maintenance */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                    className={`border rounded-2xl p-5 space-y-4 transition-colors ${
                        settings.maintenance_mode === "true"
                            ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50"
                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                settings.maintenance_mode === "true" ? "bg-amber-500/20" : "bg-amber-500/10"
                            }`}>
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Maintenance Mode</h2>
                        </div>
                        <motion.button
                            type="button"
                            onClick={() => toggle("maintenance_mode")}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                settings.maintenance_mode === "true"
                                    ? "bg-amber-500 border-amber-500 text-white"
                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            {settings.maintenance_mode === "true"
                                ? <><EyeOff className="w-3 h-3" /> Aktif</>
                                : <><Eye className="w-3 h-3" /> Nonaktif</>
                            }
                        </motion.button>
                    </div>

                    {settings.maintenance_mode === "true" && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-1.5"
                        >
                            <Label className="text-xs font-medium text-amber-700 dark:text-amber-400">Pesan Maintenance</Label>
                            <Textarea
                                placeholder="Website sedang dalam perbaikan. Silakan kunjungi kembali nanti."
                                rows={2}
                                className="text-sm bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700/50 resize-none"
                                value={settings.maintenance_message || ""}
                                onChange={(e) => set("maintenance_message", e.target.value)}
                            />
                        </motion.div>
                    )}

                    {settings.maintenance_mode !== "true" && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Aktifkan untuk menampilkan halaman maintenance ke pengunjung website.
                        </p>
                    )}
                </motion.div>

            </form>
        </div>
    );
}