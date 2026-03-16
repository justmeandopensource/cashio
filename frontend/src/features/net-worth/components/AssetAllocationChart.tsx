import React, { useState } from "react";
import {
  Box,
  Center,
  Flex,
  Heading,
  Icon,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { AssetAllocationItem } from "../types";
import { splitCurrencyForDisplay } from "@/features/mutual-funds/utils";

// Colours consistent with the breakdown card
export const ALLOCATION_COLORS = ["#63B3ED", "#B794F4", "#F6AD55"];

interface AssetAllocationChartProps {
  allocation: AssetAllocationItem[];
  currencySymbol: string;
}

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  allocation,
  currencySymbol,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const primaryText = useColorModeValue("gray.800", "gray.100");
  const secondaryText = useColorModeValue("gray.500", "gray.400");
  const sym = currencySymbol || "₹";

  const chartData = allocation.map((item) => ({
    ...item,
    value: Number(item.value),
  }));

  const hoveredItem = hoveredIdx !== null ? chartData[hoveredIdx] : null;

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="sm"
      p={{ base: 3, md: 4 }}
      h="full"
    >
      {/* Card header */}
      <Flex align="center" gap={1.5} mb={4}>
        <Icon as={PieChartIcon} boxSize={3} color={labelColor} />
        <Text
          fontSize="2xs"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="wider"
          color={labelColor}
        >
          Asset Allocation
        </Text>
      </Flex>

      {chartData.length === 0 ? (
        <Center flexDirection="column" py={10} gap={2}>
          <Icon as={PieChartIcon} boxSize={7} color={secondaryText} />
          <Text fontSize="sm" color={secondaryText}>
            No allocation data yet.
          </Text>
        </Center>
      ) : (
        <Flex
          direction={{ base: "column", xl: "row" }}
          align="center"
          gap={4}
          h={{ base: "auto", xl: "calc(100% - 40px)" }}
        >
          {/* Donut */}
          <Box
            position="relative"
            w={{ base: "200px", xl: "full" }}
            h={{ base: "200px", xl: "full" }}
            minH="180px"
            flex={{ xl: 1 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="78%"
                  dataKey="value"
                  labelLine={false}
                  label={false}
                  onMouseEnter={(_, idx) => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {chartData.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length]}
                      opacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.3}
                      strokeWidth={hoveredIdx === idx ? 2 : 0.5}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <Center
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              pointerEvents="none"
            >
              <VStack spacing={0} textAlign="center" px={2}>
                {hoveredItem ? (
                  <>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color={primaryText}
                      lineHeight="short"
                    >
                      {hoveredItem.label}
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color={primaryText}>
                      {splitCurrencyForDisplay(hoveredItem.value, sym).main}
                      <Text as="span" fontSize="2xs" opacity={0.7}>
                        {splitCurrencyForDisplay(hoveredItem.value, sym).decimals}
                      </Text>
                    </Text>
                    <Text fontSize="xs" color={secondaryText}>
                      {hoveredItem.percentage.toFixed(1)}%
                    </Text>
                  </>
                ) : (
                  <Text fontSize="xs" color={secondaryText}>
                    Hover to explore
                  </Text>
                )}
              </VStack>
            </Center>
          </Box>

          {/* Legend */}
          <VStack
            align="stretch"
            spacing={2}
            w={{ base: "full", xl: "auto" }}
            minW={{ xl: "140px" }}
          >
            {chartData.map((item, idx) => (
              <Flex
                key={item.label}
                align="center"
                gap={2}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                cursor="default"
                opacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.4}
                transition="opacity 0.15s"
              >
                <Box
                  w={2.5}
                  h={2.5}
                  borderRadius="full"
                  bg={ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length]}
                  flexShrink={0}
                />
                <Box flex={1} minW={0}>
                  <Text fontSize="xs" color={primaryText} fontWeight="medium" isTruncated>
                    {item.label}
                  </Text>
                  <Text fontSize="2xs" color={secondaryText}>
                    {item.percentage.toFixed(1)}%
                  </Text>
                </Box>
              </Flex>
            ))}
          </VStack>
        </Flex>
      )}
    </Box>
  );
};

export default AssetAllocationChart;
