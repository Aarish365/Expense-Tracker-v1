import api from './api';

// filters example: { type: 'expense', month: 11, year: 2026, search: 'rent' }
export const transactionService = {
  getAll: (filters = {}) => api.get('/transactions', { params: filters }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};
