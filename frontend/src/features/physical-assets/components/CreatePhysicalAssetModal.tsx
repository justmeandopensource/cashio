import React, { FC, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Text,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  HStack,
  Spinner,
  Stack,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  Badge,
} from "@chakra-ui/react";
import {
  Plus,
  FileText,
  Tag,
  Coins,
} from "lucide-react";
import { CreatePhysicalAssetModalProps, PhysicalAssetCreate } from "../types";
import { useCreatePhysicalAsset, useAssetTypes } from "../api";
import useLedgerStore from "@/components/shared/store";

interface FormData {
  name: string;
  asset_type_id: string;
  notes: string;
}

const CreatePhysicalAssetModal: FC<CreatePhysicalAssetModalProps> = ({
  isOpen,
  onClose,
  onAssetCreated,
  assetTypeId,
}) => {
  const { ledgerId } = useLedgerStore();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    asset_type_id: assetTypeId ? assetTypeId.toString() : "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when assetTypeId changes
  useEffect(() => {
    if (assetTypeId) {
      setFormData(prev => ({
        ...prev,
        asset_type_id: assetTypeId.toString(),
      }));
    }
  }, [assetTypeId]);

  // Modern theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");

  // Fetch available asset types
  const { data: assetTypes, isLoading: assetTypesLoading } = useAssetTypes(
    Number(ledgerId) || 0,
  );

  const createPhysicalAssetMutation = useCreatePhysicalAsset();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        asset_type_id: "",
        notes: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Asset name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Asset name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Asset name must be less than 100 characters";
    }

    if (!formData.asset_type_id) {
      newErrors.asset_type_id = "Please select an asset type";
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = "Notes must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerId) return;

    if (!validateForm()) {
      return;
    }

    const assetData: PhysicalAssetCreate = {
      name: formData.name.trim(),
      asset_type_id: parseInt(formData.asset_type_id),
      notes: formData.notes.trim() || undefined,
    };

    try {
      await createPhysicalAssetMutation.mutateAsync({
        ledgerId: Number(ledgerId),
        data: assetData,
      });

      // Create a temporary asset object for the callback
      const selectedAssetType = assetTypes?.find(
        (at) => at.asset_type_id.toString() === formData.asset_type_id,
      );

      onAssetCreated({
        physical_asset_id: 0, // Will be set by the API
        ledger_id: Number(ledgerId),
        asset_type_id: parseInt(formData.asset_type_id),
        name: assetData.name,
        total_quantity: 0,
        average_cost_per_unit: 0,
        latest_price_per_unit: 0,
        last_price_update: undefined,
        current_value: 0,
        notes: assetData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        asset_type: selectedAssetType,
      });

      onClose();
    } catch (error: any) {
      // Error handling is done by the mutation hook
      console.error("Physical asset creation failed:", error);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    createPhysicalAssetMutation.reset();
    onClose();
  };

  const isLoading = createPhysicalAssetMutation.isPending;
  const isFormValid = formData.name.trim() && formData.asset_type_id;
  const selectedAssetType = assetTypes?.find(
    (at) => at.asset_type_id.toString() === formData.asset_type_id,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <ModalContent
        bg={bgColor}
        borderRadius={{ base: 0, sm: "md" }}
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        mx={{ base: 0, sm: 4 }}
        my={{ base: 0, sm: "auto" }}
        maxHeight={{ base: "100%", md: "95vh" }}
        display="flex"
        flexDirection="column"
      >
        {/* Modern gradient header */}
        <Box
          bgGradient="linear(135deg, teal.400, teal.600)"
          color="white"
          px={{ base: 4, sm: 8 }}
          py={{ base: 6, sm: 6 }}
          pt={{ base: 12, sm: 6 }}
          position="relative"
        >
          <HStack spacing={{ base: 3, sm: 4 }} align="center">
            <Box
              p={{ base: 2, sm: 3 }}
              bg="whiteAlpha.200"
              borderRadius="md"
              backdropFilter="blur(10px)"
            >
              <Plus size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <Text
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
                mb={2}
              >
                Create Physical Asset
              </Text>
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
              >
                Add a new asset to your portfolio
              </Text>
            </Box>
          </HStack>
        </Box>

         <ModalBody
           px={{ base: 4, sm: 8 }}
           py={{ base: 4, sm: 6 }}
           flex="1"
           overflow="auto"
         >
           <form id="create-physical-asset-form" onSubmit={handleCreate}>
             <VStack spacing={{ base: 5, sm: 6 }} align="stretch">
            {/* Asset Details Form */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                 {/* Asset Name */}
                 <FormControl isInvalid={!!errors.name}>
                   <FormLabel fontWeight="semibold" mb={2}>
                     <HStack spacing={2}>
                       <Tag size={16} />
                       <Text>
                         Asset Name{" "}
                         <Text as="span" color="red.500">
                           *
                         </Text>
                       </Text>
                     </HStack>
                   </FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="e.g., Gold 22CT, ETH"
                      maxLength={100}
                      size="lg"
                      bg={inputBg}
                      borderColor={inputBorderColor}
                      borderWidth="2px"
                      borderRadius="md"
                      autoFocus
                      _hover={{ borderColor: "teal.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                    />
                   <FormErrorMessage>{errors.name}</FormErrorMessage>
                   <FormHelperText>Choose a unique name</FormHelperText>
                 </FormControl>

                 {/* Asset Type Selection */}
                 <FormControl isInvalid={!!errors.asset_type_id}>
                   <FormLabel fontWeight="semibold" mb={2}>
                     <HStack spacing={2}>
                       <Coins size={16} />
                       <Text>Asset Type</Text>
                       <Text as="span" color="red.500">
                         *
                       </Text>
                     </HStack>
                   </FormLabel>
                   {assetTypesLoading ? (
                     <HStack justify="center" p={4}>
                       <Spinner size="sm" />
                       <Text fontSize="sm" color="gray.500">
                         Loading asset types...
                       </Text>
                     </HStack>
                   ) : (
                     <Select
                       value={formData.asset_type_id}
                       onChange={(e) =>
                         handleInputChange("asset_type_id", e.target.value)
                       }
                       placeholder="Select an asset type"
                       size="lg"
                       bg={inputBg}
                       borderColor={inputBorderColor}
                       borderWidth="2px"
                       borderRadius="md"
                       _hover={{ borderColor: "teal.300" }}
                       _focus={{
                         borderColor: focusBorderColor,
                         boxShadow: `0 0 0 1px ${focusBorderColor}`,
                       }}
                     >
                       {assetTypes?.map((assetType) => (
                         <option
                           key={assetType.asset_type_id}
                           value={assetType.asset_type_id}
                         >
                           {assetType.name} ({assetType.unit_symbol})
                         </option>
                       ))}
                     </Select>
                   )}
                   <FormErrorMessage>{errors.asset_type_id}</FormErrorMessage>
                   <FormHelperText>
                     Type of asset you&apos;re tracking
                     {selectedAssetType && (
                       <Badge ml={2} colorScheme="teal" size="sm">
                         {selectedAssetType.unit_symbol}
                       </Badge>
                     )}
                   </FormHelperText>
                 </FormControl>

                {/* Notes */}
                <FormControl isInvalid={!!errors.notes}>
                  <FormLabel fontWeight="semibold" mb={2}>
                    <HStack spacing={2}>
                      <FileText size={16} />
                      <Text>Notes (Optional)</Text>
                    </HStack>
                  </FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Add any additional details about this asset..."
                    rows={3}
                    maxLength={1000}
                    bg={inputBg}
                    borderColor={inputBorderColor}
                    borderWidth="2px"
                    borderRadius="md"
                    _hover={{ borderColor: "teal.300" }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    resize="vertical"
                  />
                  <FormErrorMessage>{errors.notes}</FormErrorMessage>
                  <FormHelperText>
                    Additional details about this asset ({formData.notes.length}
                    /1000 characters)
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>



            {/* Error Display */}
            {createPhysicalAssetMutation.isError && (
              <Alert
                status="error"
                borderRadius="md"
                border="1px solid"
                borderColor="red.200"
              >
                <AlertIcon />
                <Box>
                  <AlertTitle fontWeight="bold">Creation Failed!</AlertTitle>
                  <AlertDescription>
                    {createPhysicalAssetMutation.error?.message ||
                      "An error occurred while creating the physical asset. Please try again."}
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Action Buttons */}
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={3}
              width="full"
            >
               <Button
                 type="submit"
                 bg="teal.500"
                 color="white"
                 _hover={{
                   bg: "teal.600",
                   transform: isLoading ? "none" : "translateY(-2px)",
                   boxShadow: isLoading ? "none" : "lg",
                 }}
                 size="lg"
                 width={{ base: "full", md: "auto" }}
                 flex={{ base: "none", md: 1 }}
                 borderRadius="md"
                 isLoading={isLoading}
                 loadingText="Creating Asset..."
                 isDisabled={!isFormValid}
                 leftIcon={<Plus />}
                 transition="all 0.2s"
               >
                 Create Physical Asset
               </Button>

              <Button
                variant="outline"
                onClick={handleClose}
                size="lg"
                width={{ base: "full", md: "auto" }}
                flex={{ base: "none", md: 1 }}
                borderRadius="md"
                borderWidth="2px"
                borderColor={useColorModeValue("gray.300", "gray.600")}
                color={useColorModeValue("gray.600", "gray.200")}
                _hover={{
                  bg: useColorModeValue("gray.50", "gray.600"),
                  borderColor: useColorModeValue("gray.400", "gray.500"),
                  transform: "translateY(-2px)",
                }}
                isDisabled={isLoading}
                transition="all 0.2s"
              >
                Cancel
              </Button>
            </Stack>
          </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CreatePhysicalAssetModal;
