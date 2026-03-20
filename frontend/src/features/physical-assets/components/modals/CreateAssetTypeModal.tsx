import React, { FC, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  HStack,
  Stack,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  Icon,
} from "@chakra-ui/react";
import {
  Plus,
  FileText,
  Tag,
  Ruler,
  Hash as HashIcon,
  Check,
} from "lucide-react";
import { CreateAssetTypeModalProps, AssetTypeCreate } from "../../types";
import { useCreateAssetType } from "../../api";
import useLedgerStore from "@/components/shared/store";

interface FormData {
  name: string;
  unit_name: string;
  unit_symbol: string;
  description: string;
}

const CreateAssetTypeModal: FC<CreateAssetTypeModalProps> = ({
  isOpen,
  onClose,
  onAssetTypeCreated,
}) => {
  const { ledgerId } = useLedgerStore();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    unit_name: "",
    unit_symbol: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const createAssetTypeMutation = useCreateAssetType();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        unit_name: "",
        unit_symbol: "",
        description: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Asset type name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Asset type name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Asset type name must be less than 100 characters";
    }

    if (!formData.unit_name.trim()) {
      newErrors.unit_name = "Unit name is required";
    } else if (formData.unit_name.length < 1) {
      newErrors.unit_name = "Unit name is required";
    } else if (formData.unit_name.length > 50) {
      newErrors.unit_name = "Unit name must be less than 50 characters";
    }

    if (!formData.unit_symbol.trim()) {
      newErrors.unit_symbol = "Unit symbol is required";
    } else if (formData.unit_symbol.length < 1) {
      newErrors.unit_symbol = "Unit symbol is required";
    } else if (formData.unit_symbol.length > 10) {
      newErrors.unit_symbol = "Unit symbol must be less than 10 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
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

    const assetTypeData: AssetTypeCreate = {
      name: formData.name.trim(),
      unit_name: formData.unit_name.trim(),
      unit_symbol: formData.unit_symbol.trim(),
      description: formData.description.trim() || undefined,
    };

    try {
      await createAssetTypeMutation.mutateAsync({
        ledgerId: Number(ledgerId),
        data: assetTypeData,
      });

      onAssetTypeCreated({
        asset_type_id: 0, // Will be set by the API
        ledger_id: Number(ledgerId),
        name: assetTypeData.name,
        unit_name: assetTypeData.unit_name,
        unit_symbol: assetTypeData.unit_symbol,
        description: assetTypeData.description,
        created_at: new Date().toISOString(),
      });

      onClose();
    } catch (error: any) {
      // Error handling is done by the mutation hook
      console.error("Asset type creation failed:", error);
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
    createAssetTypeMutation.reset();
    onClose();
  };

  const isLoading = createAssetTypeMutation.isPending;
  const isFormValid =
    formData.name.trim() &&
    formData.unit_name.trim() &&
    formData.unit_symbol.trim();

  return (
    <Modal
      isOpen={isOpen}
      returnFocusOnClose={false}
      onClose={handleClose}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <ModalContent
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
        flexDirection="column"
      >
        {/* Gradient accent line */}
        <Box
          h="3px"
          bgGradient="linear(to-r, brand.400, brand.600, teal.300)"
        />
        {/* Flat header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={modalHeaderBorderColor}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={Plus} boxSize={5} mt="3px" color={modalIconColor} />

            <Box>
              <Text
                fontSize="lg"
                fontWeight="800"
                letterSpacing="-0.02em"
                color={modalTitleColor}
              >
                Create Asset Type
              </Text>
              <Text
                fontSize="sm"
                color={modalSubtitleColor}
              >
                Define a new type of asset to track
              </Text>
            </Box>
          </HStack>
        </Box>

         <ModalBody
           px={{ base: 4, sm: 8 }}
           py={{ base: 4, sm: 6 }}
           flex="1"
           overflowY="auto"
          overflowX="hidden"
         >
           <form id="create-asset-type-form" onSubmit={handleCreate}>
             <VStack spacing={{ base: 5, sm: 6 }} align="stretch">
            {/* Asset Type Details Form */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                {/* Asset Type Name */}
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel fontWeight="semibold" mb={2}>
                    <HStack spacing={2}>
                      <Tag size={16} />
                      <Text>Asset Type Name</Text>
                      {formData.name.trim() && (
                        <Icon as={Check} boxSize={3.5} color="teal.500" />
                      )}
                    </HStack>
                  </FormLabel>
                   <Input
                     value={formData.name}
                     onChange={(e) => handleInputChange("name", e.target.value)}
                     placeholder="e.g., Gold, Silver, Bitcoin"
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
                  <FormHelperText>
                    Choose a descriptive name for this asset type
                  </FormHelperText>
                </FormControl>

                <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                  {/* Unit Name */}
                  <FormControl flex={1} isInvalid={!!errors.unit_name}>
                    <FormLabel fontWeight="semibold" mb={2}>
                      <HStack spacing={2}>
                        <Ruler size={16} />
                        <Text>Unit Name</Text>
                        {formData.unit_name.trim() && (
                          <Icon as={Check} boxSize={3.5} color="teal.500" />
                        )}
                      </HStack>
                    </FormLabel>
                    <Input
                      value={formData.unit_name}
                      onChange={(e) =>
                        handleInputChange("unit_name", e.target.value)
                      }
                      placeholder="e.g., gram, kilogram"
                      maxLength={50}
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
                    />
                    <FormErrorMessage>{errors.unit_name}</FormErrorMessage>
                    <FormHelperText>The measurement unit</FormHelperText>
                  </FormControl>

                  {/* Unit Symbol */}
                  <FormControl flex={1} isInvalid={!!errors.unit_symbol}>
                    <FormLabel fontWeight="semibold" mb={2}>
                      <HStack spacing={2}>
                        <HashIcon size={16} />
                        <Text>Unit Symbol</Text>
                        {formData.unit_symbol.trim() && (
                          <Icon as={Check} boxSize={3.5} color="teal.500" />
                        )}
                      </HStack>
                    </FormLabel>
                    <Input
                      value={formData.unit_symbol}
                      onChange={(e) =>
                        handleInputChange("unit_symbol", e.target.value)
                      }
                      placeholder="e.g., g, kg, ETH"
                      maxLength={10}
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
                    />
                    <FormErrorMessage>{errors.unit_symbol}</FormErrorMessage>
                    <FormHelperText>
                      Short abbreviation for the unit
                    </FormHelperText>
                  </FormControl>
                </Stack>

                {/* Description */}
                <FormControl isInvalid={!!errors.description}>
                  <FormLabel fontWeight="semibold" mb={2}>
                    <HStack spacing={2}>
                      <FileText size={16} />
                      <Text>Description (Optional)</Text>
                    </HStack>
                  </FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Add any additional details about this asset type..."
                    rows={3}
                    maxLength={500}
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
                  <FormErrorMessage>{errors.description}</FormErrorMessage>
                  <FormHelperText>
                    Additional details about this asset type (
                    {formData.description.length}/500 characters)
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>





            {/* Error Display */}
            {createAssetTypeMutation.isError && (
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
                    {createAssetTypeMutation.error?.message ||
                      "An error occurred while creating the asset type. Please try again."}
                  </AlertDescription>
                </Box>
              </Alert>
            )}

          </VStack>
          </form>

          {/* Mobile-only action buttons */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              type="submit"
              form="create-asset-type-form"
              colorScheme="brand"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="lg"
              fontWeight="bold"
              isLoading={isLoading}
              loadingText="Creating Asset Type..."
              isDisabled={!isFormValid}
            >
              Create Asset Type
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={handleClose}
              size="lg"
              width="100%"
              borderRadius="lg"
              isDisabled={isLoading}
            >
              Cancel
            </Button>
          </Box>
        </ModalBody>

        {/* Desktop-only footer */}
        <ModalFooter
          display={{ base: "none", sm: "flex" }}
          px={8}
          py={6}
          bg={footerBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            type="submit"
            form="create-asset-type-form"
            colorScheme="brand"
            mr={3}
            px={8}
            py={3}
            borderRadius="lg"
              fontWeight="bold"
            isLoading={isLoading}
            loadingText="Creating Asset Type..."
            isDisabled={!isFormValid}
          >
            Create Asset Type
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={handleClose}
            isDisabled={isLoading}
            px={6}
            py={3}
            borderRadius="lg"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateAssetTypeModal;
