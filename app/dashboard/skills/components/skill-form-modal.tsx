"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Skill } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Loader2, Upload, Star, Code2, Database, Wrench, Layers, Sparkles } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    skill: Skill | null;
}

const CATEGORIES = [
    { value: "language",  label: "Language",  icon: Code2,    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-400/40" },
    { value: "framework", label: "Framework", icon: Layers,   color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-400/40" },
    { value: "database",  label: "Database",  icon: Database, color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-400/40" },
    { value: "tool",      label: "Tool",      icon: Wrench,   color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400/40" },
    { value: "other",     label: "Other",     icon: Sparkles, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-400/40" },
];

const LEVELS = [
    { value: "beginner",     label: "Beginner",     pct: 25, color: "bg-gray-400" },
    { value: "intermediate", label: "Intermediate", pct: 50, color: "bg-blue-500" },
    { value: "advanced",     label: "Advanced",     pct: 75, color: "bg-violet-500" },
    { value: "expert",       label: "Expert",       pct: 100, color: "bg-emerald-500" },
];

export default function SkillFormModal({ open, onClose, onSuccess, skill }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: "", category: "", level: "", order: 0 });
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            if (skill) {
                setForm({
                    name: skill.name || "",
                    category: skill.category || "",
                    level: skill.level || "",
                    order: skill.order || 0,
                });
                setIconPreview(skill.icon_url || "");
            } else {
                setForm({ name: "", category: "", level: "", order: 0 });
                setIconPreview("");
            }
            setIconFile(null);
        }
    }, [skill, open]);

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIconFile(file);
            setIconPreview(URL.createObjectURL(file));
        }
        e.target.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category) { toast.error("Pilih category dulu"); return; }
        if (!form.level) { toast.error("Pilih level dulu"); return; }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("category", form.category);
            formData.append("level", form.level);
            formData.append("order", String(form.order));
            if (iconFile) formData.append("icon", iconFile);

            if (skill) {
                await api.put(`/skills/${skill.id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Skill diperbarui!");
            } else {
                await api.post("/skills", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Skill ditambahkan!");
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Gagal menyimpan skill");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const selectedLevel = LEVELS.find((l) => l.value === form.level);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.97 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        className="relative w-full sm:max-w-[460px] bg-white dark:bg-gray-950 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-gray-200/80 dark:border-gray-800"
                    >
                        {/* Top accent */}
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                    <Star className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm leading-none">
                                        {skill ? "Edit Skill" : "Skill Baru"}
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {skill ? "Perbarui data skill" : "Tambah ke portfolio"}
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="overflow-y-auto max-h-[68vh] sm:max-h-[62vh] px-6 space-y-5 pb-2">

                                {/* Icon + Name row */}
                                <div className="flex items-end gap-3">
                                    {/* Icon upload */}
                                    <div className="shrink-0">
                                        <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">Icon</Label>
                                        <motion.button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 flex items-center justify-center overflow-hidden transition-colors group"
                                        >
                                            {iconPreview ? (
                                                <img src={iconPreview} alt="" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <Upload className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-violet-400 transition-colors" />
                                            )}
                                        </motion.button>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            Nama <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
                                        </Label>
                                        <Input
                                            value={form.name}
                                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                            placeholder="Contoh: React, TypeScript..."
                                            required
                                            className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-violet-400 dark:focus:border-violet-600 text-sm rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Category <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map(({ value, label, icon: Icon, color }) => {
                                            const active = form.category === value;
                                            return (
                                                <motion.button
                                                    key={value}
                                                    type="button"
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setForm((f) => ({ ...f, category: active ? "" : value }))}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                                        active
                                                            ? `${color} shadow-sm`
                                                            : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-700"
                                                    }`}
                                                >
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {label}
                                                    {active && (
                                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className="w-1.5 h-1.5 rounded-full bg-current" />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Level */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Level <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {LEVELS.map(({ value, label, pct, color }) => {
                                            const active = form.level === value;
                                            return (
                                                <motion.button
                                                    key={value}
                                                    type="button"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => setForm((f) => ({ ...f, level: active ? "" : value }))}
                                                    className={`relative p-3 rounded-xl border text-left transition-all overflow-hidden ${
                                                        active
                                                            ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 shadow-sm"
                                                            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-gray-300 dark:hover:border-gray-700"
                                                    }`}
                                                >
                                                    {/* Progress bar bg */}
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-100 dark:bg-gray-800">
                                                        <motion.div
                                                            className={`h-full ${color}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: active ? `${pct}%` : "0%" }}
                                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                    <div className={`text-xs font-semibold mb-0.5 ${active ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                                        {label}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">{pct}%</div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    {/* Preview bar */}
                                    <AnimatePresence>
                                        {selectedLevel && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="pt-1"
                                            >
                                                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                                    <span>Proficiency</span>
                                                    <span className="font-medium text-gray-600 dark:text-gray-300">{selectedLevel.pct}%</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                    <motion.div
                                                        className={`h-full rounded-full ${selectedLevel.color}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${selectedLevel.pct}%` }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Order */}
                                <div className="space-y-1.5 pb-1">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Urutan
                                        <span className="ml-1.5 text-gray-400 normal-case tracking-normal font-normal">(opsional)</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        value={form.order}
                                        onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                                        min={0}
                                        className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-violet-400 dark:focus:border-violet-600 text-sm rounded-xl w-28"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60">
                                <Button type="button" variant="ghost" size="sm" onClick={onClose}
                                    className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 text-sm">
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" disabled={loading}
                                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white text-sm gap-1.5 px-5 rounded-xl shadow-md shadow-violet-500/20">
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {skill ? "Simpan Perubahan" : "Tambah Skill"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}