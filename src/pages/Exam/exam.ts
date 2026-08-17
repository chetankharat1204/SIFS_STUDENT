export type ExamStatus = 'upcoming' | 'active' | 'completed' | 'pending' | 'not_attempted';

export interface Exam {
    id: string | number;
    student_exam_id?: number;
    course: string;
    examname: string;
    date: string;
    due_date?: string;
    start_date?: string;
    end_date?: string;
    status: ExamStatus;
    total_questions?: number;
    total_marks?: number;
    duration_minutes?: number;
    instructions?: string;
    is_active?: boolean;
    is_completed?: boolean;
    is_submitted?: boolean;
}

export interface Question {
    id: string | number;
    question_id: number;
    text: string;
    title?: string;
    options: Option[];
    marks?: number;
    type?: 'mcq' | 'multiple_answer' | 'descriptive';
    correct_answer?: string;
    explanation?: string;
}

export interface Option {
    id: string;
    text: string;
    is_correct?: boolean;
}

export interface AnswerState {
    questionId: string | number;
    question_id: number;
    selectedOptionId: string | null;
    answer: string | null;
    visited: boolean;
    flagged: boolean;
    answered: boolean;
    is_correct?: boolean;
    time_spent?: number;
}

export interface ExamStartResponse {
    success: boolean;
    message: string;
    data?: {
        student_exam_id: number;
        questions: Question[];
        total_questions: number;
        duration_minutes: number;
        current_question_index?: number;
        remaining_time?: number;
    };
}

export interface SubmitAnswerResponse {
    success: boolean;
    message: string;
    data?: {
        next_question?: Question;
        previous_question?: Question;
        current_question_index: number;
        total_questions: number;
        answers_submitted: number;
        remaining_time: number;
        is_completed?: boolean;
    };
}

export interface ExamResult {
    success: boolean;
    message: string;
    data?: {
        exam_id: number;
        student_exam_id: number;
        total_questions: number;
        total_marks: number;
        obtained_marks: number;
        percentage: number;
        pass_status: 'Pass' | 'Fail';
        time_taken: number;
        submitted_at: string;
        rank?: number;
        percentile?: number;
        detailed_results?: DetailedQuestionResult[];
    };
}

export interface DetailedQuestionResult {
    question_id: number;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    marks_obtained: number;
    total_marks: number;
    explanation?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: {
        data: T[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            items_per_page: number;
        };
    };
}