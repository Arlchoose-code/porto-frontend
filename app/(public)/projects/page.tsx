import { Metadata } from "next";
import { Project } from "@/lib/types";
import ProjectsClient from "@/components/public/projects-client";

async function getData() {
    const base = process.env.API_URL;
    const res = await fetch(`${base}/projects`, { next: { revalidate: 60 } });
    const projects: Project[] = res.ok ? (await res.json()).data || [] : [];
    return { projects };
}

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Projects" };
}

export default async function ProjectsPage() {
    const { projects } = await getData();
    return <ProjectsClient projects={projects} />;
}