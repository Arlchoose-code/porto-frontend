import { NextRequest, NextResponse } from "next/server";

async function handler(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const search = req.nextUrl.search;

    const API_URL = process.env.API_URL ?? "http://localhost:3000/api";
    const url = `${API_URL}/${path.join("/")}${search}`;

    const contentType = req.headers.get("Content-Type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    const headers: Record<string, string> = {};
    const auth = req.headers.get("Authorization");
    if (auth) headers["Authorization"] = auth;

    let body: BodyInit | undefined;

    if (req.method !== "GET" && req.method !== "HEAD") {
        if (isMultipart) {
            // Rebuild FormData agar boundary di-handle otomatis oleh fetch
            const formData = await req.formData();
            const newFormData = new FormData();
            for (const [key, value] of formData.entries()) {
                newFormData.append(key, value);
            }
            body = newFormData;
            // Jangan set Content-Type — biar fetch set sendiri dengan boundary
        } else {
            headers["Content-Type"] = contentType || "application/json";
            body = await req.text();
        }
    }

    const res = await fetch(url, { method: req.method, headers, body });
    const data = await res.text();

    return new NextResponse(data, {
        status: res.status,
        headers: {
            "Content-Type": res.headers.get("Content-Type") || "application/json",
        },
    });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;