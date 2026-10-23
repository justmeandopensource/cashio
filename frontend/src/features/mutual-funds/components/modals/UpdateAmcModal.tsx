import React, { useState, useEffect } from "react";
import { useColorModeValue } from "../../../../components/ui/color-mode";
import { Input, Button, Box, VStack, HStack, Textarea, Icon, Field, Dialog, Portal } from "@chakra-ui/react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAmc } from "../../api";
import { Amc } from "../../types";
import { Edit } from "lucide-react";
import { notify } from "@/components/shared/notify";

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
      notify({
        description: "AMC updated successfully",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["amcs", amc.ledger_id] });
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", amc.ledger_id] });
      onClose();
      onUpdateCompleted();
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        notify({
          description:
            error.response?.data?.detail || "Failed to update AMC",
          status: "error",
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
      notify({
        description: "Please update at least one field.",
        status: "warning",
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
    <Dialog.Root
      open={isOpen}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slide-in-bottom"
      onOpenChange={e => {
        if (!e.open) {
          onClose();
        }
      }}
    >
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
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><Edit /></Icon>

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

            <Dialog.Body
              px={{ base: 4, sm: 8 }}
              py={{ base: 4, sm: 6 }}
              flex="1"
              display="flex"
              flexDirection="column"
              overflowY="auto"
              overflowX="hidden"
              justifyContent={{ base: "space-between", sm: "flex-start" }}
            >
              <VStack gap={{ base: 5, sm: 6 }} align="stretch" w="100%">
                {/* AMC Name Card */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Field.Root required invalid={!!errors.name}>
                    <Field.Label fontWeight="semibold" mb={2}>
                      AMC Name
                    </Field.Label>
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
                    <Field.ErrorText>{errors.name}</Field.ErrorText>
                    <Field.HelperText mt={2}>
                      Update the name of the Asset Management Company
                    </Field.HelperText>
                  </Field.Root>
                </Box>

                {/* Notes Card */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Field.Root invalid={!!errors.notes}>
                    <Field.Label fontWeight="semibold" mb={2}>
                      Notes (Optional)
                    </Field.Label>
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
                      disabled={isLoading}
                    />
                    <Field.ErrorText>{errors.notes}</Field.ErrorText>
                    <Field.HelperText mt={2}>
                      Additional notes about the AMC (
                      {formData.notes.length}/500 characters)
                    </Field.HelperText>
                  </Field.Root>
                </Box>
              </VStack>

              {/* Mobile-only action buttons that stay at bottom */}
              <Box display={{ base: "block", sm: "none" }} mt={6}>
                <Button
                  onClick={handleSubmit}
                  colorPalette="brand"
                  size="lg"
                  width="100%"
                  mb={3}
                  borderRadius="lg"
                  fontWeight="bold"
                  loading={isLoading}
                  loadingText="Updating..."
                  disabled={!hasChanges}
                >
                  Update AMC
                </Button>
                <Button
                  variant="ghost"
                  colorPalette="gray"
                  onClick={onClose}
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
                colorPalette="brand"
                mr={3}
                onClick={handleSubmit}
                px={8}
                py={3}
                borderRadius="lg"
                fontWeight="bold"
                loading={isLoading}
                loadingText="Updating..."
                disabled={!hasChanges}
              >
                Update AMC
              </Button>
              <Button
                variant="ghost"
                colorPalette="gray"
                onClick={onClose}
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

export default UpdateAmcModal;