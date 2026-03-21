import { FC } from "react";
import {
  Box,
  Text,
  Flex,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { CostBasisRange } from "./useFundAnalyticsData";

interface CostBasisIndicatorProps {
  range: CostBasisRange;
  currencySymbol: string;
}

const CostBasisIndicator: FC<CostBasisIndicatorProps> = ({
  range,
  currencySymbol,
}) => {
  const trackBg = useColorModeValue("gray.100", "gray.700");
  const gradientStart = useColorModeValue("#38A169", "#48BB78");
  const gradientEnd = useColorModeValue("#E53E3E", "#FC8181");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const labelColor = useColorModeValue("gray.500", "gray.500");

  if (range.lowest === null || range.highest === null) {
    return (
      <Box textAlign="center" py={4}>
        <Text color="gray.500" fontSize="sm">
          No purchase transactions to show cost basis
        </Text>
      </Box>
    );
  }

  const min = range.lowest;
  const max = range.highest;
  const spread = max - min || 1;

  // Extend range by 10% on each side to show current NAV outside purchase range
  const rangeMin = Math.min(min, range.current) - spread * 0.1;
  const rangeMax = Math.max(max, range.current) + spread * 0.1;
  const totalRange = rangeMax - rangeMin || 1;

  const getPosition = (value: number) =>
    ((value - rangeMin) / totalRange) * 100;

  const lowestPos = getPosition(min);
  const avgPos = getPosition(range.average);
  const highestPos = getPosition(max);
  const currentPos = getPosition(range.current);

  const format = (v: number) =>
    `${currencySymbol}${v.toFixed(2)}`;

  return (
    <Box px={2} py={4}>
      {/* Track */}
      <Box position="relative" h="40px" mb={6}>
        {/* Background track */}
        <Box
          position="absolute"
          top="16px"
          left={0}
          right={0}
          h="8px"
          borderRadius="full"
          bg={trackBg}
        />

        {/* Gradient range between lowest and highest */}
        <Box
          position="absolute"
          top="16px"
          left={`${lowestPos}%`}
          width={`${highestPos - lowestPos}%`}
          h="8px"
          borderRadius="full"
          bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
          opacity={0.6}
        />

        {/* Lowest marker */}
        <Tooltip label={`Lowest Purchase: ${format(min)}`} fontSize="xs">
          <Box
            position="absolute"
            top="12px"
            left={`${lowestPos}%`}
            transform="translateX(-50%)"
            w="16px"
            h="16px"
            borderRadius="full"
            bg="green.400"
            border="2px solid white"
            boxShadow="sm"
            cursor="pointer"
          />
        </Tooltip>

        {/* Average marker */}
        <Tooltip label={`Avg. Cost: ${format(range.average)}`} fontSize="xs">
          <Box
            position="absolute"
            top="10px"
            left={`${avgPos}%`}
            transform="translateX(-50%)"
            w="20px"
            h="20px"
            borderRadius="full"
            bg="blue.400"
            border="2px solid white"
            boxShadow="sm"
            cursor="pointer"
          />
        </Tooltip>

        {/* Highest marker */}
        <Tooltip label={`Highest Purchase: ${format(max)}`} fontSize="xs">
          <Box
            position="absolute"
            top="12px"
            left={`${highestPos}%`}
            transform="translateX(-50%)"
            w="16px"
            h="16px"
            borderRadius="full"
            bg="red.400"
            border="2px solid white"
            boxShadow="sm"
            cursor="pointer"
          />
        </Tooltip>

        {/* Current NAV marker (diamond) */}
        <Tooltip label={`Current NAV: ${format(range.current)}`} fontSize="xs">
          <Box
            position="absolute"
            top="10px"
            left={`${currentPos}%`}
            transform="translateX(-50%) rotate(45deg)"
            w="18px"
            h="18px"
            bg="purple.500"
            border="2px solid white"
            boxShadow="md"
            cursor="pointer"
          />
        </Tooltip>
      </Box>

      {/* Labels */}
      <Flex justify="space-between" wrap="wrap" gap={3}>
        <Flex align="center" gap={1.5}>
          <Box w={3} h={3} borderRadius="full" bg="green.400" />
          <Text fontSize="xs" color={labelColor}>
            Lowest
          </Text>
          <Text fontSize="xs" fontWeight="semibold" color={textColor}>
            {format(min)}
          </Text>
        </Flex>
        <Flex align="center" gap={1.5}>
          <Box w={3} h={3} borderRadius="full" bg="blue.400" />
          <Text fontSize="xs" color={labelColor}>
            Avg. Cost
          </Text>
          <Text fontSize="xs" fontWeight="semibold" color={textColor}>
            {format(range.average)}
          </Text>
        </Flex>
        <Flex align="center" gap={1.5}>
          <Box w={3} h={3} borderRadius="full" bg="red.400" />
          <Text fontSize="xs" color={labelColor}>
            Highest
          </Text>
          <Text fontSize="xs" fontWeight="semibold" color={textColor}>
            {format(max)}
          </Text>
        </Flex>
        <Flex align="center" gap={1.5}>
          <Box
            w={3}
            h={3}
            bg="purple.500"
            transform="rotate(45deg)"
          />
          <Text fontSize="xs" color={labelColor}>
            Current NAV
          </Text>
          <Text fontSize="xs" fontWeight="semibold" color={textColor}>
            {format(range.current)}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};

export default CostBasisIndicator;
