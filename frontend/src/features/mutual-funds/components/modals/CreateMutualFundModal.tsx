import React, { FC, useEffect, useRef, useState } from "react";
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
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Textarea,
  Select,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  Switch,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  HStack,
  Text,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, FileText, Building2, X, CheckCircle, Check, Search, ChevronDown } from "lucide-react";
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
  price_in_pence: boolean;
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
  const { ledgerId, navServiceType } = useLedgerStore();
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
    price_in_pence: false,
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
        price_in_pence: false,
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
      price_in_pence: formData.price_in_pence,
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
        {/* Flat header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={modalHeaderBorderColor}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={TrendingUp} boxSize={5} mt="3px" color={modalIconColor} />

            <Box>
              <Text
                fontSize="lg"
                fontWeight="bold"
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

        <ModalBody
          px={{ base: 4, sm: 8 }}
          py={{ base: 4, sm: 6 }}
          flex="1"
          display="flex"
          flexDirection="column"
          overflow="auto"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <form id="create-mutual-fund-form" onSubmit={handleSubmit}>
            <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
              {/* Fund Details Form */}
              <Box
                bg={cardBg}
                p={{ base: 4, sm: 6 }}
                borderRadius="md"
                border="1px solid"
                borderColor={borderColor}
              >
                <VStack spacing={5} align="stretch">
                  {/* Mutual Fund Name */}
                  <FormControl isInvalid={!!errors.name}>
                    <FormLabel fontWeight="semibold" mb={2}>
                      <HStack spacing={2}>
                        <TrendingUp size={16} />
                        <Text>Mutual Fund Name</Text>
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
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                    <FormHelperText>
                      Enter the complete name of the mutual fund scheme
                    </FormHelperText>
                  </FormControl>

                  {/* Plan and Code side by side */}
                  <HStack spacing={4} align="start">
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

                    <FormControl isInvalid={!!errors.code} flex={1}>
                      <FormLabel fontWeight="semibold" mb={2}>
                        <HStack spacing={2}>
                          <FileText size={16} />
                          <Text>Code (Optional)</Text>
                        </HStack>
                      </FormLabel>
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
                      <FormErrorMessage>{errors.code}</FormErrorMessage>
                      <FormHelperText>Enter a unique code</FormHelperText>
                    </FormControl>
                  </HStack>

                  {/* Price in pence toggle (UK funds only) */}
                  {navServiceType === "uk" && (
                    <FormControl>
                      <HStack justify="space-between">
                        <FormLabel fontWeight="semibold" mb={0}>
                          <HStack spacing={2}>
                            <Text>Price quoted in pence (GBX)</Text>
                          </HStack>
                        </FormLabel>
                        <Switch
                          isChecked={formData.price_in_pence}
                          onChange={(e) => setFormData(prev => ({ ...prev, price_in_pence: e.target.checked }))}
                          colorScheme="teal"
                        />
                      </HStack>
                      <FormHelperText>
                        Enable if this fund's price is quoted in pence. The fetched price will be automatically converted to pounds.
                      </FormHelperText>
                    </FormControl>
                  )}

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
                  <FormControl
                    isInvalid={!!errors.amc_id}
                    display={selectedAmc ? "block" : "none"}
                  >
                    <FormLabel fontWeight="semibold" mb={2}>
                      <HStack spacing={2}>
                        <Building2 size={16} />
                        <Text>Asset Management Company</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      value={selectedAmc?.name || ""}
                      isReadOnly
                      size="lg"
                      bg={readOnlyBg}
                      borderColor={inputBorderColor}
                      borderWidth="2px"
                      borderRadius="md"
                      opacity={0.8}
                      cursor="not-allowed"
                    />
                    <FormHelperText>
                      This fund will be created under {selectedAmc?.name}
                    </FormHelperText>
                  </FormControl>

                  <FormControl
                    isInvalid={!!errors.amc_id}
                    display={selectedAmc ? "none" : "block"}
                  >
                    <FormLabel fontWeight="semibold" mb={2}>
                      <HStack spacing={2}>
                        <Building2 size={16} />
                        <Text>Asset Management Company</Text>
                        {formData.amc_id && (
                          <Icon as={Check} boxSize={3.5} color="teal.500" />
                        )}
                      </HStack>
                    </FormLabel>
                    <Popover
                      isOpen={isAmcOpen}
                      onClose={() => { setIsAmcOpen(false); setHighlightedAmcIndex(-1); }}
                      matchWidth
                      placement="bottom-start"
                      autoFocus={false}
                      returnFocusOnClose={false}
                    >
                      <PopoverTrigger>
                        <InputGroup size="lg">
                          <InputLeftElement pointerEvents="none" height="100%">
                            <Icon as={Search} boxSize={4} color={helperTextColor} />
                          </InputLeftElement>
                          <Input
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
                          <InputRightElement height="100%" pr={1}>
                            {formData.amc_id ? (
                              <Icon
                                as={X}
                                boxSize={4}
                                color={helperTextColor}
                                cursor="pointer"
                                onClick={() => {
                                  handleInputChange("amc_id", "");
                                  setAmcSearch("");
                                  setIsAmcOpen(false);
                                  setHighlightedAmcIndex(-1);
                                }}
                              />
                            ) : (
                              <Icon
                                as={ChevronDown}
                                boxSize={4}
                                color={helperTextColor}
                                cursor="pointer"
                                onClick={() => setIsAmcOpen(!isAmcOpen)}
                              />
                            )}
                          </InputRightElement>
                        </InputGroup>
                      </PopoverTrigger>
                      <PopoverContent
                        p={0}
                        bg={bgColor}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="md"
                        boxShadow="lg"
                        maxH="220px"
                        overflowY="auto"
                        _focus={{ outline: "none" }}
                      >
                        {filteredAmcs.map((amc, i) => (
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
                              <Icon as={Check} boxSize={4} color="teal.500" />
                            )}
                          </Box>
                        ))}
                        {filteredAmcs.length === 0 && (
                          <Box px={4} py={5} textAlign="center">
                            <Text fontSize="sm" color={helperTextColor}>No AMCs found</Text>
                          </Box>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormErrorMessage>{errors.amc_id}</FormErrorMessage>
                    <FormHelperText>
                      Choose the AMC that manages this mutual fund
                    </FormHelperText>
                  </FormControl>

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
                      onChange={(e) =>
                        handleInputChange("asset_class", e.target.value)
                      }
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
                          onChange={(e) =>
                            handleInputChange("asset_sub_class", e.target.value)
                          }
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
                        <FormErrorMessage>
                          {errors.asset_sub_class}
                        </FormErrorMessage>
                        <FormHelperText>
                          Choose the asset sub-class for this mutual fund
                        </FormHelperText>
                      </FormControl>
                    )}

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
                    <FormErrorMessage>{errors.notes}</FormErrorMessage>
                    <FormHelperText>
                      Additional information about this fund (
                      {formData.notes.length}/500 characters)
                    </FormHelperText>
                  </FormControl>
                </VStack>
              </Box>

              {/* No AMCs Warning */}
              {amcs.length === 0 && (
                <Alert
                  status="warning"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="orange.200"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontWeight="bold">No AMCs Available</AlertTitle>
                    <AlertDescription>
                      You need to create at least one Asset Management Company
                      before creating a mutual fund.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Error Display */}
              {(createMutualFundMutation.isError || errors.general) && (
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
                        createMutualFundMutation.error?.message ||
                        "An error occurred while creating the mutual fund. Please try again."}
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
              form="create-mutual-fund-form"
              colorScheme="teal"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isLoading={isLoading}
              loadingText="Creating Mutual Fund..."
              isDisabled={!isFormValid || amcs.length === 0}
              onClick={handleSubmit}
            >
              Create Mutual Fund
            </Button>

            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={handleClose}
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
          bg={footerBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            type="submit"
            form="create-mutual-fund-form"
            colorScheme="teal"
            mr={3}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={isLoading}
            loadingText="Creating Mutual Fund..."
            isDisabled={!isFormValid || amcs.length === 0}
            onClick={handleSubmit}
          >
            Create Mutual Fund
          </Button>

          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={handleClose}
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

export default CreateMutualFundModal;
