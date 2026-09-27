import * as packageService from '../services/package.service.js';
import { ALLOWED_MONTHS } from '../config/catalog.js';

export const list = async (req, res) => {
  const packages = await packageService.listPackages();
  res.json({ success: true, data: { packages, monthOptions: ALLOWED_MONTHS } });
};

export const getByCode = async (req, res) => {
  const pkg = await packageService.getPackageByCode(req.params.code);
  res.json({ success: true, data: { package: pkg } });
};
