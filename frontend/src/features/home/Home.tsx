import { Flex, useDisclosure, Text } from "@chakra-ui/react";
import Layout from "@components/Layout";
import HomeMain from "@features/home/components/HomeMain";
import HomeLedgerCardsSkeleton from "./components/HomeLedgercardsSkeleton";
import { notify } from "@/components/shared/notify";
import { useNavigate } from "react-router-dom";
import { useLedgers, useCreateLedger } from "@features/ledger/hooks";

const Home = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch ledgers
  const {
    data: ledgers,
    isLoading: isFetchingLedgers,
    isError: isLedgersError,
  } = useLedgers();

  // Create ledger mutation
  const createLedgerMutation = useCreateLedger();

  // handle ledger creation
  const handleCreateLedger = async (
    newLedgerName: string,
    newLedgerCurrency: string,
    description: string,
    notes: string,
    navServiceType: string
  ) => {
    if (!newLedgerName || !newLedgerCurrency) {
      notify({
        description: "All fields required.",
        status: "error",
      });
      return;
    }

    createLedgerMutation.mutate({
      name: newLedgerName,
      currency_symbol: newLedgerCurrency,
      description: description,
      notes: notes,
      nav_service_type: navServiceType,
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
