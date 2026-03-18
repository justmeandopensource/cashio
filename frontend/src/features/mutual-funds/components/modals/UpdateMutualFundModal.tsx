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
  Textarea,
  Select,
  Button,
  useToast,
  Box,
  VStack,
  HStack,
  useColorModeValue,
  Text,
  Icon,
} from "@chakra-ui/react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMutualFund } from "../../api";
import { MutualFund, Amc } from "../../types";
import { Edit, Check, X, TrendingUp, FileText, Building2 } from "lucide-react";
import FormMutualFundSuggestionField from "../FormMutualFundSuggestionField";

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
import { toastDefaults } from "@/components/shared/utils";

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
      toast({
        description: "Mutual fund updated successfully",
        status: "success",
        ...toastDefaults,
      });
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", fund.ledger_id] });
      queryClient.invalidateQueries({ queryKey: ["amcs", fund.ledger_id] });
      onClose();
      onUpdateCompleted();
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        toast({
          description:
            error.response?.data?.detail || "Failed to update mutual fund",
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
      toast({
        description: "Please update at least one field.",
        status: "warning",
        ...toastDefaults,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
        maxHeight={{ base: "100%", md: "90vh" }}
        display="flex"
        flexDirection="column"
      >
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
                fontWeight="bold"
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

        <ModalBody
          px={{ base: 4, sm: 8 }}
          py={{ base: 4, sm: 6 }}
          flex="1"
          display="flex"
          flexDirection="column"
          overflow="auto"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
            {/* Fund Name Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel fontWeight="semibold" mb={2}>
                  <HStack spacing={2}>
                    <TrendingUp size={16} />
                    <Text>Mutual Fund Name</Text>
                  </HStack>
                </FormLabel>
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
                <FormErrorMessage>{errors.name}</FormErrorMessage>
                <FormHelperText mt={2}>
                  Update the complete name of the mutual fund scheme
                </FormHelperText>
              </FormControl>
            </Box>

            {/* Plan and Code Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                <HStack spacing={4} align="start">
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

                  <FormControl isInvalid={!!errors.code} flex={1}>
                    <FormLabel fontWeight="semibold" mb={2}>
                      <HStack spacing={2}>
                        <FileText size={16} />
                        <Text>Code (Optional)</Text>
                      </HStack>
                    </FormLabel>
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
                    <FormErrorMessage>{errors.code}</FormErrorMessage>
                    <FormHelperText>Enter a unique code</FormHelperText>
                  </FormControl>
                </HStack>

              </VStack>
            </Box>

            {/* Owner Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
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
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                {/* Asset Class */}
                <FormControl isInvalid={!!errors.asset_class}>
                  <FormLabel fontWeight="semibold" mb={2}>
                    <HStack spacing={2}>
                      <FileText size={16} />
                      <Text>Asset Class (Optional)</Text>
                    </HStack>
                  </FormLabel>
                  <Select
                    value={formData.asset_class}
                    onChange={(e) => handleInputChange("asset_class", e.target.value)}
                    placeholder="Select asset class"
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
                    {ASSET_CLASSES.map((assetClass) => (
                      <option key={assetClass.value} value={assetClass.value}>
                        {assetClass.label}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.asset_class}</FormErrorMessage>
                  <FormHelperText>
                    Choose the asset class for this mutual fund
                  </FormHelperText>
                </FormControl>

                {/* Asset Sub Class */}
                {formData.asset_class &&
                  ASSET_SUB_CLASSES[
                    formData.asset_class as keyof typeof ASSET_SUB_CLASSES
                  ]?.length > 0 && (
                    <FormControl isInvalid={!!errors.asset_sub_class}>
                      <FormLabel fontWeight="semibold" mb={2}>
                        <HStack spacing={2}>
                          <FileText size={16} />
                          <Text>Asset Sub-Class (Optional)</Text>
                        </HStack>
                      </FormLabel>
                      <Select
                        value={formData.asset_sub_class}
                        onChange={(e) => handleInputChange("asset_sub_class", e.target.value)}
                        placeholder="Select asset sub-class"
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
                        {ASSET_SUB_CLASSES[
                          formData.asset_class as keyof typeof ASSET_SUB_CLASSES
                        ].map((subClass) => (
                          <option key={subClass.value} value={subClass.value}>
                            {subClass.label}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>{errors.asset_sub_class}</FormErrorMessage>
                      <FormHelperText>
                        Choose the asset sub-class for this mutual fund
                      </FormHelperText>
                    </FormControl>
                  )}
              </VStack>
            </Box>

            {/* AMC Selection Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormControl isInvalid={!!errors.amc_id}>
                <FormLabel fontWeight="semibold" mb={2}>
                  <HStack spacing={2}>
                    <Building2 size={16} />
                    <Text>Asset Management Company</Text>
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </HStack>
                </FormLabel>
                 <Select
                   value={formData.amc_id}
                   onChange={(e) => handleInputChange("amc_id", e.target.value)}
                   placeholder="Select the AMC"
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
                   {amcs
                     .sort((a, b) => a.name.localeCompare(b.name))
                     .map((amc) => (
                       <option key={amc.amc_id} value={amc.amc_id.toString()}>
                         {amc.name}
                       </option>
                     ))}
                 </Select>
                <FormErrorMessage>{errors.amc_id}</FormErrorMessage>
                <FormHelperText mt={2}>
                  Choose the AMC that manages this mutual fund
                </FormHelperText>
              </FormControl>
            </Box>

            {/* Notes Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormControl isInvalid={!!errors.notes}>
                <FormLabel fontWeight="semibold" mb={2}>
                  <HStack spacing={2}>
                    <FileText size={16} />
                    <Text>Notes (Optional)</Text>
                  </HStack>
                </FormLabel>
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
                  isDisabled={isLoading}
                />
                <FormErrorMessage>{errors.notes}</FormErrorMessage>
                <FormHelperText mt={2}>
                  Additional information about this fund (
                  {formData.notes.length}/500 characters)
                </FormHelperText>
              </FormControl>
            </Box>
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              onClick={handleSubmit}
              colorScheme="teal"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isLoading={isLoading}
              loadingText="Updating..."
              isDisabled={!hasChanges}
            >
              Update Mutual Fund
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="md"
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
          bg={cardBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            colorScheme="teal"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={isLoading}
            loadingText="Updating..."
            isDisabled={!hasChanges}
          >
            Update Mutual Fund
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
            isDisabled={isLoading}
            px={6}
            py={3}
            borderRadius="md"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateMutualFundModal;