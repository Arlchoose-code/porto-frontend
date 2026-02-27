"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Course } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, Loader2, Award, Upload, Link, CalendarDays } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    course: Course | null;
}

function toInputDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    return dateStr.slice(0, 10);
}

export default function CourseFormModal({ open, onClose, onSuccess, course }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: "", issuer: "", issued_at: "",
        expired_at: "", credential_url: "", description: "",
    });
    const [certFile, setCertFile] = useState<File | null>(null);
    const [certPreview, setCertPreview] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevObjectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        return () => { if (prevObjectUrlRef.current) URL.revokeObjectURL(prevObjectUrlRef.current); };
    }, []);

    useEffect(() => {
        if (open) {
            if (course) {
                setForm({
                    title: course.title || "",
                    issuer: course.issuer || "",
                    issued_at: toInputDate(course.issued_at),
                    expired_at: toInputDate(course.expired_at),
                    credential_url: course.credential_url || "",
                    description: course.description || "",
                });
                setCertPreview(course.certificate_image || "");
            } else {
                setForm({ title: "", issuer: "", issued_at: "", expired_at: "", credential_url: "", description: "" });
                setCertPreview("");
            }
            setCertFile(null);
        }
    }, [course, open]);

    const handleCertChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (prevObjectUrlRef.current) URL.revokeObjectURL(prevObjectUrlRef.current);
            const { compressImage } = await import("@/lib/compress-image");
            const compressed = await compressImage(file);
            const url = URL.createObjectURL(compressed);
            prevObjectUrlRef.current = url;
            setCertFile(compressed);
            setCertPreview(url);
        }
        e.target.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("issuer", form.issuer);
            fd.append("issued_at", form.issued_at);
            fd.append("expired_at", form.expired_at);
            fd.append("credential_url", form.credential_url);
            fd.append("description", form.description);
            if (certFile) fd.append("certificate_image", certFile);

            if (course) {
                await api.put(`/courses/${course.id}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Course diperbarui!");
            } else {
                await api.post("/courses", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Course ditambahkan!");
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Gagal menyimpan course");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const isExpired = form.expired_at && new Date(form.expired_at) < new Date();

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
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                    <Award className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm leading-none">
                                        {course ? "Edit Course" : "Course Baru"}
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {course ? "Perbarui data sertifikasi" : "Tambah sertifikasi / kursus"}
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

                                {/* Certificate image + title */}
                                <div className="flex items-end gap-3">
                                    {/* Cert image upload */}
                                    <div className="shrink-0">
                                        <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">
                                            Sertifikat
                                        </Label>
                                        <motion.button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 flex items-center justify-center overflow-hidden transition-colors group relative"
                                        >
                                            {certPreview ? (
                                                <img src={certPreview} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Upload className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-orange-400 transition-colors" />
                                            )}
                                        </motion.button>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCertChange} className="hidden" />
                                    </div>

                                    {/* Title */}
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            Judul <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
                                        </Label>
                                        <Input
                                            value={form.title}
                                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                            placeholder="Nama kursus / sertifikasi..."
                                            required
                                            className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-orange-400 dark:focus:border-orange-600 text-sm rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Issuer */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Penerbit / Platform
                                    </Label>
                                    <Input
                                        value={form.issuer}
                                        onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))}
                                        placeholder="Contoh: Coursera, Dicoding, Udemy..."
                                        className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-orange-400 dark:focus:border-orange-600 text-sm rounded-xl"
                                    />
                                </div>

                                {/* Dates */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <CalendarDays className="w-3 h-3" /> Tanggal
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-400">Diterbitkan</span>
                                            <Input
                                                type="date"
                                                value={form.issued_at}
                                                onChange={(e) => setForm((f) => ({ ...f, issued_at: e.target.value }))}
                                                className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-orange-400 dark:focus:border-orange-600 text-sm rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-400">
                                                Kedaluwarsa
                                                {isExpired && (
                                                    <span className="ml-1.5 text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">
                                                        EXPIRED
                                                    </span>
                                                )}
                                            </span>
                                            <Input
                                                type="date"
                                                value={form.expired_at}
                                                onChange={(e) => setForm((f) => ({ ...f, expired_at: e.target.value }))}
                                                className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-orange-400 dark:focus:border-orange-600 text-sm rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400">Kosongkan kedaluwarsa jika sertifikat tidak ada masa berlaku</p>
                                </div>

                                {/* Credential URL */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Link className="w-3 h-3" /> URL Kredensial
                                    </Label>
                                    <Input
                                        value={form.credential_url}
                                        onChange={(e) => setForm((f) => ({ ...f, credential_url: e.target.value }))}
                                        placeholder="https://coursera.org/verify/..."
                                        type="url"
                                        className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-orange-400 dark:focus:border-orange-600 text-sm rounded-xl"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5 pb-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Deskripsi
                                    </Label>
                                    <Textarea
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                        placeholder="Materi yang dipelajari, pencapaian, dll..."
                                        rows={3}
                                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-orange-400 dark:focus:border-orange-600 resize-none text-sm rounded-xl"
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
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm gap-1.5 px-5 rounded-xl shadow-md shadow-orange-500/20">
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {course ? "Simpan Perubahan" : "Tambah Course"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}