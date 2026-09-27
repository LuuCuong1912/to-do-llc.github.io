import { request } from './http.js';

// → { packages, monthOptions } — monthOptions (1, 3, 6, 12 tháng) do Backend quy định
export const getCatalog = () => request('/packages');
