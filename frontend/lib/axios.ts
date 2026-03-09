import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
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
