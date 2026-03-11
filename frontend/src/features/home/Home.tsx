import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flex, useDisclosure, useToast, Text } from "@chakra-ui/react";
import Layout from "@components/Layout";
import HomeMain from "@features/home/components/HomeMain";
import api from "@/lib/api";
import HomeLedgerCardsSkeleton from "./components/HomeLedgercardsSkeleton";
import { toastDefaults } from "@/components/shared/utils";
import { useNavigate } from "react-router-dom";

interface Ledger {
  ledger_id: string;
  name: string;
  currency_symbol: string;
  description: string;
  notes: string;
  nav_service_type: string;
  api_key?: string;
  created_at: string;
  updated_at: string;
}

const Home = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch ledgers
  const {
    data: ledgers,
    isLoading: isFetchingLedgers,
    isError: isLedgersError,
  } = useQuery<Ledger[]>({
    queryKey: ["ledgers"],
    queryFn: async () => {
      const response = await api.get("/ledger/list");
      return response.data;
    },
  });

  // Create ledger mutation
  const createLedgerMutation = useMutation({
    mutationFn: async ({
      name,
      currency_symbol,
      description,
      notes,
      nav_service_type,
      api_key,
    }: {
      name: string;
      currency_symbol: string;
      description: string;
      notes: string;
      nav_service_type: string;
      api_key?: string;
    }) => {
      const response = await api.post("/ledger/create", {
        name,
        currency_symbol,
        description,
        notes,
        nav_service_type,
        api_key,
      });
      return response.data;
    },
    onSuccess: (data: Ledger) => {
      // Update the cached ledgers list with the new ledger
      queryClient.setQueryData(["ledgers"], (oldData: Ledger[] | undefined) => [
        ...(oldData || []),
        data,
      ]);
      onClose();
      toast({
        description: "Ledger created successfully",
        status: "success",
        ...toastDefaults,
      });
    },
    onError: (error: Error) => {
      toast({
        description: error.message,
        status: "error",
        ...toastDefaults,
      });
    },
  });

  // handle ledger creation
  const handleCreateLedger = async (
    newLedgerName: string,
    newLedgerCurrency: string,
    description: string,
    notes: string,
    navServiceType: string,
    apiKey: string
  ) => {
    if (!newLedgerName || !newLedgerCurrency) {
      toast({
        description: "All fields required.",
        status: "error",
        ...toastDefaults,
      });
      return;
    }

    createLedgerMutation.mutate({
      name: newLedgerName,
      currency_symbol: newLedgerCurrency,
      description: description,
      notes: notes,
      nav_service_type: navServiceType,
      api_key: apiKey,
    });
  };

  // handle logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  if (isFetchingLedgers) {
    return (
      <Layout handleLogout={handleLogout}>
        <HomeLedgerCardsSkeleton />
      </Layout>
    );
  }

  if (isLedgersError) {
    return (
      <Layout handleLogout={handleLogout}>
        <Flex justify="center" align="center" minH="100vh">
          <Text>Error fetching ledgers. Please try again.</Text>
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout handleLogout={handleLogout}>
      <HomeMain
        ledgers={ledgers || []}
        onOpen={onOpen}
        isOpen={isOpen}
        onClose={onClose}
        handleCreateLedger={handleCreateLedger}
      />
    </Layout>
  );
};

export default Home;
