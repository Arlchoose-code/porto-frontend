import { cache } from "react";
import { Metadata } from "next";
import { Profile } from "@/lib/types";
import ContactClient from "@/components/public/contact-client";

const getProfile = cache(async (): Promise<Profile | null> => {
    try {
        const res = await fetch(`${process.env.API_URL}/profile`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        return (await res.json()).data || null;
    } catch {
        return null;
    }
});

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Contact" };
}

export default async function ContactPage() {
    const profile = await getProfile();
    return <ContactClient profile={profile} />;
}