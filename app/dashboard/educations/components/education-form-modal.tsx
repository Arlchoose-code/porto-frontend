"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Education } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, Loader2, GraduationCap, Upload } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    education: Education | null;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => currentYear - i);

const DEGREES = ["S1 / Bachelor", "S2 / Master", "S3 / PhD", "D3 / Diploma", "D4 / Sarjana Terapan", "SMA / SMK", "Lainnya"];

export default function EducationFormModal({ open, onClose, onSuccess, education }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        school: "", degree: "", field: "",
        start_year: 0, end_year: 0, description: "",
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            if (education) {
                setForm({
                    school: education.school || "",
                    degree: education.degree || "",
                    field: education.field || "",
                    start_year: education.start_year || 0,
                    end_year: education.end_year || 0,
                    description: education.description || "",
                });
                setLogoPreview(education.logo_url || "");
            } else {
                setForm({ school: "", degree: "", field: "", start_year: 0, end_year: 0, description: "" });
                setLogoPreview("");
            }
            setLogoFile(null);
        }
    }, [education, open]);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const { compressImage } = await import("@/lib/compress-image");
            const compressed = await compressImage(file);
            setLogoFile(compressed);
            setLogoPreview(URL.createObjectURL(compressed));
        }
        e.target.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("school", form.school);
            fd.append("degree", form.degree);
            fd.append("field", form.field);
            fd.append("start_year", String(form.start_year || 0));
            fd.append("end_year", String(form.end_year || 0));
            fd.append("description", form.description);
            if (logoFile) fd.append("logo", logoFile);

            if (education) {
                await api.put(`/educations/${education.id}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Education diperbarui!");
            } else {
                await api.post("/educations", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Education ditambahkan!");
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Gagal menyimpan education");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

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
                        className="relative w-full sm:max-w-[500px] bg-white dark:bg-gray-950 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-gray-200/80 dark:border-gray-800"
                    >
                        {/* Top accent */}
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                                    <GraduationCap className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm leading-none">
                                        {education ? "Edit Education" : "Education Baru"}
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {education ? "Perbarui data pendidikan" : "Tambah riwayat pendidikan"}
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
                            <div className="overflow-y-auto max-h-[68vh] sm:max-h-[62vh] px-6 space-y-4 pb-2">

                                {/* Logo + School */}
                                <div className="flex items-end gap-3">
                                    {/* Logo upload */}
                                    <div className="shrink-0">
                                        <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">Logo</Label>
                                        <motion.button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-sky-300 dark:hover:border-sky-700 flex items-center justify-center overflow-hidden transition-colors group"
                                        >
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <Upload className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-sky-400 transition-colors" />
                                            )}
                                        </motion.button>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                    </div>

                                    {/* School */}
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            Nama Sekolah / Universitas <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
                                        </Label>
                                        <Input
                                            value={form.school}
                                            onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                                            placeholder="Contoh: Universitas Indonesia..."
                                            required
                                            className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-sky-400 dark:focus:border-sky-600 text-sm rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Degree — pill selector */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Jenjang</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DEGREES.map((deg) => {
                                            const active = form.degree === deg;
                                            return (
                                                <motion.button
                                                    key={deg}
                                                    type="button"
                                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => setForm((f) => ({ ...f, degree: active ? "" : deg }))}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                                        active
                                                            ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-400/40 shadow-sm"
                                                            : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-700"
                                                    }`}
                                                >
                                                    {deg}
                                                    {active && (
                                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 ml-1.5 align-middle" />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Field of study */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Jurusan / Bidang Studi</Label>
                                    <Input
                                        value={form.field}
                                        onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}
                                        placeholder="Contoh: Teknik Informatika, Ilmu Komputer..."
                                        className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-sky-400 dark:focus:border-sky-600 text-sm rounded-xl"
                                    />
                                </div>

                                {/* Years */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Tahun</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-400">Mulai</span>
                                            <select
                                                value={form.start_year || ""}
                                                onChange={(e) => setForm((f) => ({ ...f, start_year: Number(e.target.value) }))}
                                                className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-sky-400 dark:focus:border-sky-600 text-sm rounded-xl text-gray-900 dark:text-white outline-none transition-colors"
                                            >
                                                <option value="">Pilih tahun</option>
                                                {YEARS.map((y) => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-400">Selesai</span>
                                            <select
                                                value={form.end_year || ""}
                                                onChange={(e) => setForm((f) => ({ ...f, end_year: Number(e.target.value) }))}
                                                className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-sky-400 dark:focus:border-sky-600 text-sm rounded-xl text-gray-900 dark:text-white outline-none transition-colors"
                                            >
                                                <option value="">Pilih tahun</option>
                                                {YEARS.map((y) => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5 pb-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Deskripsi</Label>
                                    <Textarea
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                        placeholder="Prestasi, kegiatan, atau catatan lainnya..."
                                        rows={3}
                                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-sky-400 dark:focus:border-sky-600 resize-none text-sm rounded-xl"
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
                                    className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm gap-1.5 px-5 rounded-xl shadow-md shadow-sky-500/20">
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {education ? "Simpan Perubahan" : "Tambah Education"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}