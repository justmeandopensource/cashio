import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  useColorModeValue,
  Flex,
  Icon,
  Center,
  Select,
  Tooltip,
  useColorMode,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, ChevronDown } from "lucide-react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import config from "@/config";

const MotionBox = motion(Box);

interface ExpenseCalendarData {
  date: string;
  amount: number;
}

interface ExpenseCalendarResponse {
  expenses: ExpenseCalendarData[];
  total_expense: number;
}

interface ExpenseCalendarHeatmapProps {
  ledgerId?: string;
}

const ExpenseCalendarHeatmap: React.FC<ExpenseCalendarHeatmapProps> = ({ ledgerId }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { currencySymbol } = useLedgerStore();
  const navigate = useNavigate();
  const { colorMode } = useColorMode();

  const handleCellClick = (value: any) => {
    if (value && value.date) {
      const date = new Date(value.date);

      const fromDate = new Date(date);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(date);
      toDate.setHours(23, 59, 59, 999);

      const fromDateISO = fromDate.toISOString();
      const toDateISO = toDate.toISOString();

      navigate(`/ledger?tab=transactions&from_date=${fromDateISO}&to_date=${toDateISO}&transaction_type=expense`);
    }
  };

  // Color modes
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const tertiaryTextColor = useColorModeValue("gray.500", "gray.400");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const selectBg = useColorModeValue("gray.50", "gray.700");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");

  const legendColor0 = useColorModeValue("#eeeeee", "var(--chakra-colors-gray-700)");
  const legendColor1 = useColorModeValue("#B2F5EA", "var(--chakra-colors-teal-900)");
  const legendColor2 = useColorModeValue("#81E6D9", "var(--chakra-colors-teal-800)");
  const legendColor3 = useColorModeValue("#4FD1C5", "var(--chakra-colors-teal-700)");
  const legendColor4 = useColorModeValue("#38B2AC", "var(--chakra-colors-teal-600)");
  const legendColor5 = useColorModeValue("#2C7A7B", "var(--chakra-colors-teal-500)");
  const legendColor6 = useColorModeValue("#234E52", "var(--chakra-colors-teal-400)");
  const legendColor7 = useColorModeValue("#1D4044", "var(--chakra-colors-teal-300)");

  // Generate year options (current year and previous 4 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch expense calendar data
  const { data, isLoading, isError } = useQuery<ExpenseCalendarResponse>({
    queryKey: ["expenseCalendar", ledgerId, selectedYear],
    queryFn: async () => {
      if (!ledgerId) return null;

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${config.apiBaseUrl}/ledger/${ledgerId}/insights/expense-calendar?year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch expense calendar data");
      }

      return response.json();
    },
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  // Transform data for the heatmap
  const heatmapValues = data?.expenses.map((expense) => ({
    date: new Date(expense.date),
    count: expense.amount,
  })) || [];

  // Define color classes based on expense amount
  const getClassForValue = (value: any) => {
    if (!value) {
      return colorMode === "dark" ? "color-dark-0" : "color-github-0";
    }
    const amount = value.count;
    if (amount <= 0) return colorMode === "dark" ? "color-dark-0" : "color-github-0";
    if (amount < 10) return colorMode === "dark" ? "color-dark-1" : "color-github-1";
    if (amount < 50) return colorMode === "dark" ? "color-dark-2" : "color-github-2";
    if (amount < 100) return colorMode === "dark" ? "color-dark-3" : "color-github-3";
    if (amount < 200) return colorMode === "dark" ? "color-dark-4" : "color-github-4";
    if (amount < 500) return colorMode === "dark" ? "color-dark-5" : "color-github-5";
    if (amount < 1000) return colorMode === "dark" ? "color-dark-6" : "color-github-6";
    return colorMode === "dark" ? "color-dark-7" : "color-github-7";
  };

  const legendItems = [
    { color: legendColor0, label: `${currencySymbol}0` },
    { color: legendColor1, label: `${currencySymbol}1-9` },
    { color: legendColor2, label: `${currencySymbol}10-49` },
    { color: legendColor3, label: `${currencySymbol}50-99` },
    { color: legendColor4, label: `${currencySymbol}100-199` },
    { color: legendColor5, label: `${currencySymbol}200-499` },
    { color: legendColor6, label: `${currencySymbol}500-999` },
    { color: legendColor7, label: `${currencySymbol}1000+` },
  ];

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        p={{ base: 4, md: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={sectionBorderColor}
      >
        <Text color={secondaryTextColor}>Loading expense calendar data...</Text>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        bg={cardBg}
        p={{ base: 4, md: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={sectionBorderColor}
        textAlign="center"
      >
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load expense calendar data
        </Text>
      </Box>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Box borderRadius="xl" p={{ base: 0, md: 0 }}>
        {/* Header */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          flexDirection={{ base: "column", md: "row" }}
          gap={{ base: 3, md: 0 }}
          mb={{ base: 4, md: 5 }}
        >
          <Flex align="center" gap={2}>
            <Icon as={Calendar} boxSize={4} color={iconColor} />
            <Heading
              as="h2"
              size="md"
              color={primaryTextColor}
              letterSpacing="-0.02em"
            >
              Expense Calendar
            </Heading>
          </Flex>

          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            maxW={{ base: "full", md: "150px" }}
            icon={<ChevronDown />}
            variant="filled"
            bg={selectBg}
            size="sm"
            borderRadius="lg"
            fontWeight="medium"
            fontSize="sm"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </Flex>

        {/* Heatmap */}
        <Box width="full" mb={6} mt={4}>
          {heatmapValues.length > 0 ? (
            <Center>
              <Box className="react-calendar-heatmap" w="full">
                <CalendarHeatmap
                  onClick={handleCellClick}
                  startDate={new Date(selectedYear, 0, 1)}
                  endDate={new Date(selectedYear, 11, 31)}
                  values={heatmapValues}
                  classForValue={getClassForValue}
                  showWeekdayLabels={false}
                  showMonthLabels={true}
                  gutterSize={2}
                  transformDayElement={(rect: any, value) => {
                    const dateStr = value?.date instanceof Date
                      ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(value.date)
                      : value?.date;
                    if (!value || value.count === 0) {
                      // @ts-ignore
                      return rect;
                    }

                    const tooltipLabel = (
                      <VStack spacing={0} align="center">
                        <Text fontWeight="bold" fontSize="md">
                          {formatNumberAsCurrency(value.count, currencySymbol as string)}
                        </Text>
                        <Text fontSize="sm">{dateStr}</Text>
                      </VStack>
                    );

                    return (
                      <Tooltip label={tooltipLabel} placement="top" hasArrow>
                        {rect}
                      </Tooltip>
                    );
                  }}
                />
              </Box>
            </Center>
          ) : (
            <Center
              height="200px"
              borderRadius="lg"
              flexDirection="column"
              textAlign="center"
              p={6}
            >
              <Icon as={Calendar} boxSize={6} color={tertiaryTextColor} mb={4} />
              <Heading size="md" mb={2} color={secondaryTextColor}>
                No Expense Data Available
              </Heading>
              <Text color={secondaryTextColor} fontSize="sm">
                No expense transactions found for {selectedYear}.
              </Text>
            </Center>
          )}
        </Box>

        {/* Legend */}
        <Box>
          <Text
            fontSize="2xs"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="wider"
            color={columnHeaderColor}
            mb={2}
          >
            Legend
          </Text>
          <HStack spacing={3} wrap="wrap">
            {legendItems.map(({ color, label }) => (
              <HStack spacing={1.5} key={label}>
                <Box w={2.5} h={2.5} bg={color} borderRadius="sm" />
                <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                  {label}
                </Text>
              </HStack>
            ))}
          </HStack>
        </Box>
      </Box>

      {/* Custom CSS for heatmap colors */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .react-calendar-heatmap .color-github-1 { fill: #B2F5EA; }
          .react-calendar-heatmap .color-github-2 { fill: #81E6D9; }
          .react-calendar-heatmap .color-github-3 { fill: #4FD1C5; }
          .react-calendar-heatmap .color-github-4 { fill: #38B2AC; }
          .react-calendar-heatmap .color-github-5 { fill: #2C7A7B; }
          .react-calendar-heatmap .color-github-6 { fill: #234E52; }
          .react-calendar-heatmap .color-github-7 { fill: #1D4044; }

          .react-calendar-heatmap .color-dark-0 { fill: var(--chakra-colors-gray-700); }
          .react-calendar-heatmap .color-dark-1 { fill: var(--chakra-colors-teal-900); }
          .react-calendar-heatmap .color-dark-2 { fill: var(--chakra-colors-teal-800); }
          .react-calendar-heatmap .color-dark-3 { fill: var(--chakra-colors-teal-700); }
          .react-calendar-heatmap .color-dark-4 { fill: var(--chakra-colors-teal-600); }
          .react-calendar-heatmap .color-dark-5 { fill: var(--chakra-colors-teal-500); }
          .react-calendar-heatmap .color-dark-6 { fill: var(--chakra-colors-teal-400); }
          .react-calendar-heatmap .color-dark-7 { fill: var(--chakra-colors-teal-300); }

          .react-calendar-heatmap text.weekday-label,
          .react-calendar-heatmap text.month-label {
            font-size: 8px;
          }
        `,
      }} />
    </MotionBox>
  );
};

export default React.memo(ExpenseCalendarHeatmap);
