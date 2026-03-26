import {
  Box,
  Flex,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from "@chakra-ui/react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import BudgetProgressBar from "./BudgetProgressBar";
import { getBudgetStatusColor } from "../utils";

const MotionBox = motion(Box);

export interface BudgetItemData {
  budget_id: number;
  category_id: number;
  category_name: string;
  period: string;
  amount: number;
  actual_spend: number;
}

interface BudgetItemProps {
  budget: BudgetItemData;
  currencySymbol: string;
  onEdit: (budget: BudgetItemData) => void;
  onDelete: (budgetId: number) => void;
  index?: number;
}

const BudgetItem: React.FC<BudgetItemProps> = ({ budget, currencySymbol, onEdit, onDelete, index = 0 }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const valueColor = useColorModeValue("gray.800", "gray.100");
  const menuBg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.50", "gray.750");
  const menuButtonColor = useColorModeValue("gray.400", "gray.500");

  const remaining = Number(budget.amount) - Number(budget.actual_spend);
  const statusColor = getBudgetStatusColor(budget.actual_spend, budget.amount);

  return (
    <MotionBox
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
      _hover={{ borderColor: useColorModeValue("gray.200", "gray.600") }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      // @ts-ignore framer-motion transition
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}
      style={{ transition: "border-color 0.2s ease" }}
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <Box flex={1} minW={0}>
          <Flex align="center" gap={2} mb={1}>
            <Text
              fontWeight="semibold"
              color={valueColor}
              fontSize="sm"
              letterSpacing="-0.01em"
              noOfLines={1}
            >
              {budget.category_name}
            </Text>
          </Flex>
          <Flex align="center" gap={1.5} flexWrap="wrap">
            <Text fontSize="xs" color={labelColor}>
              {formatNumberAsCurrency(budget.actual_spend, currencySymbol)}
              {" / "}
              {formatNumberAsCurrency(budget.amount, currencySymbol)}
            </Text>
            <Text fontSize="xs" color={labelColor}>·</Text>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color={statusColor}
            >
              {remaining < 0
                ? `Over by ${formatNumberAsCurrency(Math.abs(remaining), currencySymbol)}`
                : `${formatNumberAsCurrency(remaining, currencySymbol)} left`}
            </Text>
          </Flex>
        </Box>

        <Menu placement="bottom-end">
          <MenuButton
            as={IconButton}
            icon={<MoreVertical size={15} />}
            variant="ghost"
            size="sm"
            aria-label="Budget options"
            color={menuButtonColor}
            borderRadius="lg"
            _hover={{ bg: hoverBg }}
          />
          <MenuList
            bg={menuBg}
            minW="140px"
            fontSize="sm"
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
            py={1}
          >
            <MenuItem
              icon={<Pencil size={14} />}
              onClick={() => onEdit(budget)}
              borderRadius="md"
              mx={1}
              _hover={{ bg: hoverBg }}
            >
              Edit
            </MenuItem>
            <MenuItem
              icon={<Trash2 size={14} />}
              color="red.400"
              onClick={() => onDelete(budget.budget_id)}
              borderRadius="md"
              mx={1}
              _hover={{ bg: useColorModeValue("red.50", "rgba(254,178,178,0.06)") }}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      <BudgetProgressBar spent={budget.actual_spend} limit={budget.amount} showLabels />
    </MotionBox>
  );
};

export default BudgetItem;
