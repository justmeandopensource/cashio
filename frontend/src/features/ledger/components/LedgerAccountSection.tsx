import React from "react";
import {
  Flex,
  Box,
  Text,
  Icon,
  IconButton,
  Heading,
  HStack,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  LucideIcon,
} from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../mutual-funds/utils";
import { getSubtypeIcon } from "../constants/accountSubtypes";
import { LedgerAccountRowDesktop, LedgerAccountCardMobile } from "./LedgerAccountCard";

import type { Account } from "@/types";

export interface SubtypeGroup {
  subtype: string;
  label: string;
  accounts: Account[];
  totalBalance: number;
  order: number;
}

interface SubtypeGroupSectionProps {
  group: SubtypeGroup;
  type: "asset" | "liability";
  showZeroBalance: boolean;
  isExpanded: boolean;
  onToggleExpand: (key: string) => void;
  getBalanceColor: (balance: number, type: "asset" | "liability", isGroupHeader: boolean) => string;
  getOwnerInitials: (owner: string | null | undefined) => string;
  onAddTransaction: (accountId?: string, transaction?: any) => void;
  onTransferFunds: (accountId?: string, transaction?: any) => void;
}

/** A collapsible group of accounts under a single subtype (e.g. "Savings Accounts") */
export const SubtypeGroupSection: React.FC<SubtypeGroupSectionProps> = ({
  group,
  type,
  showZeroBalance,
  isExpanded,
  onToggleExpand,
  getBalanceColor,
  getOwnerInitials,
  onAddTransaction,
  onTransferFunds,
}) => {
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const SubtypeIcon = getSubtypeIcon(group.subtype);
  const sectionKey = `${type}-${group.subtype}`;
  const balanceColor = getBalanceColor(group.totalBalance, type, true);

  // Colors (must be called before any early returns)
  const groupColor = useColorModeValue("brand.600", "brand.200");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const subtypeHeaderBg = useColorModeValue("gray.50", "gray.750");
  const subtypeHeaderHoverBg = useColorModeValue("gray.100", "gray.700");
  const subtypeIconBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const subtypeAccentColor = useColorModeValue("brand.400", "brand.500");

  const visibleAccounts = showZeroBalance
    ? group.accounts
    : group.accounts.filter((a) => a.net_balance !== 0);

  if (!showZeroBalance && visibleAccounts.length === 0) return null;

  return (
    <Box key={sectionKey} mb={2}>
      {/* Subtype header */}
      <Flex
        align="center"
        justify="space-between"
        py={2.5}
        px={3}
        bg={subtypeHeaderBg}
        borderRadius="lg"
        cursor="pointer"
        onClick={() => onToggleExpand(sectionKey)}
        _hover={{ bg: subtypeHeaderHoverBg }}
        transition="background 0.15s ease"
      >
        <Flex align="center" gap={2.5} flex={1} minW={0}>
          <Flex
            w={7}
            h={7}
            borderRadius="md"
            bg={subtypeIconBg}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={SubtypeIcon} boxSize={3.5} color={subtypeAccentColor} />
          </Flex>
          <Text
            fontWeight="semibold"
            fontSize="sm"
            color={groupColor}
            isTruncated
          >
            {group.label}
          </Text>
          <Badge
            colorScheme="gray"
            variant="subtle"
            fontSize="2xs"
            borderRadius="full"
            px={1.5}
            fontWeight="medium"
          >
            {visibleAccounts.length}
          </Badge>
        </Flex>
        <Flex align="center" gap={2}>
          <HStack spacing={0} align="baseline">
            <Text fontWeight="semibold" color={balanceColor} fontSize="sm">
              {splitCurrencyForDisplay(group.totalBalance, currencySymbol || "").main}
            </Text>
            <Text fontSize="2xs" color={balanceColor} opacity={0.7}>
              {splitCurrencyForDisplay(group.totalBalance, currencySymbol || "").decimals}
            </Text>
          </HStack>
          <Icon
            as={isExpanded ? ChevronUp : ChevronDown}
            boxSize={4}
            color={columnHeaderColor}
          />
        </Flex>
      </Flex>

      {/* Accounts list */}
      {isExpanded && visibleAccounts.length > 0 && (
        <>
          {/* Desktop table view */}
          <Box display={{ base: "none", xl: "block" }} mt={1}>
            {visibleAccounts.map((account) => {
              const acctBalanceColor = getBalanceColor(account.net_balance || 0, type, false);
              return (
                <LedgerAccountRowDesktop
                  key={account.account_id}
                  account={account}
                  balanceColor={acctBalanceColor}
                  onAddTransaction={onAddTransaction}
                  onTransferFunds={onTransferFunds}
                  getOwnerInitials={getOwnerInitials}
                />
              );
            })}
          </Box>

          {/* Mobile card view */}
          <Box display={{ base: "block", xl: "none" }} mt={1}>
            {visibleAccounts.map((account) => {
              const acctBalanceColor = getBalanceColor(account.net_balance || 0, type, false);
              return (
                <LedgerAccountCardMobile
                  key={account.account_id}
                  account={account}
                  balanceColor={acctBalanceColor}
                  onAddTransaction={onAddTransaction}
                  onTransferFunds={onTransferFunds}
                  getOwnerInitials={getOwnerInitials}
                />
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
};

// -- Section-level component (Assets or Liabilities) --

interface LedgerAccountSectionProps {
  type: "asset" | "liability";
  title: string;
  icon: LucideIcon;
  groups: SubtypeGroup[];
  showZeroBalance: boolean;
  onToggleShowZeroBalance: () => void;
  expandedGroups: Record<string, boolean>;
  onToggleGroupExpansion: (key: string) => void;
  getBalanceColor: (balance: number, type: "asset" | "liability", isGroupHeader: boolean) => string;
  getOwnerInitials: (owner: string | null | undefined) => string;
  onAddTransaction: (accountId?: string, transaction?: any) => void;
  onTransferFunds: (accountId?: string, transaction?: any) => void;
  onCreateAccount: () => void;
}

/** Top-level section for Assets or Liabilities with header, toggle, and grouped accounts */
const LedgerAccountSection: React.FC<LedgerAccountSectionProps> = ({
  type,
  title,
  icon,
  groups,
  showZeroBalance,
  onToggleShowZeroBalance,
  expandedGroups,
  onToggleGroupExpansion,
  getBalanceColor,
  getOwnerInitials,
  onAddTransaction,
  onTransferFunds,
  onCreateAccount,
}) => {
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const groupColor = useColorModeValue("brand.600", "brand.200");
  const pillBorderColor = useColorModeValue("gray.300", "gray.600");
  const pillActiveBg = useColorModeValue("brand.50", "brand.900");
  const pillHoverBg = useColorModeValue("gray.50", "gray.800");
  const pillTextColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const sectionHoverShadow = useColorModeValue(
    "0 8px 24px -4px rgba(53,169,163,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)",
    "0 8px 24px -4px rgba(78,194,188,0.1), 0 4px 12px -2px rgba(0,0,0,0.2)"
  );

  return (
    <Box
      bg={cardBg}
      p={{ base: 3, md: 4 }}
      borderRadius="xl"
      border="1px solid"
      borderColor={sectionBorderColor}
      transition="box-shadow 0.25s ease"
      _hover={{ boxShadow: sectionHoverShadow }}
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        flexWrap={{ base: "wrap", sm: "nowrap" }}
      >
        <Flex align="center" gap={2}>
          <Icon as={icon} size={20} color={iconColor} />
          <Heading size="md" color={groupColor} letterSpacing="-0.02em">
            {title}
          </Heading>
        </Flex>
        <Flex align="center" gap={2}>
          <Flex
            as="button"
            onClick={onToggleShowZeroBalance}
            align="center"
            gap={1.5}
            px={3}
            py={1}
            borderRadius="full"
            border="1px solid"
            borderColor={showZeroBalance ? "brand.300" : pillBorderColor}
            bg={showZeroBalance ? pillActiveBg : "transparent"}
            color={showZeroBalance ? "brand.500" : pillTextColor}
            fontSize="xs"
            fontWeight="medium"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ borderColor: "brand.400", bg: pillHoverBg }}
          >
            <Icon as={showZeroBalance ? EyeOff : Eye} boxSize={3} />
            {showZeroBalance ? "Hide zeros" : "Show zeros"}
          </Flex>
          <IconButton
            icon={<Plus />}
            size="sm"
            colorScheme="brand"
            variant="ghost"
            aria-label={`Add ${title} Account`}
            onClick={onCreateAccount}
          />
        </Flex>
      </Flex>
      {groups.length === 0 ? (
        <EmptyState
          title={`No ${title} Accounts`}
          message={`You don't have any ${title.toLowerCase()} accounts yet.`}
          buttonText={`Create ${title} Account`}
          onClick={onCreateAccount}
        />
      ) : (
        <Box>
          {groups.map((group) => (
            <SubtypeGroupSection
              key={`${type}-${group.subtype}`}
              group={group}
              type={type}
              showZeroBalance={showZeroBalance}
              isExpanded={expandedGroups[`${type}-${group.subtype}`] === true}
              onToggleExpand={onToggleGroupExpansion}
              getBalanceColor={getBalanceColor}
              getOwnerInitials={getOwnerInitials}
              onAddTransaction={onAddTransaction}
              onTransferFunds={onTransferFunds}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

/** Empty state placeholder */
const EmptyState: React.FC<{
  title: string;
  message: string;
  buttonText: string;
  onClick: () => void;
}> = ({ title, message, buttonText, onClick }) => (
  <Box textAlign="center" py={8} px={4}>
    <Text fontSize="lg" fontWeight="semibold" mb={2} letterSpacing="-0.01em">
      {title}
    </Text>
    <Text color="secondaryTextColor" mb={5} fontSize="sm">
      {message}
    </Text>
    <IconButton
      icon={<Plus />}
      onClick={onClick}
      size="sm"
      colorScheme="brand"
      borderRadius="lg"
      aria-label={buttonText}
    />
  </Box>
);

export default LedgerAccountSection;
