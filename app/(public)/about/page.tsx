import { Metadata } from "next";
import { Settings, Profile, Skill, Education, Experience, Course } from "@/lib/types";
import AboutClient from "@/components/public/about-client";

async function getData() {
    const base = process.env.API_URL;
    const [settingsRes, profileRes, skillsRes, educationsRes, experiencesRes, coursesRes] = await Promise.all([
        fetch(`${base}/settings`, { next: { revalidate: 60 } }),
        fetch(`${base}/profile`, { next: { revalidate: 60 } }),
        fetch(`${base}/skills`, { next: { revalidate: 60 } }),
        fetch(`${base}/educations`, { next: { revalidate: 60 } }),
        fetch(`${base}/experiences`, { next: { revalidate: 60 } }),
        fetch(`${base}/courses`, { next: { revalidate: 60 } }),
    ]);

    const settings: Settings = settingsRes.ok ? (await settingsRes.json()).data || {} : {};
    const profile: Profile | null = profileRes.ok ? (await profileRes.json()).data || null : null;
    const skills: Skill[] = skillsRes.ok ? (await skillsRes.json()).data || [] : [];
    const educations: Education[] = educationsRes.ok ? (await educationsRes.json()).data || [] : [];
    const experiences: Experience[] = experiencesRes.ok ? (await experiencesRes.json()).data || [] : [];
    const courses: Course[] = coursesRes.ok ? (await coursesRes.json()).data || [] : [];

    return { settings, profile, skills, educations, experiences, courses };
}

export async function generateMetadata(): Promise<Metadata> {
    const { settings } = await getData();
    return {
        title: `About - ${settings.site_title || "Portfolio"}`,
    };
}

export default async function AboutPage() {
    const data = await getData();
    return <AboutClient {...data} />;
}