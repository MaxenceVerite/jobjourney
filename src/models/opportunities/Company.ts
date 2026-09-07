export default interface Company {
    id?: string,
    name: string,
    linkedinPageUrl?: string;
  websiteUrl?: string;

  // Gov API
  siret?: string;
  address?: string;
  employeeCount?: string;
  industry?: string;

  // AI Enrichment
  pitch?: string;
  competitors?: string;
  culture?: string;
  interviewTips?: string;

}