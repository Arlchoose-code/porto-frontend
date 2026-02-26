"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Settings } from "@/lib/types";
import { motion, useInView } from "framer-motion";
import { Heart, Github, Linkedin, Twitter, Instagram } from "lucide-react";

export default function Footer() {
    const [settings, setSettings] = useState<Settings>({});
    const [profile, setProfile] = useState<any>({});
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        api.get("/settings").then((res) => setSettings(res.data.data));
        api.get("/profile").then((res) => setProfile(res.data.data)).catch(() => {});
    }, []);

    const socialLinks = [
        { icon: Github, href: profile.github, label: "GitHub" },
        { icon: Linkedin, href: profile.linkedin, label: "LinkedIn" },
        { icon: Twitter, href: profile.twitter, label: "Twitter" },
        { icon: Instagram, href: profile.instagram, label: "Instagram" },
    ].filter((s) => s.href);

    return (
        <motion.footer
            ref={ref}
            className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
        >
            <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">

                {/* Footer text */}
                <motion.p
                    className="text-sm text-gray-500 dark:text-gray-500"
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.1 }}
                >
                    {settings.footer_text || "© 2026 Portfolio. All rights reserved."}
                </motion.p>

                {/* Center — made with */}
                <motion.div
                    className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600"
                    initial={{ opacity: 0, y: 5 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 }}
                >
                    <span>Made with</span>
                    <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5 }}
                    >
                        <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                    </motion.div>
                    <span>& Next.js</span>
                </motion.div>

                {/* Social links */}
                {socialLinks.length > 0 && (
                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: 10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.3 }}
                    >
                        {socialLinks.map((social, index) => (
                            <motion.a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                whileHover={{ scale: 1.15, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.3 + index * 0.05 }}
                            >
                                <social.icon className="w-4 h-4" />
                            </motion.a>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.footer>
    );
}