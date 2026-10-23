import React from "react";
import { useColorModeValue } from "../../../components/ui/color-mode";
import { Flex, Text, Icon, HStack, IconButton, Link as ChakraLink } from "@chakra-ui/react";
import { Tooltip } from '@/components/ui/tooltip';
import { Link as RouterLink } from "react-router-dom";
import { Plus, Repeat } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../mutual-funds/utils";

import type { Account, Transaction } from "@/types";

function formatTimeAgo(dateStr?: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

interface LedgerAccountCardProps {
  account: Account;
  balanceColor: string;
  onAddTransaction: (accountId?: string, transaction?: Transaction) => void;
  onTransferFunds: (accountId?: string, transaction?: Transaction) => void;
  getOwnerInitials: (owner: string | null | undefined) => string;
}

/** Desktop table-row view for a single account */
export const LedgerAccountRowDesktop: React.FC<LedgerAccountCardProps> = ({
  account,
  balanceColor,
  onAddTransaction,
  onTransferFunds,
  getOwnerInitials,
}) => {
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const balance = account.net_balance || 0;
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const hoverIconColor = useColorModeValue("brand.600", "brand.400");
  const accountHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const timeAgoColor = useColorModeValue("gray.400", "gray.500");

  const timeAgo = formatTimeAgo(account.last_transaction_date);

  return (
    <Flex
      key={account.account_id}
      align="center"
      justify="space-between"
      py={2}
      px={3}
      pl={12}
      _hover={{ bg: accountHoverBg, "& .action-icons": { opacity: 1 } }}
      transition="background 0.15s ease"
      borderRadius="md"
    >
      <HStack gap={1.5} flex={1} minW={0}>
        <ChakraLink _hover={{ textDecoration: "none" }} asChild><RouterLink to={`/account/${account.account_id}`}>
            <Text
              fontSize="sm"
              color={tertiaryTextColor}
              _hover={{ color: "brand.500" }}
              transition="color 0.15s ease"
              truncate
            >
              {account.name}
            </Text>
          </RouterLink></ChakraLink>
        {getOwnerInitials(account.owner) && (
          <Text as="span" fontSize="xs" color="gray.500">
            [{getOwnerInitials(account.owner)}]
          </Text>
        )}
        {timeAgo && (
          <Tooltip content={`Last transaction: ${new Date(account.last_transaction_date!).toLocaleDateString()}`} showArrow positioning={{
            placement: "top"
          }}>
            <Text fontSize="2xs" color={timeAgoColor} flexShrink={0}>
              {timeAgo}
            </Text>
          </Tooltip>
        )}
      </HStack>
      <Flex align="center" gap={3}>
        <HStack gap={0} align="baseline">
          <Text fontWeight="semibold" color={balanceColor} fontSize="sm">
            {splitCurrencyForDisplay(balance, currencySymbol || "").main}
          </Text>
          <Text fontSize="2xs" color={balanceColor} opacity={0.7}>
            {splitCurrencyForDisplay(balance, currencySymbol || "").decimals}
          </Text>
        </HStack>
        <Flex
          gap={1.5}
          opacity={0}
          transition="opacity 0.2s"
          className="action-icons"
        >
          <ChakraLink
            onClick={() => onAddTransaction(account.account_id, undefined)}
            _hover={{ textDecoration: "none" }}
          >
            <Icon
              boxSize="14px"
              color={iconColor}
              _hover={{ color: hoverIconColor }}
              transition="color 0.15s ease"
              asChild><Plus /></Icon>
          </ChakraLink>
          <ChakraLink
            onClick={() => onTransferFunds(account.account_id)}
            _hover={{ textDecoration: "none" }}
          >
            <Icon
              boxSize="14px"
              color={iconColor}
              _hover={{ color: hoverIconColor }}
              transition="color 0.15s ease"
              asChild><Repeat /></Icon>
          </ChakraLink>
        </Flex>
      </Flex>
    </Flex>
  );
};

/** Mobile card view for a single account */
export const LedgerAccountCardMobile: React.FC<LedgerAccountCardProps> = ({
  account,
  balanceColor,
  onAddTransaction,
  onTransferFunds,
  getOwnerInitials,
}) => {
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const balance = account.net_balance || 0;
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const dividerColor = useColorModeValue("gray.100", "gray.700");
  const timeAgoColor = useColorModeValue("gray.400", "gray.500");

  const timeAgo = formatTimeAgo(account.last_transaction_date);

  return (
    <Flex
      key={account.account_id}
      justifyContent="space-between"
      alignItems="center"
      py={2.5}
      px={3}
      borderBottom="1px solid"
      borderColor={dividerColor}
      _last={{ borderBottom: "none" }}
    >
      <HStack gap={1.5} flex={1} minW={0}>
        <ChakraLink _hover={{ textDecoration: "none" }} asChild><RouterLink to={`/account/${account.account_id}`}>
            <Text
              color={tertiaryTextColor}
              fontSize="sm"
              truncate
            >
              {account.name}
            </Text>
          </RouterLink></ChakraLink>
        {getOwnerInitials(account.owner) && (
          <Text as="span" fontSize="xs" color="gray.500">
            [{getOwnerInitials(account.owner)}]
          </Text>
        )}
        {timeAgo && (
          <Text fontSize="2xs" color={timeAgoColor} flexShrink={0}>
            {timeAgo}
          </Text>
        )}
      </HStack>
      <Flex align="center" gap={2}>
        <HStack gap={0} align="baseline">
          <Text fontWeight="semibold" color={balanceColor} fontSize="sm">
            {splitCurrencyForDisplay(balance, currencySymbol || "").main}
          </Text>
          <Text fontSize="2xs" color={balanceColor} opacity={0.7}>
            {splitCurrencyForDisplay(balance, currencySymbol || "").decimals}
          </Text>
        </HStack>
        <Flex gap={1}>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="brand"
            aria-label="Add transaction"
            onClick={() => onAddTransaction(account.account_id, undefined)}><Plus size={14} /></IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="brand"
            aria-label="Transfer funds"
            onClick={() => onTransferFunds(account.account_id)}><Repeat size={14} /></IconButton>
        </Flex>
      </Flex>
    </Flex>
  );
};
