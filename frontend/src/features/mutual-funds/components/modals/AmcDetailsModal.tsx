import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Box,
  Text,
  Flex,
  Badge,
  useColorModeValue,
  Icon,
  Button,
  Divider,
} from "@chakra-ui/react";
import { Building2, FileText } from "lucide-react";
import { Amc } from "../../types";

interface AmcDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  amc: Amc;
  onEditAmc?: () => void;
}

const AmcDetailsModal: React.FC<AmcDetailsModalProps> = ({
  isOpen,
  onClose,
  amc,
  onEditAmc,
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
  const modalIconColor = useColorModeValue("gray.400", "gray.500");
  const footerBg = useColorModeValue("gray.50", "gray.900");

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not available";
    try {
      // Parse as UTC and convert to local time
      const utcDate = new Date(
        dateString + (dateString.includes("Z") ? "" : "Z"),
      );
      return utcDate.toLocaleString("en-US", {
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
            <Icon as={Building2} boxSize={5} mt="3px" color={modalIconColor} />

            <VStack align="start" spacing={1} flex={1}>
              <HStack
                spacing={3}
                align="center"
                flexWrap={{ base: "wrap", sm: "nowrap" }}
              >
                <Text
                  fontSize="lg"
                  fontWeight="800"
                  letterSpacing="-0.02em"
                  color={modalTitleColor}
                >
                  {amc.name}
                </Text>
                <Badge
                  colorScheme="brand"
                  variant="subtle"
                  fontSize="sm"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  flexShrink={0}
                >
                  AMC
                </Badge>
              </HStack>

              <Text
                fontSize="sm"
                color={modalSubtitleColor}
                fontStyle={!amc.notes ? "italic" : "normal"}
              >
                {amc.notes || "No description"}
              </Text>
            </VStack>
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
          <VStack spacing={{ base: 4, sm: 6 }} align="stretch" w="100%">
            {/* Notes Section - Always shown */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
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
                color={amc.notes ? textSecondary : textMuted}
                lineHeight="1.7"
                whiteSpace="pre-wrap"
                fontSize={{ base: "md", sm: "lg" }}
                fontStyle={!amc.notes ? "italic" : "normal"}
              >
                {amc.notes || "No notes available for this AMC."}
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
                    {formatDate(amc.created_at)}
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
                    {formatDate(amc.updated_at)}
                  </Text>
                </Flex>
              </VStack>
            </Box>
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            {onEditAmc && (
              <Button
                colorScheme="brand"
                size="lg"
                width="100%"
                mb={3}
                onClick={onEditAmc}
                borderRadius="lg"
                fontWeight="bold"
              >
                Edit AMC
              </Button>
            )}
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="lg"
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
          {onEditAmc && (
            <Button
              colorScheme="brand"
              mr={3}
              onClick={onEditAmc}
              px={8}
              py={3}
              borderRadius="lg"
              fontWeight="bold"
            >
              Edit AMC
            </Button>
          )}
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
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

export default AmcDetailsModal;

