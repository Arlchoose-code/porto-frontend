import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "revalidate_secret";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { secret, type, slug } = body;

        if (secret !== REVALIDATE_SECRET) {
            return NextResponse.json({ success: false, message: "Invalid secret" }, { status: 401 });
        }

        switch (type) {
            case "profile":
            case "settings":
                revalidatePath("/");
                revalidatePath("/about");
                revalidatePath("/contact");
                break;

            case "blog":
                revalidatePath("/blog");
                if (slug) revalidatePath(`/blog/${slug}`);
                break;

            case "project":
                revalidatePath("/");
                revalidatePath("/projects");
                if (slug) revalidatePath(`/projects/${slug}`);
                break;

            case "skill":
            case "education":
            case "experience":
            case "course":
                revalidatePath("/");
                revalidatePath("/about");
                break;

            case "bookmark":
                revalidatePath("/bookmarks");
                break;

            case "tool":
                revalidatePath("/tools");
                if (slug) revalidatePath(`/tools/${slug}`);
                break;

            default:
                // Revalidate semua
                revalidatePath("/");
                revalidatePath("/about");
                revalidatePath("/blog");
                revalidatePath("/projects");
                revalidatePath("/bookmarks");
                revalidatePath("/tools");
                revalidatePath("/contact");
        }

        return NextResponse.json({ success: true, message: `Revalidated: ${type}` });
    } catch (err) {
        return NextResponse.json({ success: false, message: "Error revalidating" }, { status: 500 });
    }
}