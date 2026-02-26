"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Search, X, Wrench, ArrowRight } from "lucide-react";
import { Tool } from "@/lib/types";

interface ToolsClientProps {
    tools: Tool[];
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    return (
        <motion.div ref={ref} className={className}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    );
}

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });

    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}>
            <Link href={`/tools/${tool.slug}`}
                className="group flex flex-col h-full rounded-2xl border border-border bg-background hover:border-foreground/20 hover:shadow-sm overflow-hidden transition-all duration-200 p-5">

                {/* Icon + arrow */}
                <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-foreground/5 transition-colors">
                        {tool.icon ? (
                            <Image src={tool.icon} alt={tool.name} width={24} height={24} className="rounded-sm object-contain" />
                        ) : (
                            <Wrench className="w-5 h-5 text-muted-foreground" />
                        )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>

                {/* Name */}
                <h2 className="text-sm font-bold text-foreground leading-snug mb-1.5 group-hover:text-foreground/70 transition-colors">
                    {tool.name}
                </h2>

                {/* Description */}
                {tool.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                        {tool.description}
                    </p>
                )}

                {/* Category */}
                {tool.category && (
                    <div className="mt-4 pt-3 border-t border-border">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {tool.category}
                        </span>
                    </div>
                )}
            </Link>
        </motion.div>
    );
}

export default function ToolsClient({ tools }: ToolsClientProps) {
    const [search, setSearch] = useState("");

    // Group by category
    const filtered = search.trim()
        ? tools.filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase()) ||
            t.category?.toLowerCase().includes(search.toLowerCase())
        )
        : tools;

    const categories = Array.from(new Set(filtered.map(t => t.category || "General"))).sort();

    return (
        <div className="overflow-x-hidden w-full">
            {/* HERO */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 py-20 lg:py-28">
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4 block">Utilities</span>
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">Tools</h1>
                    <p className="text-lg text-muted-foreground max-w-xl">
                        A collection of handy utilities for everyday developer tasks.
                    </p>
                </motion.div>
            </section>

            {/* SEARCH */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 pb-10">
                <FadeUp>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search tools..."
                            className="w-full pl-11 pr-10 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                        />
                        {search && (
                            <button onClick={() => setSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </FadeUp>
            </section>

            {/* TOOLS BY CATEGORY */}
            <section className="max-w-6xl mx-auto px-8 sm:px-16 pb-24 space-y-14">
                {filtered.length === 0 ? (
                    <FadeUp>
                        <div className="py-20 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                <Wrench className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground mb-1">No tools found</p>
                            <p className="text-xs text-muted-foreground">Try a different search term.</p>
                        </div>
                    </FadeUp>
                ) : (
                    categories.map(category => {
                        const categoryTools = filtered.filter(t => (t.category || "General") === category);
                        return (
                            <FadeUp key={category}>
                                <div>
                                    <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-5">{category}</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {categoryTools.map((tool, i) => (
                                            <ToolCard key={tool.id} tool={tool} index={i} />
                                        ))}
                                    </div>
                                </div>
                            </FadeUp>
                        );
                    })
                )}
            </section>
        </div>
    );
}