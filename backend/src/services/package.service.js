import ApiError from '../utils/ApiError.js';
import * as packageModel from '../models/package.model.js';

export const toPublicPackage = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: row.description,
  pricePerMonth: row.price_per_month,
  maxTasks: row.max_tasks, // null = không giới hạn
  tier: row.tier,
  features: row.features, // mysql2 tự chuyển cột JSON thành mảng
});

export const listPackages = async () => {
  const rows = await packageModel.findAllActive();
  return rows.map(toPublicPackage);
};

export const getPackageByCode = async (code) => {
  const row = await packageModel.findActiveByCode(code);
  if (!row) throw new ApiError(404, 'PACKAGE_NOT_FOUND', 'Không tìm thấy gói');
  return toPublicPackage(row);
};
