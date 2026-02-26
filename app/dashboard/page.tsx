"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
    FileText, FolderOpen, Wrench, Bookmark,
    Mail, Star, GraduationCap, Briefcase,
    ArrowRight, TrendingUp
} from "lucide-react";

interface Stats {
    blogs: number;
    projects: number;
    tools: number;
    bookmarks: number;
    contacts: number;
    skills: number;
    educations: number;
    experiences: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({
        blogs: 0, projects: 0, tools: 0, bookmarks: 0,
        contacts: 0, skills: 0, educations: 0, experiences: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            const [blogs, projects, tools, bookmarks, contacts, skills, educations, experiences] =
                await Promise.allSettled([
                    api.get("/blogs/all"),
                    api.get("/projects"),
                    api.get("/tools/all"),
                    api.get("/bookmarks"),
                    api.get("/contacts"),
                    api.get("/skills"),
                    api.get("/educations"),
                    api.get("/experiences"),
                ]);

            setStats({
                blogs: blogs.status === "fulfilled" ? blogs.value.data.meta?.total || blogs.value.data.data?.length || 0 : 0,
                projects: projects.status === "fulfilled" ? projects.value.data.data?.length || 0 : 0,
                tools: tools.status === "fulfilled" ? tools.value.data.data?.length || 0 : 0,
                bookmarks: bookmarks.status === "fulfilled" ? bookmarks.value.data.meta?.total || bookmarks.value.data.data?.length || 0 : 0,
                contacts: contacts.status === "fulfilled" ? contacts.value.data.data?.length || 0 : 0,
                skills: skills.status === "fulfilled" ? skills.value.data.data?.length || 0 : 0,
                educations: educations.status === "fulfilled" ? educations.value.data.data?.length || 0 : 0,
                experiences: experiences.status === "fulfilled" ? experiences.value.data.data?.length || 0 : 0,
            });
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: "Blogs", value: stats.blogs, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", href: "/dashboard/blogs" },
        { label: "Projects", value: stats.projects, icon: FolderOpen, color: "text-purple-500", bg: "bg-purple-500/10", href: "/dashboard/projects" },
        { label: "Tools", value: stats.tools, icon: Wrench, color: "text-green-500", bg: "bg-green-500/10", href: "/dashboard/tools" },
        { label: "Bookmarks", value: stats.bookmarks, icon: Bookmark, color: "text-yellow-500", bg: "bg-yellow-500/10", href: "/dashboard/bookmarks" },
        { label: "Contacts", value: stats.contacts, icon: Mail, color: "text-red-500", bg: "bg-red-500/10", href: "/dashboard/contacts" },
        { label: "Skills", value: stats.skills, icon: Star, color: "text-orange-500", bg: "bg-orange-500/10", href: "/dashboard/skills" },
        { label: "Educations", value: stats.educations, icon: GraduationCap, color: "text-teal-500", bg: "bg-teal-500/10", href: "/dashboard/educations" },
        { label: "Experiences", value: stats.experiences, icon: Briefcase, color: "text-pink-500", bg: "bg-pink-500/10", href: "/dashboard/experiences" },
    ];

    return (
        <div className="space-y-8">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                        Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Overview semua data portfolio kamu
                    </p>
                </div>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.07, duration: 0.35 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                        <Link href={stat.href}>
                            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md dark:hover:shadow-blue-500/5 transition-all duration-200 cursor-pointer group">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                        {stat.label}
                                    </CardTitle>
                                    <motion.div
                                        className={`p-2 rounded-lg ${stat.bg}`}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    </motion.div>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between">
                                    <motion.div
                                        className="text-2xl font-bold text-gray-900 dark:text-white"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: index * 0.07 + 0.2, type: "spring", bounce: 0.4 }}
                                    >
                                        {stat.value}
                                    </motion.div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}