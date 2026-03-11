import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  AssetType,
  PhysicalAsset,
  AssetTransaction,
  AssetTypeCreate,
  AssetTypeUpdate,
  PhysicalAssetCreate,
  PhysicalAssetUpdate,
  PhysicalAssetPriceUpdate,
  AssetTransactionCreate,
} from "./types";

// Asset Type API functions
export const getAssetTypes = async (ledgerId: number): Promise<AssetType[]> => {
  const response = await api.get(`/ledger/${ledgerId}/asset-types`);
  return response.data;
};

export const createAssetType = async (
  ledgerId: number,
  data: AssetTypeCreate
): Promise<AssetType> => {
  const response = await api.post(`/ledger/${ledgerId}/asset-type/create`, data);
  return response.data;
};

export const updateAssetType = async (
  ledgerId: number,
  typeId: number,
  data: AssetTypeUpdate
): Promise<AssetType> => {
  const response = await api.put(`/ledger/${ledgerId}/asset-type/${typeId}`, data);
  return response.data;
};

export const deleteAssetType = async (
  ledgerId: number,
  typeId: number
): Promise<void> => {
  await api.delete(`/ledger/${ledgerId}/asset-type/${typeId}`);
};

// Physical Asset API functions
export const getPhysicalAssets = async (ledgerId: number): Promise<PhysicalAsset[]> => {
  const response = await api.get(`/ledger/${ledgerId}/physical-assets`);
  return response.data;
};

export const getPhysicalAsset = async (
  ledgerId: number,
  assetId: number
): Promise<PhysicalAsset> => {
  const response = await api.get(`/ledger/${ledgerId}/physical-assets/${assetId}`);
  return response.data;
};

export const createPhysicalAsset = async (
  ledgerId: number,
  data: PhysicalAssetCreate
): Promise<PhysicalAsset> => {
  const response = await api.post(`/ledger/${ledgerId}/physical-asset/create`, data);
  return response.data;
};

export const updatePhysicalAsset = async (
  ledgerId: number,
  assetId: number,
  data: PhysicalAssetUpdate
): Promise<PhysicalAsset> => {
  const response = await api.put(`/ledger/${ledgerId}/physical-asset/${assetId}`, data);
  return response.data;
};

export const updatePhysicalAssetPrice = async (
  ledgerId: number,
  assetId: number,
  data: PhysicalAssetPriceUpdate
): Promise<PhysicalAsset> => {
  const response = await api.put(`/ledger/${ledgerId}/physical-asset/${assetId}/update-price`, data);
  return response.data;
};

export const deletePhysicalAsset = async (
  ledgerId: number,
  assetId: number
): Promise<void> => {
  await api.delete(`/ledger/${ledgerId}/physical-asset/${assetId}`);
};

// Asset Transaction API functions
export const buyAsset = async (
  ledgerId: number,
  data: AssetTransactionCreate
): Promise<AssetTransaction> => {
  const response = await api.post(`/ledger/${ledgerId}/asset-transaction/buy`, data);
  return response.data;
};

export const sellAsset = async (
  ledgerId: number,
  data: AssetTransactionCreate
): Promise<AssetTransaction> => {
  const response = await api.post(`/ledger/${ledgerId}/asset-transaction/sell`, data);
  return response.data;
};

export const getAssetTransactions = async (
  ledgerId: number,
  assetId: number
): Promise<AssetTransaction[]> => {
  const response = await api.get(`/ledger/${ledgerId}/physical-assets/${assetId}/transactions`);
  return response.data;
};

export const getAllAssetTransactions = async (
  ledgerId: number
): Promise<AssetTransaction[]> => {
  const response = await api.get(`/ledger/${ledgerId}/asset-transactions`);
  return response.data;
};

export const deleteAssetTransaction = async (
  ledgerId: number,
  assetTransactionId: number
): Promise<void> => {
  await api.delete(`/ledger/${ledgerId}/asset-transaction/${assetTransactionId}`);
};

