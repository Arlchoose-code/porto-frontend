"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format, parseISO, subMonths, startOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
    FileText, FolderOpen, Wrench, Bookmark, Mail, Star,
    GraduationCap, Briefcase, ArrowRight, TrendingUp,
    Activity, CheckCircle, Clock, XCircle, Archive,
    BookOpen, Tag, User2, BarChart2,
} from "lucide-react";

/* ── Types ── */
interface Stats {
    blogs: number; projects: number; tools: number; bookmarks: number;
    contacts: number; skills: number; educations: number; experiences: number;
    courses: number; tags: number; users: number;
}
interface BlogStats { total: number; published: number; pending: number; rejected: number; archived: number; }
interface RecentBlog { id: number; title: string; status: string; created_at: string; }
interface RecentContact { id: number; name: string; subject: string; status: string; }
interface ToolUsageStat { tool_slug: string; tool_name: string; total_runs: number; }
interface ToolDailyUsage { date: string; count: number; }

/* ── Helper konversi UTC ke WIB ── */
function utcToWIB(dateStr: string): Date {
    // Parse ISO string (format: "2026-02-27T04:30:28.962Z" atau "2026-02-27")
    const utcDate = parseISO(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00Z');
    // Tambah 7 jam (WIB = UTC+7)
    return new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
}

function formatWIB(dateStr: string, formatStr: string): string {
    const wibDate = utcToWIB(dateStr);
    return format(wibDate, formatStr, { locale: localeId });
}

/* ── Helpers ── */
function buildMonthlyData(items: any[], monthCount = 6) {
    const months = Array.from({ length: monthCount }, (_, i) => {
        const d = subMonths(new Date(), monthCount - 1 - i);
        return { key: format(startOfMonth(d), "yyyy-MM"), label: format(d, "MMM yy", { locale: localeId }) };
    });
    const map: Record<string, number> = {};
    months.forEach(m => (map[m.key] = 0));
    items.forEach(item => {
        if (item.created_at) {
            // Konversi ke WIB dulu baru ambil bulan
            const wibDate = utcToWIB(item.created_at);
            const k = format(wibDate, "yyyy-MM");
            if (map[k] !== undefined) map[k]++;
        }
    });
    return months.map(m => ({ name: m.label, value: map[m.key] }));
}

function buildSkillLevelData(skills: any[]) {
    // Sesuaikan dengan format level yang ada di data (lowercase)
    const order = ["beginner", "intermediate", "advanced", "expert"];
    const displayNames = {
        beginner: "Beginner",
        intermediate: "Intermediate", 
        advanced: "Advanced",
        expert: "Expert"
    };
    
    const map: Record<string, number> = {};
    
    // Inisialisasi semua level dengan 0
    order.forEach(level => { map[level] = 0; });
    
    // Hitung skills berdasarkan level (case insensitive)
    skills.forEach(s => { 
        const level = s.level?.toLowerCase(); // pastikan lowercase
        if (level && map[level] !== undefined) {
            map[level]++; 
        }
    });
    
    // Konversi ke format untuk chart dengan display names
    return order
        .filter(level => map[level] > 0) // hanya tampilkan yang ada datanya
        .map(level => ({ 
            name: displayNames[level as keyof typeof displayNames], 
            value: map[level] 
        }));
}

function buildPlatformData(projects: any[]) {
    const map: Record<string, number> = {};
    projects.forEach(p => {
        const pl = p.platform || "Other";
        map[pl] = (map[pl] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function buildSkillRadarData(skills: any[]) {
    const map: Record<string, number> = {};
    skills.forEach(s => { map[s.category] = (map[s.category] || 0) + 1; });
    return Object.entries(map).map(([subject, A]) => ({ subject, A })).sort((a, b) => b.A - a.A).slice(0, 7);
}

/* ── Constants ── */
const STATUS_CFG: Record<string, { color: string; bg: string; icon: any }> = {
    published: { color: "#22c55e", bg: "bg-green-500/10",  icon: CheckCircle },
    pending:   { color: "#f59e0b", bg: "bg-yellow-500/10", icon: Clock },
    rejected:  { color: "#ef4444", bg: "bg-red-500/10",    icon: XCircle },
    archived:  { color: "#6b7280", bg: "bg-gray-500/10",   icon: Archive },
};
const PIE_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#ec4899","#14b8a6","#f97316"];
const SKILL_LEVEL_COLORS: Record<string, string> = {
    Beginner: "#94a3b8", Intermediate: "#3b82f6", Advanced: "#8b5cf6", Expert: "#f59e0b"
};

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color || p.fill }}>{p.name || "Value"}: <span className="font-bold">{p.value}</span></p>
            ))}
        </div>
    );
};

