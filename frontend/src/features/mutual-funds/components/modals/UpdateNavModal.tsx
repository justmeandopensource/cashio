import { FC, useState } from "react";
import React from "react";
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
  Text,
  HStack,
  Box,
  Badge,
  Stack,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  InputGroup,
  InputLeftAddon,
  Icon,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Calculator, Info, RefreshCw, Clock, Download } from "lucide-react";

import { updateMutualFundNav, bulkFetchNav } from "../../api";
import { MutualFund } from "../../types";

import { splitCurrencyForDisplay } from "../../../physical-assets/utils";
import useLedgerStore from "@/components/shared/store";
import { notify } from "@/components/shared/notify";
import { format } from "date-fns";

interface UpdateNavModalProps {
  isOpen: boolean;
  onClose: () => void;
  fund: MutualFund | null;
  onSuccess: () => void;
}

interface FormData {
  nav: string;
}

const UpdateNavModal: FC<UpdateNavModalProps> = ({
  isOpen,
  onClose,
  fund,
  onSuccess,
}) => {
  const { ledgerId } = useLedgerStore();
  const { currencySymbol } = useLedgerStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>({ nav: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modern theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const textColorTertiary = useColorModeValue("gray.600", "gray.200");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = textColorSecondary;
  const modalIconColor = useColorModeValue("gray.400", "gray.500");
  const updateNavMutation = useMutation({
    mutationFn: (navData: { latest_nav: number }) =>
      updateMutualFundNav(Number(ledgerId), fund!.mutual_fund_id, navData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", ledgerId] });
      queryClient.invalidateQueries({
        queryKey: ["mf-transactions", ledgerId],
      });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      // Error will be displayed in the Alert component below
      console.error("NAV update failed:", error);
    },
  });

  const fetchNavMutation = useMutation({
    mutationFn: () => {
      if (!fund?.code) {
        throw new Error("No scheme code available for this fund");
      }
      return bulkFetchNav(Number(ledgerId), { scheme_codes: [fund.code] });
    },
    onSuccess: (data) => {
      const result = data.results[0];
      if (result.success && result.nav_value) {
        setFormData({ nav: result.nav_value.toFixed(4) });
        setErrors({});
      } else {
        notify({
          title: "Fetch Failed",
          description: result.error_message || "Failed to fetch NAV",
          status: "error",
          duration: 5000,
        });
      }
    },
    onError: (error: any) => {
      notify({
        title: "Fetch Failed",
        description: error?.response?.data?.detail || error?.message || "Failed to fetch NAV",
        status: "error",
        duration: 5000,
      });
    },
  });

  const handleClose = () => {
    updateNavMutation.reset();
    setFormData({ nav: "" });
    setErrors({});
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const navValue = parseFloat(formData.nav);

    if (!formData.nav.trim()) {
      newErrors.nav = "NAV is required";
    } else if (isNaN(navValue) || navValue <= 0) {
      newErrors.nav = "NAV must be a positive number";
    } else if (navValue > 10000) {
      newErrors.nav = "NAV seems too high. Please verify the value.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrors({});

    if (!fund || !validateForm()) return;

    try {
      await updateNavMutation.mutateAsync({
        latest_nav: parseFloat(formData.nav),
      });
    } catch (error) {
      console.error("NAV update failed:", error);
    }
  };

  const handleInputChange = (value: string) => {
    // Allow empty string, numbers, and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Check if there are more than 2 decimal places
      const decimalPart = value.split(".")[1];
      if (decimalPart && decimalPart.length > 2) {
        // Truncate to 2 decimal places
        const integerPart = value.split(".")[0];
        setFormData((prev) => ({
          ...prev,
          nav: `${integerPart}.${decimalPart.substring(0, 2)}`,
        }));
      } else {
        setFormData((prev) => ({ ...prev, nav: value }));
      }

      // Clear error when user starts typing
      if (errors.nav) {
        setErrors((prev) => ({ ...prev, nav: "" }));
      }
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (!fund) return null;

  const newNavValue = parseFloat(formData.nav);
  const areNavsEqual = !isNaN(newNavValue) && Math.round(newNavValue * 100) === Math.round(Number(fund.latest_nav) * 100);

  const previewNavValue = isNaN(newNavValue) ? fund.latest_nav : newNavValue;
  const newCurrentValue = Number(fund.total_units) * Number(previewNavValue);
  const currentValueChange = newCurrentValue - Number(fund.current_value);

  return (
    <Modal
      isOpen={isOpen}
      returnFocusOnClose={false}
      onClose={handleClose}
      size={{ base: "full", sm: "lg" }}
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
            <Icon as={RefreshCw} boxSize={5} mt="3px" color={modalIconColor} />

            <Box>
              <Box
                fontSize="lg"
                fontWeight="800"
                letterSpacing="-0.02em"
                color={modalTitleColor}
              >
                Update NAV
              </Box>
              <Box
                fontSize="sm"
                color={modalSubtitleColor}
              >
                {fund.name}
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
            {/* Current Fund Info Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <HStack spacing={3} mb={4}>
                <Info size={20} color="teal" />
                <Text fontWeight="semibold" color="teal.600">
                  Current Information
                </Text>
              </HStack>

              <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                <Box flex={1}>
                  <HStack spacing={2} mb={2}>
                     <Text fontSize="sm" fontWeight="medium" color={textColor}>
                       Current Price
                     </Text>
                  </HStack>
                  <HStack spacing={0} align="baseline">
                     <Text fontSize="xl" fontWeight="bold">
                       {splitCurrencyForDisplay(Number(fund.latest_nav), currencySymbol || "₹").main}
                     </Text>
                     <Text fontSize="lg" fontWeight="bold" opacity={0.7}>
                       {splitCurrencyForDisplay(Number(fund.latest_nav), currencySymbol || "₹").decimals}
                     </Text>
                  </HStack>
                   <Text fontSize="sm" color={textColorSecondary}>
                     per unit
                   </Text>
                </Box>

                {fund.last_nav_update && (
                  <Box flex={1}>
                    <HStack spacing={2} mb={2}>
                      <Clock size={16} />
                       <Text fontSize="sm" fontWeight="medium" color={textColor}>
                         Last Updated
                       </Text>
                    </HStack>
                    <Text fontSize="md" fontWeight="semibold">
                      {format(new Date(fund.last_nav_update), "MMM dd, yyyy")}
                    </Text>
                                           <Text fontSize="sm" color={textColorSecondary}>
                                             {format(new Date(fund.last_nav_update), "h:mm a")}
                                           </Text>
                                        </Box>                )}
              </Stack>
            </Box>

            {/* NAV Update Form */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                <FormControl isInvalid={!!errors.nav}>
                   <HStack justify="space-between" align="center" mb={2}>
                     <FormLabel fontWeight="semibold" mb={0}>
                       <HStack spacing={2}>
                         <Calculator size={16} />
                         <Text>New NAV per Unit</Text>
                         <Text as="span" color="red.500">
                           *
                         </Text>
                       </HStack>
                     </FormLabel>
                     {fund?.code && (
                       <Button
                         size="xs"
                         variant="outline"
                         leftIcon={<Download size={14} />}
                         onClick={() => fetchNavMutation.mutate()}
                         isLoading={fetchNavMutation.isPending}
                         loadingText="Fetching..."
                         colorScheme="brand"
                       >
                         Fetch NAV
                       </Button>
                     )}
                   </HStack>
                   <InputGroup size="lg">
                     <InputLeftAddon
                       bg={inputBorderColor}
                       borderWidth="2px"
                       borderColor={inputBorderColor}
                        color={textColorTertiary}
                       fontWeight="semibold"
                     >
                       {currencySymbol || "₹"}
                     </InputLeftAddon>
                    <Input
                      type="text"
                      value={formData.nav}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="0.00"
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
                  </InputGroup>
                  <FormErrorMessage>{errors.nav}</FormErrorMessage>
                   <FormHelperText color={textColorSecondary}>
                     Enter the latest NAV per unit from your fund statement
                   </FormHelperText>
                </FormControl>

                {/* Preview of changes */}
                {formData.nav && !isNaN(newNavValue) && !areNavsEqual && (
                  <Box
                    p={4}
                    bg={currentValueChange >= 0 ? "green.50" : "red.50"}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={
                      currentValueChange >= 0 ? "green.200" : "red.200"
                    }
                  >
                    <HStack spacing={3} mb={2}>
                      <TrendingUp
                        size={18}
                        color={currentValueChange >= 0 ? "#38A169" : "#E53E3E"}
                        style={{
                          transform:
                            currentValueChange < 0 ? "rotate(180deg)" : "none",
                        }}
                      />
                      <Text
                        fontWeight="semibold"
                        color={
                          currentValueChange >= 0 ? "green.700" : "red.700"
                        }
                      >
                        NAV Change Preview
                      </Text>
                    </HStack>
                    <HStack justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                         <Text fontSize="sm" color={textColor}>
                           New NAV
                         </Text>
                        <HStack spacing={0} align="baseline">
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color={currentValueChange >= 0 ? "green.600" : "red.600"}
                          >
                            {splitCurrencyForDisplay(newNavValue, currencySymbol || "₹").main}
                          </Text>
                          <Text
                            fontSize="md"
                            fontWeight="bold"
                            color={currentValueChange >= 0 ? "green.600" : "red.600"}
                            opacity={0.7}
                          >
                            {splitCurrencyForDisplay(newNavValue, currencySymbol || "₹").decimals}
                          </Text>
                        </HStack>
                      </VStack>
                      <VStack align="end" spacing={1}>
                         <Text fontSize="sm" color={textColor}>
                           Value Change
                         </Text>
                        <Badge
                          colorScheme={
                            currentValueChange >= 0 ? "green" : "red"
                          }
                          fontSize="md"
                          px={3}
                          py={1}
                        >
                          <HStack spacing={0} align="baseline">
                            <Text fontSize="sm" fontWeight="bold">
                              {currentValueChange >= 0 ? "+" : ""}{
                                splitCurrencyForDisplay(
                                  Math.abs(currentValueChange),
                                  currencySymbol || "₹",
                                ).main
                              }
                            </Text>
                            <Text fontSize="xs" fontWeight="bold" opacity={0.7}>
                              {splitCurrencyForDisplay(
                                Math.abs(currentValueChange),
                                currencySymbol || "₹",
                              ).decimals
                            }
                            </Text>
                          </HStack>
                        </Badge>
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Error Display */}
            {updateNavMutation.isError && (
              <Alert
                status="error"
                borderRadius="md"
                border="1px solid"
                borderColor="red.200"
              >
                <AlertIcon />
                <Box>
                  <AlertTitle fontWeight="bold">Update Failed!</AlertTitle>
                  <AlertDescription>
                    {(updateNavMutation.error as any)?.response?.data?.detail ||
                      (updateNavMutation.error as any)?.message ||
                      "An error occurred while updating the NAV."}
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              colorScheme="brand"
              onClick={handleSubmit}
              size="lg"
              width="100%"
              mb={3}
              borderRadius="lg"
              fontWeight="bold"
              isLoading={updateNavMutation.isPending}
              loadingText="Updating NAV..."
              isDisabled={
                !formData.nav.trim() ||
                !!errors.nav ||
                areNavsEqual
              }
            >
              Update NAV
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={handleClose}
              size="lg"
              width="100%"
              borderRadius="lg"
              isDisabled={updateNavMutation.isPending}
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
          bg={useColorModeValue("gray.50", "gray.900")}
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
            isLoading={updateNavMutation.isPending}
            loadingText="Updating NAV..."
            isDisabled={!formData.nav.trim() || !!errors.nav || areNavsEqual}
          >
            Update NAV
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={handleClose}
            isDisabled={updateNavMutation.isPending}
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

export default UpdateNavModal;