// React Query hooks
export const useAssetTypes = (ledgerId: number) => {
  return useQuery({
    queryKey: ["asset-types", ledgerId],
    queryFn: () => getAssetTypes(ledgerId),
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePhysicalAssets = (ledgerId: number) => {
  return useQuery({
    queryKey: ["physical-assets", ledgerId],
    queryFn: () => getPhysicalAssets(ledgerId),
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePhysicalAsset = (ledgerId: number, assetId: number) => {
  return useQuery({
    queryKey: ["physical-asset", ledgerId, assetId],
    queryFn: () => getPhysicalAsset(ledgerId, assetId),
    enabled: !!ledgerId && !!assetId,
  });
};

export const useAssetTransactions = (ledgerId: number, assetId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["asset-transactions", ledgerId, assetId],
    queryFn: () => getAssetTransactions(ledgerId, assetId),
    enabled: !!ledgerId && !!assetId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllAssetTransactions = (ledgerId: number) => {
  return useQuery({
    queryKey: ["all-asset-transactions", ledgerId],
    queryFn: () => getAllAssetTransactions(ledgerId),
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hooks
export const useCreateAssetType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ledgerId, data }: { ledgerId: number; data: AssetTypeCreate }) =>
      createAssetType(ledgerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["asset-types", variables.ledgerId],
      });
    },
  });
};

export const useUpdateAssetType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerId,
      typeId,
      data,
    }: {
      ledgerId: number;
      typeId: number;
      data: AssetTypeUpdate;
    }) => updateAssetType(ledgerId, typeId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["asset-types", variables.ledgerId],
      });
    },
  });
};

export const useDeleteAssetType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ledgerId, typeId }: { ledgerId: number; typeId: number }) =>
      deleteAssetType(ledgerId, typeId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["asset-types", variables.ledgerId],
      });
    },
  });
};

export const useCreatePhysicalAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ledgerId, data }: { ledgerId: number; data: PhysicalAssetCreate }) =>
      createPhysicalAsset(ledgerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["physical-assets", variables.ledgerId],
      });
    },
  });
};

export const useUpdatePhysicalAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerId,
      assetId,
      data,
    }: {
      ledgerId: number;
      assetId: number;
      data: PhysicalAssetUpdate;
    }) => updatePhysicalAsset(ledgerId, assetId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["physical-assets", variables.ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["physical-asset", variables.ledgerId, variables.assetId],
      });
    },
  });
};

export const useUpdatePhysicalAssetPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerId,
      assetId,
      data,
    }: {
      ledgerId: number;
      assetId: number;
      data: PhysicalAssetPriceUpdate;
    }) => updatePhysicalAssetPrice(ledgerId, assetId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["physical-assets", variables.ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["physical-asset", variables.ledgerId, variables.assetId],
      });
    },
  });
};

export const useDeletePhysicalAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ledgerId, assetId }: { ledgerId: number; assetId: number }) =>
      deletePhysicalAsset(ledgerId, assetId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["physical-assets", variables.ledgerId],
      });
    },
  });
};

export const useBuyAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ledgerId, data }: { ledgerId: number; data: AssetTransactionCreate }) =>
      buyAsset(ledgerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["physical-assets", variables.ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["asset-transactions", variables.ledgerId, variables.data.physical_asset_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-asset-transactions", variables.ledgerId],
      });
      // Also invalidate accounts and transactions since financial transactions are created
      queryClient.invalidateQueries({
        queryKey: ["accounts", variables.ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
    },
  });
};

export const useSellAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ledgerId, data }: { ledgerId: number; data: AssetTransactionCreate }) =>
      sellAsset(ledgerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["physical-assets", variables.ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["asset-transactions", variables.ledgerId, variables.data.physical_asset_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-asset-transactions", variables.ledgerId],
      });
      // Also invalidate accounts and transactions since financial transactions are created
      queryClient.invalidateQueries({
        queryKey: ["accounts", variables.ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
    },
  });
};

export const useDeleteAssetTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ledgerId, assetTransactionId }: { ledgerId: number; assetTransactionId: number }) =>
      deleteAssetTransaction(ledgerId, assetTransactionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["physical-assets", variables.ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-asset-transactions", variables.ledgerId],
      });
      // Also invalidate accounts and transactions since financial transactions are deleted
      queryClient.invalidateQueries({
        queryKey: ["accounts", variables.ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
    },
  });
};