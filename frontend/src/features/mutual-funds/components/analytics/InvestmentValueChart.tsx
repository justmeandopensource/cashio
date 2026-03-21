import { FC, useMemo } from "react";
import { Box, Text, useColorModeValue, useBreakpointValue } from "@chakra-ui/react";
import { ResponsiveLine, Point } from "@nivo/line";
import { InvestmentValueSeries } from "./useFundAnalyticsData";

const formatDateLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en", { month: "short", year: "2-digit" });
};

interface InvestmentValueChartProps {
  data: InvestmentValueSeries[];
  currencySymbol: string;
}

const InvestmentValueChart: FC<InvestmentValueChartProps> = ({
  data,
  currencySymbol,
}) => {
  const maxTicks = useBreakpointValue({ base: 5, md: 10 }) || 5;
  const textColor = useColorModeValue("#4A5568", "#A0AEC0");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const tooltipBg = useColorModeValue("#FFFFFF", "#1A202C");
  const tooltipBorder = useColorModeValue("#E2E8F0", "#4A5568");

  if (data.length === 0 || data[0].data.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No transaction data available</Text>
      </Box>
    );
  }

  const tickValues = useMemo(() => {
    const xValues = data[0]?.data.map((d) => d.x) || [];
    if (xValues.length <= maxTicks) return undefined;
    const step = Math.ceil(xValues.length / maxTicks);
    const ticks = xValues.filter((_, i) => i % step === 0);
    if (ticks[ticks.length - 1] !== xValues[xValues.length - 1]) {
      ticks.push(xValues[xValues.length - 1]);
    }
    return ticks;
  }, [data, maxTicks]);

  const renderTooltip = ({ point }: { point: Point }) => {
    const dateStr = String(point.data.x);
    // Find the matching data from both series for this x value
    const investedPoint = data[0]?.data.find((d) => d.x === dateStr);
    const valuePoint = data[1]?.data.find((d) => d.x === dateStr);
    return (
      <Box
        bg={tooltipBg}
        border="1px solid"
        borderColor={tooltipBorder}
        borderRadius="md"
        px={3}
        py={2}
        boxShadow="lg"
        fontSize="xs"
        minW="180px"
        whiteSpace="nowrap"
      >
        <Text fontWeight="bold" mb={1}>
          {dateStr}
        </Text>
        {investedPoint && (
          <Text color="#3182CE">
            Invested: {currencySymbol}
            {investedPoint.y.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        )}
        {valuePoint && (
          <Text color="#38B2AC">
            Value: {currencySymbol}
            {valuePoint.y.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        )}
      </Box>
    );
  };

  return (
    <Box h={{ base: "250px", md: "300px" }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 20, right: 20, bottom: 70, left: 60 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
        curve="monotoneX"
        axisBottom={{
          tickRotation: -45,
          tickSize: 5,
          tickPadding: 5,
          format: formatDateLabel,
          tickValues,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          format: (v) => {
            if (v >= 100000) return `${currencySymbol}${(v / 100000).toFixed(1)}L`;
            if (v >= 1000) return `${currencySymbol}${(v / 1000).toFixed(1)}K`;
            return `${currencySymbol}${v}`;
          },
        }}
        enablePoints={true}
        pointSize={6}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointColor="white"
        enableArea={true}
        areaOpacity={0.15}
        useMesh={true}
        tooltip={renderTooltip}
        theme={{
          axis: {
            ticks: { text: { fill: textColor, fontSize: 11 } },
          },
          grid: { line: { stroke: gridColor, strokeWidth: 1 } },
          crosshair: { line: { stroke: textColor, strokeWidth: 1, strokeOpacity: 0.35 } },
        }}
        colors={["#3182CE", "#38B2AC"]}
        lineWidth={2}
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            translateY: 70,
            itemWidth: 80,
            itemHeight: 20,
            itemTextColor: textColor,
            symbolSize: 10,
            symbolShape: "circle",
          },
        ]}
      />
    </Box>
  );
};

export default InvestmentValueChart;
