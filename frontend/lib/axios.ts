import axios from 'axios';
import toast from 'react-hot-toast';
import { getAuthToken } from './auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure Content-Type is set if not already present, or if it was removed from the initial config
    if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (!error.response) {
            // Network error (backend is down)
            toast.error('Backend Connection Error');
        } else {
            // Handle other types of API errors if needed
            const message = error.response.data?.message || 'Something went wrong';
            toast.error(message);
        }
        return Promise.reject(error);
    }
);

export default api;
