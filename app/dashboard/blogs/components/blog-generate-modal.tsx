"use client";

import { useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Bot, Loader2, Sparkles } from "lucide-react";
import { startGenerateJob } from "@/components/shared/generate-indicator";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BlogGenerateModal({ open, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ keyword: "", total: 3 });

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Backend langsung return 202, proses jalan di goroutine background
            await api.post("/blogs/generate", {
                keyword: form.keyword,
                total: Number(form.total),
            });

            // Mulai tracking job — indicator muncul di pojok kanan bawah
            startGenerateJob(form.keyword, form.total);

            toast.success("Aibys mulai menulis di background!", {
                description: `${form.total} blog · Kamu bisa lanjut bekerja sambil menunggu`,
                duration: 4000,
            });

            setForm({ keyword: "", total: 3 });
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Gagal memulai generate");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setForm({ keyword: "", total: 3 });
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
                        <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-blue-500" />

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-500/10">
                                    <Bot className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Generate AI Blog</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Berjalan di background, kamu bisa tetap bekerja</p>
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

                        <form onSubmit={handleGenerate} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Keyword / Topik
                                </Label>
                                <Input
                                    value={form.keyword}
                                    onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                                    placeholder="contoh: golang backend, UI design 2026..."
                                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-400">Kosongkan untuk topik trending acak</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Jumlah Blog <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={form.total}
                                    onChange={(e) => setForm({ ...form, total: Number(e.target.value) })}
                                    required
                                    disabled={loading}
                                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                />
                                <p className="text-xs text-gray-400">
                                    Estimasi ~{form.total * 1.5} menit · Maksimal 10
                                </p>
                            </div>

                            {/* Info box */}
                            <div className="flex gap-3 p-3.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
                                <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    Aibys mencari referensi dari internet lalu menulis artikel. Proses berjalan di <strong>background</strong> — progress muncul di pojok kanan bawah.
                                </p>
                            </div>

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
                                    disabled={loading}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Memulai...</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4" /> Generate</>
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