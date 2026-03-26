import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  SimpleGrid,
  Text,
  Icon,
  useColorModeValue,
  HStack,
  Flex,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";
import { Plus, ArrowRight, Calendar, BookOpen } from "lucide-react";
import useLedgerStore from "@/components/shared/store";

const MotionBox = motion(Box);

import type { Ledger } from "@/types";

interface HomeLedgerCardsProps {
  ledgers?: Ledger[];
  onOpen: () => void;
}

// Subtle float animation for empty state icon
const floatKeyframes = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const HomeLedgerCards = ({ ledgers = [], onOpen }: HomeLedgerCardsProps) => {
  const navigate = useNavigate();
  const setLedger = useLedgerStore((s) => s.setLedger);

  const handleLedgerClick = (ledger: {
    ledger_id: string;
    name: string;
    currency_symbol: string;
    description?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
  }) => {
    setLedger({
      ledgerId: ledger.ledger_id,
      ledgerName: ledger.name,
      currencySymbol: ledger.currency_symbol,
      description: ledger.description ?? "",
      notes: ledger.notes ?? "",
      navServiceType: "",
      createdAt: ledger.created_at ?? "",
      updatedAt: ledger.updated_at ?? "",
    });
    navigate(`/ledger`);
  };

  const cardBg = useColorModeValue("white", "gray.750");
  const cardBorder = useColorModeValue("gray.100", "gray.600");
  const nameColor = useColorModeValue("gray.900", "gray.50");
  const descColor = useColorModeValue("gray.500", "gray.400");
  const dateColor = useColorModeValue("gray.400", "gray.500");
  const arrowColor = useColorModeValue("gray.300", "gray.600");

  const isDark = useColorModeValue(false, true);

  // Per-card glow shadows matching accent colors
  const hoverShadows = useMemo(() => [
    isDark
      ? "0 12px 32px -4px rgba(78,194,188,0.15), 0 4px 12px -2px rgba(0,0,0,0.3)"
      : "0 12px 32px -4px rgba(53,169,163,0.12), 0 4px 12px -2px rgba(0,0,0,0.06)",
    isDark
      ? "0 12px 32px -4px rgba(167,139,250,0.18), 0 4px 12px -2px rgba(0,0,0,0.3)"
      : "0 12px 32px -4px rgba(139,92,246,0.14), 0 4px 12px -2px rgba(0,0,0,0.06)",
    isDark
      ? "0 12px 32px -4px rgba(56,189,248,0.18), 0 4px 12px -2px rgba(0,0,0,0.3)"
      : "0 12px 32px -4px rgba(59,130,246,0.14), 0 4px 12px -2px rgba(0,0,0,0.06)",
    isDark
      ? "0 12px 32px -4px rgba(251,146,60,0.18), 0 4px 12px -2px rgba(0,0,0,0.3)"
      : "0 12px 32px -4px rgba(234,88,12,0.14), 0 4px 12px -2px rgba(0,0,0,0.06)",
    isDark
      ? "0 12px 32px -4px rgba(244,114,182,0.18), 0 4px 12px -2px rgba(0,0,0,0.3)"
      : "0 12px 32px -4px rgba(219,39,119,0.14), 0 4px 12px -2px rgba(0,0,0,0.06)",
  ], [isDark]);

  const emptyIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.12)");
  const emptyTitleColor = useColorModeValue("gray.800", "gray.100");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");
  const emptyDotColor = useColorModeValue("brand.200", "brand.700");

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Rich gradients for currency badges — deeper, more saturated
  const gradients = useMemo(() => [
    "linear(135deg, #2dd4bf, #0d9488)",
    "linear(135deg, #a78bfa, #7c3aed)",
    "linear(135deg, #38bdf8, #0284c7)",
    "linear(135deg, #fb923c, #ea580c)",
    "linear(135deg, #f472b6, #db2777)",
  ], []);

  // Solid accent colors matching gradients
  const accentTeal = useColorModeValue("teal.400", "teal.300");
  const accentPurple = useColorModeValue("purple.400", "purple.300");
  const accentBlue = useColorModeValue("blue.400", "blue.300");
  const accentOrange = useColorModeValue("orange.400", "orange.300");
  const accentPink = useColorModeValue("pink.400", "pink.300");
  const accentColors = useMemo(
    () => [accentTeal, accentPurple, accentBlue, accentOrange, accentPink],
    [accentTeal, accentPurple, accentBlue, accentOrange, accentPink]
  );

  if (ledgers.length === 0) {
    return (
      <MotionBox
        textAlign="center"
        py={24}
        px={6}
        display="flex"
        flexDirection="column"
        alignItems="center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Decorative dots */}
        <HStack spacing={2} mb={6} opacity={0.5}>
          <Box w="4px" h="4px" borderRadius="full" bg={emptyDotColor} />
          <Box w="6px" h="6px" borderRadius="full" bg={emptyDotColor} />
          <Box w="4px" h="4px" borderRadius="full" bg={emptyDotColor} />
        </HStack>

        <Box
          w="80px"
          h="80px"
          borderRadius="2xl"
          bg={emptyIconBg}
          display="flex"
          alignItems="center"
          justifyContent="center"
          mb={6}
          css={{ animation: `${floatKeyframes} 3s ease-in-out infinite` }}
        >
          <Icon as={BookOpen} boxSize={9} color="brand.500" strokeWidth={1.5} />
        </Box>

        <Text
          fontSize="xl"
          fontWeight="800"
          color={emptyTitleColor}
          mb={2}
          letterSpacing="-0.02em"
        >
          No ledgers yet
        </Text>
        <Text
          fontSize="sm"
          color={emptySubColor}
          mb={10}
          maxW="300px"
          lineHeight="1.6"
        >
          Create your first ledger to start tracking your finances.
        </Text>

        <MotionBox
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <Box
            as="button"
            onClick={onOpen}
            display="inline-flex"
            alignItems="center"
            gap={2}
            px={6}
            py={3}
            borderRadius="xl"
            bg="brand.500"
            color="white"
            fontWeight="bold"
            fontSize="sm"
            letterSpacing="0.01em"
            _hover={{
              bg: "brand.600",
              boxShadow: "0 0 24px rgba(53,169,163,0.3)",
            }}
            transition="all 0.2s ease"
          >
            <Icon as={Plus} boxSize={4} strokeWidth={2.5} />
            Create your first ledger
          </Box>
        </MotionBox>

        {/* Decorative dots */}
        <HStack spacing={2} mt={8} opacity={0.3}>
          <Box w="4px" h="4px" borderRadius="full" bg={emptyDotColor} />
          <Box w="6px" h="6px" borderRadius="full" bg={emptyDotColor} />
          <Box w="4px" h="4px" borderRadius="full" bg={emptyDotColor} />
        </HStack>
      </MotionBox>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      {ledgers.map((ledger, index) => {
        const gradient = gradients[index % gradients.length];
        const accent = accentColors[index % accentColors.length];
        const glow = hoverShadows[index % hoverShadows.length];
        return (
          <MotionBox
            key={ledger.ledger_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: index * 0.06,
              ease: "easeOut",
            }}
            whileTap={{ scale: 0.985 }}
          >
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              borderRadius="xl"
              overflow="hidden"
              cursor="pointer"
              role="group"
              position="relative"
              onClick={() => handleLedgerClick(ledger)}
              _hover={{
                borderColor: accent,
                boxShadow: glow,
              }}
              transition="border-color 0.2s ease, box-shadow 0.25s ease"
            >
              {/* Accent line at top */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="2px"
                bg={accent}
                opacity={0.7}
              />

              <Flex align="flex-start" gap={4} p={5}>
                {/* Currency badge */}
                <Box
                  w="52px"
                  h="52px"
                  borderRadius="xl"
                  bgGradient={gradient}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontWeight="800"
                  fontSize="xl"
                  flexShrink={0}
                  boxShadow="0 4px 12px -2px rgba(0,0,0,0.15)"
                  transition="transform 0.2s ease, box-shadow 0.2s ease"
                  _groupHover={{
                    transform: "scale(1.05)",
                    boxShadow: "0 6px 16px -2px rgba(0,0,0,0.2)",
                  }}
                >
                  {ledger.currency_symbol}
                </Box>

                {/* Content */}
                <Box flex={1} minW={0}>
                  <Text
                    fontWeight="bold"
                    fontSize="md"
                    color={nameColor}
                    noOfLines={1}
                    lineHeight="1.3"
                  >
                    {ledger.name}
                  </Text>
                  {ledger.description ? (
                    <Text
                      fontSize="sm"
                      color={descColor}
                      noOfLines={2}
                      mt={1}
                      lineHeight="1.5"
                    >
                      {ledger.description}
                    </Text>
                  ) : (
                    <Text fontSize="sm" color={dateColor} mt={1} fontStyle="italic">
                      No description
                    </Text>
                  )}
                  <HStack spacing={1.5} mt={2.5}>
                    <Icon as={Calendar} boxSize={3} color={dateColor} />
                    <Text fontSize="xs" color={dateColor} letterSpacing="0.02em">
                      {formatDate(ledger.created_at ?? "")}
                    </Text>
                  </HStack>
                </Box>

                {/* Arrow */}
                <Icon
                  as={ArrowRight}
                  boxSize={4}
                  color={arrowColor}
                  alignSelf="center"
                  flexShrink={0}
                  transition="color 0.2s ease, transform 0.2s ease"
                  _groupHover={{
                    color: accent,
                    transform: "translateX(3px)",
                  }}
                />
              </Flex>
            </Box>
          </MotionBox>
        );
      })}
    </SimpleGrid>
  );
};

export default HomeLedgerCards;
