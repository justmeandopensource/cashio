
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserProfile, changePassword, UserUpdate, ChangePassword } from "./api";

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserUpdate) => updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePassword) => changePassword(data),
  });
};
