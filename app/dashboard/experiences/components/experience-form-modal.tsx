"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Experience } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, Loader2, Briefcase, MapPin, Calendar, Upload, ImageIcon } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    experience: Experience | null;
}

function formatDateForInput(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    return dateStr.slice(0, 10); // "2024-01-15T..." → "2024-01-15"
}

export default function ExperienceFormModal({ open, onClose, onSuccess, experience }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        company: "", role: "", location: "",
        start_date: "", end_date: "", description: "", is_current: false,
    });
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<{ id: number; image_url: string }[]>([]);
    const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            if (experience) {
                setForm({
                    company: experience.company || "",
                    role: experience.role || "",
                    location: experience.location || "",
                    start_date: formatDateForInput(experience.start_date),
                    end_date: formatDateForInput(experience.end_date),
                    description: experience.description || "",
                    is_current: experience.is_current || false,
                });
                setExistingImages(experience.images || []);
            } else {
                setForm({ company: "", role: "", location: "", start_date: "", end_date: "", description: "", is_current: false });
                setExistingImages([]);
            }
            setImageFiles([]);
            setImagePreviews([]);
        }
    }, [experience, open]);

    const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImageFiles((prev) => [...prev, ...files]);
        setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
        e.target.value = "";
    };

    const removeNewImage = (i: number) => {
        setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
        setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
    };

    const handleDeleteExistingImage = async (imageId: number) => {
        if (!experience) return;
        setDeletingImageId(imageId);
        try {
            await api.delete(`/experiences/${experience.id}/images/${imageId}`);
            setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
            toast.success("Gambar dihapus");
        } catch {
            toast.error("Gagal hapus gambar");
        } finally {
            setDeletingImageId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("company", form.company);
            fd.append("role", form.role);
            fd.append("location", form.location);
            fd.append("start_date", form.start_date);
            fd.append("end_date", form.is_current ? "" : form.end_date);
            fd.append("is_current", String(form.is_current));
            fd.append("description", form.description);

            if (experience) {
                await api.put(`/experiences/${experience.id}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                for (const file of imageFiles) {
                    const imgData = new FormData();
                    imgData.append("image", file);
                    await api.post(`/experiences/${experience.id}/images`, imgData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                }
                toast.success("Experience diperbarui!");
            } else {
                imageFiles.forEach((f) => fd.append("images", f));
                await api.post("/experiences", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Experience ditambahkan!");
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Gagal menyimpan experience");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const allImages = [
        ...existingImages.map((img) => ({ id: img.id, src: img.image_url, isNew: false, newIndex: -1 })),
        ...imagePreviews.map((src, i) => ({ id: -(i + 1), src, isNew: true, newIndex: i })),
    ];

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
                        className="relative w-full sm:max-w-[520px] bg-white dark:bg-gray-950 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-gray-200/80 dark:border-gray-800"
                    >
                        {/* Top accent */}
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Briefcase className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm leading-none">
                                        {experience ? "Edit Experience" : "Experience Baru"}
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {experience ? "Perbarui data pengalaman kerja" : "Tambah riwayat pekerjaan"}
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
                            <div className="overflow-y-auto max-h-[70vh] sm:max-h-[65vh] px-6 space-y-4 pb-2">

                                {/* Company & Role */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            Perusahaan <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
                                        </Label>
                                        <Input
                                            value={form.company}
                                            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                                            placeholder="Nama perusahaan..."
                                            required
                                            className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-emerald-400 dark:focus:border-emerald-600 text-sm rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                            Role <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
                                        </Label>
                                        <Input
                                            value={form.role}
                                            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                                            placeholder="Posisi / jabatan..."
                                            required
                                            className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-emerald-400 dark:focus:border-emerald-600 text-sm rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3" /> Lokasi
                                    </Label>
                                    <Input
                                        value={form.location}
                                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                                        placeholder="Kota, Negara / Remote..."
                                        className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-emerald-400 dark:focus:border-emerald-600 text-sm rounded-xl"
                                    />
                                </div>

                                {/* Dates */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" /> Periode
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-400">Mulai</span>
                                            <Input
                                                type="date"
                                                value={form.start_date}
                                                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                                                className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-emerald-400 dark:focus:border-emerald-600 text-sm rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-400">Selesai</span>
                                            <Input
                                                type="date"
                                                value={form.end_date}
                                                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                                                disabled={form.is_current}
                                                className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-emerald-400 dark:focus:border-emerald-600 text-sm rounded-xl disabled:opacity-40"
                                            />
                                        </div>
                                    </div>

                                    {/* Is current toggle */}
                                    <motion.button
                                        type="button"
                                        onClick={() => setForm((f) => ({ ...f, is_current: !f.is_current, end_date: !f.is_current ? "" : f.end_date }))}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all w-full ${
                                            form.is_current
                                                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
                                                : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700"
                                        }`}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {/* Custom toggle */}
                                        <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${form.is_current ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                                            <motion.div
                                                animate={{ x: form.is_current ? 16 : 2 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm"
                                            />
                                        </div>
                                        <span>Masih bekerja di sini</span>
                                        {form.is_current && (
                                            <span className="ml-auto text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-semibold">
                                                PRESENT
                                            </span>
                                        )}
                                    </motion.button>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Deskripsi</Label>
                                    <Textarea
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                        placeholder="Ceritakan tanggung jawab dan pencapaian..."
                                        rows={4}
                                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-emerald-400 dark:focus:border-emerald-600 resize-none text-sm rounded-xl"
                                    />
                                </div>

                                {/* Images */}
                                <div className="space-y-2 pb-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <ImageIcon className="w-3 h-3" /> Foto
                                        {allImages.length > 0 && (
                                            <span className="text-gray-400 normal-case tracking-normal font-normal">· {allImages.length} foto</span>
                                        )}
                                    </Label>

                                    <AnimatePresence>
                                        {allImages.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="grid grid-cols-4 gap-2"
                                            >
                                                {allImages.map((img) => (
                                                    <motion.div
                                                        key={`${img.isNew ? "n" : "e"}-${img.id}`}
                                                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="relative group aspect-square"
                                                    >
                                                        <img src={img.src} alt=""
                                                            className={`w-full h-full rounded-xl object-cover ${img.isNew
                                                                ? "ring-2 ring-emerald-400 dark:ring-emerald-600 ring-offset-1 dark:ring-offset-gray-950"
                                                                : "border border-gray-200 dark:border-gray-800"
                                                            }`}
                                                        />
                                                        {img.isNew && (
                                                            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-emerald-500 text-white rounded-md px-1 py-0.5 leading-none">NEW</span>
                                                        )}
                                                        <motion.button
                                                            type="button"
                                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                            onClick={() => img.isNew ? removeNewImage(img.newIndex) : handleDeleteExistingImage(img.id)}
                                                            disabled={deletingImageId === img.id}
                                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                                        >
                                                            {deletingImageId === img.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                                        </motion.button>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
                                        className="w-full h-14 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-xl flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-emerald-500 transition-all group"
                                    >
                                        <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span>Upload foto (multiple)</span>
                                    </motion.button>
                                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImagesChange} className="hidden" />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60">
                                <Button type="button" variant="ghost" size="sm" onClick={onClose}
                                    className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 text-sm">
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" disabled={loading}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm gap-1.5 px-5 rounded-xl shadow-md shadow-emerald-500/20">
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {experience ? "Simpan Perubahan" : "Tambah Experience"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}