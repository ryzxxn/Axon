import axios from 'axios';

// Create an instance of axios
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL, // Base API URL
    withCredentials: true, // Include cookies in requests
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://api.axonn.xyz/',
    },
});

// Interceptor for debugging (optional)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Axios error:', error.response || error.message);
        return Promise.reject(error);
    }
);

export default axiosInstance;