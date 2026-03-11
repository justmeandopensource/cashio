
import api from "@/lib/api";

export interface UserProfile {
  full_name: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
}

export interface ChangePassword {
  current_password: string;
  new_password: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get("/user/me");
  return response.data;
};

export const updateUserProfile = async (
  data: UserUpdate
): Promise<UserProfile> => {
  const response = await api.put("/user/me", data);
  return response.data;
};

export const changePassword = async (data: ChangePassword): Promise<void> => {
  await api.put("/user/change-password", data);
};

// Backup and Restore APIs
export const getBackups = async (): Promise<string[]> => {
  const response = await api.get("/api/system/backups");
  return response.data;
};

export const createBackup = async (): Promise<{ message: string; filename: string }> => {
  const response = await api.post("/api/system/backup");
  return response.data;
};

export const restoreBackup = async (filename: string): Promise<{ message: string; filename: string }> => {
  const response = await api.post(`/api/system/restore/${filename}`);
  return response.data;
};

export const deleteBackup = async (filename: string): Promise<{ message: string; filename: string }> => {
  const response = await api.delete(`/api/system/backups/${filename}`);
  return response.data;
};

export const uploadBackup = async (file: File): Promise<{ message: string; filename: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/system/upload-backup", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const downloadBackup = async (filename: string) => {
  try {
    const response = await api.get(`/api/system/download-backup/${filename}`, {
      responseType: 'blob',
    });

    // Create a blob URL for the file
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};
