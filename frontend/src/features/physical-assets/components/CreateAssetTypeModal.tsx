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
} from "@chakra-ui/react";
import {
  Plus,
  FileText,
  Tag,
  Ruler,
  Hash as HashIcon,
} from "lucide-react";
import { CreateAssetTypeModalProps, AssetTypeCreate } from "../types";
import { useCreateAssetType } from "../api";
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
                Create Asset Type
              </Text>
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
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
           overflow="auto"
         >
           <form id="create-asset-type-form" onSubmit={handleCreate}>
             <VStack spacing={{ base: 5, sm: 6 }} align="stretch">
            {/* Asset Type Details Form */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
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
                      <Text as="span" color="red.500">
                        *
                      </Text>
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
                        <Text as="span" color="red.500">
                          *
                        </Text>
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
                        <Text as="span" color="red.500">
                          *
                        </Text>
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
                 loadingText="Creating Asset Type..."
                 isDisabled={!isFormValid}
                 leftIcon={<Plus />}
                 transition="all 0.2s"
               >
                 Create Asset Type
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

export default CreateAssetTypeModal;
