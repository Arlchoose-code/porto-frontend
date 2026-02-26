"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { User } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Eye, Pencil, Trash2, Users, Loader2, Mail, AtSign, Calendar } from "lucide-react";
import UserFormModal from "./components/user-form-modal";
import UserViewModal from "./components/user-view-modal";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.18 } },
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filtered, setFiltered] = useState<User[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");

    const [formModal, setFormModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const res = await api.get("/users");
            setUsers(res.data.data || []);
        } catch {
            toast.error("Gagal memuat users");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            q
                ? users.filter((u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.username.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q)
                )
                : users
        );
    }, [search, users]);

    const handleDelete = async () => {
        if (!selectedUser) return;
        try {
            await api.delete(`/users/${selectedUser.id}`);
            toast.success("User dihapus!");
            setDeleteDialog(false);
            setSelectedUser(null);
            fetchUsers(true);
        } catch {
            toast.error("Gagal hapus user");
        }
    };

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <motion.div
                            animate={{ rotate: [0, -8, 8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                        >
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                        </motion.div>
                        Users
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola akun pengguna dashboard</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button
                        onClick={() => { setSelectedUser(null); setFormModal(true); }}
                        size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">Tambah User</span>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                    placeholder="Cari nama, username, email..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm"
                />
            </motion.div>

            {/* List */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="h-[68px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : filtered.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search ? "User tidak ditemukan" : "Belum ada user"}
                        </p>
                        {!search && (
                            <Button onClick={() => { setSelectedUser(null); setFormModal(true); }}
                                size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white mt-4">
                                <Plus className="w-3.5 h-3.5" /> Tambah User
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="list" variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                        <AnimatePresence>
                            {filtered.map((user) => (
                                <motion.div
                                    key={user.id}
                                    variants={itemVariants} exit="exit" layout
                                    whileHover={{ y: -1, transition: { duration: 0.15 } }}
                                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm rounded-xl p-3.5 transition-all duration-200 group"
                                >
                                    <div className="flex items-center gap-3">

                                        {/* Avatar initial */}
                                        <motion.div whileHover={{ scale: 1.05 }}
                                            className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                                            <span className="text-sm font-bold text-white">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </motion.div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {user.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <AtSign className="w-3 h-3" />
                                                    <span className="truncate">{user.username}</span>
                                                </span>
                                                <span className="hidden sm:flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate">{user.email}</span>
                                                </span>
                                                <span className="hidden md:flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(user.created_at), "dd MMM yyyy", { locale: id })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                            <motion.button
                                                onClick={() => { setSelectedUser(user); setViewModal(true); }}
                                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                whileTap={{ scale: 0.85 }} title="Lihat">
                                                <Eye className="w-3.5 h-3.5" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => { setSelectedUser(user); setFormModal(true); }}
                                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                whileTap={{ scale: 0.85 }} title="Edit">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => { setSelectedUser(user); setDeleteDialog(true); }}
                                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                whileTap={{ scale: 0.85 }} title="Hapus">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <UserFormModal
                open={formModal}
                onClose={() => { setFormModal(false); setSelectedUser(null); }}
                onSuccess={() => fetchUsers(true)}
                user={selectedUser}
            />
            <UserViewModal
                open={viewModal}
                onClose={() => { setViewModal(false); setSelectedUser(null); }}
                user={selectedUser}
            />

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus User?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            User <strong className="text-gray-700 dark:text-gray-300">"{selectedUser?.name}"</strong> akan dihapus permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-200 dark:border-gray-700 text-sm">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white text-sm">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}