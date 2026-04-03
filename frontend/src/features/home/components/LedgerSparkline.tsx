import { memo, useMemo } from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getIncomeExpenseTrend } from "@/features/insights/api";
import { queryKeys } from "@/lib/queryKeys";

interface LedgerSparklineProps {
  ledgerId: string;
  currencySymbol: string;
}

interface TrendPoint {
  period: string;
  income: number;
  expense: number;
}

/**
 * Build an SVG path for a smooth area sparkline.
 * Returns { linePath, areaPath } where linePath is the visible stroke
 * and areaPath closes down to the bottom for the gradient fill.
 * `sharedMax` ensures both series use the same vertical scale.
 */
function buildSparklinePaths(
  values: number[],
  width: number,
  height: number,
  padding: number,
  sharedMax: number
): { linePath: string; areaPath: string } | null {
  if (values.length < 2) return null;
  const max = Math.max(sharedMax, 1);
  const drawH = height - padding * 2;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => ({
    x: i * step,
    y: padding + drawH - (v / max) * drawH,
  }));

  // Catmull-Rom to cubic bezier for smooth curves
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  const linePath = d;
  const areaPath = `${d} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  return { linePath, areaPath };
}

const LedgerSparkline = memo(
  ({ ledgerId }: LedgerSparklineProps) => {
    const { data } = useQuery({
      queryKey: queryKeys.insights.incomeExpense(ledgerId, "last_12_months"),
      queryFn: ({ signal }) =>
        getIncomeExpenseTrend(ledgerId, "last_12_months", signal),
      staleTime: 10 * 60 * 1000,
    });

    const incomeStroke = useColorModeValue("#0d9488", "#5eead4");
    const expenseStroke = useColorModeValue("#ef4444", "#fca5a5");
    const incomeFillOpacity = useColorModeValue(0.15, 0.1);
    const expenseFillOpacity = useColorModeValue(0.12, 0.08);

    const trend: TrendPoint[] = useMemo(() => {
      return data?.trend_data ?? [];
    }, [data]);

    const W = 200;
    const H = 36;
    const PAD = 3;

    const sharedMax = useMemo(
      () => Math.max(...trend.map((t) => Math.max(t.income, t.expense)), 1),
      [trend]
    );
    const incomePaths = useMemo(
      () => buildSparklinePaths(trend.map((t) => t.income), W, H, PAD, sharedMax),
      [trend, sharedMax]
    );
    const expensePaths = useMemo(
      () => buildSparklinePaths(trend.map((t) => t.expense), W, H, PAD, sharedMax),
      [trend, sharedMax]
    );

    if (!incomePaths || !expensePaths) return null;

    return (
      <Box mt={2} mb={-1} mx={-1} h="36px" opacity={0.85}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient
              id={`spark-inc-${ledgerId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={incomeStroke}
                stopOpacity={incomeFillOpacity}
              />
              <stop offset="100%" stopColor={incomeStroke} stopOpacity={0} />
            </linearGradient>
            <linearGradient
              id={`spark-exp-${ledgerId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={expenseStroke}
                stopOpacity={expenseFillOpacity}
              />
              <stop offset="100%" stopColor={expenseStroke} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Income area + line */}
          <path
            d={incomePaths.areaPath}
            fill={`url(#spark-inc-${ledgerId})`}
          />
          <path
            d={incomePaths.linePath}
            fill="none"
            stroke={incomeStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Expense area + line */}
          <path
            d={expensePaths.areaPath}
            fill={`url(#spark-exp-${ledgerId})`}
          />
          <path
            d={expensePaths.linePath}
            fill="none"
            stroke={expenseStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </Box>
    );
  }
);

LedgerSparkline.displayName = "LedgerSparkline";

export default LedgerSparkline;
