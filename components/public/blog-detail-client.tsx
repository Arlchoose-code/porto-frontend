"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, User, Calendar, Tag as TagIcon } from "lucide-react";
import { Blog } from "@/lib/types";
import ShareButton from "@/components/public/share-button";

interface BlogDetailClientProps {
    blog: Blog;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function BlogDetailClient({ blog }: BlogDetailClientProps) {
    return (
        <div>
            <div className="max-w-6xl mx-auto px-8 sm:px-16 py-12 lg:py-20">
                {/* Back */}
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                    <Link href="/blog"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        All Posts
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-8">

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {blog.tags.map(tag => (
                                <Link key={tag.id} href={`/blog?tag=${tag.slug}`}
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
                                    <TagIcon className="w-3 h-3" /> {tag.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">{blog.title}</h1>

                    {blog.description && (
                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">{blog.description}</p>
                    )}

                    {/* Meta + Share */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                {blog.author === "aibys"
                                    ? <><Bot className="w-4 h-4" /> Syahril&apos;s AI Assistant (Aibys AI)</>
                                    : <><User className="w-4 h-4" /> {blog.user?.name || "Syahril"}</>}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDate(blog.created_at)}
                            </div>
                        </div>
                        <ShareButton title={blog.title} description={blog.description} />
                    </div>
                </motion.div>

                {/* Cover image */}
                {blog.cover_image && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative rounded-2xl overflow-hidden bg-muted mb-10"
                        style={{ aspectRatio: "16/9" }}>
                        <Image src={blog.cover_image} alt={blog.title} fill className="object-cover" priority />
                    </motion.div>
                )}

                {/* Content */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}>
                    <div
                        className="prose prose-neutral dark:prose-invert max-w-none
                            prose-headings:font-bold prose-headings:tracking-tight
                            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                            prose-p:text-muted-foreground prose-p:leading-relaxed
                            prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 hover:prose-a:opacity-70
                            prose-strong:text-foreground
                            prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
                            prose-blockquote:border-l-foreground prose-blockquote:text-muted-foreground
                            prose-img:rounded-xl prose-img:border prose-img:border-border
                            prose-li:text-muted-foreground
                            prose-hr:border-border"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                    />
                </motion.div>
            </div>
        </div>
    );
}