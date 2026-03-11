import React, { FC, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Box,
  HStack,
  Badge,
  Stack,
  useColorModeValue,
  FormHelperText,
  FormErrorMessage,
  InputGroup,
  InputLeftAddon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { TrendingUp, Clock, Info, RefreshCw } from "lucide-react";
import { useUpdatePhysicalAssetPrice } from "../api";
import { PhysicalAsset } from "../types";
import useLedgerStore from "@/components/shared/store";
import { format } from "date-fns";
import { splitCurrencyForDisplay } from "../utils";

interface UpdatePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: PhysicalAsset | undefined;
  onPriceUpdated?: () => void;
}

const UpdatePriceModal: FC<UpdatePriceModalProps> = ({
  isOpen,
  onClose,
  asset,
  onPriceUpdated,
}) => {
  const { ledgerId, currencySymbol } = useLedgerStore();
  const [newPrice, setNewPrice] = useState("");
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
   const buttonBorderColor = useColorModeValue("gray.300", "gray.600");
   const buttonHoverBg = useColorModeValue("gray.50", "gray.600");
   const buttonHoverBorderColor = useColorModeValue("gray.400", "gray.500");
   const positiveBg = useColorModeValue("green.50", "green.900");
   const negativeBg = useColorModeValue("red.50", "red.900");
   const positiveBorder = useColorModeValue("green.200", "green.700");
   const negativeBorder = useColorModeValue("red.200", "red.700");
   const positiveText = useColorModeValue("green.700", "green.300");
   const negativeText = useColorModeValue("red.700", "red.300");
   const positiveTextSecondary = useColorModeValue("green.600", "green.400");
   const negativeTextSecondary = useColorModeValue("red.600", "red.400");
   const positiveIconColor = useColorModeValue("#38A169", "#68D391");
   const negativeIconColor = useColorModeValue("#E53E3E", "#FC8181");

  const updatePriceMutation = useUpdatePhysicalAssetPrice();

  useEffect(() => {
    if (asset && isOpen) {
      setNewPrice(
        asset.latest_price_per_unit
          ? asset.latest_price_per_unit.toFixed(2)
          : "",
      );
      setErrors({});
    }
  }, [asset, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const price = parseFloat(newPrice) || 0;

    if (!newPrice.trim()) {
      newErrors.price = "Price is required";
    } else if (price < 0) {
      newErrors.price = "Price must be greater than or equal to 0";
    } else if (isNaN(price)) {
      newErrors.price = "Please enter a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!asset || !ledgerId || !validateForm()) return;

    try {
      await updatePriceMutation.mutateAsync({
        ledgerId: Number(ledgerId),
        assetId: asset.physical_asset_id,
        data: { latest_price_per_unit: parseFloat(newPrice) },
      });

      onPriceUpdated?.();
      onClose();
    } catch (error) {
      console.error("Price update failed:", error);
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
        setNewPrice(`${integerPart}.${decimalPart.substring(0, 2)}`);
      } else {
        setNewPrice(value);
      }

      // Clear error when user starts typing
      if (errors.price) {
        setErrors((prev) => ({ ...prev, price: "" }));
      }
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleUpdate();
    }
  };

  const handleClose = () => {
    updatePriceMutation.reset();
    onClose();
  };

  if (!asset) return null;

  const isLoading = updatePriceMutation.isPending;
  const currentPrice = asset.latest_price_per_unit || 0;
  const newPriceValue = parseFloat(newPrice) || 0;
  const priceChange = newPriceValue - currentPrice;
  const priceChangePercent =
    currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={{ base: "full", sm: "lg" }}
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
              <RefreshCw size={24} style={{ margin: 0 }} />
            </Box>

            <Box>
              <HStack spacing={3} mb={2}>
                <Text
                  fontSize={{ base: "xl", sm: "2xl" }}
                  fontWeight="bold"
                  lineHeight="1.2"
                >
                  Update Price
                </Text>
                <Badge
                  bg="whiteAlpha.200"
                  color="white"
                  fontSize="sm"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {asset.asset_type?.name}
                </Badge>
              </HStack>
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
              >
                {asset.name}
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
          <VStack spacing={{ base: 5, sm: 6 }} align="stretch" w="100%">
            {/* Current Price Info Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
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
                       {splitCurrencyForDisplay(currentPrice, currencySymbol || "$").main}
                     </Text>
                     <Text fontSize="lg" fontWeight="bold" opacity={0.7}>
                       {splitCurrencyForDisplay(currentPrice, currencySymbol || "$").decimals}
                     </Text>
                  </HStack>
                   <Text fontSize="sm" color={textColorSecondary}>
                     per {asset.asset_type?.unit_symbol}
                   </Text>
                </Box>

                {asset.last_price_update && (
                  <Box flex={1}>
                    <HStack spacing={2} mb={2}>
                      <Clock size={16} />
                       <Text fontSize="sm" fontWeight="medium" color={textColor}>
                         Last Updated
                       </Text>
                    </HStack>
                    <Text fontSize="md" fontWeight="semibold">
                      {format(
                        new Date(asset.last_price_update),
                        "MMM dd, yyyy",
                      )}
                    </Text>
                                           <Text fontSize="sm" color={textColorSecondary}>
                                             {format(new Date(asset.last_price_update), "h:mm a")}
                                           </Text>
                                        </Box>                )}
              </Stack>
            </Box>

            {/* Price Update Form */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                <FormControl isInvalid={!!errors.price}>
                  <FormLabel fontWeight="semibold" mb={2}>
                    <HStack spacing={2}>
                      <TrendingUp size={16} />
                      <Text>New Price per Unit</Text>
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </HStack>
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftAddon
                      bg={inputBorderColor}
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                       color={textColorTertiary}
                      fontWeight="semibold"
                    >
                      {currencySymbol}
                    </InputLeftAddon>
                    <Input
                      type="text"
                      value={newPrice}
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
                  <FormErrorMessage>{errors.price}</FormErrorMessage>
                  <FormHelperText>
                    Enter the new price per {asset.asset_type?.unit_symbol}
                  </FormHelperText>
                </FormControl>

                {/* Price Change Preview */}
                {newPrice &&
                  !errors.price &&
                  newPriceValue !== currentPrice && (
                     <Box
                       p={4}
                       bg={priceChange >= 0 ? positiveBg : negativeBg}
                       borderRadius="md"
                       border="1px solid"
                       borderColor={priceChange >= 0 ? positiveBorder : negativeBorder}
                     >
                      <HStack spacing={3} mb={2}>
                         <TrendingUp
                           size={18}
                           color={priceChange >= 0 ? positiveIconColor : negativeIconColor}
                           style={{
                             transform:
                               priceChange < 0 ? "rotate(180deg)" : "none",
                           }}
                         />
                         <Text
                           fontWeight="semibold"
                           color={priceChange >= 0 ? positiveText : negativeText}
                         >
                           Price Change Preview
                         </Text>
                      </HStack>
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                   <Text fontSize="sm" color={textColor}>
                     Change Amount
                   </Text>
                          <HStack spacing={0} align="baseline">
                             <Text
                               fontSize="lg"
                               fontWeight="bold"
                               color={priceChange >= 0 ? positiveTextSecondary : negativeTextSecondary}
                             >
                               {splitCurrencyForDisplay(Math.abs(priceChange), currencySymbol || "$").main}
                             </Text>
                             <Text
                               fontSize="md"
                               fontWeight="bold"
                               color={priceChange >= 0 ? positiveTextSecondary : negativeTextSecondary}
                               opacity={0.7}
                             >
                              {splitCurrencyForDisplay(Math.abs(priceChange), currencySymbol || "$").decimals}
                            </Text>
                          </HStack>
                        </VStack>
                         <VStack align="end" spacing={1}>
                           <Text fontSize="sm" color={textColor}>
                             Percentage
                           </Text>
                          <Badge
                            colorScheme={priceChange >= 0 ? "green" : "red"}
                            fontSize="md"
                            px={3}
                            py={1}
                          >
                            {priceChange >= 0 ? "+" : ""}
                            {priceChangePercent.toFixed(1)}%
                          </Badge>
                        </VStack>
                      </HStack>
                    </Box>
                  )}
              </VStack>
            </Box>

            {/* Error Display */}
            {updatePriceMutation.isError && (
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
                    {(updatePriceMutation.error as any)?.response?.data
                      ?.detail ||
                      (updatePriceMutation.error as any)?.message ||
                      "An error occurred while updating the price."}
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              bg="teal.500"
              color="white"
              _hover={{
                bg: "teal.600",
                transform: isLoading ? "none" : "translateY(-2px)",
                boxShadow: isLoading ? "none" : "lg",
              }}
              onClick={handleUpdate}
              size="lg"
              width="100%"
              mb={3}
              borderRadius="md"
              isLoading={isLoading}
              loadingText="Updating Price..."
              isDisabled={
                !newPrice.trim() ||
                !!errors.price ||
                newPriceValue === currentPrice
              }
              leftIcon={<RefreshCw />}
              transition="all 0.2s"
            >
              Update Price
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              size="lg"
              width="100%"
              borderRadius="md"
              borderWidth="2px"
               borderColor={buttonBorderColor}
               color={textColorTertiary}
                 _hover={{
                   bg: buttonHoverBg,
                   borderColor: buttonHoverBorderColor,
                   transform: "translateY(-2px)",
                 }}
              isDisabled={isLoading}
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
            bg="teal.500"
            color="white"
            mr={3}
            _hover={{
              bg: "teal.600",
              transform: isLoading ? "none" : "translateY(-2px)",
              boxShadow: isLoading ? "none" : "lg",
            }}
            onClick={handleUpdate}
            px={8}
            py={3}
            borderRadius="md"
            isLoading={isLoading}
            loadingText="Updating Price..."
            isDisabled={
              !newPrice.trim() ||
              !!errors.price ||
              newPriceValue === currentPrice
            }
            leftIcon={<RefreshCw />}
            transition="all 0.2s"
          >
            Update Price
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            isDisabled={isLoading}
            px={6}
            py={3}
            borderRadius="md"
            borderWidth="2px"
             borderColor={buttonBorderColor}
             color={textColorTertiary}
             _hover={{
               bg: buttonHoverBg,
               borderColor: buttonHoverBorderColor,
             }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdatePriceModal;
