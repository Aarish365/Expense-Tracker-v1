import api from './api';

export const budgetService = {
  get: (month, year) => api.get('/budget', { params: { month, year } }),
  list: () => api.get('/budget/list'),
  save: (data) => api.post('/budget', data),
  update: (id, amount) => api.put(`/budget/${id}`, { amount }),
  delete: (id) => api.delete(`/budget/${id}`),
};
