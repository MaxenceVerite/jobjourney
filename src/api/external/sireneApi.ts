import axios from "axios";

const SIRENE_API_URL = "https://recherche-entreprises.api.gouv.fr/search?q=";

export interface SireneResult {
  siren: string;
  nom_complet: string;
  siege: {
    adresse: string;
    code_postal: string;
    libelle_commune: string;
  };
  activite_principale: string;
  tranche_effectif_salarie: string;
}

export const searchCompanyGovApi = async (query: string): Promise<SireneResult[]> => {
  if (!query || query.length < 3) return [];
  try {
    const response = await axios.get(`${SIRENE_API_URL}${encodeURIComponent(query)}`);
    return response.data.results || [];
  } catch (error) {
    console.error("Error fetching from Sirene API:", error);
    return [];
  }
};
