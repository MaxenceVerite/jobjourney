import apiClient from "../../apiClient";
import { SearchParams } from "../jobBoard/jobBoardApi";

export interface JobAlert {
  id: string;
  name: string;
  createdAt: string;
  searchParams: SearchParams;
}

export const getJobAlerts = async (): Promise<JobAlert[]> => {
  const response = await apiClient.get("/api/jobalerts");
  return response.data;
};

export const createJobAlert = async (name: string, searchParams: SearchParams): Promise<{ id: string }> => {
  const response = await apiClient.post("/api/jobalerts", { name, searchParams });
  return response.data;
};

export const deleteJobAlert = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/jobalerts/${id}`);
};
