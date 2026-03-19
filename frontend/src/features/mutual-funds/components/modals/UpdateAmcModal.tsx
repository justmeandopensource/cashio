import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Input,
  Button,
  useToast,
  Box,
  VStack,
  HStack,
  useColorModeValue,
  Textarea,
  Icon,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAmc } from "../../api";
import { Amc } from "../../types";
import { Edit, Check, X } from "lucide-react";
import { toastDefaults } from "@/components/shared/utils";

interface UpdateAmcModalProps {
  isOpen: boolean;
  onClose: () => void;
  amc: Amc;
  onUpdateCompleted: () => void;
}

interface FormData {
  name: string;
  notes: string;
}

const UpdateAmcModal: React.FC<UpdateAmcModalProps> = ({
  isOpen,
  onClose,
  amc,
  onUpdateCompleted,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: amc.name,
    notes: amc.notes || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const queryClient = useQueryClient();

  // Modern theme colors - matching other modals
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

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Update form data when amc prop changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: amc.name,
        notes: amc.notes || "",
      });
      setErrors({});
    }
  }, [isOpen, amc]);

  const updateAmcMutation = useMutation({
    mutationFn: (updateData: { name?: string; notes?: string }) =>
      updateAmc(amc.ledger_id, amc.amc_id, updateData),
    onSuccess: () => {
      toast({
        description: "AMC updated successfully",
        status: "success",
        ...toastDefaults,
      });
      queryClient.invalidateQueries({ queryKey: ["amcs", amc.ledger_id] });
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", amc.ledger_id] });
      onClose();
      onUpdateCompleted();
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        toast({
          description:
            error.response?.data?.detail || "Failed to update AMC",
          status: "error",
          ...toastDefaults,
        });
      }
    },
  });

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

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    const payload: { name?: string; notes?: string } = {};

    // Add only the fields that have changed
    if (formData.name !== amc.name) payload.name = formData.name.trim();
    if (formData.notes !== (amc.notes || "")) payload.notes = formData.notes.trim() || undefined;

    // If no fields have changed, show an error toast
    if (Object.keys(payload).length === 0) {
      toast({
        description: "Please update at least one field.",
        status: "warning",
        ...toastDefaults,
      });
      return;
    }

    updateAmcMutation.mutate(payload);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const isLoading = updateAmcMutation.isPending;
  const hasChanges =
    formData.name !== amc.name ||
    formData.notes !== (amc.notes || "");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
            <Icon as={Edit} boxSize={5} mt="3px" color={modalIconColor} />

            <Box>
              <Box
                fontSize="lg"
                fontWeight="800"
                letterSpacing="-0.02em"
                color={modalTitleColor}
              >
                Update AMC
              </Box>
              <Box
                fontSize="sm"
                color={modalSubtitleColor}
              >
                Modify AMC details and settings
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
          <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
            {/* AMC Name Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel fontWeight="semibold" mb={2}>
                  AMC Name
                </FormLabel>
                <Input
                  placeholder="e.g., HDFC, ICICI, SBI"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onKeyDown={handleKeyDown}
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  bg={inputBg}
                  size="lg"
                  borderRadius="md"
                  _hover={{ borderColor: "teal.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                  autoFocus
                  maxLength={100}
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
                <FormHelperText mt={2}>
                  Update the name of the Asset Management Company
                </FormHelperText>
              </FormControl>
            </Box>

            {/* Notes Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormControl isInvalid={!!errors.notes}>
                <FormLabel fontWeight="semibold" mb={2}>
                  Notes (Optional)
                </FormLabel>
                <Textarea
                  placeholder="Add notes about this AMC"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  bg={inputBg}
                  size="lg"
                  borderRadius="md"
                  rows={4}
                  _hover={{ borderColor: "teal.300" }}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                  resize="vertical"
                  maxLength={500}
                  isDisabled={isLoading}
                />
                <FormErrorMessage>{errors.notes}</FormErrorMessage>
                <FormHelperText mt={2}>
                  Additional notes about the AMC (
                  {formData.notes.length}/500 characters)
                </FormHelperText>
              </FormControl>
            </Box>
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              onClick={handleSubmit}
              colorScheme="brand"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="lg"
              fontWeight="bold"
              isLoading={isLoading}
              loadingText="Updating..."
              isDisabled={!hasChanges}
            >
              Update AMC
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
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
            colorScheme="brand"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="lg"
            fontWeight="bold"
            isLoading={isLoading}
            loadingText="Updating..."
            isDisabled={!hasChanges}
          >
            Update AMC
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
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

export default UpdateAmcModal;