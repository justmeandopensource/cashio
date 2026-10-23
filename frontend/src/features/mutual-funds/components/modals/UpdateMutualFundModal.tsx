import React, { useState, useEffect } from "react";
import { useColorModeValue } from "../../../../components/ui/color-mode";
import {
  Input,
  Textarea,
  NativeSelect,
  Button,
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Field,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMutualFund } from "../../api";
import { MutualFund, Amc } from "../../types";
import { Edit, TrendingUp, FileText, Building2 } from "lucide-react";
import FormMutualFundSuggestionField from "../FormMutualFundSuggestionField";
import { notify } from "@/components/shared/notify";

const ASSET_CLASSES = [
  { value: "Debt", label: "Debt" },
  { value: "Equity", label: "Equity" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "Others", label: "Others" },
].sort((a, b) => a.label.localeCompare(b.label));

const ASSET_SUB_CLASSES = {
  Equity: [
    { value: "Large Cap", label: "Large Cap" },
    { value: "Large & Mid Cap", label: "Large & Mid Cap" },
    { value: "Mid Cap", label: "Mid Cap" },
    { value: "Small Cap", label: "Small Cap" },
    { value: "Flexi Cap", label: "Flexi Cap" },
    { value: "Multi Cap", label: "Multi Cap" },
    { value: "ELSS", label: "ELSS" },
    { value: "Index", label: "Index" },
    { value: "Sectoral", label: "Sectoral" },
  ].sort((a, b) => a.label.localeCompare(b.label)),
  Debt: [
    { value: "Liquid", label: "Liquid" },
    { value: "Overnight", label: "Overnight" },
    { value: "Corporate Bond", label: "Corporate Bond" },
    { value: "Banking", label: "Banking" },
    { value: "Short Duration", label: "Short Duration" },
    { value: "Ultra Short Duration", label: "Ultra Short Duration" },
  ].sort((a, b) => a.label.localeCompare(b.label)),
  Hybrid: [],
  Others: [
    { value: "Gold", label: "Gold" },
    { value: "Silver", label: "Silver" },
  ].sort((a, b) => a.label.localeCompare(b.label)),
};
interface UpdateMutualFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  fund: MutualFund;
  amcs: Amc[];
  onUpdateCompleted: () => void;
}

interface FormData {
  name: string;
  plan: string;
  code: string;
  owner: string;
  asset_class: string;
  asset_sub_class: string;
  amc_id: string;
  notes: string;
}

