import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import React from "react";

interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  showLabels?: boolean;
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ spent, limit, showLabels }) => {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const trackBg = useColorModeValue("gray.100", "gray.700");

  let barColor: string;
  if (pct >= 90) {
    barColor = "var(--chakra-colors-red-400)";
  } else if (pct >= 75) {
    barColor = "var(--chakra-colors-orange-400)";
  } else {
    barColor = "var(--chakra-colors-green-400)";
  }

  return (
    <Box w="100%">
      <Box
        w="100%"
        h="8px"
        bg={trackBg}
        borderRadius="full"
        overflow="hidden"
      >
        <Box
          h="100%"
          w={`${pct}%`}
          bg={barColor}
          borderRadius="full"
          transition="width 0.4s ease"
        />
      </Box>
      {showLabels && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {Math.round(pct)}%
        </Text>
      )}
    </Box>
  );
};

export default BudgetProgressBar;
