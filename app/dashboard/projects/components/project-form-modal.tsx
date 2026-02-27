"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Project } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    X, Loader2, Plus, FolderOpen, Link,
    Layers, ImageIcon, Globe, Smartphone,
    Monitor, Terminal, Code2, Sparkles, Upload
} from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    project: Project | null;
}

const PLATFORMS = [
    { value: "Web", icon: Globe, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-400/40" },
    { value: "Mobile", icon: Smartphone, color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-400/40" },
    { value: "Desktop", icon: Monitor, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-400/40" },
    { value: "API", icon: Code2, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400/40" },
    { value: "CLI", icon: Terminal, color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-400/40" },
    { value: "Other", icon: Sparkles, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-400/40" },
];

export default function ProjectFormModal({ open, onClose, onSuccess, project }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", platform: "", url: "" });
    const [techInput, setTechInput] = useState("");
    const [techStacks, setTechStacks] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<{ id: number; image_url: string }[]>([]);
    const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            if (project) {
                setForm({
                    title: project.title || "",
                    description: project.description || "",
                    platform: project.platform || "",
                    url: project.url || "",
                });
                setTechStacks(project.tech_stacks?.map((t) => t.name) || []);
                setExistingImages(project.images || []);
            } else {
                setForm({ title: "", description: "", platform: "", url: "" });
                setTechStacks([]);
                setExistingImages([]);
            }
            setImagePreviews(prev => { prev.forEach(url => URL.revokeObjectURL(url)); return []; });
            setImageFiles([]);
            setTechInput("");
        }
    }, [project, open]);

    const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        const { compressImage } = await import("@/lib/compress-image");
        const compressed = await Promise.all(files.map((f) => compressImage(f)));
        setImageFiles((prev) => [...prev, ...compressed]);
        const previews = compressed.map((f) => URL.createObjectURL(f));
        setImagePreviews((prev) => [...prev, ...previews]);
    };

    const removeNewImage = (index: number) => {
        setImagePreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDeleteExistingImage = async (imageId: number) => {
        if (!project) return;
        setDeletingImageId(imageId);
        try {
            await api.delete(`/projects/${project.id}/images/${imageId}`);
            setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
            toast.success("Gambar dihapus");
        } catch {
            toast.error("Gagal hapus gambar");
        } finally {
            setDeletingImageId(null);
        }
    };

    const addTechStack = () => {
        const val = techInput.trim();
        if (val && !techStacks.includes(val)) {
            setTechStacks((prev) => [...prev, val]);
        }
        setTechInput("");
    };

    const removeTechStack = (name: string) => {
        setTechStacks((prev) => prev.filter((t) => t !== name));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("platform", form.platform);
            formData.append("url", form.url);
            techStacks.forEach((t) => formData.append("tech_stacks", t));

            if (project) {
                await api.put(`/projects/${project.id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                for (const file of imageFiles) {
                    const imgData = new FormData();
                    imgData.append("image", file);
                    await api.post(`/projects/${project.id}/images`, imgData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                }
                toast.success("Project berhasil diperbarui!");
            } else {
                imageFiles.forEach((f) => formData.append("images", f));
                await api.post("/projects", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Project berhasil dibuat!");
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Gagal menyimpan project");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const newImageItems = imagePreviews.map((src, i) => ({ id: -(i + 1), src, isNew: true, newIndex: i }));
    const existingImageItems = existingImages.map((img) => ({ id: img.id, src: img.image_url, isNew: false, newIndex: -1 }));
    const allImages = [...existingImageItems, ...newImageItems];

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
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <FolderOpen className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm leading-none">
                                        {project ? "Edit Project" : "Project Baru"}
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {project ? "Perbarui detail project" : "Tambahkan ke portfolio"}
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

                        {/* Scrollable body */}
                        <form onSubmit={handleSubmit}>
                            <div className="overflow-y-auto max-h-[68vh] sm:max-h-[62vh] px-6 space-y-5 pb-2">

                                {/* Title */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Judul <span className="text-red-400 normal-case tracking-normal font-normal ml-0.5">*</span>
                                    </Label>
                                    <Input
                                        value={form.title}
                                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                        placeholder="Nama project kamu..."
                                        required
                                        className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-blue-400 dark:focus:border-blue-500 text-sm rounded-xl transition-colors"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Deskripsi</Label>
                                    <Textarea
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                        placeholder="Ceritakan project ini secara singkat..."
                                        rows={3}
                                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-blue-400 dark:focus:border-blue-500 resize-none text-sm rounded-xl transition-colors"
                                    />
                                </div>

                                {/* Platform — pill buttons, no Select bug */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Platform</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {PLATFORMS.map(({ value, icon: Icon, color }) => {
                                            const active = form.platform === value;
                                            return (
                                                <motion.button
                                                    key={value}
                                                    type="button"
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setForm((f) => ({ ...f, platform: active ? "" : value }))}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
                                                        active
                                                            ? `${color} shadow-sm scale-[1.02]`
                                                            : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                                                    }`}
                                                >
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {value}
                                                    {active && (
                                                        <motion.span
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className="w-1.5 h-1.5 rounded-full bg-current ml-0.5"
                                                        />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* URL */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Link className="w-3 h-3" /> URL Project
                                    </Label>
                                    <Input
                                        value={form.url}
                                        onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                                        placeholder="https://github.com/kamu/project"
                                        type="url"
                                        className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-blue-400 dark:focus:border-blue-500 text-sm rounded-xl transition-colors"
                                    />
                                </div>

                                {/* Tech Stacks */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Layers className="w-3 h-3" /> Tech Stack
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={techInput}
                                            onChange={(e) => setTechInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTechStack(); } }}
                                            placeholder="Ketik nama tech, tekan Enter..."
                                            className="h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-blue-400 dark:focus:border-blue-500 text-sm flex-1 rounded-xl"
                                        />
                                        <Button type="button" onClick={addTechStack} size="sm"
                                            className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shrink-0">
                                            <Plus className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    <AnimatePresence>
                                        {techStacks.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex flex-wrap gap-1.5"
                                            >
                                                {techStacks.map((tech) => (
                                                    <motion.span
                                                        key={tech}
                                                        initial={{ opacity: 0, scale: 0.7 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.7 }}
                                                        className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-medium"
                                                    >
                                                        {tech}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTechStack(tech)}
                                                            className="w-4 h-4 flex items-center justify-center rounded hover:text-red-500 transition-colors ml-0.5"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </motion.span>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Images */}
                                <div className="space-y-2 pb-2">
                                    <Label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <ImageIcon className="w-3 h-3" /> Gambar
                                        {allImages.length > 0 && (
                                            <span className="ml-1 text-gray-400 dark:text-gray-500 normal-case tracking-normal font-normal text-xs">
                                                · {allImages.length} foto
                                            </span>
                                        )}
                                    </Label>

                                    <AnimatePresence>
                                        {allImages.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="grid grid-cols-4 gap-2"
                                            >
                                                {allImages.map((img) => (
                                                    <motion.div
                                                        key={`${img.isNew ? "new" : "exist"}-${img.id}`}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="relative group aspect-square"
                                                    >
                                                        <img
                                                            src={img.src} alt=""
                                                            className={`w-full h-full rounded-xl object-cover ${img.isNew
                                                                ? "ring-2 ring-blue-400 dark:ring-blue-600 ring-offset-1 dark:ring-offset-gray-950"
                                                                : "border border-gray-200 dark:border-gray-800"
                                                            }`}
                                                        />
                                                        {img.isNew && (
                                                            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-blue-500 text-white rounded-md px-1 py-0.5 leading-none">
                                                                NEW
                                                            </span>
                                                        )}
                                                        <motion.button
                                                            type="button"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => img.isNew
                                                                ? removeNewImage(img.newIndex)
                                                                : handleDeleteExistingImage(img.id)
                                                            }
                                                            disabled={deletingImageId === img.id}
                                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                                        >
                                                            {deletingImageId === img.id
                                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                : <X className="w-3 h-3" />
                                                            }
                                                        </motion.button>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        whileHover={{ scale: 1.005 }}
                                        whileTap={{ scale: 0.995 }}
                                        className="w-full h-14 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-blue-400 transition-all group"
                                    >
                                        <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span>Klik untuk upload gambar (multiple)</span>
                                    </motion.button>
                                    <input
                                        ref={fileInputRef} type="file" multiple accept="image/*"
                                        onChange={handleImagesChange} className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60">
                                <Button
                                    type="button" variant="ghost" size="sm" onClick={onClose}
                                    className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 text-sm"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit" size="sm" disabled={loading}
                                    className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm gap-1.5 px-5 rounded-xl shadow-md shadow-blue-500/20"
                                >
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {project ? "Simpan Perubahan" : "Buat Project"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}