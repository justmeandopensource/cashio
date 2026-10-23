import React, { FC, useState, useEffect } from "react";
import { useColorModeValue } from "../../../../components/ui/color-mode";
import {
  Button,
  VStack,
  Input,
  Textarea,
  Text,
  NativeSelect,
  Alert,
  Box,
  HStack,
  Spinner,
  Icon,
  Badge,
  Field,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import {
  Plus,
  FileText,
  Tag,
  Coins,
  Check,
} from "lucide-react";
import { CreatePhysicalAssetModalProps, PhysicalAssetCreate } from "../../types";
import { useCreatePhysicalAsset, useAssetTypes } from "../../api";
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
  const ledgerId = useLedgerStore((s) => s.ledgerId);
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
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");
  const footerBg = useColorModeValue("gray.50", "gray.900");

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
    <Dialog.Root
      open={isOpen}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slide-in-bottom"
      onOpenChange={e => {
        if (!e.open) {
          handleClose();
        }
      }}>
      <Portal>

        <Dialog.Backdrop backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <Dialog.Positioner>
          <Dialog.Content
            bg={bgColor}
            borderRadius={{ base: 0, sm: "xl" }}
            boxShadow="2xl"
            border="1px solid"
            borderColor={borderColor}
            overflow="hidden"
            mx={{ base: 0, sm: 4 }}
            my={{ base: 0, sm: "auto" }}
            maxHeight={{ base: "100%", md: "90vh" }}
            display="flex"
            flexDirection="column">
            {/* Gradient accent line */}
            <Box h="3px" bgGradient="to-r" gradientFrom="brand.400" gradientVia="brand.600" gradientTo="teal.300"  />
            {/* Flat header */}
            <Box
              px={{ base: 4, sm: 8 }}
              py={5}
              borderBottom="1px solid"
              borderColor={modalHeaderBorderColor}
            >
              <HStack gap={3} align="flex-start">
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><Plus /></Icon>

                <Box>
                  <Text
                    fontSize="lg"
                    fontWeight="800"
                    letterSpacing="-0.02em"
                    color={modalTitleColor}
                  >
                    Create Physical Asset
                  </Text>
                  <Text
                    fontSize="sm"
                    color={modalSubtitleColor}
                  >
                    Add a new asset to your portfolio
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Dialog.Body
              px={{ base: 4, sm: 8 }}
              py={{ base: 4, sm: 6 }}
              flex="1"
              overflowY="auto"
             overflowX="hidden"
            >
              <form id="create-physical-asset-form" onSubmit={handleCreate}>
                <VStack gap={{ base: 5, sm: 6 }} align="stretch">
               {/* Asset Details Form */}
               <Box
                 bg={cardBg}
                 p={{ base: 4, sm: 6 }}
                 borderRadius="xl"
                 border="1px solid"
                 borderColor={borderColor}
               >
                 <VStack gap={5} align="stretch">
                    {/* Asset Name */}
                    <Field.Root invalid={!!errors.name}>
                      <Field.Label fontWeight="semibold" mb={2}>
                        <HStack gap={2}>
                          <Tag size={16} />
                          <Text>Asset Name</Text>
                          {formData.name.trim() && (
                            <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
                          )}
                        </HStack>
                      </Field.Label>
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
                      <Field.ErrorText>{errors.name}</Field.ErrorText>
                      <Field.HelperText>Choose a unique name</Field.HelperText>
                    </Field.Root>

                    {/* Asset Type Selection */}
                    <Field.Root invalid={!!errors.asset_type_id}>
                      <Field.Label fontWeight="semibold" mb={2}>
                        <HStack gap={2}>
                          <Coins size={16} />
                          <Text>Asset Type</Text>
                          {formData.asset_type_id && (
                            <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
                          )}
                        </HStack>
                      </Field.Label>
                      {assetTypesLoading ? (
                        <HStack justify="center" p={4}>
                          <Spinner size="sm" />
                          <Text fontSize="sm" color="gray.500">
                            Loading asset types...
                          </Text>
                        </HStack>
                      ) : (
                        <NativeSelect.Root size="lg">
                          <NativeSelect.Field
                            value={formData.asset_type_id}
                            onChange={(e) =>
                              handleInputChange("asset_type_id", e.target.value)
                            }
                            placeholder="Select an asset type"
                            bg={inputBg}
                            borderColor={inputBorderColor}
                            borderWidth="2px"
                            borderRadius="md"
                            _hover={{ borderColor: "teal.300" }}
                            _focus={{
                              borderColor: focusBorderColor,
                              boxShadow: `0 0 0 1px ${focusBorderColor}`,
                            }}>
                            {assetTypes?.map((assetType) => (
                              <option
                                key={assetType.asset_type_id}
                                value={assetType.asset_type_id}
                              >
                                {assetType.name} ({assetType.unit_symbol})
                              </option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      )}
                      <Field.ErrorText>{errors.asset_type_id}</Field.ErrorText>
                      <Field.HelperText>
                        Type of asset you&apos;re tracking
                        {selectedAssetType && (
                          <Badge ml={2} colorPalette="brand" size="sm">
                            {selectedAssetType.unit_symbol}
                          </Badge>
                        )}
                      </Field.HelperText>
                    </Field.Root>

                   {/* Notes */}
                   <Field.Root invalid={!!errors.notes}>
                     <Field.Label fontWeight="semibold" mb={2}>
                       <HStack gap={2}>
                         <FileText size={16} />
                         <Text>Notes (Optional)</Text>
                       </HStack>
                     </Field.Label>
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
                     <Field.ErrorText>{errors.notes}</Field.ErrorText>
                     <Field.HelperText>
                       Additional details about this asset ({formData.notes.length}
                       /1000 characters)
                     </Field.HelperText>
                   </Field.Root>
                 </VStack>
               </Box>



               {/* Error Display */}
               {createPhysicalAssetMutation.isError && (
                 <Alert.Root
                   status="error"
                   borderRadius="md"
                   border="1px solid"
                   borderColor="red.200"
                 >
                   <Alert.Indicator />
                   <Box>
                     <Alert.Title fontWeight="bold">Creation Failed!</Alert.Title>
                     <Alert.Description>
                       {createPhysicalAssetMutation.error?.message ||
                         "An error occurred while creating the physical asset. Please try again."}
                     </Alert.Description>
                   </Box>
                 </Alert.Root>
               )}

             </VStack>
             </form>

             {/* Mobile-only action buttons */}
             <Box display={{ base: "block", sm: "none" }} mt={6}>
               <Button
                 type="submit"
                 form="create-physical-asset-form"
                 colorPalette="brand"
                 size="lg"
                 width="100%"
                 mb={3}
                 borderRadius="lg"
                 fontWeight="bold"
                 loading={isLoading}
                 loadingText="Creating Asset..."
                 disabled={!isFormValid}
               >
                 Create Physical Asset
               </Button>
               <Button
                 variant="ghost"
                 colorPalette="gray"
                 onClick={handleClose}
                 size="lg"
                 width="100%"
                 borderRadius="lg"
                 disabled={isLoading}
               >
                 Cancel
               </Button>
             </Box>
           </Dialog.Body>

            {/* Desktop-only footer */}
            <Dialog.Footer
              display={{ base: "none", sm: "flex" }}
              px={8}
              py={6}
              bg={footerBg}
              borderTop="1px solid"
              borderColor={borderColor}
            >
              <Button
                type="submit"
                form="create-physical-asset-form"
                colorPalette="brand"
                mr={3}
                px={8}
                py={3}
                borderRadius="lg"
                  fontWeight="bold"
                loading={isLoading}
                loadingText="Creating Asset..."
                disabled={!isFormValid}
              >
                Create Physical Asset
              </Button>
              <Button
                variant="ghost"
                colorPalette="gray"
                onClick={handleClose}
                disabled={isLoading}
                px={6}
                py={3}
                borderRadius="lg"
              >
                Cancel
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default CreatePhysicalAssetModal;
