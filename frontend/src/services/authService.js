import API from './axiosConfig';

export const authService = {
  signup: (userData) => API.post('/auth/signup', userData),
  signin: (credentials) => API.post('/auth/signin', credentials),
  verifyToken: () => API.get('/auth/verify'),
  refreshToken: (refreshToken) => API.post('/auth/refresh-token', { refreshToken }),
};

export default authService;
