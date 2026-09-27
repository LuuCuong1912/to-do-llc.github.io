import { request } from './http.js';

export const getPackages = async () => (await request('/packages')).packages;
