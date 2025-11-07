import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Question } from 'exampro-shared';

// API response types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface AuthResponse {
  token: string;
  user: {
    email: string;
    name: string;
  };
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  async googleAuth(idToken: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/google', { idToken });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Authentication failed');
    }
    return response.data.data;
  },

  async refreshToken(): Promise<string> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token to refresh');
    }

    const response = await api.post<ApiResponse<{ token: string }>>('/auth/refresh', { token });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Token refresh failed');
    }
    return response.data.data.token;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },
};

// Questions API
export const questionsAPI = {
  async getSubjects(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/questions/subjects');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch subjects');
    }
    return response.data.data;
  },

  async getQuestions(subject?: string): Promise<Question[]> {
    const params = subject ? { subject } : {};
    const response = await api.get<ApiResponse<Question[]>>('/questions', { params });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch questions');
    }
    return response.data.data;
  },

  async getQuestion(id: number): Promise<Question> {
    const response = await api.get<ApiResponse<Question>>(`/questions/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch question');
    }
    return response.data.data;
  },

  async addQuestion(question: Omit<Question, 'No'>): Promise<Question> {
    const response = await api.post<ApiResponse<Question>>('/questions', question);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to add question');
    }
    return response.data.data;
  },

  async updateQuestion(question: Question): Promise<Question> {
    const response = await api.put<ApiResponse<Question>>(`/questions/${question.No}`, question);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update question');
    }
    return response.data.data;
  },

  async deleteQuestion(id: number): Promise<void> {
    const response = await api.delete<ApiResponse>(`/questions/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete question');
    }
  },

  async importQuestions(questions: Omit<Question, 'No'>[]): Promise<{ imported: number; total: number }> {
    const response = await api.post<ApiResponse<{ imported: number; total: number }>>('/questions/import', { questions });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to import questions');
    }
    return response.data.data;
  },
};

// Users API
export const usersAPI = {
  async getUsers(): Promise<Array<{ email: string; name: string }>> {
    const response = await api.get<ApiResponse<Array<{ email: string; name: string }>>>('/users');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch users');
    }
    return response.data.data;
  },

  async addUser(email: string, name?: string): Promise<void> {
    const response = await api.post<ApiResponse>('/users', { email, name });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to add user');
    }
  },

  async removeUser(email: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/users/${encodeURIComponent(email)}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to remove user');
    }
  },
};

// Health check
export const healthAPI = {
  async checkHealth(): Promise<{ status: string; timestamp: string; service: string }> {
    const response = await api.get<ApiResponse<{ status: string; timestamp: string; service: string }>>('/health');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Health check failed');
    }
    return response.data.data;
  },
};

export default api;