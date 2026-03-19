import { useQueryClient } from "@tanstack/react-query";
import { FC, useState, useRef, RefObject } from "react";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { usePhysicalAssets, useAssetTypes, useDeleteAssetType, useAllAssetTransactions } from "./api";
import { toastDefaults } from "@/components/shared/utils";
import PhysicalAssetsOverview from "./components/PhysicalAssetsOverview";
import BuySellAssetModal from "./components/modals/BuySellAssetModal";
import CreateAssetTypeModal from "./components/modals/CreateAssetTypeModal";
import CreatePhysicalAssetModal from "./components/modals/CreatePhysicalAssetModal";
import UpdatePriceModal from "./components/modals/UpdatePriceModal";
import EmptyStateTransactions from "./components/EmptyStateTransactions";
import AssetTransactionHistory from "./components/AssetTransactionHistory";
import { PhysicalAsset, AssetType } from "./types";

const MotionBox = motion(Box);

const PhysicalAssets: FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { ledgerId } = useLedgerStore();
  const [selectedAsset, setSelectedAsset] = useState<PhysicalAsset | undefined>();
  const [tabIndex, setTabIndex] = useState(0);
  const [initialAssetFilter, setInitialAssetFilter] = useState<string>("all");
  const [filters, setFilters] = useState<{
    selectedAssetType: string;
    showZeroBalance: boolean;
    searchTerm?: string;
  }>({
    selectedAssetType: "all",
    showZeroBalance: false,
    searchTerm: "",
  });

  // Responsive modal settings
  const modalSize = useBreakpointValue({ base: "full", md: "md" });
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Tab colors
  const selectedTabColor = useColorModeValue("brand.700", "brand.200");
  const selectedTabBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const selectedTabBorderColor = useColorModeValue("brand.500", "brand.400");
  const hoverTabBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const tabColor = useColorModeValue("gray.500", "gray.400");
  const badgeBg = useColorModeValue("brand.50", "brand.900");
  const badgeColor = useColorModeValue("brand.600", "brand.200");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorderColor = useColorModeValue("gray.100", "gray.700");

  // Modal states
  const {
    isOpen: isBuySellModalOpen,
    onOpen: onBuySellModalOpen,
    onClose: onBuySellModalClose,
  } = useDisclosure();

  const {
    isOpen: isCreateAssetTypeModalOpen,
    onOpen: onCreateAssetTypeModalOpen,
    onClose: onCreateAssetTypeModalClose,
  } = useDisclosure();

  const {
    isOpen: isCreateAssetModalOpen,
    onOpen: onCreateAssetModalOpen,
    onClose: onCreateAssetModalClose,
  } = useDisclosure();

  const {
    isOpen: isUpdatePriceModalOpen,
    onOpen: onUpdatePriceModalOpen,
    onClose: onUpdatePriceModalClose,
  } = useDisclosure();

  // Dialog states
  const [isAssetTypeWarningOpen, setIsAssetTypeWarningOpen] = useState(false);
  const [isDeleteAssetTypeDialogOpen, setIsDeleteAssetTypeDialogOpen] = useState(false);
  const [isDeleteAssetTypeErrorOpen, setIsDeleteAssetTypeErrorOpen] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const cancelRef: RefObject<any> = useRef(null);

  // API queries
  const { data: assets = [], isLoading: assetsLoading, error: assetsError } = usePhysicalAssets(Number(ledgerId) || 0);
  const { data: assetTypes = [] } = useAssetTypes(Number(ledgerId) || 0);
  const { data: transactions = [] } = useAllAssetTransactions(Number(ledgerId) || 0);

  // Delete mutations
  const deleteAssetTypeMutation = useDeleteAssetType();

  const handleBuySell = (assetId: number) => {
    const asset = assets.find((asset) => asset.physical_asset_id === assetId);
    setSelectedAsset(asset);
    onBuySellModalOpen();
  };

  const handleUpdatePrice = (asset: PhysicalAsset) => {
    setSelectedAsset(asset);
    onUpdatePriceModalOpen();
  };

  const confirmDeleteAssetType = async () => {
    if (!selectedAssetType) return;

    const assetsUsingType = assets.filter(asset => asset.asset_type_id === selectedAssetType.asset_type_id);

    if (assetsUsingType.length > 0) {
      setIsDeleteAssetTypeDialogOpen(false);
      setIsDeleteAssetTypeErrorOpen(true);
      return;
    }

    try {
      await deleteAssetTypeMutation.mutateAsync({
        ledgerId: Number(ledgerId),
        typeId: selectedAssetType.asset_type_id,
      });
      toast({
        ...toastDefaults,
        title: "Asset Type Deleted",
        description: `"${selectedAssetType.name}" has been successfully deleted.`,
        status: "success",
      });
      setIsDeleteAssetTypeDialogOpen(false);
      setSelectedAssetType(null);
    } catch {
      toast({
        ...toastDefaults,
        title: "Delete Failed",
        description: `Failed to delete "${selectedAssetType.name}". Please try again.`,
        status: "error",
      });
      setIsDeleteAssetTypeDialogOpen(false);
      setSelectedAssetType(null);
    }
  };

  const handleCreateAsset = () => {
    if (assetTypes.length === 0) {
      setIsAssetTypeWarningOpen(true);
    } else {
      onCreateAssetModalOpen();
    }
  };

  const handleCreateAssetType = () => {
    onCreateAssetTypeModalOpen();
  };

  const handleViewTransactions = (asset: PhysicalAsset) => {
    setInitialAssetFilter(asset.physical_asset_id.toString());
    setTabIndex(1);
  };

  const handleTabChange = (index: number) => {
    setTabIndex(index);
  };

  if (assetsError) {
    return (
      <Box p={6}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Failed to Load Physical Assets!</AlertTitle>
          <AlertDescription>
            Unable to load your physical assets. This might be due to a network issue or server problem.
            Please check your connection and try refreshing the page. If the problem persists, contact support.
          </AlertDescription>
        </Alert>
      </Box>
    );
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
        index={tabIndex}
        onChange={handleTabChange}
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
                {assets.length > 0 && (
                  <Badge
                    ml={2}
                    borderRadius="full"
                    px={2}
                    bg={badgeBg}
                    color={badgeColor}
                    fontWeight="bold"
                    fontSize="2xs"
                  >
                    {assets.length}
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
            {tabIndex === 0 && (
              <PhysicalAssetsOverview
                assetTypes={assetTypes}
                physicalAssets={assets}
                onCreateAssetType={handleCreateAssetType}
                onCreateAsset={handleCreateAsset}
                onBuySell={handleBuySell}
                onUpdatePrice={handleUpdatePrice}
                onViewTransactions={handleViewTransactions}
                filters={filters}
                onFiltersChange={setFilters}
              />
            )}
          </TabPanel>

          <TabPanel p={{ base: 2, md: 4 }}>
            {tabIndex === 1 && (
              assetsLoading ? (
                <Box p={8} textAlign="center">
                  <VStack spacing={4}>
                    <Spinner size="lg" color="brand.500" />
                    <Text color={tabColor} fontSize="lg">
                      Loading transaction history...
                    </Text>
                  </VStack>
                </Box>
              ) : assets.length === 0 ? (
                <EmptyStateTransactions />
              ) : (
                <AssetTransactionHistory
                  assetTypes={assetTypes}
                  physicalAssets={assets}
                  transactions={transactions}
                  onDataChange={() => {
                    queryClient.invalidateQueries({
                      queryKey: ["all-asset-transactions", Number(ledgerId)],
                    });
                  }}
                  initialAssetFilter={initialAssetFilter}
                />
              )
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Asset Type Warning Dialog */}
      <Modal
        isOpen={isAssetTypeWarningOpen}
        onClose={() => setIsAssetTypeWarningOpen(false)}
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
          <ModalHeader fontSize="lg" fontWeight="800" letterSpacing="-0.02em">
            Create Asset Type First
          </ModalHeader>

          <ModalBody>
            You need to create at least one asset type before you can create a physical asset.
            Asset types define the kind of physical assets you want to track (e.g., Gold, Silver, etc.).
          </ModalBody>

          <ModalFooter>
            <Button
              ref={cancelRef}
              variant="outline"
              onClick={() => setIsAssetTypeWarningOpen(false)}
              borderRadius="lg"
            >
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={() => {
                setIsAssetTypeWarningOpen(false);
                onCreateAssetTypeModalOpen();
              }}
              ml={3}
              borderRadius="lg"
              fontWeight="bold"
            >
              Create Asset Type
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Asset Type Confirmation Modal */}
      <Modal
        isOpen={isDeleteAssetTypeDialogOpen}
        onClose={() => {
          setIsDeleteAssetTypeDialogOpen(false);
          setSelectedAssetType(null);
        }}
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
          <ModalHeader fontWeight="800" letterSpacing="-0.02em">Delete Asset Type</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete the asset type &ldquo;{selectedAssetType?.name}&rdquo;?
            This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setIsDeleteAssetTypeDialogOpen(false);
                setSelectedAssetType(null);
              }}
              borderRadius="lg"
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmDeleteAssetType}
              isLoading={deleteAssetTypeMutation.isPending}
              loadingText="Deleting..."
              borderRadius="lg"
              fontWeight="bold"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Asset Type Error Dialog */}
      <AlertDialog
        isOpen={isDeleteAssetTypeErrorOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setIsDeleteAssetTypeErrorOpen(false);
          setSelectedAssetType(null);
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              <AlertIcon as={AlertTriangle} color="red.500" mr={2} />
              Cannot Delete Asset Type
            </AlertDialogHeader>

            <AlertDialogBody>
              The asset type &ldquo;{selectedAssetType?.name}&rdquo; cannot be deleted because
              {assets.filter(asset => asset.asset_type_id === selectedAssetType?.asset_type_id).length} physical asset(s) are currently using it.
              Please delete or reassign all associated assets first.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                onClick={() => {
                  setIsDeleteAssetTypeErrorOpen(false);
                  setSelectedAssetType(null);
                }}
              >
                OK
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Modals */}
      <BuySellAssetModal
        isOpen={isBuySellModalOpen}
        onClose={onBuySellModalClose}
        asset={selectedAsset}
        onTransactionCompleted={() => {
          onBuySellModalClose();
          setSelectedAsset(undefined);
        }}
      />

      <CreateAssetTypeModal
        isOpen={isCreateAssetTypeModalOpen}
        onClose={onCreateAssetTypeModalClose}
        onAssetTypeCreated={() => {
          onCreateAssetTypeModalClose();
          queryClient.invalidateQueries({
            queryKey: ["asset-types", Number(ledgerId)],
          });
        }}
      />

      <CreatePhysicalAssetModal
        isOpen={isCreateAssetModalOpen}
        onClose={onCreateAssetModalClose}
        onAssetCreated={() => {
          onCreateAssetModalClose();
          setSelectedAssetType(null);
          queryClient.invalidateQueries({
            queryKey: ["physical-assets", Number(ledgerId)],
          });
        }}
        assetTypeId={selectedAssetType?.asset_type_id}
      />

      <UpdatePriceModal
        isOpen={isUpdatePriceModalOpen}
        onClose={onUpdatePriceModalClose}
        asset={selectedAsset}
      />
    </MotionBox>
  );
};

export default PhysicalAssets;
