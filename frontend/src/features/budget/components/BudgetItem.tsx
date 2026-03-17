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
import React from "react";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import BudgetProgressBar from "./BudgetProgressBar";

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
}

const BudgetItem: React.FC<BudgetItemProps> = ({ budget, currencySymbol, onEdit, onDelete }) => {
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.800", "gray.100");
  const menuBg = useColorModeValue("white", "gray.800");

  const remaining = budget.amount - budget.actual_spend;

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={{ base: 4, md: 5 }}
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <Box flex={1}>
          <Text fontWeight="semibold" color={valueColor} fontSize="sm">
            {budget.category_name}
          </Text>
          <Text fontSize="xs" color={labelColor} mt={0.5}>
            {formatNumberAsCurrency(budget.actual_spend, currencySymbol)} of{" "}
            {formatNumberAsCurrency(budget.amount, currencySymbol)}
            {" · "}
            <Text
              as="span"
              color={remaining < 0 ? "red.400" : "green.400"}
              fontWeight="medium"
            >
              {remaining < 0 ? "Over by " : ""}
              {formatNumberAsCurrency(Math.abs(remaining), currencySymbol)}
              {remaining >= 0 ? " left" : ""}
            </Text>
          </Text>
        </Box>

        <Menu placement="bottom-end">
          <MenuButton
            as={IconButton}
            icon={<MoreVertical size={16} />}
            variant="ghost"
            size="sm"
            aria-label="Budget options"
            color={labelColor}
          />
          <MenuList bg={menuBg} minW="140px" fontSize="sm">
            <MenuItem icon={<Pencil size={14} />} onClick={() => onEdit(budget)}>
              Edit
            </MenuItem>
            <MenuItem
              icon={<Trash2 size={14} />}
              color="red.400"
              onClick={() => onDelete(budget.budget_id)}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      <BudgetProgressBar spent={budget.actual_spend} limit={budget.amount} showLabels />
    </Box>
  );
};

export default BudgetItem;
