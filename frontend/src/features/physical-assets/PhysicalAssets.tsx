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
import { AlertTriangle } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { usePhysicalAssets, useAssetTypes, useDeleteAssetType, useAllAssetTransactions } from "./api";
import { toastDefaults } from "@/components/shared/utils";
import PhysicalAssetsOverview from "./components/PhysicalAssetsOverview";
import BuySellAssetModal from "./components/BuySellAssetModal";
import CreateAssetTypeModal from "./components/CreateAssetTypeModal";
import CreatePhysicalAssetModal from "./components/CreatePhysicalAssetModal";
import UpdatePriceModal from "./components/UpdatePriceModal";
import EmptyStateTransactions from "./components/EmptyStateTransactions";
import AssetTransactionHistory from "./components/AssetTransactionHistory";
import { PhysicalAsset, AssetType } from "./types";



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
  const selectedTabBg = useColorModeValue("brand.50", "brand.900");
  const selectedTabBorderColor = useColorModeValue("brand.400", "brand.500");
  const hoverTabBg = useColorModeValue("brand.100", "brand.800");
  const tabColor = useColorModeValue("gray.600", "gray.400");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");

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

    // Check if there are any assets using this type
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
    setTabIndex(1); // Switch to transactions tab
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
    <Box>
      <Tabs variant="soft-rounded" colorScheme="brand" size={{ base: "md", md: "md" }} index={tabIndex} onChange={handleTabChange}>
        <Box p={{ base: 2, md: 4 }}>
            <TabList borderBottom="none">
              <Tab
                px={{ base: 4, md: 6 }}
                py={4}
                fontWeight="medium"
                borderRadius="md"
                whiteSpace="nowrap"
                color={tabColor}
                _selected={{
                  color: selectedTabColor,
                  bg: selectedTabBg,
                  fontWeight: "semibold",
                  border: "1px solid",
                  borderColor: selectedTabBorderColor,
                }}
                _hover={{
                  bg: hoverTabBg,
                }}
              >
                <Flex align="center">
                  <Text>Overview</Text>
                 {assets.length > 0 && (
                   <Badge ml={2} colorScheme="brand" borderRadius="full" px={2}>
                     {assets.length}
                   </Badge>
                 )}
               </Flex>
             </Tab>
             <Tab
               px={{ base: 4, md: 6 }}
               py={4}
               fontWeight="medium"
               borderRadius="md"
               whiteSpace="nowrap"
               color={tabColor}
               _selected={{
                 color: selectedTabColor,
                 bg: selectedTabBg,
                 fontWeight: "semibold",
                 border: "1px solid",
                 borderColor: selectedTabBorderColor,
               }}
               _hover={{
                 bg: hoverTabBg,
               }}
             >
               <Flex align="center">
                 <Text color={tertiaryTextColor}>Transactions</Text>
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

             {/* Transactions Tab */}
             <TabPanel p={{ base: 2, md: 4 }}>
               {tabIndex === 1 && (
                 assetsLoading ? (
                   <Box p={8} textAlign="center">
                     <VStack spacing={4}>
                       <Spinner size="lg" color={selectedTabColor} />
                       <Text color={tabColor} fontSize="lg">
                         Loading transaction history...
                       </Text>
                       <Text color={tabColor} fontSize="sm">
                         This may take a moment for large portfolios
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
                        // Refresh data if needed
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
           <ModalOverlay />
           <ModalContent>
             <ModalHeader fontSize="lg" fontWeight="bold">
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
                 _hover={{
                   bg: "gray.50",
                   borderColor: "gray.300",
                 }}
               >
                 Cancel
               </Button>
               <Button
                 colorScheme="teal"
                 onClick={() => {
                   setIsAssetTypeWarningOpen(false);
                   onCreateAssetTypeModalOpen();
                 }}
                 ml={3}
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
          <ModalOverlay />
          <ModalContent
            margin={isMobile ? 0 : "auto"}
            borderRadius={isMobile ? 0 : "md"}
          >
            <ModalHeader>Delete Asset Type</ModalHeader>
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
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDeleteAssetType}
                isLoading={deleteAssetTypeMutation.isPending}
                loadingText="Deleting..."
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
            // Refresh asset types data
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
            // Refresh assets data
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

      </Box>
    );
  };

export default PhysicalAssets;