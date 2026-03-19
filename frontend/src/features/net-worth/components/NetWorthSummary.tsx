import React from "react";
import {
  Box,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { TrendingUp, Building, ShieldAlert, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { splitCurrencyForDisplay } from "@/features/mutual-funds/utils";

const MotionBox = motion(Box);

interface NetWorthSummaryProps {
  netWorth: number | string;
  totalAssets: number | string;
  totalLiabilities: number | string;
  currencySymbol: string;
}

const NetWorthSummary: React.FC<NetWorthSummaryProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
  currencySymbol,
}) => {
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.600", "green.300");
  const negativeColor = useColorModeValue("red.500", "red.300");
  const heroBg = useColorModeValue("brand.600", "brand.700");
  const heroLabelColor = useColorModeValue("whiteAlpha.700", "whiteAlpha.600");
  const heroValueColor = useColorModeValue("white", "white");
  const heroAccentColor = useColorModeValue("brand.100", "brand.200");
  const sym = currencySymbol || "₹";

  const nw = Number(netWorth);
  const ta = Number(totalAssets);
  const tl = Number(totalLiabilities);

  const nwDisplay = splitCurrencyForDisplay(nw, sym);
  const taDisplay = splitCurrencyForDisplay(ta, sym);
  const tlDisplay = splitCurrencyForDisplay(tl, sym);

  const secondaryCards = [
    {
      icon: Building,
      label: "Total Assets",
      display: taDisplay,
      accentColor: useColorModeValue("brand.400", "brand.300"),
      valueColor: positiveColor,
      trendIcon: ArrowUpRight,
    },
    {
      icon: ShieldAlert,
      label: "Total Liabilities",
      display: tlDisplay,
      accentColor: useColorModeValue("orange.400", "orange.300"),
      valueColor: tl <= 0 ? positiveColor : negativeColor,
      trendIcon: tl > 0 ? ArrowDownRight : ArrowUpRight,
    },
  ];

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 4 }}>
      {/* Hero net worth card — spans full width on mobile, 1 col on desktop */}
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        bg={heroBg}
        borderRadius="xl"
        p={{ base: 4, md: 5 }}
        position="relative"
        overflow="hidden"
        boxShadow="lg"
      >

        <Flex align="center" gap={1.5} mb={3}>
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

        {/* Net worth indicator pill */}
        <Flex
          mt={3}
          align="center"
          gap={1}
          bg={nw >= 0 ? "whiteAlpha.200" : "red.300"}
          borderRadius="full"
          px={2.5}
          py={0.5}
          w="fit-content"
        >
          <Icon
            as={nw >= 0 ? ArrowUpRight : ArrowDownRight}
            boxSize={3}
            color={nw >= 0 ? "green.300" : "red.300"}
          />
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color={nw >= 0 ? "green.300" : "red.300"}
          >
            {nw >= 0 ? "Positive" : "Negative"}
          </Text>
        </Flex>
      </MotionBox>

      {/* Secondary cards — assets & liabilities */}
      {secondaryCards.map(({ icon, label, display, accentColor, valueColor }, idx) => (
        <MotionBox
          key={label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 * (idx + 1), ease: "easeOut" }}
          bg={cardBg}
          p={{ base: 3, md: 4 }}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
          _hover={{ borderColor: accentColor, transition: "border-color 0.2s" }}
        >
          {/* Top accent line */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="2px"
            bg={accentColor}
            opacity={0.7}
          />

          <Flex align="center" gap={1.5} mb={2}>
            <Flex
              w={5}
              h={5}
              borderRadius="md"
              bg={`${accentColor}`.replace(/\.\d+$/, '') + ".50"}
              align="center"
              justify="center"
            >
              <Icon as={icon} boxSize={3} color={accentColor} />
            </Flex>
            <Text
              fontSize="2xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color={labelColor}
            >
              {label}
            </Text>
          </Flex>

          <HStack spacing={0} align="baseline">
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color={valueColor}
              lineHeight="short"
              letterSpacing="-0.01em"
            >
              {display.main}
            </Text>
            <Text fontSize="xs" color={valueColor} opacity={0.6}>
              {display.decimals}
            </Text>
          </HStack>
        </MotionBox>
      ))}
    </SimpleGrid>
  );
};

export default NetWorthSummary;
