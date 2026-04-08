import axios from 'axios';

// Determine API base URL based on environment
// For local development: http://localhost:5000/api
// For production: Use the deployed backend URL
const getBaseURL = () => {
  // If running on localhost:3000 (development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // For production (Netlify or other hosting)  
  // IMPORTANT: Update this with your actual deployed backend URL
  const url = process.env.REACT_APP_API_URL || 'http://library-backend-env.eba-7et24bke.us-east-1.elasticbeanstalk.com/api';
  console.log(`Using API URL: ${url}`);
  return url;
};

const API = axios.create({
  baseURL: getBaseURL(),
});

// Gắn token vào mỗi request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['x-access-token'] = token;
  }
  return config;
});

// Xử lý khi token hết hạn
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${getBaseURL()}/auth/refresh-token`, {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers['x-access-token'] = data.accessToken;
        return API(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
