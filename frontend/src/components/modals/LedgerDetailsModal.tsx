import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
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
import { BookText, FileText } from "lucide-react";

interface LedgerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerName: string;
  currencySymbol: string;
  description: string | undefined;
  notes: string | undefined;
  createdAt: string | undefined;
  updatedAt: string | undefined;
  onEditLedger?: () => void;
}

const LedgerDetailsModal: React.FC<LedgerDetailsModalProps> = ({
  isOpen,
  onClose,
  ledgerName,
  currencySymbol,
  description,
  notes,
  createdAt,
  updatedAt,
  onEditLedger,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const textMuted = useColorModeValue("gray.500", "gray.500");
  const iconColor = useColorModeValue("teal.500", "teal.300");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

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
            <Icon as={BookText} boxSize={5} mt="3px" color={modalIconColor} />

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
                  {ledgerName}
                </Text>
                <Badge
                  colorScheme="teal"
                  variant="subtle"
                  fontSize="sm"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  flexShrink={0}
                >
                  {currencySymbol}
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
                {notes || "No notes available for this ledger."}
              </Text>
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
            {/* Mobile-only action buttons */}
            <Box display={{ base: "block", sm: "none" }}>
              {onEditLedger && (
                <Button
                  colorScheme="teal"
                  size="lg"
                  width="100%"
                  mb={3}
                  borderRadius="md"
                  onClick={() => {
                    onEditLedger();
                    onClose();
                  }}
                >
                  Edit Ledger
                </Button>
              )}
              <Button
                variant="ghost"
                colorScheme="gray"
                onClick={onClose}
                width="100%"
                size="lg"
                borderRadius="md"
              >
                Cancel
              </Button>
            </Box>
          </VStack>
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
          {onEditLedger && (
            <Button
              colorScheme="teal"
              mr={3}
              onClick={() => {
                onEditLedger();
                onClose();
              }}
              px={8}
              py={3}
              borderRadius="md"
            >
              Edit Ledger
            </Button>
          )}
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
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

export default LedgerDetailsModal;
