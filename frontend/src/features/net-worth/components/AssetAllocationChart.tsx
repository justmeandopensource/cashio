import React, { useState } from "react";
import {
  Box,
  Center,
  Flex,
  Icon,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsivePie } from "@nivo/pie";
import { PieChart as PieChartIcon } from "lucide-react";
import { AssetAllocationItem } from "../types";
import { splitCurrencyForDisplay } from "@/features/mutual-funds/utils";

import { ALLOCATION_COLORS } from "../constants";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

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
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const primaryText = useColorModeValue("gray.800", "gray.100");
  const secondaryText = useColorModeValue("gray.500", "gray.400");
  const legendHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const emptyStateBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const sym = currencySymbol || "₹";

  const chartData = allocation.map((item, idx) => ({
    id: item.label,
    label: item.label,
    value: Number(item.value),
    percentage: item.percentage,
    color: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
  }));

  const hoveredItem = hoveredIdx !== null ? chartData[hoveredIdx] : null;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
      h="full"
      position="relative"
      overflow="hidden"
    >
      {/* Card header */}
      <Flex align="center" gap={1.5} mb={4}>
        <Icon as={PieChartIcon} boxSize={3.5} color={labelColor} />
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="wider"
          color={labelColor}
        >
          Asset Allocation
        </Text>
      </Flex>

      {chartData.length === 0 ? (
        <Center flexDirection="column" py={10} gap={3}>
          <Box
            w="48px"
            h="48px"
            borderRadius="xl"
            bg={emptyStateBg}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={PieChartIcon} boxSize={5} color={secondaryText} />
          </Box>
          <Text fontSize="sm" color={secondaryText}>
            No allocation data yet.
          </Text>
        </Center>
      ) : (
        <Flex
          direction={{ base: "column", xl: "row" }}
          align="center"
          gap={5}
          h={{ base: "auto", xl: "calc(100% - 40px)" }}
        >
          {/* Donut chart */}
          <Box
            position="relative"
            w={{ base: "220px", xl: "full" }}
            h={{ base: "220px", xl: "full" }}
            minH="200px"
            flex={{ xl: 1 }}
          >
            <ResponsivePie
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.55}
              padAngle={2}
              cornerRadius={3}
              colors={{ datum: "data.color" }}
              borderWidth={0}
              enableArcLinkLabels={false}
              enableArcLabels={false}
              motionConfig="gentle"
              onMouseEnter={(datum) => {
                const idx = chartData.findIndex(d => d.id === datum.id);
                setHoveredIdx(idx >= 0 ? idx : null);
              }}
              onMouseLeave={() => setHoveredIdx(null)}
              tooltip={() => <></>}
            />

            {/* Center label */}
            <Center
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              pointerEvents="none"
            >
              <AnimatePresence mode="wait">
                <MotionFlex
                  key={hoveredIdx ?? "default"}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  direction="column"
                  align="center"
                  textAlign="center"
                  px={3}
                >
                  {hoveredItem ? (
                    <>
                      <Text
                        fontSize="xs"
                        fontWeight="600"
                        color={ALLOCATION_COLORS[hoveredIdx! % ALLOCATION_COLORS.length]}
                        lineHeight="short"
                        mb={0.5}
                      >
                        {hoveredItem.label}
                      </Text>
                      <Text fontSize="md" fontWeight="800" color={primaryText} lineHeight="1.1">
                        {splitCurrencyForDisplay(hoveredItem.value, sym).main}
                        <Text as="span" fontSize="xs" opacity={0.5}>
                          {splitCurrencyForDisplay(hoveredItem.value, sym).decimals}
                        </Text>
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="600"
                        color={secondaryText}
                        mt={0.5}
                      >
                        {hoveredItem.percentage.toFixed(1)}%
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text fontSize="2xs" color={secondaryText} fontWeight="500">
                        Hover to
                      </Text>
                      <Text fontSize="2xs" color={secondaryText} fontWeight="500">
                        explore
                      </Text>
                    </>
                  )}
                </MotionFlex>
              </AnimatePresence>
            </Center>
          </Box>

          {/* Legend */}
          <VStack
            align="stretch"
            spacing={1}
            w={{ base: "full", xl: "auto" }}
            minW={{ xl: "150px" }}
          >
            {chartData.map((item, idx) => {
              const isActive = hoveredIdx === null || hoveredIdx === idx;
              return (
                <Flex
                  key={item.label}
                  align="center"
                  gap={2.5}
                  px={2.5}
                  py={2}
                  borderRadius="lg"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  cursor="default"
                  opacity={isActive ? 1 : 0.35}
                  bg={hoveredIdx === idx ? legendHoverBg : "transparent"}
                  transition="all 0.15s ease"
                >
                  <Box
                    w={2.5}
                    h={2.5}
                    borderRadius="sm"
                    bg={ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length]}
                    flexShrink={0}
                  />
                  <Box flex={1} minW={0}>
                    <Text fontSize="xs" color={primaryText} fontWeight="600" isTruncated>
                      {item.label}
                    </Text>
                    <Text fontSize="2xs" color={secondaryText} fontWeight="500">
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </VStack>
        </Flex>
      )}
    </MotionBox>
  );
};

export default AssetAllocationChart;
