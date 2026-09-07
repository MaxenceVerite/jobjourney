import myJobBoardApiClient from "../../apiClient";

export interface UserSettings {
    id?: string;
    userId: string;
    aiApiKey?: string;
    theme?: string;
    notificationsEnabled?: boolean;
}

const settingsPath = "/api/settings";

export const getSettings = async (): Promise<UserSettings> => {
    const response = await myJobBoardApiClient.get(settingsPath);
    return response.data;
};

export const updateSettings = async (settings: UserSettings): Promise<UserSettings> => {
    const response = await myJobBoardApiClient.put(settingsPath, settings);
    return response.data;
};
