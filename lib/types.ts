export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PaginatedApiResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    meta: PaginationMeta;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

export interface Settings {
    site_title?: string;
    site_description?: string;
    site_keywords?: string;
    site_author?: string;
    site_url?: string;
    site_language?: string;
    logo_url?: string;
    favicon_url?: string;
    theme_color?: string;
    og_type?: string;
    og_image?: string;
    og_locale?: string;
    twitter_handle?: string;
    footer_text?: string;
    google_analytics?: string;
    facebook_pixel?: string;
    hotjar_id?: string;
    show_blog?: string;
    show_projects?: string;
    show_tools?: string;
    show_bookmarks?: string;
    show_experiences?: string;
    show_educations?: string;
    show_courses?: string;
    show_skills?: string;
    show_contact?: string;
    contact_email?: string;
    maintenance_mode?: string;
    maintenance_message?: string;
}

export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: number;
    name: string;
    tagline: string;
    bio: string;
    avatar: string;
    resume_url: string;
    github: string;
    linkedin: string;
    twitter: string;
    instagram: string;
    email: string;
    phone: string;
    location: string;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

export interface Blog {
    id: number;
    title: string;
    slug: string;
    description: string;
    content: string;
    cover_image: string;
    author: string;
    status: "pending" | "published" | "rejected" | "archived";
    reject_comment: string;
    user_id: number | null;
    user: User | null;
    tags: Tag[];
    created_at: string;
    updated_at: string;
}

export interface Skill {
    id: number;
    name: string;
    category: string;
    level: string;
    icon_url: string;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface Education {
    id: number;
    school: string;
    degree: string;
    field: string;
    start_year: number;
    end_year: number;
    description: string;
    logo_url: string;
    created_at: string;
    updated_at: string;
}

export interface Course {
    id: number;
    title: string;
    issuer: string;
    issued_at: string;
    expired_at: string;
    credential_url: string;
    description: string;
    certificate_image: string;
    created_at: string;
    updated_at: string;
}

export interface ExperienceImage {
    id: number;
    experience_id: number;
    image_url: string;
    order: number;
}

export interface Experience {
    id: number;
    company: string;
    role: string;
    location: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description: string;
    images: ExperienceImage[];
    created_at: string;
    updated_at: string;
}

export interface ProjectTechStack {
    id: number;
    project_id: number;
    name: string;
}

export interface ProjectImage {
    id: number;
    project_id: number;
    image_url: string;
    order: number;
}

export interface Project {
    id: number;
    title: string;
    slug: string;
    description: string;
    content: string;
    platform: string;
    url: string;
    cover_image: string;
    is_featured: boolean;
    tech_stacks: ProjectTechStack[];
    images: ProjectImage[];
    created_at: string;
    updated_at: string;
}

export interface BookmarkTopic {
    id: number;
    bookmark_id: number;
    name: string;
}

export interface Bookmark {
    id: number;
    url: string;
    title: string;
    description: string;
    topics: BookmarkTopic[];
    created_at: string;
    updated_at: string;
}

export interface Contact {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    read_at: string | null;
    done_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Tool {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: string;
    icon: string;
    is_active: boolean;
    order: number;
    created_at: string;
    updated_at: string;
}