"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Profile } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    User, Loader2, Save, Github, Linkedin,
    Twitter, Instagram, Mail, Phone, MapPin, FileText,
    Link2, Camera, ExternalLink
} from "lucide-react";

export default function ProfilePage() {
    const [profile, setProfile] = useState<Partial<Profile>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeFileName, setResumeFileName] = useState<string | null>(null);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);
    const prevAvatarUrlRef = useRef<string | null>(null);

    // Cleanup object URL on unmount
    useEffect(() => {
        return () => { if (prevAvatarUrlRef.current) URL.revokeObjectURL(prevAvatarUrlRef.current); };
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get("/profile");
                setProfile(res.data.data || {});
            } catch {
                // profile belum ada
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (field: keyof Profile, value: string) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        if (prevAvatarUrlRef.current) URL.revokeObjectURL(prevAvatarUrlRef.current);
        const { compressImage } = await import("@/lib/compress-image");
        const compressed = await compressImage(file);
        const url = URL.createObjectURL(compressed);
        prevAvatarUrlRef.current = url;
        setAvatarFile(compressed);
        setAvatarPreview(url);
    };

    const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setResumeFile(file);
        setResumeFileName(file.name);
        e.target.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", profile.name || "");
            formData.append("tagline", profile.tagline || "");
            formData.append("bio", profile.bio || "");
            formData.append("github", profile.github || "");
            formData.append("linkedin", profile.linkedin || "");
            formData.append("twitter", profile.twitter || "");
            formData.append("instagram", profile.instagram || "");
            formData.append("email", profile.email || "");
            formData.append("phone", profile.phone || "");
            formData.append("location", profile.location || "");
            if (avatarFile) formData.append("avatar", avatarFile);
            if (resumeFile) formData.append("resume", resumeFile);

            const res = await api.put("/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setProfile(res.data.data);
            setAvatarFile(null);
            setResumeFile(null);
            setResumeFileName(null);
            toast.success("Profile berhasil disimpan!");
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            const errors = err.response?.data?.errors;
            if (errors) toast.error(Object.values(errors)[0] as string);
            else toast.error("Gagal menyimpan profile");
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

    const displayAvatar = avatarPreview || profile.avatar;

    const socialLinks = [
        {
            id: "github" as keyof Profile,
            label: "GitHub",
            icon: Github,
            placeholder: "https://github.com/username",
            iconColor: "text-gray-600 dark:text-gray-300",
            iconBg: "bg-gray-200/80 dark:bg-gray-700",
        },
        {
            id: "linkedin" as keyof Profile,
            label: "LinkedIn",
            icon: Linkedin,
            placeholder: "https://linkedin.com/in/username",
            iconColor: "text-blue-600 dark:text-blue-400",
            iconBg: "bg-blue-100 dark:bg-blue-500/20",
        },
        {
            id: "twitter" as keyof Profile,
            label: "Twitter / X",
            icon: Twitter,
            placeholder: "https://twitter.com/username",
            iconColor: "text-sky-500 dark:text-sky-400",
            iconBg: "bg-sky-100 dark:bg-sky-500/20",
        },
        {
            id: "instagram" as keyof Profile,
            label: "Instagram",
            icon: Instagram,
            placeholder: "https://instagram.com/username",
            iconColor: "text-pink-500 dark:text-pink-400",
            iconBg: "bg-pink-100 dark:bg-pink-500/20",
        },
    ];

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 shrink-0" />
                        Profile
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola informasi profil publik kamu</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button
                        type="submit" form="profile-form" disabled={saving}
                        size="sm"
                        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                        {saving
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
                            : <><Save className="w-3.5 h-3.5" /> Simpan Profile</>
                        }
                    </Button>
                </motion.div>
            </div>

            <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">

                {/* Card 1: Avatar + Info Dasar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden"
                >
                    {/* Banner */}
                    <div className="h-16 bg-gradient-to-r from-blue-500/80 via-violet-500/80 to-pink-500/80 dark:from-blue-600/60 dark:via-violet-600/60 dark:to-pink-600/60" />

                    <div className="px-5 pb-5">
                        {/* Avatar overlapping banner */}
                        <div className="flex items-end gap-3 -mt-8 mb-4">
                            <div className="relative shrink-0">
                                <motion.div
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="w-16 h-16 rounded-xl border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800 shadow cursor-pointer flex items-center justify-center"
                                >
                                    {displayAvatar ? (
                                        <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                                    )}
                                </motion.div>
                                <motion.button
                                    type="button" whileTap={{ scale: 0.85 }}
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow border-2 border-white dark:border-gray-900 transition-colors"
                                >
                                    <Camera className="w-2.5 h-2.5" />
                                </motion.button>
                            </div>
                            <div className="pb-0.5 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                                    {profile.name || <span className="text-gray-400 dark:text-gray-500 font-normal">Nama belum diisi</span>}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {profile.tagline || <span className="text-gray-400 dark:text-gray-500">Tagline belum diisi</span>}
                                </p>
                                <AnimatePresence>
                                    {avatarFile && (
                                        <motion.p initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="text-xs text-blue-500 mt-0.5 truncate">
                                            ✓ {avatarFile.name}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Nama <span className="text-red-400">*</span>
                                </Label>
                                <Input required placeholder="John Doe"
                                    className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    value={profile.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tagline</Label>
                                <Input placeholder="Full Stack Developer"
                                    className="h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    value={profile.tagline || ""} onChange={(e) => handleChange("tagline", e.target.value)} />
                            </div>
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Bio</Label>
                                <Textarea placeholder="Ceritakan sedikit tentang dirimu..." rows={3}
                                    className="text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
                                    value={profile.bio || ""} onChange={(e) => handleChange("bio", e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </motion.div>

                {/* Card 2: Kontak */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.13 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                            <Mail className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Kontak</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <Input type="email" placeholder="john@example.com"
                                    className="pl-8 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    value={profile.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nomor HP</Label>
                            <div className="relative">
                                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <Input placeholder="+62 812 3456 7890"
                                    className="pl-8 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    value={profile.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Lokasi</Label>
                            <div className="relative">
                                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <Input placeholder="Jakarta, Indonesia"
                                    className="pl-8 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    value={profile.location || ""} onChange={(e) => handleChange("location", e.target.value)} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Card 3: Sosial Media */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
                            <Link2 className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Sosial Media</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {socialLinks.map(({ id, label, icon: Icon, placeholder, iconColor, iconBg }) => (
                            <div key={id} className="space-y-1.5">
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</Label>
                                <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 dark:focus-within:border-blue-600 transition-all">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${iconBg}`}>
                                        <Icon className={`w-3 h-3 ${iconColor}`} />
                                    </div>
                                    <input
                                        placeholder={placeholder}
                                        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none min-w-0"
                                        value={(profile[id] as string) || ""}
                                        onChange={(e) => handleChange(id, e.target.value)}
                                    />
                                    {profile[id] && (
                                        <a href={profile[id] as string} target="_blank" rel="noopener noreferrer"
                                            className="shrink-0 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Card 4: Resume */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.23 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Resume / CV</h2>
                    </div>

                    <motion.div
                        onClick={() => resumeInputRef.current?.click()}
                        whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.998 }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-all group ${
                            resumeFileName
                                ? "border-emerald-400/60 dark:border-emerald-600/60 bg-emerald-50 dark:bg-emerald-900/10"
                                : "border-gray-200 dark:border-gray-700 hover:border-blue-400/60 dark:hover:border-blue-600/60 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                        }`}
                    >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            resumeFileName
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : "bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                        }`}>
                            <FileText className={`w-4 h-4 transition-colors ${
                                resumeFileName ? "text-emerald-500" : "text-gray-400 dark:text-gray-500 group-hover:text-blue-500"
                            }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                                resumeFileName
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-gray-700 dark:text-gray-300"
                            }`}>
                                {resumeFileName
                                    ? resumeFileName
                                    : profile.resume_url
                                        ? "Resume sudah diupload — klik untuk ganti"
                                        : "Klik untuk upload resume"}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {resumeFileName ? "File baru siap diupload" : "Format: PDF. Maks 5MB."}
                            </p>
                        </div>
                        {profile.resume_url && !resumeFileName && (
                            <a href={profile.resume_url} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <ExternalLink className="w-3 h-3" /> Lihat
                            </a>
                        )}
                    </motion.div>

                    <input ref={resumeInputRef} type="file" accept=".pdf" className="hidden" onChange={handleResumeChange} />
                </motion.div>

            </form>
        </div>
    );
}