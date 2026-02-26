import { NextRequest, NextResponse } from "next/server";

const PAGE_VISIBILITY: Record<string, string> = {
    "/blog": "show_blog",
    "/projects": "show_projects",
    "/tools": "show_tools",
    "/bookmarks": "show_bookmarks",
    "/contact": "show_contact",
};

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname === "/maintenance"
    ) {
        return NextResponse.next();
    }

    try {
        const res = await fetch(`${process.env.API_URL}/settings`, {
            cache: "no-store",
        });
        const json = await res.json();
        const settings = json.data || {};

        // Cek maintenance mode
        if (settings.maintenance_mode === "true") {
            const url = req.nextUrl.clone();
            url.pathname = "/maintenance";
            return NextResponse.rewrite(url);
        }

        // Cek visibility — kalau show_xxx = "false", redirect ke /
        const segment = "/" + pathname.split("/")[1];
        const visibilityKey = PAGE_VISIBILITY[segment];
        if (visibilityKey && settings[visibilityKey] === "false") {
            return NextResponse.redirect(new URL("/", req.url));
        }

    } catch {
        // kalau backend mati, lanjut aja
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};