/* ── Main Component ── */
export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({
        blogs: 0, projects: 0, tools: 0, bookmarks: 0,
        contacts: 0, skills: 0, educations: 0, experiences: 0,
        courses: 0, tags: 0, users: 0,
    });
    const [blogStats, setBlogStats] = useState<BlogStats>({ total: 0, published: 0, pending: 0, rejected: 0, archived: 0 });
    const [recentBlogs, setRecentBlogs] = useState<RecentBlog[]>([]);
    const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);

    // chart data
    const [blogMonthly, setBlogMonthly] = useState<any[]>([]);
    const [contactMonthly, setContactMonthly] = useState<any[]>([]);
    const [skillLevelData, setSkillLevelData] = useState<any[]>([]);
    const [platformData, setPlatformData] = useState<any[]>([]);
    const [skillRadarData, setSkillRadarData] = useState<any[]>([]);
    const [toolPerTool, setToolPerTool] = useState<ToolUsageStat[]>([]);
    const [toolDaily, setToolDaily] = useState<any[]>([]);
    const [toolTotalAll, setToolTotalAll] = useState(0);
    const [toolTodayCount, setToolTodayCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            const results = await Promise.allSettled([
                api.get("/blogs/all?limit=100"),       // 0
                api.get("/projects"),        // 1
                api.get("/tools/all"),       // 2
                api.get("/bookmarks"),       // 3
                api.get("/contacts"),        // 4
                api.get("/skills"),          // 5
                api.get("/educations"),      // 6
                api.get("/experiences"),     // 7
                api.get("/courses"),         // 8
                api.get("/tags"),            // 9
                api.get("/users"),           // 10
                api.get("/blogs/stats"),     // 11
                api.get("/tools/stats"),     // 12
            ]);

            const get = (i: number) => results[i].status === "fulfilled" ? results[i].value.data : null;
            const len = (i: number) => { const d = get(i); return d?.meta?.total ?? d?.data?.length ?? 0; };

            const blogsData    = get(0)?.data || [];
            const projectsData = get(1)?.data || [];
            const contactsData = get(4)?.data || [];
            const skillsData   = get(5)?.data || [];

            setStats({
                blogs: len(0), projects: len(1), tools: len(2), bookmarks: len(3),
                contacts: len(4), skills: len(5), educations: len(6), experiences: len(7),
                courses: len(8), tags: len(9), users: len(10),
            });

            const bs = get(11)?.data;
            if (bs) setBlogStats(bs);

            // Tool usage stats
            const toolStats = get(12)?.data;
            if (toolStats) {
                setToolPerTool(toolStats.per_tool || []);
                setToolTotalAll(toolStats.total_all || 0);
                setToolTodayCount(toolStats.today_count || 0);
                
                // Build daily 7 hari — FIX TIMEZONE UTC → WIB
                const dailyRaw: ToolDailyUsage[] = toolStats.daily || [];
                
                // Konversi data dari API (UTC) ke WIB
                const dailyInWIB = dailyRaw.map(item => ({
                    date: formatWIB(item.date, 'yyyy-MM-dd'),
                    count: item.count
                }));
                
                const days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const wibKey = format(d, 'yyyy-MM-dd');
                    const found = dailyInWIB.find(r => r.date === wibKey);
                    return { 
                        name: format(d, "dd MMM", { locale: localeId }), 
                        value: found?.count || 0 
                    };
                });
                setToolDaily(days);
            }

            // Recent blogs dengan konversi WIB (untuk display)
            setRecentBlogs(blogsData.slice(0, 5));
            
            // Recent contacts dengan konversi WIB (untuk display)
            setRecentContacts(contactsData.slice(0, 5));
            
            // Blog monthly dengan konversi WIB
            setBlogMonthly(buildMonthlyData(blogsData, 7));
            
            // Contact monthly dengan konversi WIB
            setContactMonthly(buildMonthlyData(contactsData, 7));
            
            setSkillLevelData(buildSkillLevelData(skillsData));
            setPlatformData(buildPlatformData(projectsData));
            setSkillRadarData(buildSkillRadarData(skillsData));

            setLoading(false);
        };
        fetchAll();
    }, []);

    const statCards = [
        { label: "Blogs",       value: stats.blogs,       icon: FileText,      color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-500/10",   href: "/dashboard/blogs",       accent: "#3b82f6" },
        { label: "Projects",    value: stats.projects,    icon: FolderOpen,    color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", href: "/dashboard/projects",    accent: "#8b5cf6" },
        { label: "Courses",     value: stats.courses,     icon: BookOpen,      color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10", href: "/dashboard/courses",     accent: "#6366f1" },
        { label: "Tools",       value: stats.tools,       icon: Wrench,        color: "text-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-500/10",href: "/dashboard/tools",      accent: "#10b981" },
        { label: "Bookmarks",   value: stats.bookmarks,   icon: Bookmark,      color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-500/10",   href: "/dashboard/bookmarks",   accent: "#f59e0b" },
        { label: "Skills",      value: stats.skills,      icon: Star,          color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", href: "/dashboard/skills",      accent: "#f97316" },
        { label: "Contacts",    value: stats.contacts,    icon: Mail,          color: "text-rose-500",   bg: "bg-rose-50 dark:bg-rose-500/10",     href: "/dashboard/contacts",    accent: "#f43f5e" },
        { label: "Tags",        value: stats.tags,        icon: Tag,           color: "text-cyan-500",   bg: "bg-cyan-50 dark:bg-cyan-500/10",     href: "/dashboard/tags",        accent: "#06b6d4" },
        { label: "Educations",  value: stats.educations,  icon: GraduationCap, color: "text-teal-500",   bg: "bg-teal-50 dark:bg-teal-500/10",     href: "/dashboard/educations",  accent: "#14b8a6" },
        { label: "Experiences", value: stats.experiences, icon: Briefcase,     color: "text-pink-500",   bg: "bg-pink-50 dark:bg-pink-500/10",     href: "/dashboard/experiences", accent: "#ec4899" },
        { label: "Users",       value: stats.users,       icon: User2,         color: "text-slate-500",  bg: "bg-slate-50 dark:bg-slate-500/10",   href: "/dashboard/users",       accent: "#64748b" },
    ];

    const blogStatusPieData = [
        { name: "Published", value: blogStats.published, color: "#22c55e" },
        { name: "Pending",   value: blogStats.pending,   color: "#f59e0b" },
        { name: "Rejected",  value: blogStats.rejected,  color: "#ef4444" },
        { name: "Archived",  value: blogStats.archived,  color: "#6b7280" },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart2 className="w-6 h-6 text-blue-500" /> Dashboard
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
                            Overview & analytics portfolio kamu
                        </p>
                    </div>
                    <span className="text-xs text-gray-400 hidden sm:block">
                        {format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })}
                    </span>
                </div>
            </motion.div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {statCards.map((s, i) => (
                    <motion.div key={s.label}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    >
                        <Link href={s.href}>
                            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden relative">
                                {/* accent line top */}
                                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: s.accent }} />
                                <CardContent className="px-4 pt-5 pb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${s.bg}`}>
                                            <s.icon className={`w-4 h-4 ${s.color}`} />
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                                        {loading
                                            ? <span className="inline-block w-8 h-7 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                            : s.value
                                        }
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{s.label}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* ── Row 2: Area Charts ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Blog Activity */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                Blog Activity
                                <span className="ml-auto text-xs font-normal text-gray-400">7 bulan terakhir</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={blogMonthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="blogGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[&>line]:stroke-gray-800" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" name="Blogs" stroke="#3b82f6" strokeWidth={2} fill="url(#blogGrad)" dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Contact Activity */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-rose-500" />
                                Incoming Contacts
                                <span className="ml-auto text-xs font-normal text-gray-400">7 bulan terakhir</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={contactMonthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="contactGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[&>line]:stroke-gray-800" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" name="Contacts" stroke="#f43f5e" strokeWidth={2} fill="url(#contactGrad)" dot={{ r: 3, fill: "#f43f5e" }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ── Row 2.5: Tool Usage Charts ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Tool Daily Usage — Area chart total per hari */}
                <motion.div className="md:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-emerald-500" />
                                Total Tool Usage
                                <span className="ml-auto text-xs font-normal text-gray-400">7 hari terakhir (WIB)</span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    {toolTodayCount} hari ini
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart
                                    data={toolDaily}
                                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="toolGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[&>line]:stroke-gray-800" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                        width={25}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" name="Total Runs" stroke="#10b981" strokeWidth={2} fill="url(#toolGrad)" dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                            
                            {/* Summary total */}
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>Total 7 hari: <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {toolDaily.reduce((sum, day) => sum + day.value, 0)}
                                </span></span>
                                <span>Total semua waktu: <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {toolTotalAll}
                                </span></span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Top Tools */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.41 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-emerald-500" />
                                Top Tools
                                <span className="ml-auto text-xs font-normal text-gray-400">{toolTotalAll} total</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {toolPerTool.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2">
                                    <BarChart2 className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                    <p className="text-xs text-gray-400">Belum ada data usage</p>
                                </div>
                            ) : (
                                <div className="space-y-4 mt-1">
                                    {toolPerTool.slice(0, 6).map((t, i) => {
                                        const max = toolPerTool[0]?.total_runs || 1;
                                        const pct = Math.round((t.total_runs / max) * 100);
                                        const colors = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#f43f5e","#06b6d4"];
                                        const color = colors[i % colors.length];
                                        return (
                                            <div key={t.tool_slug}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                            {t.tool_name || t.tool_slug}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold ml-2 shrink-0" style={{ color }}>
                                                        {t.total_runs}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: color }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 + i * 0.07 }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ── Row 3: Pie + Bar + Radar ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Blog Status Pie */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" /> Blog Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={blogStatusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                                        paddingAngle={3} dataKey="value" nameKey="name">
                                        {blogStatusPieData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
                                {blogStatusPieData.map(d => {
                                    const pct = blogStats.total > 0 ? Math.round((d.value / blogStats.total) * 100) : 0;
                                    return (
                                        <div key={d.name} className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                            <span className="text-[11px] text-gray-500 dark:text-gray-400">{d.name}</span>
                                            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 ml-auto">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Project Platform Bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-purple-500" /> Project Platform
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {platformData.length === 0
                                ? <p className="text-xs text-gray-400 text-center py-10">Belum ada project</p>
                                : (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={platformData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }} barSize={18}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[&>line]:stroke-gray-800" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Projects" radius={[4, 4, 0, 0]}>
                                                {platformData.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )
                            }
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Skill Level Bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Star className="w-4 h-4 text-orange-500" /> Skill Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {skillLevelData.length === 0
                                ? <p className="text-xs text-gray-400 text-center py-10">Belum ada skill</p>
                                : (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={skillLevelData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barSize={14}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[&>line]:stroke-gray-800" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={80} />
                                            <Tooltip content={<CustomTooltip />} />
                                          <Bar dataKey="value" name="Skills" radius={[0, 4, 4, 0]}>
    {skillLevelData.map((entry) => {
        // Mapping manual aja based on entry.name
        let color = "#94a3b8"; // default gray
        
        if (entry.name === "Beginner") color = "#94a3b8";
        else if (entry.name === "Intermediate") color = "#3b82f6";
        else if (entry.name === "Advanced") color = "#8b5cf6";
        else if (entry.name === "Expert") color = "#f59e0b";
        
        return <Cell key={entry.name} fill={color} />;
    })}
</Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )
                            }
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ── Row 4: Radar + Recent ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Skill Category Radar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-500" /> Skill Categories
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {skillRadarData.length === 0
                                ? <p className="text-xs text-gray-400 text-center py-10">Belum ada skill</p>
                                : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <RadarChart data={skillRadarData}>
                                            <PolarGrid stroke="#e5e7eb" className="dark:[&>line]:stroke-gray-700 dark:[&>polygon]:stroke-gray-700" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#9ca3af" }} />
                                            <Radar name="Skills" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} dot={{ r: 3, fill: "#8b5cf6" }} />
                                            <Tooltip content={<CustomTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                )
                            }
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Blogs - dengan konversi WIB untuk tanggal */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" /> Recent Blogs
                            </CardTitle>
                            <Link href="/dashboard/blogs" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                                All <ArrowRight className="w-3 h-3" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentBlogs.length === 0
                                ? <p className="text-xs text-gray-400 text-center py-6">Belum ada blog</p>
                                : (
                                    <div className="space-y-3">
                                        {recentBlogs.map((blog, i) => {
                                            const cfg = STATUS_CFG[blog.status] || STATUS_CFG.pending;
                                            const Icon = cfg.icon;
                                            return (
                                                <motion.div key={blog.id}
                                                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.6 + i * 0.04 }}
                                                    className="flex items-center gap-2.5"
                                                >
                                                    <div className={`p-1.5 rounded-md ${cfg.bg} shrink-0`}>
                                                        <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{blog.title}</p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {blog.created_at ? formatWIB(blog.created_at, "d MMM yyyy") : "-"}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                                                        style={{ color: cfg.color, backgroundColor: cfg.color + "22" }}>
                                                        {blog.status}
                                                    </span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )
                            }
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Contacts - dengan konversi WIB untuk tanggal (kalo ada) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.61 }}>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-rose-500" /> Recent Contacts
                            </CardTitle>
                            <Link href="/dashboard/contacts" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                                All <ArrowRight className="w-3 h-3" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentContacts.length === 0
                                ? <p className="text-xs text-gray-400 text-center py-6">Belum ada pesan</p>
                                : (
                                    <div className="space-y-3">
                                        {recentContacts.map((c, i) => (
                                            <motion.div key={c.id}
                                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.63 + i * 0.04 }}
                                                className="flex items-center gap-2.5"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0">
                                                    <span className="text-white text-[11px] font-bold">{c.name?.[0]?.toUpperCase() || "?"}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{c.name}</p>
                                                    <p className="text-[10px] text-gray-400 truncate">{c.subject}</p>
                                                </div>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                                                    !c.status || c.status === "unread"
                                                        ? "text-blue-600 bg-blue-500/10"
                                                        : "text-gray-500 bg-gray-100 dark:bg-gray-800"
                                                }`}>
                                                    {c.status || "unread"}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )
                            }
                        </CardContent>
                    </Card>
                </motion.div>

            </div>
        </div>
    );
}