"use client";

import { User } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { X, User as UserIcon, Mail, AtSign, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props {
    open: boolean;
    onClose: () => void;
    user: User | null;
}

export default function UserViewModal({ open, onClose, user }: Props) {
    if (!user) return null;

    const fields = [
        { label: "ID", value: `#${user.id}`, icon: Hash },
        { label: "Username", value: `@${user.username}`, icon: AtSign },
        { label: "Email", value: user.email, icon: Mail },
        { label: "Dibuat", value: format(new Date(user.created_at), "dd MMM yyyy, HH:mm", { locale: id }), icon: Calendar },
        { label: "Diupdate", value: format(new Date(user.updated_at), "dd MMM yyyy, HH:mm", { locale: id }), icon: Calendar },
    ];

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
                        className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-purple-500" />
                                </div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Detail User</h2>
                            </div>
                            <motion.button onClick={onClose} whileTap={{ scale: 0.9 }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>

                        {/* Avatar + Name */}
                        <div className="flex flex-col items-center pt-6 pb-4 px-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg mb-3"
                            >
                                <span className="text-2xl font-bold text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </motion.div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{user.username}</p>
                        </div>

                        {/* Fields */}
                        <div className="px-6 pb-6 space-y-2">
                            {fields.map((field, i) => (
                                <motion.div
                                    key={field.label}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 + i * 0.04 }}
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0">
                                        <field.icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{field.label}</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{field.value}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}