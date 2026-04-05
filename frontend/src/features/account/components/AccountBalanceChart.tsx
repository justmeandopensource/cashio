import React from "react";
import {
  Box,
  Flex,
  Heading,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { useAccountBalanceHistory } from "../hooks";

const MotionBox = motion(Box);

interface AccountBalanceChartProps {
  accountId: string;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const AccountBalanceChart: React.FC<AccountBalanceChartProps> = ({ accountId }) => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);

  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const gridStroke = useColorModeValue("#e2e8f0", "#2d3748");
  const axisTickColor = useColorModeValue("#718096", "#cbd5e0");
  const tooltipBg = useColorModeValue("#fff", "#2d3748");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const lineColor = useColorModeValue("#3182ce", "#63b3ed");
  const fillColor = useColorModeValue("#3182ce", "#63b3ed");
  const zeroLineColor = useColorModeValue("#e2e8f0", "#4a5568");

  const { data } = useAccountBalanceHistory(ledgerId || "", accountId);

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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.data_points}
              margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={fillColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={fillColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: "0.65rem", fill: axisTickColor }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tickFormatter={(value) => {
                  if (value === 0) return "";
                  const sym = currencySymbol || "$";
                  const abs = Math.abs(value);
                  if (abs >= 100000)
                    return `${sym}${(value / 100000).toFixed(1)}L`;
                  if (abs >= 1000)
                    return `${sym}${(value / 1000).toFixed(1)}K`;
                  return `${sym}${value}`;
                }}
                tick={{ fontSize: "0.65rem", fill: axisTickColor }}
              />
              <Tooltip
                formatter={(value: number) => [
                  formatNumberAsCurrency(value, currencySymbol as string),
                  "Balance",
                ]}
                labelFormatter={(label: string) => {
                  const d = new Date(label + "T00:00:00");
                  return d.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderRadius: "10px",
                }}
              />
              {hasNegative && (
                <ReferenceLine y={0} stroke={zeroLineColor} strokeDasharray="4 4" />
              )}
              <Area
                type="monotone"
                dataKey="balance"
                stroke={lineColor}
                strokeWidth={2}
                fill="url(#balanceGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(AccountBalanceChart);
