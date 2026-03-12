import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Flex,
  Badge,
  Divider,
  useColorModeValue,
  Icon,
  Button,
} from "@chakra-ui/react";
import { Building, ShieldAlert, FileText, Edit } from "lucide-react";

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountName: string;
  accountType: string;
  openingBalance: number;
  netBalance: number;
  currencySymbol: string;
  description: string | undefined;
  notes: string | undefined;
  createdAt: string | undefined;
  updatedAt: string | undefined;
  onEditAccount?: () => void;
}

const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  isOpen,
  onClose,
  accountName,
  accountType,
  openingBalance,
  netBalance,
  currencySymbol,
  description,
  notes,
  createdAt,
  updatedAt,
  onEditAccount,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const textMuted = useColorModeValue("gray.500", "gray.500");
  const iconColor = useColorModeValue("teal.500", "teal.300");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.15)");
  const modalIconColor = useColorModeValue("brand.600", "brand.300");

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not available";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    const locale = currencySymbol === "₹" ? "en-IN" : "en-US";
    return `${currencySymbol}${Math.abs(amount).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

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
          <ModalCloseButton
            size="lg"
            borderRadius="full"
            top={{ base: 4, sm: 4 }}
            right={{ base: 4, sm: 6 }}
          />

          <HStack spacing={3} align="center">
            <Box p={2} bg={modalIconBg} borderRadius="lg">
              <Icon as={accountType === "asset" ? Building : ShieldAlert} boxSize={5} color={modalIconColor} />
            </Box>

            <VStack align="start" spacing={1} flex={1}>
              <HStack
                spacing={3}
                align="center"
                flexWrap={{ base: "wrap", sm: "nowrap" }}
              >
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color={modalTitleColor}
                >
                  {accountName}
                </Text>
                <Badge
                  colorScheme="teal"
                  variant="subtle"
                  fontSize="sm"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  flexShrink={0}
                  textTransform="capitalize"
                >
                  {accountType}
                </Badge>
              </HStack>

              <Text
                fontSize="sm"
                color={modalSubtitleColor}
                fontStyle={!description ? "italic" : "normal"}
              >
                {description || "No description"}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <ModalBody p={{ base: 4, sm: 8 }} flex="1" overflowY="auto" overflowX="hidden">
          <VStack spacing={{ base: 4, sm: 6 }} align="stretch">
            {/* Notes Section - Always shown */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <HStack spacing={3} mb={4}>
                <Icon as={FileText} color={iconColor} boxSize={6} />
                <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="semibold">
                  Notes
                </Text>
              </HStack>

              <Text
                color={notes ? textSecondary : textMuted}
                lineHeight="1.7"
                whiteSpace="pre-wrap"
                fontSize={{ base: "md", sm: "lg" }}
                fontStyle={!notes ? "italic" : "normal"}
              >
                {notes || "No notes available for this account."}
              </Text>
            </Box>

            {/* Balance Information Section */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={4}>
                <Flex justify="space-between" align="center" w="full">
                  <HStack spacing={2}>
                    <Box w={2} h={2} bg="purple.400" borderRadius="full" />
                    <Text
                      fontSize={{ base: "sm", sm: "md" }}
                      color={textSecondary}
                      fontWeight="medium"
                    >
                      Opening Balance
                    </Text>
                  </HStack>
                  <Text
                    fontSize={{ base: "md", sm: "lg" }}
                    color="gray.600"
                    fontWeight="semibold"
                    fontFamily="mono"
                  >
                    {formatCurrency(openingBalance)}
                  </Text>
                </Flex>

                <Divider />

                <Flex justify="space-between" align="center" w="full">
                  <HStack spacing={2}>
                    <Box w={2} h={2} bg="blue.400" borderRadius="full" />
                    <Text
                      fontSize={{ base: "sm", sm: "md" }}
                      color={textSecondary}
                      fontWeight="medium"
                    >
                      Net Balance
                    </Text>
                  </HStack>
                  <Text
                    fontSize={{ base: "md", sm: "lg" }}
                    color={
                      accountType === "liability"
                        ? (netBalance >= 0 ? "red.500" : "green.500")
                        : (netBalance >= 0 ? "green.500" : "red.500")
                    }
                    fontWeight="semibold"
                    fontFamily="mono"
                  >
                    {formatCurrency(netBalance)}
                  </Text>
                </Flex>
              </VStack>
            </Box>

            {/* Metadata Section - Always at bottom */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={4}>
                <Flex justify="space-between" align="center" w="full">
                  <HStack spacing={2}>
                    <Box w={2} h={2} bg="green.400" borderRadius="full" />
                    <Text
                      fontSize={{ base: "sm", sm: "md" }}
                      color={textSecondary}
                      fontWeight="medium"
                    >
                      Created
                    </Text>
                  </HStack>
                  <Text
                    fontSize={{ base: "sm", sm: "md" }}
                    color={textMuted}
                    fontFamily="mono"
                  >
                    {formatDate(createdAt)}
                  </Text>
                </Flex>

                <Divider />

                <Flex justify="space-between" align="center" w="full">
                  <HStack spacing={2}>
                    <Box w={2} h={2} bg="blue.400" borderRadius="full" />
                    <Text
                      fontSize={{ base: "sm", sm: "md" }}
                      color={textSecondary}
                      fontWeight="medium"
                    >
                      Last Updated
                    </Text>
                  </HStack>
                  <Text
                    fontSize={{ base: "sm", sm: "md" }}
                    color={textMuted}
                    fontFamily="mono"
                  >
                    {formatDate(updatedAt)}
                  </Text>
                </Flex>
              </VStack>
            </Box>
            {onEditAccount && (
              <Button
                leftIcon={<Edit size={20} />}
                colorScheme="teal"
                size="lg"
                width="full"
                onClick={() => {
                  onEditAccount();
                  onClose();
                }}
              >
                Edit Account
              </Button>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AccountDetailsModal;