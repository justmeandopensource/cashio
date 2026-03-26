import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { motion } from "framer-motion";
import React from "react";
import { getBudgetStatusColor } from "../utils";

const MotionBox = motion(Box);

interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  showLabels?: boolean;
  size?: "sm" | "md";
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  spent,
  limit,
  showLabels,
  size = "sm",
}) => {
  const numSpent = Number(spent);
  const numLimit = Number(limit);
  const pct = numLimit > 0 ? Math.min((numSpent / numLimit) * 100, 100) : 0;
  const isOver = numSpent > numLimit;
  const trackBg = useColorModeValue("gray.100", "gray.700");

  const barHeight = size === "md" ? "10px" : "6px";

  const statusColor = getBudgetStatusColor(spent, limit);
  const barColor = `var(--chakra-colors-${statusColor.replace(".", "-")})`;

  let glowColor: string;
  if (statusColor === "red.400") {
    glowColor = "rgba(245, 101, 101, 0.25)";
  } else if (statusColor === "orange.400") {
    glowColor = "rgba(237, 137, 54, 0.20)";
  } else {
    glowColor = "rgba(72, 187, 120, 0.20)";
  }

  return (
    <Box w="100%">
      <Box
        w="100%"
        h={barHeight}
        bg={trackBg}
        borderRadius="full"
        overflow="hidden"
        position="relative"
      >
        <MotionBox
          h="100%"
          borderRadius="full"
          bg={barColor}
          boxShadow={pct > 0 ? `0 0 8px ${glowColor}` : "none"}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        />
      </Box>
      {showLabels && (
        <Flex justify="space-between" mt={1.5}>
          <Text
            fontSize="xs"
            fontWeight="medium"
            color={statusColor}
            letterSpacing="-0.01em"
          >
            {Math.round(pct)}%
          </Text>
          {isOver && (
            <Text fontSize="xs" fontWeight="medium" color="red.400">
              Over budget
            </Text>
          )}
        </Flex>
      )}
    </Box>
  );
};

export default BudgetProgressBar;
