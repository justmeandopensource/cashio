import React, { FC, useEffect, useRef, useState } from "react";
import { useColorModeValue } from "../../../../components/ui/color-mode";
import {
  Button,
  VStack,
  Input,
  Textarea,
  NativeSelect,
  Alert,
  Box,
  HStack,
  Text,
  Icon,
  Popover,
  Field,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { InputGroup } from "@/components/ui/input-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, FileText, Building2, X, Check, Search, ChevronDown } from "lucide-react";
import { createMutualFund } from "../../api";
import { Amc, MutualFundCreate } from "../../types";
import useLedgerStore from "@/components/shared/store";
import FormMutualFundSuggestionField from "../FormMutualFundSuggestionField";

interface CreateMutualFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  amcs: Amc[];
  onSuccess: () => void;
  preselectedAmcId?: number | null;
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

const CreateMutualFundModal: FC<CreateMutualFundModalProps> = ({
  isOpen,
  onClose,
  amcs,
  onSuccess,
  preselectedAmcId,
}) => {
  const initialRef = useRef(null);
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    plan: "",
    code: "",
    owner: "",
    asset_class: "",
    asset_sub_class: "",
    amc_id: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AMC searchable dropdown state
  const [amcSearch, setAmcSearch] = useState<string>("");
  const [isAmcOpen, setIsAmcOpen] = useState<boolean>(false);
  const [highlightedAmcIndex, setHighlightedAmcIndex] = useState<number>(-1);

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
  const helperTextColor = useColorModeValue("gray.500", "gray.400");
  const highlightColor = useColorModeValue("teal.50", "teal.900");
  const readOnlyBg = useColorModeValue("gray.100", "gray.600");

  const createMutualFundMutation = useMutation({
    mutationFn: (fundData: MutualFundCreate) =>
      createMutualFund(Number(ledgerId), fundData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", ledgerId] });
      queryClient.invalidateQueries({ queryKey: ["amcs", ledgerId] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      } else {
        setErrors({
          general: "Failed to create mutual fund. Please try again.",
        });
      }
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const validPreselected =
        preselectedAmcId &&
        preselectedAmcId > 0 &&
        amcs.find((amc) => amc.amc_id === preselectedAmcId);

      setFormData({
        name: "",
        plan: "",
        code: "",
        owner: "",
        asset_class: "",
        asset_sub_class: "",
        amc_id: validPreselected ? preselectedAmcId.toString() : "",
        notes: "",
      });
      setErrors({});
      setAmcSearch("");
      setIsAmcOpen(false);
      setHighlightedAmcIndex(-1);
    }
  }, [isOpen, preselectedAmcId, amcs]);

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

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = "Notes must be less than 500 characters";
    }

    const isPreselectedAmcValid =
      preselectedAmcId &&
      preselectedAmcId > 0 &&
      amcs.find((amc) => amc.amc_id === preselectedAmcId);

    const amcId = isPreselectedAmcValid
      ? preselectedAmcId
      : formData.amc_id
        ? parseInt(formData.amc_id, 10)
        : null;

    if (!amcId) {
      newErrors.amc_id = "Please select an AMC";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // AMC searchable dropdown computed values
  const sortedAmcs = [...amcs].sort((a, b) => a.name.localeCompare(b.name));
  const filteredAmcs = sortedAmcs.filter((amc) =>
    amc.name.toLowerCase().includes(amcSearch.toLowerCase()),
  );
  const selectedAmcOption = amcs.find((a) => a.amc_id.toString() === formData.amc_id);

  const handleAmcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = filteredAmcs.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isAmcOpen) { setIsAmcOpen(true); setHighlightedAmcIndex(0); }
        else { setHighlightedAmcIndex((prev) => (total === 0 ? -1 : (prev + 1) % total)); }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isAmcOpen && total > 0) setHighlightedAmcIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
        break;
      case "Enter":
        if (isAmcOpen && highlightedAmcIndex >= 0 && highlightedAmcIndex < total) {
          e.preventDefault();
          const amc = filteredAmcs[highlightedAmcIndex];
          handleInputChange("amc_id", amc.amc_id.toString());
          setAmcSearch("");
          setIsAmcOpen(false);
          setHighlightedAmcIndex(-1);
        }
        break;
      case "Escape":
        setIsAmcOpen(false);
        setHighlightedAmcIndex(-1);
        break;
      case "Tab":
        setIsAmcOpen(false);
        setHighlightedAmcIndex(-1);
        break;
    }
  };

  const handleClose = () => {
    createMutualFundMutation.reset();
    setAmcSearch("");
    setIsAmcOpen(false);
    setHighlightedAmcIndex(-1);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const isPreselectedAmcValid =
      preselectedAmcId &&
      preselectedAmcId > 0 &&
      amcs.find((amc) => amc.amc_id === preselectedAmcId);

    const amcId = isPreselectedAmcValid
      ? preselectedAmcId
      : parseInt(formData.amc_id, 10);

    const fundData: MutualFundCreate = {
      name: formData.name.trim(),
      plan: formData.plan.trim() || undefined,
      code: formData.code.trim() || undefined,
      owner: formData.owner.trim() || undefined,
      asset_class: formData.asset_class.trim() || undefined,
      asset_sub_class: formData.asset_sub_class.trim() || undefined,
      amc_id: amcId!,
      notes: formData.notes.trim() || undefined,
    };

    createMutualFundMutation.mutate(fundData);
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

  const isLoading = createMutualFundMutation.isPending;
  const isFormValid =
    formData.name.trim() &&
    (!formData.plan || formData.plan.length <= 50) &&
    (!formData.code || formData.code.length <= 50) &&
    ((preselectedAmcId &&
      preselectedAmcId > 0 &&
      amcs.find((amc) => amc.amc_id === preselectedAmcId)) ||
      formData.amc_id);

  const selectedAmc = preselectedAmcId
    ? amcs.find((amc) => amc.amc_id === preselectedAmcId)
    : null;

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
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><TrendingUp /></Icon>

                <Box>
                  <Text
                    fontSize="lg"
                    fontWeight="800"
                    letterSpacing="-0.02em"
                    color={modalTitleColor}
                  >
                    Create Mutual Fund
                  </Text>
                  <Text
                    fontSize="sm"
                    color={modalSubtitleColor}
                  >
                    {selectedAmc
                      ? `Add a new fund to ${selectedAmc.name}`
                      : "Add a new mutual fund scheme to track"}
                  </Text>
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
              <form id="create-mutual-fund-form" onSubmit={handleSubmit}>
                <VStack gap={{ base: 5, sm: 6 }} align="stretch" w="100%">
                  {/* Fund Details Form */}
                  <Box
                    bg={cardBg}
                    p={{ base: 4, sm: 6 }}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <VStack gap={5} align="stretch">
                      {/* Mutual Fund Name */}
                      <Field.Root invalid={!!errors.name}>
                        <Field.Label fontWeight="semibold" mb={2}>
                          <HStack gap={2}>
                            <TrendingUp size={16} />
                            <Text>Mutual Fund Name</Text>
                            {formData.name.trim() && (
                              <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
                            )}
                          </HStack>
                        </Field.Label>
                        <Input
                          ref={initialRef}
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder="e.g., HDFC Mid Cap Fund"
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
                        <Field.ErrorText>{errors.name}</Field.ErrorText>
                        <Field.HelperText>
                          Enter the complete name of the mutual fund scheme
                        </Field.HelperText>
                      </Field.Root>

                      {/* Plan and Code side by side */}
                      <HStack gap={4} align="start">
                        <FormMutualFundSuggestionField
                          ledgerId={ledgerId as string}
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
                            onChange={(e) =>
                              handleInputChange("code", e.target.value)
                            }
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

                      {/* Owner */}
                      <FormMutualFundSuggestionField
                        ledgerId={ledgerId as string}
                        field="owner"
                        label="Owner (Optional)"
                        value={formData.owner}
                        setValue={(val) => handleInputChange("owner", val)}
                        placeholder="e.g., John Doe"
                        helperText="Enter the owner name to allow same fund names for different owners"
                        borderColor={inputBorderColor}
                        inputBg={inputBg}
                      />

                      {/* AMC Selection */}
                      <Field.Root
                        invalid={!!errors.amc_id}
                        display={selectedAmc ? "block" : "none"}
                      >
                        <Field.Label fontWeight="semibold" mb={2}>
                          <HStack gap={2}>
                            <Building2 size={16} />
                            <Text>Asset Management Company</Text>
                          </HStack>
                        </Field.Label>
                        <Input
                          value={selectedAmc?.name || ""}
                          readOnly
                          size="lg"
                          bg={readOnlyBg}
                          borderColor={inputBorderColor}
                          borderWidth="2px"
                          borderRadius="md"
                          opacity={0.8}
                          cursor="not-allowed"
                        />
                        <Field.HelperText>
                          This fund will be created under {selectedAmc?.name}
                        </Field.HelperText>
                      </Field.Root>

                      <Field.Root
                        invalid={!!errors.amc_id}
                        display={selectedAmc ? "none" : "block"}
                      >
                        <Field.Label fontWeight="semibold" mb={2}>
                          <HStack gap={2}>
                            <Building2 size={16} />
                            <Text>Asset Management Company</Text>
                            {formData.amc_id && (
                              <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
                            )}
                          </HStack>
                        </Field.Label>
                        <Popover.Root
                          open={isAmcOpen}
                          autoFocus={false}
                          onOpenChange={e => {
                            if (!(e.open)) { setIsAmcOpen(false); setHighlightedAmcIndex(-1); }
                          }}
                          positioning={{
                            sameWidth: true,
                            placement: 'bottom-start'
                          }}>
                          <Popover.Trigger asChild>
                            <InputGroup
                              w="full"
                              startElement={<Icon boxSize={4} color={helperTextColor} asChild><Search /></Icon>}
                              endElement={
                                formData.amc_id ? (
                                  <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><X
                                      onClick={() => {
                                        handleInputChange("amc_id", "");
                                        setAmcSearch("");
                                        setIsAmcOpen(false);
                                        setHighlightedAmcIndex(-1);
                                      }} /></Icon>
                                ) : (
                                  <Icon boxSize={4} color={helperTextColor} cursor="pointer" asChild><ChevronDown onClick={() => setIsAmcOpen(!isAmcOpen)} /></Icon>
                                )
                              }
                              endElementProps={{ pr: 1 }}
                            >
                              <Input
                                size="lg"
                                value={isAmcOpen ? amcSearch : (selectedAmcOption?.name ?? "")}
                                onChange={(e) => {
                                  setAmcSearch(e.target.value);
                                  handleInputChange("amc_id", "");
                                  setHighlightedAmcIndex(-1);
                                  setIsAmcOpen(true);
                                }}
                                onFocus={() => {
                                  setAmcSearch("");
                                  setHighlightedAmcIndex(-1);
                                  setIsAmcOpen(true);
                                }}
                                onKeyDown={handleAmcKeyDown}
                                placeholder="Search AMC..."
                                borderWidth="2px"
                                borderColor={formData.amc_id ? "teal.400" : inputBorderColor}
                                bg={inputBg}
                                borderRadius="md"
                                _hover={{ borderColor: "teal.300" }}
                                _focus={{
                                  borderColor: focusBorderColor,
                                  boxShadow: `0 0 0 1px ${focusBorderColor}`,
                                }}
                                autoComplete="off"
                              />
                            </InputGroup>
                          </Popover.Trigger>
                          <Popover.Positioner>
                            <Popover.Content w="full" p={0}
                            bg={bgColor}
                            border="1px solid"
                            borderColor={borderColor}
                            borderRadius="md"
                            boxShadow="lg"
                            maxH="220px"
                            overflowY="auto"
                            _focus={{ outline: "none" }}>{filteredAmcs.map((amc, i) => (
                              <Box
                                key={amc.amc_id}
                                px={4} py={3}
                                cursor="pointer"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                bg={formData.amc_id === amc.amc_id.toString() || i === highlightedAmcIndex ? highlightColor : "transparent"}
                                _hover={{ bg: highlightColor }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleInputChange("amc_id", amc.amc_id.toString());
                                  setAmcSearch("");
                                  setIsAmcOpen(false);
                                  setHighlightedAmcIndex(-1);
                                }}
                              >
                                <Text fontSize="sm" fontWeight={formData.amc_id === amc.amc_id.toString() ? "semibold" : "normal"}>
                                  {amc.name}
                                </Text>
                                {formData.amc_id === amc.amc_id.toString() && (
                                  <Icon boxSize={4} color="teal.500" asChild><Check /></Icon>
                                )}
                              </Box>
                            ))}
                            {filteredAmcs.length === 0 && (
                              <Box px={4} py={5} textAlign="center">
                                <Text fontSize="sm" color={helperTextColor}>No AMCs found</Text>
                              </Box>
                            )}</Popover.Content>
                          </Popover.Positioner>
                        </Popover.Root>
                        <Field.ErrorText>{errors.amc_id}</Field.ErrorText>
                        <Field.HelperText>
                          Choose the AMC that manages this mutual fund
                        </Field.HelperText>
                      </Field.Root>

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
                            onChange={(e) =>
                              handleInputChange("asset_class", e.target.value)
                            }
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
                                onChange={(e) =>
                                  handleInputChange("asset_sub_class", e.target.value)
                                }
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
                            <Field.ErrorText>
                              {errors.asset_sub_class}
                            </Field.ErrorText>
                            <Field.HelperText>
                              Choose the asset sub-class for this mutual fund
                            </Field.HelperText>
                          </Field.Root>
                        )}

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
                          onChange={(e) =>
                            handleInputChange("notes", e.target.value)
                          }
                          placeholder="Other details..."
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
                        <Field.ErrorText>{errors.notes}</Field.ErrorText>
                        <Field.HelperText>
                          Additional information about this fund (
                          {formData.notes.length}/500 characters)
                        </Field.HelperText>
                      </Field.Root>
                    </VStack>
                  </Box>

                  {/* No AMCs Warning */}
                  {amcs.length === 0 && (
                    <Alert.Root
                      status="warning"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="orange.200"
                    >
                      <Alert.Indicator />
                      <Box>
                        <Alert.Title fontWeight="bold">No AMCs Available</Alert.Title>
                        <Alert.Description>
                          You need to create at least one Asset Management Company
                          before creating a mutual fund.
                        </Alert.Description>
                      </Box>
                    </Alert.Root>
                  )}

                  {/* Error Display */}
                  {(createMutualFundMutation.isError || errors.general) && (
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
                          {errors.general ||
                            createMutualFundMutation.error?.message ||
                            "An error occurred while creating the mutual fund. Please try again."}
                        </Alert.Description>
                      </Box>
                    </Alert.Root>
                  )}
                </VStack>
              </form>

              {/* Mobile-only action buttons that stay at bottom */}
              <Box display={{ base: "block", sm: "none" }} mt={6}>
                <Button
                  type="submit"
                  form="create-mutual-fund-form"
                  colorPalette="brand"
                  size="lg"
                  width="100%"
                  mb={3}
                  borderRadius="lg"
                  fontWeight="bold"
                  loading={isLoading}
                  loadingText="Creating Mutual Fund..."
                  disabled={!isFormValid || amcs.length === 0}
                  onClick={handleSubmit}
                >
                  Create Mutual Fund
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
                form="create-mutual-fund-form"
                colorPalette="brand"
                mr={3}
                px={8}
                py={3}
                borderRadius="lg"
                fontWeight="bold"
                loading={isLoading}
                loadingText="Creating Mutual Fund..."
                disabled={!isFormValid || amcs.length === 0}
                onClick={handleSubmit}
              >
                Create Mutual Fund
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

export default CreateMutualFundModal;
