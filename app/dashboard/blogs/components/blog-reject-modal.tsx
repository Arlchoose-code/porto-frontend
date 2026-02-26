"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Blog } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, XCircle, Bot, User, AlertTriangle } from "lucide-react";
import { startRegenerateJob } from "@/components/shared/generate-indicator";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    blog: Blog | null;
}

export default function BlogRejectModal({ open, onClose, onSuccess, blog }: Props) {
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState("");

    const isAI = blog?.author === "aibys";

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!blog || !comment.trim()) return;

        setLoading(true);
        try {
            await api.put(`/blogs/${blog.id}/reject`, { comment });

            // Kalau AI blog, start regenerate job indicator
            if (isAI) {
                startRegenerateJob(blog.id, blog.title);
                toast.success("Blog ditolak, Aibys sedang memperbaiki...", {
                    description: "Pantau progress di pojok kanan bawah",
                    duration: 4000,
                });
            } else {
                toast.success("Blog ditolak");
            }

            setComment("");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Gagal menolak blog");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setComment("");
        onClose();
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
                        onClick={handleClose}
                    />
                    <motion.div
                        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    >
                        {/* Top strip */}
                        <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-red-500" />

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-orange-500/10">
                                    <XCircle className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Tolak Blog</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                        {blog?.title}
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                onClick={handleClose}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                whileTap={{ scale: 0.85 }}
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        <form onSubmit={handleReject} className="p-5 space-y-4">

                            {/* Info box — berbeda untuk AI vs manual */}
                            {isAI ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3 p-3.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20"
                                >
                                    <Bot className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-purple-700 dark:text-purple-300">
                                        <p className="font-medium">Blog dari Aibys AI</p>
                                        <p className="text-xs mt-0.5 text-purple-600 dark:text-purple-400">
                                            Setelah ditolak, Aibys akan langsung memperbaiki berdasarkan catatan kamu. Progress bisa dipantau di pojok kanan bawah.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20"
                                >
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-700 dark:text-amber-300">
                                        <p className="font-medium flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" /> Blog Manual
                                        </p>
                                        <p className="text-xs mt-0.5 text-amber-600 dark:text-amber-400">
                                            Blog ini ditulis manual. Catatan penolakan akan disimpan sebagai referensi penulis.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Comment input */}
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Catatan Penolakan <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={isAI
                                        ? "Contoh: Konten terlalu singkat, tolong tambahkan lebih banyak contoh kode dan penjelasan praktis..."
                                        : "Jelaskan alasan penolakan dan saran perbaikan..."
                                    }
                                    rows={4}
                                    required
                                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none text-sm"
                                />
                                <p className="text-xs text-gray-400">
                                    {comment.length} karakter · minimal jelaskan alasan penolakan
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    className="flex-1 border-gray-200 dark:border-gray-700 text-sm"
                                    disabled={loading}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !comment.trim()}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm gap-2"
                                >
                                    {loading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </motion.div>
                                    ) : (
                                        <><XCircle className="w-4 h-4" /> Tolak Blog</>
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