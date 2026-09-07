import myJobBoardApiClient from "../../apiClient";

export interface UserProfile {
    id?: string;
    userId?: string;
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    experienceYears?: number;
    salaryExpectationMin?: number;
    salaryExpectationMax?: number;
    remotePreference?: string;
    linkedInUrl?: string;
    portfolioUrl?: string;
    freeNotes?: string;
    address?: string;
    cityCode?: string;
    latitude?: number;
    longitude?: number;
}

const profilePath = "/api/profile";

export const getProfile = async (): Promise<UserProfile> => {
    const response = await myJobBoardApiClient.get(profilePath);
    return response.data;
};

export const updateProfile = async (profile: UserProfile): Promise<UserProfile> => {
    const response = await myJobBoardApiClient.put(profilePath, profile);
    return response.data;
};
