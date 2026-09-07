import {
  getCompanies as getCompaniesApi,
  createCompany as createCompanyApi,
  updateCompany as updateCompanyApi,
  deleteCompany as deleteCompanyApi,
  generateCompanySummary as generateCompanySummaryApi
} from "../api/myJobBoard/features/companies/companiesApi";
import Company from "../models/opportunities/Company";

const getCompanies = async () => {
  return getCompaniesApi();
};

const createCompany = async (company: Company) => {
  return createCompanyApi(company);
};

const updateCompany = async (company: Company) => {
  return updateCompanyApi(company);
};

const deleteCompany = async (id: string) => {
  return deleteCompanyApi(id);
};

const generateCompanySummary = async (companyName: string) => {
  return generateCompanySummaryApi(companyName);
};

export { getCompanies, createCompany, updateCompany, deleteCompany, generateCompanySummary };