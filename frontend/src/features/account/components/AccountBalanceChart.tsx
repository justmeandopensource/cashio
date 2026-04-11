import React, { useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ResponsiveLine } from "@nivo/line";
import { TrendingUp } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { useAccountBalanceHistory } from "../hooks";

const MotionBox = motion(Box);

interface AccountBalanceChartProps {
  accountId: string;
}

const AccountBalanceChart: React.FC<AccountBalanceChartProps> = ({ accountId }) => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);

  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const gridStroke = useColorModeValue("#e2e8f0", "#2d3748");
  const axisTickColor = useColorModeValue("#718096", "#cbd5e0");
  const tooltipBg = useColorModeValue("#fff", "#2d3748");
  const tooltipBorder = useColorModeValue("#e2e8f0", "#4a5568");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const lineColor = useColorModeValue("#3182ce", "#63b3ed");
  const fillColor = useColorModeValue("#3182ce", "#63b3ed");
  const zeroLineColor = useColorModeValue("#e2e8f0", "#4a5568");

  const { data } = useAccountBalanceHistory(ledgerId || "", accountId);

  const lineData = useMemo(() => {
    if (!data?.data_points?.length) return [];
    return [{
      id: "Balance",
      data: data.data_points.map(p => ({ x: p.date, y: p.balance })),
    }];
  }, [data]);

  if (!data || data.data_points.length === 0) {
    return null;
  }

  const hasNegative = data.data_points.some((p) => p.balance < 0);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Box
        bg={cardBg}
        p={{ base: 4, md: 5 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={sectionBorderColor}
        h="full"
      >
        <Flex align="center" gap={2} mb={4}>
          <Icon as={TrendingUp} boxSize={4} color={iconColor} />
          <Heading
            as="h3"
            size="sm"
            color={primaryTextColor}
            letterSpacing="-0.02em"
          >
            Balance History
          </Heading>
        </Flex>

        <Box height={{ base: "220px", md: "280px" }} width="full">
          <ResponsiveLine
            data={lineData}
            margin={{ top: 10, right: 20, bottom: 10, left: 60 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: "auto", max: "auto" }}
            curve="monotoneX"
            colors={[lineColor]}
            lineWidth={2}
            enablePoints={false}
            enableArea={true}
            areaOpacity={0.15}
            useMesh={true}
            enableCrosshair={true}
            enableGridX={false}
            gridYValues={7}
            defs={[{
              id: "balanceGradient",
              type: "linearGradient",
              colors: [
                { offset: 0, color: fillColor, opacity: 0.25 },
                { offset: 100, color: fillColor, opacity: 0.02 },
              ],
            }]}
            fill={[{ match: "*", id: "balanceGradient" }]}
            axisBottom={null}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickValues: 5,
              format: (value) => {
                if (value === 0) return "";
                const sym = currencySymbol || "$";
                const abs = Math.abs(Number(value));
                if (abs >= 100000) return `${sym}${(Number(value) / 100000).toFixed(1)}L`;
                if (abs >= 1000) return `${sym}${(Number(value) / 1000).toFixed(1)}K`;
                return `${sym}${value}`;
              },
            }}
            markers={hasNegative ? [{ axis: "y" as const, value: 0, lineStyle: { stroke: zeroLineColor, strokeDasharray: "4 4" } }] : []}
            tooltip={({ point }) => {
              const d = new Date(point.data.xFormatted + "T00:00:00");
              return (
                <Box bg={tooltipBg} border="1px solid" borderColor={tooltipBorder} borderRadius="md" px={3} py={2} boxShadow="lg" fontSize="xs" whiteSpace="nowrap">
                  <Text fontWeight="bold" color={axisTickColor}>
                    {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                  <Text color={axisTickColor} mb={0.5}>
                    {d.toLocaleDateString("en-US", { year: "numeric" })}
                  </Text>
                  <Text fontWeight="600" color={lineColor}>
                    {formatNumberAsCurrency(Number(point.data.y), currencySymbol as string)}
                  </Text>
                </Box>
              );
            }}
            theme={{
              axis: { ticks: { text: { fill: axisTickColor, fontSize: 11 } } },
              grid: { line: { stroke: gridStroke, strokeWidth: 1 } },
              crosshair: { line: { stroke: axisTickColor, strokeWidth: 1, strokeOpacity: 0.35 } },
            }}
          />
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(AccountBalanceChart);
