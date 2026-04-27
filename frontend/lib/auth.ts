import axios from 'axios';

const TOKEN_KEY = 'hms_token';
const USER_KEY = 'hms_user';

export const setAuthData = (token: string, user: any) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const getAuthUser = () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
};

export const clearAuthData = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('studentIndex');
    localStorage.removeItem('auth_data'); // Legacy key if any
};

export const isAuthenticated = () => {
    return !!getAuthToken();
};
