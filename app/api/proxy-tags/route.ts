import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";

    const params = new URLSearchParams({ page, limit });
    if (search) params.set("search", search);

    try {
        const res = await fetch(
            `${process.env.API_URL}/tags?${params}`,
            // No cache when searching, cache normally when paginating
            search ? { cache: "no-store" } : { next: { revalidate: 3600 } }
        );
        const json = await res.json();
        return NextResponse.json(json);
    } catch {
        return NextResponse.json({ data: [], meta: { total_pages: 1 } }, { status: 500 });
    }
}