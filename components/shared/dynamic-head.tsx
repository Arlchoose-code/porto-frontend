"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/components/shared/settings-provider";

const PAGE_TITLES: Record<string, string> = {
    "/": "",
    "/about": "About",
    "/projects": "Projects",
    "/blog": "Blog",
    "/bookmarks": "Bookmarks",
    "/contact": "Contact",
    "/tools": "Tools",
};

// Slug pages yang title-nya dihandle oleh generateMetadata
const SLUG_SEGMENTS = ["/blog", "/projects", "/tools"];

export default function DynamicHead() {
    const pathname = usePathname();
    const { settings, loading } = useSettings();

    useEffect(() => {
        if (loading) return;

        const siteName = settings.site_title || "Syahril Portfolio";
        const segment = "/" + pathname.split("/")[1];

        // Kalau ini slug page (ada path ke-3), skip — biarkan generateMetadata yang handle
        const isSlugPage = SLUG_SEGMENTS.includes(segment) && pathname.split("/").length > 2;
        if (isSlugPage) return;

        const pageTitle = PAGE_TITLES[segment] ?? "";
        document.title = pageTitle ? `${pageTitle} - ${siteName}` : siteName;
    }, [pathname, settings.site_title, loading]);

    return null;
}