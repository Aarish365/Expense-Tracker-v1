import api from './api';

export const reportService = {
  get: ({ startDate, endDate, type }) => api.get('/reports', { params: { startDate, endDate, type } }),
};
