import Company from "../../../../models/opportunities/Company";
import myJobBoardApiClient from "../../apiClient";

const companiesRessourcePath = "/api/companies";

const getCompanies = async(): Promise<Company[]>=> {
    try{
    var response = await myJobBoardApiClient.get(`${companiesRessourcePath}`);

    return response.data;
    }catch(error){
        console.log("Impossible de récupérer les entreprises : " + error)
        throw error;
    }
}

const createCompany = async(company: Company): Promise<Company>=> {
    try{
    var response = await myJobBoardApiClient.post(`${companiesRessourcePath}`, company);

    return response.data;
    }catch(error){
        console.log("Impossible de créer l'entreprise : " + error)
        throw error;
    }
}


const updateCompany = async(company: Company): Promise<Company> => {
    try {
        var response = await myJobBoardApiClient.put(`${companiesRessourcePath}/${company.id}`, company);
        return response.data;
    } catch(error) {
        console.log("Impossible de modifier l'entreprise : " + error);
        throw error;
    }
}

const deleteCompany = async(id: string): Promise<void> => {
    try {
        await myJobBoardApiClient.delete(`${companiesRessourcePath}/${id}`);
    } catch(error) {
        console.log("Impossible de supprimer l'entreprise : " + error);
        throw error;
    }
}

const generateCompanySummary = async(companyName: string): Promise<any> => {
    try {
        var response = await myJobBoardApiClient.post("/api/ai/generate-company-summary", { companyName });
        let data = response.data;
        
        // Si Axios n'a pas déjà parsé en objet (ex: si Gemini renvoie des backticks markdown)
        if (typeof data === 'string') {
            data = data.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
            return JSON.parse(data);
        }
        
        // Si Axios l'a déjà parsé
        return data;
    } catch(error) {
        console.log("Impossible de générer le résumé : " + error);
        throw error;
    }
}

export {
    getCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    generateCompanySummary
}