const UpdateMutualFundModal: React.FC<UpdateMutualFundModalProps> = ({
  isOpen,
  onClose,
  fund,
  amcs,
  onUpdateCompleted,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: fund.name,
    plan: fund.plan || "",
    code: fund.code || "",
    owner: fund.owner || "",
    asset_class: fund.asset_class || "",
    asset_sub_class: fund.asset_sub_class || "",
    amc_id: fund.amc_id.toString(),
    notes: fund.notes || "",
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

  // Update form data when fund prop changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: fund.name,
        plan: fund.plan || "",
        code: fund.code || "",
        owner: fund.owner || "",
        asset_class: fund.asset_class || "",
        asset_sub_class: fund.asset_sub_class || "",
        amc_id: fund.amc_id.toString(),
        notes: fund.notes || "",
      });
      setErrors({});
    }
  }, [isOpen, fund]);

  const updateMutualFundMutation = useMutation({
    mutationFn: (updateData: {
      name?: string;
      plan?: string;
      code?: string;
      owner?: string;
      asset_class?: string;
      asset_sub_class?: string;
      amc_id?: number;
      notes?: string;
    }) => updateMutualFund(fund.ledger_id, fund.mutual_fund_id, updateData),
    onSuccess: () => {
      notify({
        description: "Mutual fund updated successfully",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", fund.ledger_id] });
      queryClient.invalidateQueries({ queryKey: ["amcs", fund.ledger_id] });
      onClose();
      onUpdateCompleted();
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        notify({
          description:
            error.response?.data?.detail || "Failed to update mutual fund",
          status: "error",
        });
      }
    },
  });

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Mutual fund name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Mutual fund name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Mutual fund name must be less than 100 characters";
    }

    if (formData.plan && formData.plan.length > 50) {
      newErrors.plan = "Plan must be less than 50 characters";
    }

    if (formData.code && formData.code.length > 50) {
      newErrors.code = "Code must be less than 50 characters";
    }

    if (formData.owner && formData.owner.length > 100) {
      newErrors.owner = "Owner must be less than 100 characters";
    }



    if (!formData.amc_id) {
      newErrors.amc_id = "Please select an AMC";
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

    const payload: {
      name?: string;
      plan?: string;
      code?: string;
      owner?: string;
      asset_class?: string;
      asset_sub_class?: string;
      amc_id?: number;
      notes?: string;
    } = {};

    // Add only the fields that have changed
    if (formData.name !== fund.name) payload.name = formData.name.trim();
    if (formData.plan !== (fund.plan || "")) payload.plan = formData.plan.trim() || undefined;
    if (formData.code !== (fund.code || "")) payload.code = formData.code.trim() || undefined;
    if (formData.owner !== (fund.owner || "")) payload.owner = formData.owner.trim() || undefined;
    if (formData.asset_class !== (fund.asset_class || "")) payload.asset_class = formData.asset_class.trim() || undefined;
    if (formData.asset_sub_class !== (fund.asset_sub_class || "")) payload.asset_sub_class = formData.asset_sub_class.trim() || undefined;
    if (parseInt(formData.amc_id) !== fund.amc_id) payload.amc_id = parseInt(formData.amc_id);
    if (formData.notes !== (fund.notes || "")) payload.notes = formData.notes.trim() || undefined;

    // If no fields have changed, show an error toast
    if (Object.keys(payload).length === 0) {
      notify({
        description: "Please update at least one field.",
        status: "warning",
      });
      return;
    }

    updateMutualFundMutation.mutate(payload);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Clear sub-class when asset class changes
      if (field === "asset_class" && value !== prev.asset_class) {
        newData.asset_sub_class = "";
      }

      return newData;
    });

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const isLoading = updateMutualFundMutation.isPending;
  const hasChanges =
    formData.name !== fund.name ||
    formData.plan !== (fund.plan || "") ||
    formData.code !== (fund.code || "") ||
    formData.owner !== (fund.owner || "") ||
    formData.asset_class !== (fund.asset_class || "") ||
    formData.asset_sub_class !== (fund.asset_sub_class || "") ||
    formData.amc_id !== fund.amc_id.toString() ||
    formData.notes !== (fund.notes || "");

  return (
    <Dialog.Root
      open={isOpen}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slide-in-bottom"
      onOpenChange={e => {
        if (!e.open) {
          onClose();
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
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><Edit /></Icon>

                <Box>
                  <Box
                    fontSize="lg"
                    fontWeight="800"
                    letterSpacing="-0.02em"
                    color={modalTitleColor}
                  >
                    Update Mutual Fund
                  </Box>
                  <Box
                    fontSize="sm"
                    color={modalSubtitleColor}
                  >
                    Modify mutual fund details and settings
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
                {/* Fund Name Card */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Field.Root required invalid={!!errors.name}>
                    <Field.Label fontWeight="semibold" mb={2}>
                      <HStack gap={2}>
                        <TrendingUp size={16} />
                        <Text>Mutual Fund Name</Text>
                      </HStack>
                    </Field.Label>
                    <Input
                      placeholder="e.g., HDFC Mid Cap Fund"
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
                      Update the complete name of the mutual fund scheme
                    </Field.HelperText>
                  </Field.Root>
                </Box>

                {/* Plan and Code Card */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <VStack gap={5} align="stretch">
                    <HStack gap={4} align="start">
                      <FormMutualFundSuggestionField
                        ledgerId={fund.ledger_id.toString()}
                        field="plan"
                        label="Plan (Optional)"
                        value={formData.plan}
                        setValue={(val) => handleInputChange("plan", val)}
                        placeholder="Direct Growth"
                        helperText="Enter the plan type"
                        borderColor={inputBorderColor}
                        inputBg={inputBg}
                      />

                      <Field.Root invalid={!!errors.code} flex={1}>
                        <Field.Label fontWeight="semibold" mb={2}>
                          <HStack gap={2}>
                            <FileText size={16} />
                            <Text>Code (Optional)</Text>
                          </HStack>
                        </Field.Label>
                        <Input
                          value={formData.code}
                          onChange={(e) => handleInputChange("code", e.target.value)}
                          placeholder="HDFC001"
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
                        <Field.ErrorText>{errors.code}</Field.ErrorText>
                        <Field.HelperText>Enter a unique code</Field.HelperText>
                      </Field.Root>
                    </HStack>

                  </VStack>
                </Box>

                {/* Owner Card */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <FormMutualFundSuggestionField
                    ledgerId={fund.ledger_id.toString()}
                    field="owner"
                    label="Owner (Optional)"
                    value={formData.owner}
                    setValue={(val) => handleInputChange("owner", val)}
                    placeholder="e.g., John Doe"
                    helperText="Enter the owner name to allow same fund names for different owners"
                    borderColor={inputBorderColor}
                    inputBg={inputBg}
                  />
                </Box>

                {/* Asset Classification Card */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <VStack gap={5} align="stretch">
                    {/* Asset Class */}
                    <Field.Root invalid={!!errors.asset_class}>
                      <Field.Label fontWeight="semibold" mb={2}>
                        <HStack gap={2}>
                          <FileText size={16} />
                          <Text>Asset Class (Optional)</Text>
                        </HStack>
                      </Field.Label>
                      <NativeSelect.Root size="lg">
                        <NativeSelect.Field
                          value={formData.asset_class}
                          onChange={(e) => handleInputChange("asset_class", e.target.value)}
                          placeholder="Select asset class"
                          bg={inputBg}
                          borderColor={inputBorderColor}
                          borderWidth="2px"
                          borderRadius="md"
                          _hover={{ borderColor: "teal.300" }}
                          _focus={{
                            borderColor: focusBorderColor,
                            boxShadow: `0 0 0 1px ${focusBorderColor}`,
                          }}>
                          {ASSET_CLASSES.map((assetClass) => (
                            <option key={assetClass.value} value={assetClass.value}>
                              {assetClass.label}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Field.ErrorText>{errors.asset_class}</Field.ErrorText>
                      <Field.HelperText>
                        Choose the asset class for this mutual fund
                      </Field.HelperText>
                    </Field.Root>

                    {/* Asset Sub Class */}
                    {formData.asset_class &&
                      ASSET_SUB_CLASSES[
                        formData.asset_class as keyof typeof ASSET_SUB_CLASSES
                      ]?.length > 0 && (
                        <Field.Root invalid={!!errors.asset_sub_class}>
                          <Field.Label fontWeight="semibold" mb={2}>
                            <HStack gap={2}>
                              <FileText size={16} />
                              <Text>Asset Sub-Class (Optional)</Text>
                            </HStack>
                          </Field.Label>
                          <NativeSelect.Root size="lg">
                            <NativeSelect.Field
                              value={formData.asset_sub_class}
                              onChange={(e) => handleInputChange("asset_sub_class", e.target.value)}
                              placeholder="Select asset sub-class"
                              bg={inputBg}
                              borderColor={inputBorderColor}
                              borderWidth="2px"
                              borderRadius="md"
                              _hover={{ borderColor: "teal.300" }}
                              _focus={{
                                borderColor: focusBorderColor,
                                boxShadow: `0 0 0 1px ${focusBorderColor}`,
                              }}>
                              {ASSET_SUB_CLASSES[
                                formData.asset_class as keyof typeof ASSET_SUB_CLASSES
                              ].map((subClass) => (
                                <option key={subClass.value} value={subClass.value}>
                                  {subClass.label}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                          <Field.ErrorText>{errors.asset_sub_class}</Field.ErrorText>
                          <Field.HelperText>
                            Choose the asset sub-class for this mutual fund
                          </Field.HelperText>
                        </Field.Root>
                      )}
                  </VStack>
                </Box>

                {/* AMC Selection Card */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Field.Root invalid={!!errors.amc_id}>
                    <Field.Label fontWeight="semibold" mb={2}>
                      <HStack gap={2}>
                        <Building2 size={16} />
                        <Text>Asset Management Company</Text>
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </HStack>
                    </Field.Label>
                     <NativeSelect.Root size="lg">
                       <NativeSelect.Field
                         value={formData.amc_id}
                         onChange={(e) => handleInputChange("amc_id", e.target.value)}
                         placeholder="Select the AMC"
                         bg={inputBg}
                         borderColor={inputBorderColor}
                         borderWidth="2px"
                         borderRadius="md"
                         _hover={{ borderColor: "teal.300" }}
                         _focus={{
                           borderColor: focusBorderColor,
                           boxShadow: `0 0 0 1px ${focusBorderColor}`,
                         }}>
                         {amcs
                           .sort((a, b) => a.name.localeCompare(b.name))
                           .map((amc) => (
                             <option key={amc.amc_id} value={amc.amc_id.toString()}>
                               {amc.name}
                             </option>
                           ))}
                       </NativeSelect.Field>
                       <NativeSelect.Indicator />
                     </NativeSelect.Root>
                    <Field.ErrorText>{errors.amc_id}</Field.ErrorText>
                    <Field.HelperText mt={2}>
                      Choose the AMC that manages this mutual fund
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
                      <HStack gap={2}>
                        <FileText size={16} />
                        <Text>Notes (Optional)</Text>
                      </HStack>
                    </Field.Label>
                    <Textarea
                      placeholder="Other details..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
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
                      disabled={isLoading}
                    />
                    <Field.ErrorText>{errors.notes}</Field.ErrorText>
                    <Field.HelperText mt={2}>
                      Additional information about this fund (
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
                  Update Mutual Fund
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
                Update Mutual Fund
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

export default UpdateMutualFundModal;