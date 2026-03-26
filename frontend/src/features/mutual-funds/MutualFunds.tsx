import { useState, FC } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  Spinner,
  useBreakpointValue,
  Badge,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import useLedgerStore from "@/components/shared/store";

// Import components
import MutualFundsOverview from "./components/MutualFundsOverview";
import MfTransactions from "./components/MfTransactions";

// Import modals (to be created)
import CreateAmcModal from "./components/modals/CreateAmcModal";
import CreateMutualFundModal from "./components/modals/CreateMutualFundModal";
import BuySellMfModal from "./components/modals/BuySellMfModal";
import TransferUnitsModal from "./components/modals/TransferUnitsModal";
import UpdateNavModal from "./components/modals/UpdateNavModal";

// Import icons
import { Building2, Trash2 } from "lucide-react";

// Import analytics drawer
import FundAnalyticsDrawer from "./components/analytics/FundAnalyticsDrawer";

// API functions
import { getAmcs, getMutualFunds, getAllMfTransactions, deleteMutualFund } from "./api";
import { MutualFund } from "./types";
import { notify } from "@/components/shared/notify";

const MotionBox = motion(Box);

 
interface MutualFundsProps {
  onAccountDataChange?: () => void;
    filters: {
      selectedAmc: string;
      selectedOwner: string;
      selectedAssetClass: string;
      showZeroBalance: boolean;
      searchTerm?: string;
    };
    onFiltersChange: (filters: {
      selectedAmc: string;
      selectedOwner: string;
      selectedAssetClass: string;
      showZeroBalance: boolean;
      searchTerm?: string;
    }) => void;
}
 

