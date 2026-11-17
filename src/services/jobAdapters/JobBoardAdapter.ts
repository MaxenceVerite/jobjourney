// src/services/jobAdapters/JobBoardAdapter.ts

export interface ExtractedJobData {
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriodicity?: "Yearly" | "Monthly" | "Daily";
  contractType?: string; // CDI, CDD, Freelance, Stage, Alternance, Intérim
  remoteCondition?: "Remote" | "Hybrid" | "Office";
  description?: string;
  url?: string;
  logoUrl?: string;
  sourceJobBoard: string;
  skills?: string[];
  externalReference?: string;
  experienceLevel?: string;
  publishedAt?: string;
}

export interface JobBoardAdapter {
  readonly name: string;
  matches(url: string, doc: Document): boolean;
  extract(doc: Document, url: string): Partial<ExtractedJobData>;
}
