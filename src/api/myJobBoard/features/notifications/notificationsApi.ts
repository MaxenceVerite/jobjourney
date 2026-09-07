import myJobBoardApiClient from "../../apiClient";

export interface UserNotification {
    id: string;
    userId: string;
    message: string;
    type: string;
    linkUrl?: string;
    relatedEntityId?: string;
    isRead: boolean;
    createdDate: string;
}

const notificationsPath = "/api/notifications";

export const getNotifications = async (): Promise<UserNotification[]> => {
    try {
        const response = await myJobBoardApiClient.get(notificationsPath);
        return response.data;
    } catch (error) {
        console.error("Impossible de récupérer les notifications :", error);
        throw error;
    }
};

export const markAsRead = async (id: string): Promise<UserNotification> => {
    try {
        const response = await myJobBoardApiClient.put(`${notificationsPath}/${id}/mark-as-read`);
        return response.data;
    } catch (error) {
        console.error("Impossible de marquer comme lue :", error);
        throw error;
    }
};

export const markAllAsRead = async (): Promise<void> => {
    try {
        await myJobBoardApiClient.put(`${notificationsPath}/mark-all-as-read`);
    } catch (error) {
        console.error("Impossible de marquer tout comme lu :", error);
        throw error;
    }
};
