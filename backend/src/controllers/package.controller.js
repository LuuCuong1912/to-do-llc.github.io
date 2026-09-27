import * as packageService from '../services/package.service.js';

export const list = async (req, res) => {
  const packages = await packageService.listPackages();
  res.json({ success: true, data: { packages } });
};

export const getByCode = async (req, res) => {
  const pkg = await packageService.getPackageByCode(req.params.code);
  res.json({ success: true, data: { package: pkg } });
};
