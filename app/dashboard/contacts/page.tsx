"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Contact } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    Search, Trash2, Mail, Loader2,
    ChevronLeft, ChevronRight, Eye,
    CheckCircle, Clock, MailOpen, X,
    User, MessageSquare, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.18 } }
};

const STATUS_CONFIG = {
    pending: {
        label: "Pending",
        icon: Clock,
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dot: "bg-amber-500",
    },
    read: {
        label: "Dibaca",
        icon: MailOpen,
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        dot: "bg-blue-500",
    },
    done: {
        label: "Selesai",
        icon: CheckCircle,
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-500",
    },
};

interface ContactStats {
    total: number;
    pending: number;
    read: number;
    done: number;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [activeStatus, setActiveStatus] = useState("all");
    const [stats, setStats] = useState<ContactStats>({ total: 0, pending: 0, read: 0, done: 0 });

    const [viewModal, setViewModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const [all, pending, read, done] = await Promise.all([
                api.get("/contacts"),
                api.get("/contacts", { params: { status: "pending" } }),
                api.get("/contacts", { params: { status: "read" } }),
                api.get("/contacts", { params: { status: "done" } }),
            ]);
            setStats({
                total: all.data.data?.length || 0,
                pending: pending.data.data?.length || 0,
                read: read.data.data?.length || 0,
                done: done.data.data?.length || 0,
            });
        } catch { /* silent */ }
    }, []);

    const fetchContacts = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setInitialLoading(true);
        try {
            const params: Record<string, string> = {};
            if (activeStatus !== "all") params.status = activeStatus;
            const res = await api.get("/contacts", { params });
            setContacts(res.data.data || []);
        } catch {
            toast.error("Gagal memuat contacts");
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, [activeStatus]);

    useEffect(() => { fetchContacts(false); }, []);
    useEffect(() => {
        if (!initialLoading) fetchContacts(true);
    }, [activeStatus]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Client-side search filter
    const filtered = contacts.filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.subject?.toLowerCase().includes(q) ||
            c.message?.toLowerCase().includes(q)
        );
    });

    const handleUpdateStatus = async (contact: Contact, status: "pending" | "read" | "done") => {
        setUpdatingId(contact.id);
        try {
            await api.put(`/contacts/${contact.id}/status`, { status });
            toast.success(`Status diubah ke ${STATUS_CONFIG[status].label}`);
            fetchContacts(true);
            fetchStats();
            // Update selected contact di modal kalau lagi buka
            if (selectedContact?.id === contact.id) {
                setSelectedContact({ ...contact, status });
            }
        } catch {
            toast.error("Gagal update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async () => {
        if (!selectedContact) return;
        setDeleting(true);
        try {
            await api.delete(`/contacts/${selectedContact.id}`);
            toast.success("Pesan dihapus!");
            setDeleteDialog(false);
            setViewModal(false);
            setSelectedContact(null);
            fetchContacts(true);
            fetchStats();
        } catch {
            toast.error("Gagal hapus pesan");
        } finally {
            setDeleting(false);
        }
    };

    const openView = async (contact: Contact) => {
        setSelectedContact(contact);
        setViewModal(true);
        // Auto mark as read kalau masih pending
        if (contact.status === "pending") {
            await handleUpdateStatus(contact, "read");
        }
    };

    const statCards = [
        { label: "Total", value: stats.total, color: "text-gray-700 dark:text-gray-200", filter: "all" },
        { label: "Pending", value: stats.pending, color: "text-amber-500", filter: "pending" },
        { label: "Dibaca", value: stats.read, color: "text-blue-500", filter: "read" },
        { label: "Selesai", value: stats.done, color: "text-emerald-500", filter: "done" },
    ];

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" />
                        </motion.div>
                        Contacts
                        <AnimatePresence>
                            {refreshing && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Badge pending belum dibaca */}
                        {stats.pending > 0 && (
                            <motion.span
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                {stats.pending}
                            </motion.span>
                        )}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola pesan masuk dari pengunjung</p>
                </div>
            </motion.div>

            {/* Stats — clickable filter */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="grid grid-cols-4 gap-2">
                {statCards.map((stat, i) => (
                    <motion.button key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setActiveStatus(stat.filter)}
                        className={`bg-white dark:bg-gray-900 border rounded-xl p-3 text-center transition-all cursor-pointer hover:shadow-sm ${
                            activeStatus === stat.filter
                                ? "border-violet-400 dark:border-violet-600 ring-1 ring-violet-400/30"
                                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                        }`}>
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                    </motion.button>
                ))}
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Cari email, subject, pesan..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm" />
                </div>
            </motion.div>

            {/* Contact List */}
            <AnimatePresence mode="wait">
                {initialLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="h-[72px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                        ))}
                    </motion.div>
                ) : filtered.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        </motion.div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search ? "Tidak ada pesan yang cocok" : "Belum ada pesan masuk"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {search ? "Coba kata kunci lain" : "Pesan dari pengunjung akan muncul di sini"}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div key="list" variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                        <AnimatePresence>
                            {filtered.map((contact) => {
                                const cfg = STATUS_CONFIG[contact.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                                const StatusIcon = cfg.icon;
                                const isPending = contact.status === "pending";

                                return (
                                    <motion.div key={contact.id} variants={itemVariants} exit="exit" layout
                                        whileHover={{ y: -1, transition: { duration: 0.15 } }}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-3.5 transition-all duration-200 group hover:shadow-sm cursor-pointer ${
                                            isPending
                                                ? "border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-500/5"
                                                : "border-gray-200 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800"
                                        }`}
                                        onClick={() => openView(contact)}>
                                        <div className="flex items-start gap-2 sm:gap-3">

                                            {/* Avatar */}
                                            <div className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${
                                                isPending
                                                    ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                                    : "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400"
                                            }`}>
                                                {contact.name?.[0]?.toUpperCase() ?? contact.email?.[0]?.toUpperCase() ?? "?"}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                                    <Badge className={`text-xs gap-1 ${cfg.className}`}>
                                                        <StatusIcon className="w-2.5 h-2.5" />
                                                        <span className="hidden sm:inline">{cfg.label}</span>
                                                    </Badge>
                                                    {isPending && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                            Baru
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className={`font-semibold text-xs sm:text-sm leading-snug line-clamp-1 transition-colors ${
                                                    isPending
                                                        ? "text-gray-900 dark:text-white"
                                                        : "text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400"
                                                }`}>
                                                    {contact.subject}
                                                </h3>

                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1 truncate">
                                                        <User className="w-3 h-3 shrink-0" />
                                                        <span className="truncate max-w-[120px] sm:max-w-[200px]">
                                                            {contact.name || contact.email}
                                                        </span>
                                                    </span>
                                                    <span className="hidden sm:block shrink-0">
                                                        {format(new Date(contact.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                                    {contact.message}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                                                onClick={(e) => e.stopPropagation()}>
                                                <motion.button onClick={() => openView(contact)}
                                                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                                                    whileTap={{ scale: 0.85 }} title="Lihat">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </motion.button>
                                                {contact.status !== "done" && (
                                                    <motion.button
                                                        onClick={() => handleUpdateStatus(contact, "done")}
                                                        disabled={updatingId === contact.id}
                                                        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                        whileTap={{ scale: 0.85 }} title="Tandai selesai">
                                                        {updatingId === contact.id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <CheckCircle className="w-3.5 h-3.5" />}
                                                    </motion.button>
                                                )}
                                                <motion.button
                                                    onClick={() => { setSelectedContact(contact); setDeleteDialog(true); }}
                                                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    whileTap={{ scale: 0.85 }} title="Hapus">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Modal */}
            <AnimatePresence>
                {viewModal && selectedContact && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setViewModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.97 }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="relative w-full sm:max-w-[520px] bg-white dark:bg-gray-950 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-gray-200/80 dark:border-gray-800">

                            {/* Top accent */}
                            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 text-white font-bold text-sm">
                                        {selectedContact.name?.[0]?.toUpperCase() ?? selectedContact.email?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900 dark:text-white text-sm leading-none">
                                            {selectedContact.name || "Detail Pesan"}
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">{selectedContact.email}</p>
                                    </div>
                                </div>
                                <motion.button onClick={() => setViewModal(false)}
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto max-h-[65vh] px-6 pb-2 space-y-4">

                                {/* Status row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {(["pending", "read", "done"] as const).map((s) => {
                                        const c = STATUS_CONFIG[s];
                                        const Icon = c.icon;
                                        const isActive = selectedContact.status === s;
                                        return (
                                            <motion.button key={s}
                                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                                                disabled={updatingId === selectedContact.id}
                                                onClick={() => handleUpdateStatus(selectedContact, s)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                                    isActive
                                                        ? `${c.className} shadow-sm`
                                                        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                                                }`}>
                                                {updatingId === selectedContact.id && isActive
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <Icon className="w-3 h-3" />}
                                                {c.label}
                                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current ml-0.5" />}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Info */}
                                <div className="space-y-3">
                                    {selectedContact.name && (
                                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                            <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-0.5">Nama</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedContact.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                        <Mail className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-0.5">Email</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedContact.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-0.5">Subject</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedContact.subject}</p>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                        <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Pesan</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {selectedContact.message}
                                        </p>
                                    </div>

                                    {/* Timestamps */}
                                    <div className="grid grid-cols-1 gap-2 pb-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                                            <span>Dikirim: <span className="text-gray-600 dark:text-gray-300">
                                                {format(new Date(selectedContact.created_at), "dd MMMM yyyy, HH:mm", { locale: id })}
                                            </span></span>
                                        </div>
                                        {selectedContact.read_at && (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <MailOpen className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                                                <span>Dibaca: <span className="text-gray-600 dark:text-gray-300">
                                                    {format(new Date(selectedContact.read_at), "dd MMMM yyyy, HH:mm", { locale: id })}
                                                </span></span>
                                            </div>
                                        )}
                                        {selectedContact.done_at && (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                                <span>Selesai: <span className="text-gray-600 dark:text-gray-300">
                                                    {format(new Date(selectedContact.done_at), "dd MMMM yyyy, HH:mm", { locale: id })}
                                                </span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setViewModal(false)}
                                    className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 text-sm">
                                    Tutup
                                </Button>
                                <Button type="button" size="sm"
                                    onClick={() => { setViewModal(false); setDeleteDialog(true); }}
                                    className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm">
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Hapus Pesan?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Pesan dari <strong className="text-gray-700 dark:text-gray-300">{selectedContact?.name || selectedContact?.email}</strong> dengan subject <strong className="text-gray-700 dark:text-gray-300">&quot;{selectedContact?.subject}&quot;</strong> akan dihapus permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-200 dark:border-gray-700 text-sm">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm">
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}