const MutualFunds: FC<MutualFundsProps> = (props) => {
  const { onAccountDataChange, filters, onFiltersChange } = props;
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const queryClient = useQueryClient();
  const [subTabIndex, setSubTabIndex] = useState(0);
  const [selectedFundFilter, setSelectedFundFilter] = useState<string>("all");

  // Modal states
  const {
    isOpen: isCreateAmcModalOpen,
    onOpen: onCreateAmcModalOpen,
    onClose: onCreateAmcModalClose,
  } = useDisclosure();

  const {
    isOpen: isCreateFundModalOpen,
    onOpen: onCreateFundModalOpen,
    onClose: onCreateFundModalClose,
  } = useDisclosure();

  const {
    isOpen: isBuySellModalOpen,
    onOpen: onBuySellModalOpen,
    onClose: onBuySellModalClose,
  } = useDisclosure();

  const {
    isOpen: isTransferModalOpen,
    onOpen: onTransferModalOpen,
    onClose: onTransferModalClose,
  } = useDisclosure();

  const {
    isOpen: isUpdateNavModalOpen,
    onOpen: onUpdateNavModalOpen,
    onClose: onUpdateNavModalClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteFundModalOpen,
    onOpen: onDeleteFundModalOpen,
    onClose: onDeleteFundModalClose,
  } = useDisclosure();

  const {
    isOpen: isAnalyticsDrawerOpen,
    onOpen: onAnalyticsDrawerOpen,
    onClose: onAnalyticsDrawerClose,
  } = useDisclosure();

  // State for modals
  const [analyticsTargetFund, setAnalyticsTargetFund] = useState<MutualFund | null>(null);
  const [selectedFund, setSelectedFund] = useState<MutualFund | null>(null);
  const [selectedFundId, setSelectedFundId] = useState<number | undefined>();
  const [isAmcWarningOpen, setIsAmcWarningOpen] = useState<boolean>(false);
  const [preselectedAmcId, setPreselectedAmcId] = useState<number | null>(null);
  const [fundToDelete, setFundToDelete] = useState<{ id: number; name: string } | null>(null);

  // Responsive modal settings
  const modalSize = useBreakpointValue({ base: "full", md: "md" });
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Fetch data
  const { data: amcs = [], isLoading: isLoadingAmcs, refetch: refetchAmcs } = useQuery({
    queryKey: ["amcs", ledgerId],
    queryFn: () => getAmcs(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: mutualFunds = [], isLoading: isLoadingMutualFunds, refetch: refetchFunds } = useQuery({
    queryKey: ["mutual-funds", ledgerId],
    queryFn: () => getMutualFunds(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000,
  });

   const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery({
     queryKey: ["mf-transactions", ledgerId],
     queryFn: () => getAllMfTransactions(Number(ledgerId)),
     enabled: !!ledgerId && subTabIndex === 1,
     staleTime: 5 * 60 * 1000,
   });

  const isLoading = isLoadingAmcs || isLoadingMutualFunds || isLoadingTransactions;

  const handleSubTabChange = (index: number) => {
    setSubTabIndex(index);
  };

  const handleCreateAmc = () => {
    onCreateAmcModalOpen();
  };

  const handleCreateFund = (amcId?: number) => {
    if (amcs.length === 0) {
      setIsAmcWarningOpen(true);
    } else {
      setPreselectedAmcId(amcId ?? null);
      onCreateFundModalOpen();
    }
  };

  const handleTradeUnits = (fundId: number) => {
    const fund = mutualFunds.find(f => f.mutual_fund_id === fundId);
    if (fund) {
      setSelectedFund(fund);
      onBuySellModalOpen();
    }
  };

  const handleTransferUnits = (fundId: number) => {
    setSelectedFundId(fundId);
    onTransferModalOpen();
  };

  const handleUpdateNav = (fund: MutualFund) => {
    setSelectedFund(fund);
    onUpdateNavModalOpen();
  };

  const handleDataChange = () => {
    refetchAmcs();
    refetchFunds();
    refetchTransactions();
    queryClient.invalidateQueries({ queryKey: ["transactions", ledgerId] });
    if (onAccountDataChange) {
      onAccountDataChange();
    }
  };

  const handleCloseFund = (fundId: number) => {
    const fund = mutualFunds.find(f => f.mutual_fund_id === fundId);
    if (fund) {
      setFundToDelete({ id: fundId, name: fund.name });
      onDeleteFundModalOpen();
    }
  };

  const handleViewAnalytics = (fund: MutualFund) => {
    setAnalyticsTargetFund(fund);
    onAnalyticsDrawerOpen();
  };

  const handleViewTransactions = (fundId: number) => {
    setSelectedFundFilter(fundId.toString());
    setSubTabIndex(1);
  };

  const deleteFundMutation = useMutation({
    mutationFn: (fundId: number) => deleteMutualFund(Number(ledgerId), fundId),
    onSuccess: () => {
      const fundName = fundToDelete?.name || "Fund";
      handleDataChange();
      onDeleteFundModalClose();
      setFundToDelete(null);
      notify({
        title: "Fund Closed",
        description: `"${fundName}" has been successfully closed.`,
        status: "success",
      });
    },
    onError: (error: any) => {
      const fundName = fundToDelete?.name || "Fund";
      notify({
        title: "Delete Failed",
        description: `Failed to close "${fundName}". Please try again.`,
        status: "error",
      });
      console.error("Error deleting fund:", error);
    },
  });

  const confirmDeleteFund = () => {
    if (fundToDelete) {
      deleteFundMutation.mutate(fundToDelete.id);
    }
  };

  const selectedTabColor = useColorModeValue("brand.700", "brand.200");
  const selectedTabBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const selectedTabBorderColor = useColorModeValue("brand.500", "brand.400");
  const hoverTabBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const tabColor = useColorModeValue("gray.500", "gray.400");
  const badgeBg = useColorModeValue("brand.50", "brand.900");
  const badgeColor = useColorModeValue("brand.600", "brand.200");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorderColor = useColorModeValue("gray.100", "gray.700");

  if (!ledgerId) {
    return <Box>No ledger selected</Box>;
  }

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs
        variant="unstyled"
        size={{ base: "md", md: "md" }}
        index={subTabIndex}
        onChange={handleSubTabChange}
      >
        <Box p={{ base: 2, md: 4 }}>
          <TabList borderBottom="none" gap={1}>
            <Tab
              px={{ base: 3, md: 4 }}
              py={2.5}
              fontWeight="medium"
              fontSize="sm"
              whiteSpace="nowrap"
              borderBottom="2px solid"
              borderBottomColor="transparent"
              borderRadius={0}
              color={tabColor}
              transition="all 0.2s ease"
              _selected={{
                color: selectedTabColor,
                bg: selectedTabBg,
                fontWeight: "semibold",
                borderBottomColor: selectedTabBorderColor,
              }}
              _hover={{ bg: hoverTabBg }}
            >
              <Flex align="center">
                <Text>Overview</Text>
                {mutualFunds.length > 0 && (
                  <Badge
                    ml={2}
                    borderRadius="full"
                    px={2}
                    bg={badgeBg}
                    color={badgeColor}
                    fontWeight="bold"
                    fontSize="2xs"
                  >
                    {mutualFunds.length}
                  </Badge>
                )}
              </Flex>
            </Tab>
            <Tab
              px={{ base: 3, md: 4 }}
              py={2.5}
              fontWeight="medium"
              fontSize="sm"
              whiteSpace="nowrap"
              borderBottom="2px solid"
              borderBottomColor="transparent"
              borderRadius={0}
              color={tabColor}
              transition="all 0.2s ease"
              _selected={{
                color: selectedTabColor,
                bg: selectedTabBg,
                fontWeight: "semibold",
                borderBottomColor: selectedTabBorderColor,
              }}
              _hover={{ bg: hoverTabBg }}
            >
              <Flex align="center">
                <Text>Transactions</Text>
              </Flex>
            </Tab>
          </TabList>
        </Box>

         <TabPanels>
           <TabPanel p={{ base: 2, md: 4 }}>
             {subTabIndex === 0 &&
               (isLoading ? (
                 <Box display="flex" justifyContent="center" py={10}>
                   <Spinner size="xl" color="brand.500" />
                 </Box>
               ) : (
                     <MutualFundsOverview
                       amcs={amcs}
                       mutualFunds={mutualFunds}
                       onCreateAmc={handleCreateAmc}
                       onCreateFund={handleCreateFund}
                       onTradeUnits={handleTradeUnits}
                       onTransferUnits={handleTransferUnits}
                       onUpdateNav={handleUpdateNav}
                       onCloseFund={handleCloseFund}
                       onViewTransactions={handleViewTransactions}
                       onViewAnalytics={handleViewAnalytics}
                      filters={filters}
                       onFiltersChange={onFiltersChange}
                     />
               ))}
           </TabPanel>
           <TabPanel p={{ base: 2, md: 4 }}>
             {subTabIndex === 1 && (
               isLoading ? (
                 <Box display="flex" justifyContent="center" py={10}>
                   <Spinner size="xl" color="brand.500" />
                 </Box>
               ) : (
                  <MfTransactions
                    amcs={amcs}
                    mutualFunds={mutualFunds}
                    transactions={transactions}
                    onDataChange={handleDataChange}
                    onAccountDataChange={onAccountDataChange}
                    initialFundFilter={selectedFundFilter}
                  />
               )
             )}
           </TabPanel>
         </TabPanels>
      </Tabs>

      {/* Modals */}
      <CreateAmcModal
        isOpen={isCreateAmcModalOpen}
        onClose={onCreateAmcModalClose}
        onSuccess={handleDataChange}
      />

      <CreateMutualFundModal
        isOpen={isCreateFundModalOpen}
        onClose={() => {
          onCreateFundModalClose();
          setPreselectedAmcId(null);
        }}
        amcs={amcs}
        onSuccess={() => {
          handleDataChange();
          setPreselectedAmcId(null);
        }}
        preselectedAmcId={preselectedAmcId}
      />

       <BuySellMfModal
         isOpen={isBuySellModalOpen}
         onClose={onBuySellModalClose}
         fund={selectedFund || undefined}
         onSuccess={handleDataChange}
       />

       <TransferUnitsModal
         isOpen={isTransferModalOpen}
         onClose={onTransferModalClose}
         fromFundId={selectedFundId!}
         mutualFunds={mutualFunds}
         onSuccess={handleDataChange}
       />

       <UpdateNavModal
         isOpen={isUpdateNavModalOpen}
         onClose={onUpdateNavModalClose}
         fund={selectedFund}
         onSuccess={handleDataChange}
       />

      <Modal
        isOpen={isDeleteFundModalOpen}
        returnFocusOnClose={false}
        onClose={onDeleteFundModalClose}
        size={modalSize}
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <ModalContent
          margin={isMobile ? 0 : "auto"}
          borderRadius={isMobile ? 0 : "xl"}
          bg={modalBg}
          border="1px solid"
          borderColor={modalBorderColor}
          boxShadow="2xl"
        >
          <ModalHeader fontWeight="800" letterSpacing="-0.02em">Close Mutual Fund</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to close &quot;{fundToDelete?.name}&quot;?
            <br />
            This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteFundModalClose} borderRadius="lg">
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmDeleteFund}
              isLoading={deleteFundMutation.isPending}
              loadingText="Closing..."
              leftIcon={<Trash2 size={16} />}
              borderRadius="lg"
              fontWeight="bold"
            >
              Close Fund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Fund Analytics Drawer */}
      <FundAnalyticsDrawer
        isOpen={isAnalyticsDrawerOpen}
        onClose={() => {
          onAnalyticsDrawerClose();
          setAnalyticsTargetFund(null);
        }}
        fund={analyticsTargetFund}
      />

      {/* AMC Warning Dialog */}
      <Modal
        isOpen={isAmcWarningOpen}
        returnFocusOnClose={false}
        onClose={() => setIsAmcWarningOpen(false)}
        size={{ base: "full", md: "lg" }}
      >
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <ModalContent
          bg={modalBg}
          border="1px solid"
          borderColor={modalBorderColor}
          borderRadius={{ base: 0, md: "xl" }}
          boxShadow="2xl"
        >
          <ModalHeader fontSize="lg" fontWeight="800" display="flex" alignItems="center" gap={2} letterSpacing="-0.02em">
            <Building2 size={20} />
            Create AMC First
          </ModalHeader>

          <ModalBody>
            <Text>
              You need to create at least one Asset Management Company (AMC) before you can create a mutual fund.
              AMCs are the organizations that manage your mutual fund investments (e.g., HDFC, ICICI, SBI, etc.).
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setIsAmcWarningOpen(false)}
              mr={3}
              borderRadius="lg"
            >
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={() => {
                setIsAmcWarningOpen(false);
                onCreateAmcModalOpen();
              }}
              leftIcon={<Building2 size={16} />}
              borderRadius="lg"
              fontWeight="bold"
            >
              Create AMC
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>


    </MotionBox>
  );
};

export default MutualFunds;
