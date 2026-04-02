import React, { useState, useMemo } from "react";
import {
  Flex,
  Box,
  Text,
  Icon,
  useDisclosure,
  SimpleGrid,
  HStack,
  Skeleton,
  useColorModeValue,
  Select,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  Building,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import CreateAccountModal from "@components/modals/CreateAccountModal";
import useLedgerStore from "@/components/shared/store";
import FinancialTooltip from "@/components/shared/FinancialTooltip";
import { splitCurrencyForDisplay } from "../../mutual-funds/utils";
import { ACCOUNT_SUBTYPES, getSubtypeLabel } from "../constants/accountSubtypes";
import LedgerAccountSection, { type SubtypeGroup } from "./LedgerAccountSection";

import type { Account } from "@/types";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

interface LedgerMainAccountsProps {
  accounts: Account[];
  isLoading: boolean;
  onAddTransaction: (accountId?: string, transaction?: any) => void;
  onTransferFunds: (accountId?: string, transaction?: any) => void;
}

const LedgerMainAccounts: React.FC<LedgerMainAccountsProps> = ({
  accounts,
  isLoading,
  onAddTransaction,
  onTransferFunds,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const [accountType, setAccountType] = useState<"asset" | "liability">("asset");
  const [showZeroBalanceAssets, setShowZeroBalanceAssets] = useState(false);
  const [showZeroBalanceLiabilities, setShowZeroBalanceLiabilities] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedOwner, setSelectedOwner] = useState<string>("all");

  // Get unique owners for the filter dropdown
  const owners = useMemo(() => {
    const ownerSet = new Set<string>();
    accounts.forEach((a) => {
      if (a.owner) ownerSet.add(a.owner);
    });
    return Array.from(ownerSet).sort();
  }, [accounts]);

  // Filter accounts by owner
  const filteredAccounts = useMemo(() => {
    if (selectedOwner === "all") return accounts;
    return accounts.filter((a) => a.owner === selectedOwner);
  }, [accounts, selectedOwner]);

  // Helper to get owner initials
  const getOwnerInitials = (owner: string | null | undefined): string => {
    if (!owner) return "";
    return owner.split(" ").map((word) => word.charAt(0).toUpperCase()).join("");
  };

  // Separate into assets and liabilities
  const assetAccounts = filteredAccounts.filter((a) => a.type === "asset");
  const liabilityAccounts = filteredAccounts.filter((a) => a.type === "liability");

  // Group accounts by subtype
  const groupBySubtype = (accts: Account[]): SubtypeGroup[] => {
    const groups: Record<string, Account[]> = {};
    accts.forEach((a) => {
      const key = a.subtype || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });

    return Object.entries(groups)
      .map(([subtype, groupAccounts]) => ({
        subtype,
        label: getSubtypeLabel(subtype),
        accounts: groupAccounts.sort((a, b) => a.name.localeCompare(b.name)),
        totalBalance: groupAccounts.reduce((sum, a) => sum + (a.net_balance || 0), 0),
        order: ACCOUNT_SUBTYPES[subtype]?.order ?? 99,
      }))
      .sort((a, b) => a.order - b.order);
  };

  const assetGroups = groupBySubtype(assetAccounts);
  const liabilityGroups = groupBySubtype(liabilityAccounts);

  const toggleGroupExpansion = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Colors
  const positiveColor = useColorModeValue("green.500", "green.300");
  const negativeColor = useColorModeValue("red.500", "red.300");
  const groupPositiveColor = useColorModeValue("green.400", "green.400");
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");

  // Summary card accent colors
  const assetAccentColor = useColorModeValue("teal.400", "teal.300");
  const liabilityAccentColor = useColorModeValue("orange.400", "orange.300");
  const netWorthPositiveAccentColor = useColorModeValue("green.400", "green.300");
  const netWorthNegativeAccentColor = useColorModeValue("red.400", "red.300");

  const getBalanceColor = (
    balance: number,
    type: "asset" | "liability",
    isGroupHeader: boolean
  ) => {
    if (type === "asset") {
      return balance >= 0 ? (isGroupHeader ? groupPositiveColor : positiveColor) : negativeColor;
    }
    return balance <= 0 ? (isGroupHeader ? groupPositiveColor : positiveColor) : negativeColor;
  };

  // Summary totals
  const totalAssets = assetAccounts.reduce((sum, a) => sum + (a.net_balance || 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + (a.net_balance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const handleCreateAccountClick = (type: "asset" | "liability") => {
    setAccountType(type);
    onOpen();
  };

  if (isLoading) {
    return (
      <Box p={{ base: 2, md: 4 }}>
        {/* Summary cards skeleton */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 4 }} mb={{ base: 4, md: 6 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height="90px" borderRadius="xl" />
          ))}
        </SimpleGrid>
        {/* Account sections skeleton */}
        <SimpleGrid columns={{ base: 1, md: 1, lg: 2 }} spacing={{ base: 4, md: 6 }}>
          {[0, 1].map((i) => (
            <Box key={i}>
              <Skeleton height="48px" borderRadius="lg" mb={2} />
              <Skeleton height="48px" borderRadius="lg" mb={2} />
              <Skeleton height="48px" borderRadius="lg" />
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  const summaryCards = [
    {
      icon: Building,
      label: "Assets",
      tooltipTerm: "total_assets" as const,
      value: totalAssets,
      accentColor: assetAccentColor,
      colorFn: () => (totalAssets >= 0 ? positiveColor : negativeColor),
    },
    {
      icon: ShieldAlert,
      label: "Liabilities",
      tooltipTerm: "total_liabilities" as const,
      value: totalLiabilities,
      accentColor: liabilityAccentColor,
      colorFn: () => getBalanceColor(totalLiabilities, "liability", false),
    },
    {
      icon: TrendingUp,
      label: "Net Worth",
      tooltipTerm: "net_worth" as const,
      value: netWorth,
      accentColor: netWorth >= 0 ? netWorthPositiveAccentColor : netWorthNegativeAccentColor,
      colorFn: () => (netWorth >= 0 ? positiveColor : negativeColor),
    },
  ];

  return (
    <Box p={{ base: 2, md: 4 }}>
      {/* Owner filter */}
      {owners.length > 0 && (
        <Flex mb={4} justify="flex-end">
          <Select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            size="sm"
            maxW={{ base: "100%", md: "200px" }}
            borderRadius="lg"
          >
            <option value="all">All Owners</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </Select>
        </Flex>
      )}

      {/* Summary bar */}
      <MotionSimpleGrid
        columns={{ base: 1, md: 3 }}
        spacing={{ base: 3, md: 4 }}
        mb={{ base: 4, md: 6 }}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {summaryCards.map(({ icon, label, tooltipTerm, value, accentColor, colorFn }) => (
          <MotionBox
            key={label}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
            }}
          >
            <Box
              bg={cardBg}
              p={{ base: 3, md: 4 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={sectionBorderColor}
              overflow="hidden"
              position="relative"
              transition="border-color 0.2s ease"
              _hover={{ borderColor: accentColor }}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="2px"
                bg={accentColor}
                opacity={0.7}
              />
              <Flex align="center" gap={1.5} mb={2}>
                <Flex
                  w={5}
                  h={5}
                  borderRadius="md"
                  bg={accentColor}
                  opacity={0.12}
                  position="absolute"
                />
                <Flex w={5} h={5} borderRadius="md" align="center" justify="center">
                  <Icon as={icon} boxSize={3} color={accentColor} />
                </Flex>
                <Text
                  fontSize="2xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color={columnHeaderColor}
                >
                  {label}
                  <FinancialTooltip term={tooltipTerm} />
                </Text>
              </Flex>
              <HStack spacing={0} align="baseline">
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  fontWeight="bold"
                  color={colorFn()}
                  lineHeight="short"
                  letterSpacing="-0.01em"
                >
                  {splitCurrencyForDisplay(value, currencySymbol || "").main}
                </Text>
                <Text fontSize="xs" color={colorFn()} opacity={0.6}>
                  {splitCurrencyForDisplay(value, currencySymbol || "").decimals}
                </Text>
              </HStack>
            </Box>
          </MotionBox>
        ))}
      </MotionSimpleGrid>

      {/* Assets & Liabilities detail */}
      <SimpleGrid columns={{ base: 1, md: 1, lg: 2 }} spacing={{ base: 4, md: 6 }}>
        <MotionBox
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          <LedgerAccountSection
            type="asset"
            title="Assets"
            icon={Building}
            groups={assetGroups}
            showZeroBalance={showZeroBalanceAssets}
            onToggleShowZeroBalance={() => setShowZeroBalanceAssets(!showZeroBalanceAssets)}
            expandedGroups={expandedGroups}
            onToggleGroupExpansion={toggleGroupExpansion}
            getBalanceColor={getBalanceColor}
            getOwnerInitials={getOwnerInitials}
            onAddTransaction={onAddTransaction}
            onTransferFunds={onTransferFunds}
            onCreateAccount={() => handleCreateAccountClick("asset")}
          />
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        >
          <LedgerAccountSection
            type="liability"
            title="Liabilities"
            icon={ShieldAlert}
            groups={liabilityGroups}
            showZeroBalance={showZeroBalanceLiabilities}
            onToggleShowZeroBalance={() => setShowZeroBalanceLiabilities(!showZeroBalanceLiabilities)}
            expandedGroups={expandedGroups}
            onToggleGroupExpansion={toggleGroupExpansion}
            getBalanceColor={getBalanceColor}
            getOwnerInitials={getOwnerInitials}
            onAddTransaction={onAddTransaction}
            onTransferFunds={onTransferFunds}
            onCreateAccount={() => handleCreateAccountClick("liability")}
          />
        </MotionBox>
      </SimpleGrid>

      <CreateAccountModal
        isOpen={isOpen}
        onClose={onClose}
        accountType={accountType}
      />
    </Box>
  );
};

export default LedgerMainAccounts;
