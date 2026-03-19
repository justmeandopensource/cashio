import React, { FC, useRef, useState, useEffect } from "react";
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  HStack,
  Text,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  Icon,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, FileText, X, CheckCircle, Check } from "lucide-react";
import { createAmc } from "../../api";
import { AmcCreate } from "../../types";
import useLedgerStore from "@/components/shared/store";

interface CreateAmcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  notes: string;
}

const CreateAmcModal: FC<CreateAmcModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const initialRef = useRef(null);
  const { ledgerId } = useLedgerStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    notes: "",
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

  const createAmcMutation = useMutation({
    mutationFn: (amcData: AmcCreate) => createAmc(Number(ledgerId), amcData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amcs", ledgerId] });
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", ledgerId] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      } else {
        setErrors({ general: "Failed to create AMC. Please try again." });
      }
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        notes: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "AMC name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "AMC name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "AMC name must be less than 100 characters";
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = "Notes must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    createAmcMutation.reset();
    setFormData({ name: "", notes: "" });
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const amcData: AmcCreate = {
      name: formData.name.trim(),
      notes: formData.notes.trim() || undefined,
    };

    createAmcMutation.mutate(amcData);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const isLoading = createAmcMutation.isPending;
  const isFormValid = formData.name.trim();

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
            <Icon as={Building2} boxSize={5} mt="3px" color={modalIconColor} />

            <Box>
              <Box
                fontSize="lg"
                fontWeight="800"
                letterSpacing="-0.02em"
                color={modalTitleColor}
              >
                Create AMC
              </Box>
              <Box
                fontSize="sm"
                color={modalSubtitleColor}
              >
                Add a new AMC to manage mutual funds
              </Box>
            </Box>
          </HStack>
        </Box>

        <ModalBody
          px={{ base: 4, sm: 8 }}
          py={{ base: 4, sm: 6 }}
          flex="1"
          display="flex"
          flexDirection="column"
          overflowY="auto"
          overflowX="hidden"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <form id="create-amc-form" onSubmit={handleSubmit}>
            <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
              {/* AMC Details Form */}
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="xl"
                border="1px solid"
                borderColor={borderColor}
              >
                <VStack spacing={5} align="stretch">
                  {/* AMC Name */}
                  <FormControl isInvalid={!!errors.name}>
                    <FormLabel fontWeight="semibold" mb={2}>
                      <HStack spacing={2}>
                        <Building2 size={16} />
                        <Text>AMC Name</Text>
                        {formData.name.trim() && (
                          <Icon as={Check} boxSize={3.5} color="teal.500" />
                        )}
                      </HStack>
                    </FormLabel>
                    <Input
                      ref={initialRef}
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="e.g., HDFC, ICICI, SBI"
                      maxLength={100}
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
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                    <FormHelperText>
                      Enter the name of the Asset Management Company
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
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      placeholder="Add notes about this AMC"
                      rows={4}
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
                    <FormErrorMessage>{errors.notes}</FormErrorMessage>
                    <FormHelperText>
                      Additional notes about the AMC (
                      {formData.notes.length}/500 characters)
                    </FormHelperText>
                  </FormControl>
                </VStack>
              </Box>

              {/* Error Display */}
              {(createAmcMutation.isError || errors.general) && (
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
                      {errors.general ||
                        createAmcMutation.error?.message ||
                        "An error occurred while creating the AMC. Please try again."}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </form>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              type="submit"
              form="create-amc-form"
              colorScheme="brand"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="lg"
              fontWeight="bold"
              isLoading={isLoading}
              loadingText="Creating AMC..."
              isDisabled={!isFormValid}
              onClick={handleSubmit}
            >
              Create AMC
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
            form="create-amc-form"
            colorScheme="brand"
            mr={3}
            px={8}
            py={3}
            borderRadius="lg"
            fontWeight="bold"
            isLoading={isLoading}
            loadingText="Creating AMC..."
            isDisabled={!isFormValid}
            onClick={handleSubmit}
          >
            Create AMC
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

export default CreateAmcModal;
