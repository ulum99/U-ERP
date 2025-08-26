import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Interceptor untuk menambahkan header pada setiap request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    const activeBranch = localStorage.getItem('activeBranch');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (activeBranch) {
        config.headers['X-Branch-ID'] = activeBranch;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default api;