import myJobBoardApiClient from "../../apiClient";

export interface FranceTravailJobOffer {
  id: string;
  intitule: string;
  description: string;
  dateCreation?: string;
  dateActualisation?: string;
  lieuTravail?: {
    libelle?: string;
    latitude?: number;
    longitude?: number;
    commune?: string;
  };
  entreprise?: {
    nom?: string;
    description?: string;
    logo?: string;
    entrepriseAdaptee?: boolean;
  };
  salaire?: {
    libelle?: string;
    commentaire?: string;
  };
  origineOffre?: {
    origine?: string;
    urlOrigine?: string;
  };
  typeContrat?: string;
  typeContratLibelle?: string;
  natureContrat?: string;
  experienceExige?: string;
  experienceLibelle?: string;
}

export interface FranceTravailSearchResponse {
  resultats: FranceTravailJobOffer[];
}

export interface SearchParams {
  keyword?: string;
  commune?: string;
  rayon?: number;
  typeContrat?: string;
  experience?: string;
  publishDate?: number;
  remoteMode?: string;
  educationLevel?: string;
  page?: number;
}

export interface SmartMatchOffer {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  location?: string;
  distanceKm?: number;
  contractType?: string;
  salaryText?: string;
  description?: string;
  externalUrl?: string;
  publishedAt?: string;

  globalFitScore: number;
  techFitScore: number;
  ambitionFitScore: number;
  conditionsFitScore: number;

  hasSignificantTradeOff: boolean;
  matchCategory: "StandardMatch" | "PerfectMatch" | "TradeOffOpportunity" | "CareerAccelerator";
  strongPoints: string[];
  frictionPoints: string[];

  aiCoachVerdict?: string;
  tailoredPitch?: string;

  originalOffer?: FranceTravailJobOffer;
}

export interface SmartMatchSearchRequest {
  keyword?: string;
  rayon?: number;
  cityCode?: string;
  latitude?: number;
  longitude?: number;
  includeAiVerdict?: boolean;
  limit?: number;
}

export interface SmartMatchSearchResponse {
  matches: SmartMatchOffer[];
  totalAnalyzed: number;
  totalRetained: number;
  candidateSummaryUsed: string;
}

export const searchOffers = async (searchParams: SearchParams): Promise<FranceTravailSearchResponse> => {
  const params = new URLSearchParams();
  if (searchParams.keyword) params.append('keyword', searchParams.keyword);
  if (searchParams.commune) params.append('commune', searchParams.commune);
  if (searchParams.rayon) params.append('rayon', searchParams.rayon.toString());
  if (searchParams.typeContrat) params.append('typeContrat', searchParams.typeContrat);
  if (searchParams.experience) params.append('experience', searchParams.experience);
  if (searchParams.publishDate) params.append('publishDate', searchParams.publishDate.toString());
  if (searchParams.remoteMode) params.append('remoteMode', searchParams.remoteMode);
  if (searchParams.educationLevel) params.append('educationLevel', searchParams.educationLevel);
  params.append('page', (searchParams.page || 1).toString());

  const response = await myJobBoardApiClient.get(`/api/jobboard/search?${params.toString()}`);
  return response.data;
};

export const getSmartMatches = async (request: SmartMatchSearchRequest): Promise<SmartMatchSearchResponse> => {
  const response = await myJobBoardApiClient.post('/api/jobboard/smart-matches', request);
  return response.data;
};
