import React from "react";
import {
  Box,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Building, ShieldAlert, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNetWorth } from "@/features/net-worth/api";
import { splitCurrencyForDisplay } from "@/features/mutual-funds/utils";
import { queryKeys } from "@/lib/queryKeys";
import type { Ledger } from "@/types";

const MotionBox = motion(Box);

interface HomeNetWorthBannerProps {
  defaultLedgerId: number;
  ledgers: Ledger[];
}

const HomeNetWorthBanner: React.FC<HomeNetWorthBannerProps> = ({
  defaultLedgerId,
  ledgers,
}) => {
  const navigate = useNavigate();

  const defaultLedger = ledgers.find(
    (l) => String(l.ledger_id) === String(defaultLedgerId)
  );
  const currencySymbol = defaultLedger?.currency_symbol || "$";
  const ledgerName = defaultLedger?.name || "Ledger";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.netWorth.forLedger(defaultLedgerId),
    queryFn: () => getNetWorth(defaultLedgerId),
    staleTime: 5 * 60 * 1000,
  });

  const heroBg = useColorModeValue("brand.600", "brand.700");
  const heroLabelColor = useColorModeValue("whiteAlpha.700", "whiteAlpha.600");
  const heroValueColor = "white";
  const heroAccentColor = useColorModeValue("brand.100", "brand.200");

  const cardBg = useColorModeValue("white", "cardDarkBg");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.600", "green.300");
  const negativeColor = useColorModeValue("red.500", "red.300");
  const assetAccent = useColorModeValue("brand.400", "brand.300");
  const liabilityAccent = useColorModeValue("orange.400", "orange.300");
  const ledgerNameColor = useColorModeValue("whiteAlpha.600", "whiteAlpha.500");

  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={6}>
        <Skeleton borderRadius="xl" h="120px" />
        <Skeleton borderRadius="xl" h="120px" />
        <Skeleton borderRadius="xl" h="120px" />
      </SimpleGrid>
    );
  }

  if (!data) return null;

  const nw = Number(data.net_worth);
  const ta = Number(data.total_assets);
  const tl = Number(data.total_liabilities);

  const nwDisplay = splitCurrencyForDisplay(nw, currencySymbol);
  const taDisplay = splitCurrencyForDisplay(ta, currencySymbol);
  const tlDisplay = splitCurrencyForDisplay(tl, currencySymbol);

  return (
    <Box mb={6}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        {/* Hero: Net Worth */}
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          bg={heroBg}
          borderRadius="xl"
          p={{ base: 4, md: 5 }}
          position="relative"
          overflow="hidden"
          boxShadow="md"
          cursor="pointer"
          onClick={() => navigate("/net-worth")}
          _hover={{ boxShadow: "lg" }}
        >
          <Flex align="center" gap={1.5} mb={2.5}>
            <Icon as={TrendingUp} boxSize={3.5} color={heroAccentColor} />
            <Text
              fontSize="xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color={heroLabelColor}
            >
              Net Worth
            </Text>
          </Flex>

          <HStack spacing={0} align="baseline">
            <Text
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="800"
              color={heroValueColor}
              lineHeight="1"
              letterSpacing="-0.02em"
            >
              {nwDisplay.main}
            </Text>
            <Text
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="600"
              color={heroValueColor}
              opacity={0.5}
            >
              {nwDisplay.decimals}
            </Text>
          </HStack>

          <Flex mt={2.5} align="center" justify="space-between">
            <Flex
              align="center"
              gap={1}
              bg={nw >= 0 ? "whiteAlpha.200" : "red.300"}
              borderRadius="full"
              px={2}
              py={0.5}
              w="fit-content"
            >
              <Icon
                as={nw >= 0 ? ArrowUpRight : ArrowDownRight}
                boxSize={3}
                color={nw >= 0 ? "green.300" : "red.300"}
              />
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                color={nw >= 0 ? "green.300" : "red.300"}
              >
                {nw >= 0 ? "Positive" : "Negative"}
              </Text>
            </Flex>
            <Text fontSize="2xs" fontWeight="500" color={ledgerNameColor}>
              {ledgerName}
            </Text>
          </Flex>
        </MotionBox>

        {/* Total Assets */}
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          bg={cardBg}
          p={{ base: 4, md: 5 }}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
          cursor="pointer"
          onClick={() => navigate("/net-worth")}
          _hover={{ borderColor: assetAccent, transition: "border-color 0.2s" }}
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="2px"
            bg={assetAccent}
            opacity={0.7}
          />
          <Flex align="center" gap={1.5} mb={2}>
            <Icon as={Building} boxSize={3.5} color={assetAccent} />
            <Text
              fontSize="2xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color={labelColor}
            >
              Total Assets
            </Text>
          </Flex>
          <HStack spacing={0} align="baseline">
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color={positiveColor}
              lineHeight="short"
              letterSpacing="-0.01em"
            >
              {taDisplay.main}
            </Text>
            <Text fontSize="xs" color={positiveColor} opacity={0.6}>
              {taDisplay.decimals}
            </Text>
          </HStack>
        </MotionBox>

        {/* Total Liabilities */}
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          bg={cardBg}
          p={{ base: 4, md: 5 }}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
          cursor="pointer"
          onClick={() => navigate("/net-worth")}
          _hover={{
            borderColor: liabilityAccent,
            transition: "border-color 0.2s",
          }}
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="2px"
            bg={liabilityAccent}
            opacity={0.7}
          />
          <Flex align="center" gap={1.5} mb={2}>
            <Icon as={ShieldAlert} boxSize={3.5} color={liabilityAccent} />
            <Text
              fontSize="2xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color={labelColor}
            >
              Total Liabilities
            </Text>
          </Flex>
          <HStack spacing={0} align="baseline">
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color={tl <= 0 ? positiveColor : negativeColor}
              lineHeight="short"
              letterSpacing="-0.01em"
            >
              {tlDisplay.main}
            </Text>
            <Text
              fontSize="xs"
              color={tl <= 0 ? positiveColor : negativeColor}
              opacity={0.6}
            >
              {tlDisplay.decimals}
            </Text>
          </HStack>
        </MotionBox>
      </SimpleGrid>
    </Box>
  );
};

export default HomeNetWorthBanner;
