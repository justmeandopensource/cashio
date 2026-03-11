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
  Textarea,
  Select,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, FileText, Building2, X, CheckCircle } from "lucide-react";
import { createMutualFund } from "../../api";
import { Amc, MutualFundCreate } from "../../types";
import useLedgerStore from "@/components/shared/store";

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
  const { ledgerId } = useLedgerStore();
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

  // Modern theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");

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

  const handleClose = () => {
    createMutualFundMutation.reset();
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
              <TrendingUp size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <Text
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
                mb={2}
              >
                Create Mutual Fund
              </Text>
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
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
                        <Text as="span" color="red.500">
                          *
                        </Text>
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
                    <FormControl isInvalid={!!errors.plan} flex={1}>
                      <FormLabel fontWeight="semibold" mb={2}>
                        <HStack spacing={2}>
                          <FileText size={16} />
                          <Text>Plan (Optional)</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        value={formData.plan}
                        onChange={(e) =>
                          handleInputChange("plan", e.target.value)
                        }
                        placeholder="Direct Growth"
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
                      <FormErrorMessage>{errors.plan}</FormErrorMessage>
                      <FormHelperText>Enter the plan type</FormHelperText>
                    </FormControl>

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

                  {/* Owner */}
                  <FormControl isInvalid={!!errors.owner}>
                    <FormLabel fontWeight="semibold" mb={2}>
                      <HStack spacing={2}>
                        <FileText size={16} />
                        <Text>Owner (Optional)</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      value={formData.owner}
                      onChange={(e) =>
                        handleInputChange("owner", e.target.value)
                      }
                      placeholder="e.g., John Doe"
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
                    <FormErrorMessage>{errors.owner}</FormErrorMessage>
                    <FormHelperText>
                      Enter the owner name to allow same fund names for
                      different owners
                    </FormHelperText>
                  </FormControl>

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
                      bg={useColorModeValue("gray.100", "gray.600")}
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
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </HStack>
                    </FormLabel>
                     <Select
                       value={formData.amc_id}
                       onChange={(e) =>
                         handleInputChange("amc_id", e.target.value)
                       }
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
              bg="teal.500"
              color="white"
              _hover={{
                bg: "teal.600",
                transform: isLoading ? "none" : "translateY(-2px)",
                boxShadow: isLoading ? "none" : "lg",
              }}
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isLoading={isLoading}
              loadingText="Creating Mutual Fund..."
              isDisabled={!isFormValid || amcs.length === 0}
              leftIcon={<CheckCircle />}
              transition="all 0.2s"
              onClick={handleSubmit}
            >
              Create Mutual Fund
            </Button>

            <Button
              variant="outline"
              onClick={handleClose}
              size="lg"
              width="100%"
              borderRadius="md"
              borderWidth="2px"
              borderColor={useColorModeValue("gray.300", "gray.600")}
              color={useColorModeValue("gray.600", "gray.200")}
              _hover={{
                bg: useColorModeValue("gray.50", "gray.600"),
                borderColor: useColorModeValue("gray.400", "gray.500"),
              }}
              isDisabled={isLoading}
              leftIcon={<X />}
              transition="all 0.2s"
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
            type="submit"
            form="create-mutual-fund-form"
            bg="teal.500"
            color="white"
            _hover={{
              bg: "teal.600",
              transform: isLoading ? "none" : "translateY(-2px)",
              boxShadow: isLoading ? "none" : "lg",
            }}
            mr={3}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={isLoading}
            loadingText="Creating Mutual Fund..."
            isDisabled={!isFormValid || amcs.length === 0}
            leftIcon={<CheckCircle />}
            transition="all 0.2s"
            onClick={handleSubmit}
          >
            Create Mutual Fund
          </Button>

          <Button
            variant="outline"
            onClick={handleClose}
            isDisabled={isLoading}
            leftIcon={<X />}
            px={6}
            py={3}
            borderRadius="md"
            borderWidth="2px"
            borderColor={useColorModeValue("gray.300", "gray.600")}
            color={useColorModeValue("gray.600", "gray.200")}
            _hover={{
              bg: useColorModeValue("gray.50", "gray.600"),
              borderColor: useColorModeValue("gray.400", "gray.500"),
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateMutualFundModal;
