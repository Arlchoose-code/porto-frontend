"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Blog, Tag } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, Upload, Loader2, FileText, Image, Tag as TagIcon, Search } from "lucide-react";
import RichEditor from "@/components/shared/rich-editor";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    blog: Blog | null;
    tags: Tag[];
}

export default function BlogFormModal({ open, onClose, onSuccess, blog, tags }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", content: "" });
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>("");
    const [tagSearch, setTagSearch] = useState("");

    useEffect(() => {
    if (open) {
        if (blog) {
            setForm({
                title: blog.title || "",
                description: blog.description || "",
                content: blog.content || "",
            });
            // Fix: pastikan tags ter-load dengan benar
            const tagIds = blog.tags?.map((t) => t.id) || [];
            setSelectedTags(tagIds);
            setCoverPreview(blog.cover_image || "");
        } else {
            setForm({ title: "", description: "", content: "" });
            setSelectedTags([]);
            setCoverPreview("");
        }
        setCoverFile(null);
        setTagSearch("");
    }
}, [blog, open]);

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const { compressImage } = await import("@/lib/compress-image");
            const compressed = await compressImage(file);
            setCoverFile(compressed);
            setCoverPreview(URL.createObjectURL(compressed));
        }
    };

    const toggleTag = (id: number) => {
        setSelectedTags((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
        );
    };

    const filteredTags = tags.filter((tag) =>
        tag.name.toLowerCase().includes(tagSearch.toLowerCase())
    );

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("content", form.content);
        // --- TAMBAHKAN INI ---
        formData.append("update_tags", "true");
        if (coverFile) formData.append("cover_image", coverFile);
        
        // Fix: kirim tag_ids dengan benar
        if (selectedTags.length > 0) {
            selectedTags.forEach((id) => {
                formData.append("tag_ids", id.toString());
            });
        } else {
            // Kirim array kosong agar backend tahu tags dihapus semua
            formData.append("tag_ids", "");
        }

        if (blog) {
            await api.put(`/blogs/${blog.id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Blog diupdate!");
        } else {
            await api.post("/blogs", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Blog dibuat!");
        }

        onSuccess();
        onClose();
    } catch (err: any) {
        toast.error(err.response?.data?.message || "Gagal menyimpan blog");
    } finally {
        setLoading(false);
    }
};

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {blog ? "Edit Blog" : "Tambah Blog"}
                                </h2>
                            </div>
                            <motion.button
                                onClick={onClose}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                whileTap={{ scale: 0.85 }}
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-5">

                            {/* Cover image */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm font-medium">
                                    <Image className="w-4 h-4" /> Cover Image
                                </Label>
                                <div
                                    onClick={() => document.getElementById("cover-input")?.click()}
                                    className="relative w-full h-36 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer overflow-hidden group"
                                >
                                    {coverPreview ? (
                                        <>
                                            <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Upload className="w-8 h-8 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                            <Upload className="w-7 h-7" />
                                            <span className="text-sm">Klik untuk upload cover</span>
                                        </div>
                                    )}
                                </div>
                                <input id="cover-input" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                            </div>

                            {/* Title */}
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Judul <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Judul blog..."
                                    required
                                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Deskripsi
                                </Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Deskripsi singkat blog..."
                                    rows={2}
                                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
                                />
                            </div>

                            {/* Content — Rich Editor */}
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Konten <span className="text-red-500">*</span>
                                </Label>
                                <RichEditor
                                    value={form.content}
                                    onChange={(val) => setForm({ ...form, content: val })}
                                    placeholder="Tulis konten blog di sini..."
                                />
                            </div>

                            {/* Tags dengan search */}
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                                    <TagIcon className="w-4 h-4" /> Tags
                                    {selectedTags.length > 0 && (
                                        <span className="text-xs text-blue-500 font-normal">
                                            {selectedTags.length} dipilih
                                        </span>
                                    )}
                                </Label>

                                {/* Selected tags preview */}
                                {selectedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                        {selectedTags.map((id) => {
                                            const tag = tags.find((t) => t.id === id);
                                            return tag ? (
                                                <motion.span
                                                    key={id}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-medium"
                                                >
                                                    {tag.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleTag(id)}
                                                        className="hover:text-blue-200"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </motion.span>
                                            ) : null;
                                        })}
                                    </div>
                                )}

                                {/* Tag search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <Input
                                        value={tagSearch}
                                        onChange={(e) => setTagSearch(e.target.value)}
                                        placeholder="Cari tag..."
                                        className="pl-8 h-8 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>

                                {/* Tag list */}
                                <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                                    {filteredTags.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-2">
                                            {tagSearch ? "Tag tidak ditemukan" : "Belum ada tags"}
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {filteredTags.map((tag) => (
                                                <motion.button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => toggleTag(tag.id)}
                                                    whileTap={{ scale: 0.9 }}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                                        selectedTags.includes(tag.id)
                                                            ? "bg-blue-600 text-white border-blue-600"
                                                            : "bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                                                    }`}
                                                >
                                                    {tag.name}
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 border-gray-200 dark:border-gray-700"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                                    ) : (
                                        blog ? "Update Blog" : "Simpan Blog"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}