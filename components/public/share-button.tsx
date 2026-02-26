"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Link, Twitter, Check } from "lucide-react";

interface ShareButtonProps {
    title: string;
    description?: string;
}

export default function ShareButton({ title, description }: ShareButtonProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const url = typeof window !== "undefined" ? window.location.href : "";

    const copyLink = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    };

    const shareTwitter = () => {
        const text = `${title}${description ? `\n${description}` : ""}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
        setOpen(false);
    };

    const shareNative = async () => {
        if (navigator.share) {
            await navigator.share({ title, text: description, url });
            setOpen(false);
        }
    };

    const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

    return (
        <div className="relative">
            <motion.button
                onClick={() => setOpen(o => !o)}
                whileTap={{ scale: 0.92 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
                <Share2 className="w-3.5 h-3.5" />
                Share
            </motion.button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <motion.div
                            className="absolute left-0 sm:right-0 sm:left-auto top-10 z-20 bg-background border border-border rounded-xl shadow-lg p-1.5 min-w-[160px]"
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                        >
                            <button
                                onClick={copyLink}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link className="w-3.5 h-3.5" />}
                                {copied ? "Copied!" : "Copy link"}
                            </button>
                            <button
                                onClick={shareTwitter}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                            >
                                <Twitter className="w-3.5 h-3.5" />
                                Share to X
                            </button>
                            {hasNativeShare && (
                                <button
                                    onClick={shareNative}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                    More options
                                </button>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}