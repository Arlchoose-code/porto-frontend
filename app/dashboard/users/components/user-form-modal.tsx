"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { User } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Loader2, User as UserIcon, Mail, AtSign, Lock, Eye, EyeOff } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

export default function UserFormModal({ open, onClose, onSuccess, user }: Props) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });

    useEffect(() => {
        if (open) {
            if (user) {
                setForm({ name: user.name || "", username: user.username || "", email: user.email || "", password: "" });
            } else {
                setForm({ name: "", username: "", email: "", password: "" });
            }
            setShowPassword(false);
        }
    }, [user, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (user) {
                await api.put(`/users/${user.id}`, form);
                toast.success("User diupdate!");
            } else {
                await api.post("/register", form);
                toast.success("User berhasil dibuat!");
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            const errors = err.response?.data?.errors;
            if (errors) {
                toast.error(Object.values(errors)[0] as string);
            } else {
                toast.error(err.response?.data?.message || "Gagal menyimpan user");
            }
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
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user ? "Edit User" : "Tambah User"}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {user ? `Update data ${user.name}` : "Buat akun baru"}
                                    </p>
                                </div>
                            </div>
                            <motion.button onClick={onClose} whileTap={{ scale: 0.9 }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Nama <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input required placeholder="John Doe"
                                        className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Username <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input required placeholder="johndoe"
                                        className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input required type="email" placeholder="john@example.com"
                                        className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    Password {!user && <span className="text-red-500">*</span>}
                                    {user && <span className="text-xs text-gray-400 font-normal ml-1">(kosongkan jika tidak diubah)</span>}
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        required={!user}
                                        type={showPassword ? "text" : "password"}
                                        placeholder={user ? "••••••••" : "Min. 8 karakter"}
                                        className="pl-9 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={onClose}
                                    className="flex-1 border-gray-200 dark:border-gray-700">
                                    Batal
                                </Button>
                                <Button type="submit" disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                                        : user ? "Update User" : "Buat User"
                                    }
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}