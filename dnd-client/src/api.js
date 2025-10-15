import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://vibing-dnd.vercel.app/api'
  : 'http://localhost:5001/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;