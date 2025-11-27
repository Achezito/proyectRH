import { getAuthToken } from "../../shared/utils/auth";

const API_BASE = "http://10.194.1.108:5000/formulario";

export const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
