import axios, { AxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Get environment variables with fallbacks
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'sifsStudentAuthToken';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // If it's FormData, remove the Content-Type header to let browser set it
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem('studentData');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Generic API call function
export const apiCall = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: any
): Promise<{ data: T | null; error: string | null }> => {
    try {
        const response: AxiosResponse<T> = await api({
            method,
            url,
            data,
            ...config,
        });

        return { data: response.data, error: null };
    } catch (error: any) {
        console.error('API Error:', error);

        // Handle network errors
        if (error.message === 'Network Error') {
            return { data: null, error: 'Network error. Please check your connection.' };
        }

        // Handle specific error responses from backend
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'An error occurred';

        return { data: null, error: errorMessage };
    }
};

// Types
export interface NotificationItem {
    id: number;
    type: string;
    type_label: string;
    item_name: string; // may contain HTML tags
    course_name: string;
    start_date: string;
    end_date: string;
    days_remaining: number;
    urgency_level: 'high' | 'medium' | 'low';
    urgency_label: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface ZoomMeeting {
    id: number;
    meetingId: string | number;
    topic: string;
    start_time: string;
    duration: number;
    joinUrl: string;
    course_type: string;
    course_id: string | number;
    password?: string;
    recording_url?: string;
}

// Student Auth API functions
export const studentAuthAPI = {
    login: (username: string, password: string) =>
        apiCall<{
            success: boolean;
            message: string;
            token: string;
            user?: any;
        }>('POST', '/EducationAndInternship/Student/auth/login', { username, password }),

    logout: async () => {
        try {
            await api.post('/EducationAndInternship/Student/auth/logout');
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear all student-related data from local storage
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem('studentData');
            localStorage.removeItem('dashboard-active-tab');
            // Remove legacy keys if any
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    getProfile: () => apiCall<{
        success: boolean;
        message: string;
        data?: {
            user: {
                id: number;
                name: string;
                email: string;
                phone: string;
                address: string;
                state: string;
                country: string;
                image_url: string;
                [key: string]: any;
            };
        };
    }>('GET', '/EducationAndInternship/Student/auth/profile'),

    updateProfile: (data: FormData) =>
        apiCall<{
            success: boolean;
            message: string;
            data?: any;
        }>('PUT', '/EducationAndInternship/Student/auth/profile', data),

    forgetPassword: (email: string) =>
        apiCall<{
            success: boolean;
            message: string;
        }>('POST', '/EducationAndInternship/Student/forget-password/sendmail', { email }),

    getNotifications: () =>
        apiCall<{
            success: boolean;
            message: string;
            statusCode: number;
            data: {
                student: { id: number; name: string; email: string };
                total_notifications: number;
                notifications: NotificationItem[];
                grouped: {
                    due_today: NotificationItem[];
                    in_1_day: NotificationItem[];
                    in_2_days: NotificationItem[];
                    in_3_days: NotificationItem[];
                    in_7_days: NotificationItem[];
                };
                generated_at: string;
            };
        }>('GET', '/EducationAndInternship/Student/notifications'),

    getZoomMeetings: () =>
        apiCall<{
            success: boolean;
            message: string;
            data: ZoomMeeting[];
        }>('GET', '/EducationAndInternship/Student/zoom/my-meetings'),
};

// CRUD convenience functions
export const apiService = {
    get: <T>(url: string, config?: any) => apiCall<T>('GET', url, undefined, config),
    post: <T>(url: string, data?: any, config?: any) => apiCall<T>('POST', url, data, config),
    put: <T>(url: string, data?: any, config?: any) => apiCall<T>('PUT', url, data, config),
    patch: <T>(url: string, data?: any, config?: any) => apiCall<T>('PATCH', url, data, config),
    delete: <T>(url: string, config?: any) => apiCall<T>('DELETE', url, undefined, config),
};

// Export default axios instance
export default api;