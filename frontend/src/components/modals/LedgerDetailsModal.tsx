import React from "react";
import { useColorModeValue } from "../ui/color-mode";
import {
  VStack,
  HStack,
  Box,
  Text,
  Flex,
  Badge,
  Icon,
  Button,
  Separator,
  Dialog,
  Portal,
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
                <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><BookText /></Icon>

                <VStack align="start" gap={1} flex={1}>
                  <HStack
                    gap={3}
                    align="center"
                    flexWrap={{ base: "wrap", sm: "nowrap" }}
                  >
                    <Text
                      fontSize="lg"
                      fontWeight="800"
                      letterSpacing="-0.02em"
                      color={modalTitleColor}
                    >
                      {ledgerName}
                    </Text>
                    <Badge
                      colorPalette="brand"
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

            <Dialog.Body p={{ base: 4, sm: 8 }} flex="1" overflowY="auto" overflowX="hidden">
              <VStack gap={{ base: 4, sm: 6 }} align="stretch">
                {/* Notes Section - Always shown */}
                <Box
                  bg={cardBg}
                  p={{ base: 4, sm: 6 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <HStack gap={3} mb={4}>
                    <Icon color={iconColor} boxSize={6} asChild><FileText /></Icon>
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
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <VStack gap={4}>
                    <Flex justify="space-between" align="center" w="full">
                      <HStack gap={2}>
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

                    <Separator />

                    <Flex justify="space-between" align="center" w="full">
                      <HStack gap={2}>
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
                      colorPalette="brand"
                      size="lg"
                      width="100%"
                      mb={3}
                      borderRadius="lg"
                      fontWeight="bold"
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
                    colorPalette="gray"
                    onClick={onClose}
                    width="100%"
                    size="lg"
                    borderRadius="lg"
                  >
                    Cancel
                  </Button>
                </Box>
              </VStack>
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
              {onEditLedger && (
                <Button
                  colorPalette="brand"
                  mr={3}
                  onClick={() => {
                    onEditLedger();
                    onClose();
                  }}
                  px={8}
                  py={3}
                  borderRadius="lg"
                  fontWeight="bold"
                >
                  Edit Ledger
                </Button>
              )}
              <Button
                variant="ghost"
                colorPalette="gray"
                onClick={onClose}
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

export default LedgerDetailsModal;
