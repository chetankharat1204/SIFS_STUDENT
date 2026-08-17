// types/courseTypes.ts
export type Status = "ongoing" | "complete" | "saved";
export type CourseProgressStatus = "ongoing" | "complete" | "bookmarked";

export interface Course {
    id: string;
    courseId?: number;
    title: string;
    durationHours: number;
    progress: number; // 0-100
    status: Status;
    thumbnail?: string;
    subjectID?: number;
    subject_name?: string;
    course_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CourseDetail {
    id: number;
    course_id: number;
    course_name: string;
    subject_id: number;
    subject_name: string;
    description?: string;
    duration_hours: number;
    thumbnail_url?: string;
    status: CourseProgressStatus;
    progress_percentage: number;
    created_at: string;
    updated_at: string;
}

export interface Subject {
    id: number;
    course_id: number;
    subject_id: number;
    subject_name: string;
    subject_description?: string;
    sequence?: number;
    status?: string;
}

export interface LOS {
    id: number;
    los_id: number;
    los_title: string;
    los_description?: string;
    subject_id: number;
    subject_name: string;
    course_id: number;
    course_name: string;
    content?: string;
    sequence?: number;
    is_completed?: boolean;
    is_bookmarked?: boolean;
    has_note?: boolean;
    note_content?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Bookmark {
    id: number;
    course_id: number;
    course_name: string;
    subject_id: number;
    subject_name: string;
    los_id: number;
    los_title: string;
    created_at: string;
}

export interface Note {
    id: number;
    note_id?: number;
    course_id: number;
    course_name: string;
    subject_id: number;
    subject_name: string;
    los_id: number;
    los_title: string;
    note_content: string;
    created_at: string;
    updated_at: string;
}

export interface Instructor {
    id: number;
    name: string;
    position: string;
    image?: string;
    bio?: string;
    course_id?: number;
}

export interface PaginationResponse<T> {
    data: T[];
    pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        per_page: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    error?: string;
}