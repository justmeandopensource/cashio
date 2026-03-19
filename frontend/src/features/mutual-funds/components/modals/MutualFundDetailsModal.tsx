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
  Divider,
  useColorModeValue,
  Icon,
  Button,
} from "@chakra-ui/react";
import { TrendingUp, FileText } from "lucide-react";
import { MutualFund } from "../../types";

interface MutualFundDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fund: MutualFund;
  onEditFund?: () => void;
}

const MutualFundDetailsModal: React.FC<MutualFundDetailsModalProps> = ({
  isOpen,
  onClose,
  fund,
  onEditFund,
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
      const utcDate = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'));
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
            <Icon as={TrendingUp} boxSize={5} mt="3px" color={modalIconColor} />

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
                  {fund.name}
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
                  Mutual Fund
                </Badge>
              </HStack>

              <Text fontSize="sm" color={modalSubtitleColor}>
                {fund.amc?.name || "Unknown AMC"}
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


            {/* Fund Details */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={4}>
                {fund.owner && (
                  <Flex justify="space-between" align="center" w="full">
                    <HStack spacing={2}>
                      <Box w={2} h={2} bg="purple.400" borderRadius="full" />
                      <Text
                        fontSize={{ base: "sm", sm: "md" }}
                        color={textSecondary}
                        fontWeight="medium"
                      >
                        Owner
                      </Text>
                    </HStack>
                    <Text
                      fontSize={{ base: "sm", sm: "md" }}
                      color={textMuted}
                      fontFamily="mono"
                    >
                      {fund.owner}
                    </Text>
                  </Flex>
                )}

                {fund.owner && <Divider />}

                <Flex justify="space-between" align="center" w="full">
                  <HStack spacing={2}>
                    <Box w={2} h={2} bg="blue.400" borderRadius="full" />
                    <Text
                      fontSize={{ base: "sm", sm: "md" }}
                      color={textSecondary}
                      fontWeight="medium"
                    >
                      Asset Class
                    </Text>
                  </HStack>
                  <Text
                    fontSize={{ base: "sm", sm: "md" }}
                    color={textMuted}
                    fontFamily="mono"
                  >
                    {fund.asset_class || "Not specified"}
                  </Text>
                </Flex>

                {fund.asset_sub_class && (
                  <>
                    <Divider />
                    <Flex justify="space-between" align="center" w="full">
                      <HStack spacing={2}>
                        <Box w={2} h={2} bg="teal.400" borderRadius="full" />
                        <Text
                          fontSize={{ base: "sm", sm: "md" }}
                          color={textSecondary}
                          fontWeight="medium"
                        >
                          Asset Sub-Class
                        </Text>
                      </HStack>
                      <Text
                        fontSize={{ base: "sm", sm: "md" }}
                        color={textMuted}
                        fontFamily="mono"
                      >
                        {fund.asset_sub_class}
                      </Text>
                    </Flex>
                  </>
                )}

                {fund.code && (
                  <>
                    <Divider />
                    <Flex justify="space-between" align="center" w="full">
                      <HStack spacing={2}>
                        <Box w={2} h={2} bg="orange.400" borderRadius="full" />
                        <Text
                          fontSize={{ base: "sm", sm: "md" }}
                          color={textSecondary}
                          fontWeight="medium"
                        >
                          Scheme Code
                        </Text>
                      </HStack>
                      <Text
                        fontSize={{ base: "sm", sm: "md" }}
                        color={textMuted}
                        fontFamily="mono"
                      >
                        {fund.code}
                      </Text>
                    </Flex>
                  </>
                )}

                {fund.plan && (
                  <>
                    <Divider />
                    <Flex justify="space-between" align="center" w="full">
                      <HStack spacing={2}>
                        <Box w={2} h={2} bg="cyan.400" borderRadius="full" />
                        <Text
                          fontSize={{ base: "sm", sm: "md" }}
                          color={textSecondary}
                          fontWeight="medium"
                        >
                          Plan
                        </Text>
                      </HStack>
                      <Text
                        fontSize={{ base: "sm", sm: "md" }}
                        color={textMuted}
                        fontFamily="mono"
                      >
                        {fund.plan}
                      </Text>
                    </Flex>
                  </>
                )}
              </VStack>
            </Box>

            {/* Notes Section */}
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
                color={fund.notes ? textSecondary : textMuted}
                lineHeight="1.7"
                whiteSpace="pre-wrap"
                fontSize={{ base: "md", sm: "lg" }}
                fontStyle={!fund.notes ? "italic" : "normal"}
              >
                {fund.notes || "No notes available for this mutual fund."}
              </Text>
            </Box>

            {/* Metadata Section */}
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
                    {formatDate(fund.created_at)}
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
                    {formatDate(fund.updated_at)}
                  </Text>
                </Flex>

                {fund.last_nav_update && (
                  <>
                    <Divider />
                    <Flex justify="space-between" align="center" w="full">
                      <HStack spacing={2}>
                        <Box w={2} h={2} bg="purple.400" borderRadius="full" />
                        <Text
                          fontSize={{ base: "sm", sm: "md" }}
                          color={textSecondary}
                          fontWeight="medium"
                        >
                          NAV Last Updated
                        </Text>
                      </HStack>
                      <Text
                        fontSize={{ base: "sm", sm: "md" }}
                        color={textMuted}
                        fontFamily="mono"
                      >
                        {formatDate(fund.last_nav_update)}
                      </Text>
                    </Flex>
                  </>
                )}
              </VStack>
            </Box>

          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            {onEditFund && (
              <Button
                colorScheme="brand"
                size="lg"
                width="100%"
                mb={3}
                onClick={onEditFund}
                borderRadius="lg"
                fontWeight="bold"
              >
                Edit Mutual Fund
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
          {onEditFund && (
            <Button
              colorScheme="brand"
              mr={3}
              onClick={onEditFund}
              px={8}
              py={3}
              borderRadius="lg"
              fontWeight="bold"
            >
              Edit Mutual Fund
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

export default MutualFundDetailsModal;