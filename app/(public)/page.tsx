import { cache } from "react";
import { Settings, Profile, Project, Skill, Experience, Blog, Bookmark } from "@/lib/types";
import HomeClient from "@/components/public/home-client";

// cache() deduplicate panggilan identik dalam 1 request — tidak fetch 2x
const getData = cache(async () => {
    const base = process.env.API_URL;
    const [settingsRes, profileRes, projectsRes, skillsRes, experiencesRes, blogsRes, bookmarksRes] = await Promise.all([
        fetch(`${base}/settings`,          { next: { revalidate: 3600 } }),
        fetch(`${base}/profile`,           { next: { revalidate: 3600 } }),
        fetch(`${base}/projects`,          { next: { revalidate: 3600 } }),
        fetch(`${base}/skills`,            { next: { revalidate: 3600 } }),
        fetch(`${base}/experiences`,       { next: { revalidate: 3600 } }),
        fetch(`${base}/blogs?limit=24`,    { next: { revalidate: 3600 } }),
        fetch(`${base}/bookmarks?limit=50`,{ next: { revalidate: 3600 } }),
    ]);

    const settings: Settings  = settingsRes.ok  ? (await settingsRes.json()).data  || {}   : {};
    const profile: Profile | null = profileRes.ok ? (await profileRes.json()).data || null : null;
    const allProjects: Project[]  = projectsRes.ok ? (await projectsRes.json()).data || [] : [];
    const skills: Skill[]         = skillsRes.ok   ? (await skillsRes.json()).data   || [] : [];
    const experiences: Experience[] = experiencesRes.ok ? (await experiencesRes.json()).data || [] : [];
    const allBlogs: Blog[]        = blogsRes.ok    ? (await blogsRes.json()).data    || [] : [];
    const blogs = allBlogs.filter((b: Blog) => b.status === "published").slice(0, 12);
    const bookmarks: Bookmark[]   = bookmarksRes.ok ? (await bookmarksRes.json()).data || [] : [];
    const featuredProjects = allProjects.slice(0, 3);

    return { settings, profile, featuredProjects, skills, experiences, blogs, bookmarks };
});

export default async function HomePage() {
    const data = await getData();
    return <HomeClient {...data} />;
}