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
import { Building2, FileText, Edit, X } from "lucide-react";
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
  const modalIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.15)");
  const modalIconColor = useColorModeValue("brand.600", "brand.300");

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
          <HStack spacing={3} align="center">
            <Box p={2} bg={modalIconBg} borderRadius="lg">
              <Icon as={Building2} boxSize={5} color={modalIconColor} />
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
                  {amc.name}
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
          overflow="auto"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <VStack spacing={{ base: 4, sm: 6 }} align="stretch" w="100%">
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
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={4}>
                <Flex justify="space-between" align="center" w="full">
                  <Text
                    fontSize={{ base: "sm", sm: "md" }}
                    color={textSecondary}
                    fontWeight="medium"
                  >
                    Created
                  </Text>
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
                  <Text
                    fontSize={{ base: "sm", sm: "md" }}
                    color={textSecondary}
                    fontWeight="medium"
                  >
                    Last Updated
                  </Text>
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
                leftIcon={<Edit size={20} />}
                colorScheme="teal"
                size="lg"
                width="100%"
                mb={3}
                onClick={onEditAmc}
                borderRadius="md"
              >
                Edit AMC
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
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
              leftIcon={<X />}
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
          {onEditAmc && (
            <Button
              leftIcon={<Edit size={20} />}
              colorScheme="teal"
              mr={3}
              onClick={onEditAmc}
              px={8}
              py={3}
              borderRadius="md"
            >
              Edit AMC
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            borderWidth="2px"
            borderColor={useColorModeValue("gray.300", "gray.600")}
            color={useColorModeValue("gray.600", "gray.200")}
            _hover={{
              bg: useColorModeValue("gray.50", "gray.600"),
              borderColor: useColorModeValue("gray.400", "gray.500"),
            }}
            px={6}
            py={3}
            borderRadius="md"
            leftIcon={<X />}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AmcDetailsModal;

