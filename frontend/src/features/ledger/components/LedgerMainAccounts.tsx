import React, { useState, useMemo } from "react";
import {
  Flex,
  Box,
  Text,
  Icon,
  useDisclosure,
  SimpleGrid,
  Link as ChakraLink,
  IconButton,
  Heading,
  HStack,
  Stack,
  Card,
  CardHeader,
  Spinner,
  useColorModeValue,
  Badge,
  Select,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import {
  Plus,
  Repeat,
  Eye,
  EyeOff,
  Building,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import CreateAccountModal from "@components/modals/CreateAccountModal";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../mutual-funds/utils";
import { ACCOUNT_SUBTYPES, getSubtypeLabel, getSubtypeIcon } from "../constants/accountSubtypes";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

interface Account {
  account_id: string;
  name: string;
  type: "asset" | "liability";
  subtype: string;
  owner?: string;
  net_balance?: number;
}

interface LedgerMainAccountsProps {
  accounts: Account[];
  isLoading: boolean;
  // eslint-disable-next-line no-unused-vars
  onAddTransaction: (accountId?: string, transaction?: any) => void;
  // eslint-disable-next-line no-unused-vars
  onTransferFunds: (accountId?: string, transaction?: any) => void;
}

interface SubtypeGroup {
  subtype: string;
  label: string;
  accounts: Account[];
  totalBalance: number;
  order: number;
}

const LedgerMainAccounts: React.FC<LedgerMainAccountsProps> = ({
  accounts,
  isLoading,
  onAddTransaction,
  onTransferFunds,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currencySymbol } = useLedgerStore();
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

  const iconColor = useColorModeValue("brand.500", "brand.300");
  const hoverIconColor = useColorModeValue("brand.600", "brand.400");
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const groupColor = useColorModeValue("brand.600", "brand.200");
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const sectionHoverShadow = useColorModeValue(
    "0 8px 24px -4px rgba(53,169,163,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)",
    "0 8px 24px -4px rgba(78,194,188,0.1), 0 4px 12px -2px rgba(0,0,0,0.2)"
  );
  const subtypeHeaderBg = useColorModeValue("gray.50", "gray.750");
  const subtypeHeaderHoverBg = useColorModeValue("gray.100", "gray.700");
  const subtypeIconBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const subtypeAccentColor = useColorModeValue("brand.400", "brand.500");
  const accountHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const accountCardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const accountCardBorder = useColorModeValue("gray.200", "gray.600");
  const pillBorderColor = useColorModeValue("gray.300", "gray.600");
  const pillActiveBg = useColorModeValue("brand.50", "brand.900");
  const pillHoverBg = useColorModeValue("gray.50", "gray.800");
  const pillTextColor = useColorModeValue("gray.600", "gray.400");

  // Summary card accent colors
  const assetAccentColor = useColorModeValue("teal.400", "teal.300");
  const liabilityAccentColor = useColorModeValue("orange.400", "orange.300");
  const netWorthPositiveAccentColor = useColorModeValue("green.400", "green.300");
  const netWorthNegativeAccentColor = useColorModeValue("red.400", "red.300");

  // Summary totals
  const totalAssets = assetAccounts.reduce((sum, a) => sum + (a.net_balance || 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + (a.net_balance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const handleCreateAccountClick = (type: "asset" | "liability") => {
    setAccountType(type);
    onOpen();
  };

  // Render a subtype group section
  const renderSubtypeGroup = (
    group: SubtypeGroup,
    type: "asset" | "liability",
    showZeroBalance: boolean
  ) => {
    const SubtypeIcon = getSubtypeIcon(group.subtype);
    const sectionKey = `${type}-${group.subtype}`;
    const isExpanded = expandedGroups[sectionKey] === true; // default collapsed
    const balanceColor = getBalanceColor(group.totalBalance, type, true);

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
          onClick={() => toggleGroupExpansion(sectionKey)}
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
                const balance = account.net_balance || 0;
                const acctBalanceColor = getBalanceColor(balance, type, false);
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
                    <HStack spacing={1.5} flex={1} minW={0}>
                      <ChakraLink
                        as={RouterLink}
                        to={`/account/${account.account_id}`}
                        _hover={{ textDecoration: "none" }}
                      >
                        <Text
                          fontSize="sm"
                          color={tertiaryTextColor}
                          _hover={{ color: "brand.500" }}
                          transition="color 0.15s ease"
                          isTruncated
                        >
                          {account.name}
                        </Text>
                      </ChakraLink>
                      {getOwnerInitials(account.owner) && (
                        <Text as="span" fontSize="xs" color="gray.500">
                          [{getOwnerInitials(account.owner)}]
                        </Text>
                      )}
                    </HStack>
                    <Flex align="center" gap={3}>
                      <HStack spacing={0} align="baseline">
                        <Text fontWeight="semibold" color={acctBalanceColor} fontSize="sm">
                          {splitCurrencyForDisplay(balance, currencySymbol || "").main}
                        </Text>
                        <Text fontSize="2xs" color={acctBalanceColor} opacity={0.7}>
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
                            as={Plus}
                            size={14}
                            color={iconColor}
                            _hover={{ color: hoverIconColor }}
                            transition="color 0.15s ease"
                          />
                        </ChakraLink>
                        <ChakraLink
                          onClick={() => onTransferFunds(account.account_id)}
                          _hover={{ textDecoration: "none" }}
                        >
                          <Icon
                            as={Repeat}
                            size={14}
                            color={iconColor}
                            _hover={{ color: hoverIconColor }}
                            transition="color 0.15s ease"
                          />
                        </ChakraLink>
                      </Flex>
                    </Flex>
                  </Flex>
                );
              })}
            </Box>

            {/* Mobile card view */}
            <Stack spacing={2} display={{ base: "block", xl: "none" }} mt={2} pl={2}>
              {visibleAccounts.map((account) => {
                const balance = account.net_balance || 0;
                const acctBalanceColor = getBalanceColor(balance, type, false);
                return (
                  <Card
                    key={account.account_id}
                    variant="outline"
                    bg={accountCardBg}
                    borderColor={accountCardBorder}
                    size="sm"
                    boxShadow="sm"
                  >
                    <CardHeader py={2} px={3}>
                      <Flex justifyContent="space-between" alignItems="center">
                        <HStack spacing={1.5} flex={1} minW={0}>
                          <ChakraLink
                            as={RouterLink}
                            to={`/account/${account.account_id}`}
                            _hover={{ textDecoration: "none" }}
                          >
                            <Text
                              color={tertiaryTextColor}
                              fontSize="sm"
                              isTruncated
                            >
                              {account.name}
                            </Text>
                          </ChakraLink>
                          {getOwnerInitials(account.owner) && (
                            <Text as="span" fontSize="xs" color="gray.500">
                              [{getOwnerInitials(account.owner)}]
                            </Text>
                          )}
                        </HStack>
                        <Flex align="center" gap={2}>
                          <HStack spacing={0} align="baseline">
                            <Text fontWeight="semibold" color={acctBalanceColor} fontSize="sm">
                              {splitCurrencyForDisplay(balance, currencySymbol || "").main}
                            </Text>
                            <Text fontSize="2xs" color={acctBalanceColor} opacity={0.7}>
                              {splitCurrencyForDisplay(balance, currencySymbol || "").decimals}
                            </Text>
                          </HStack>
                          <Flex gap={1}>
                            <IconButton
                              icon={<Plus size={14} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="brand"
                              aria-label="Add transaction"
                              onClick={() => onAddTransaction(account.account_id, undefined)}
                            />
                            <IconButton
                              icon={<Repeat size={14} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="brand"
                              aria-label="Transfer funds"
                              onClick={() => onTransferFunds(account.account_id)}
                            />
                          </Flex>
                        </Flex>
                      </Flex>
                    </CardHeader>
                  </Card>
                );
              })}
            </Stack>
          </>
        )}
      </Box>
    );
  };

  // Empty state component
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

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  const summaryCards = [
    {
      icon: Building,
      label: "Assets",
      value: totalAssets,
      accentColor: assetAccentColor,
      colorFn: () => (totalAssets >= 0 ? positiveColor : negativeColor),
    },
    {
      icon: ShieldAlert,
      label: "Liabilities",
      value: totalLiabilities,
      accentColor: liabilityAccentColor,
      colorFn: () => getBalanceColor(totalLiabilities, "liability", false),
    },
    {
      icon: TrendingUp,
      label: "Net Worth",
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
        {summaryCards.map(({ icon, label, value, accentColor, colorFn }) => (
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
        {/* Assets Section */}
        <MotionBox
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
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
                <Icon as={Building} size={20} color={iconColor} />
                <Heading size="md" color={groupColor} letterSpacing="-0.02em">
                  Assets
                </Heading>
              </Flex>
              <Flex align="center" gap={2}>
                <Flex
                  as="button"
                  onClick={() => setShowZeroBalanceAssets(!showZeroBalanceAssets)}
                  align="center"
                  gap={1.5}
                  px={3}
                  py={1}
                  borderRadius="full"
                  border="1px solid"
                  borderColor={showZeroBalanceAssets ? "brand.300" : pillBorderColor}
                  bg={showZeroBalanceAssets ? pillActiveBg : "transparent"}
                  color={showZeroBalanceAssets ? "brand.500" : pillTextColor}
                  fontSize="xs"
                  fontWeight="medium"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ borderColor: "brand.400", bg: pillHoverBg }}
                >
                  <Icon as={showZeroBalanceAssets ? EyeOff : Eye} boxSize={3} />
                  {showZeroBalanceAssets ? "Hide zeros" : "Show zeros"}
                </Flex>
                <IconButton
                  icon={<Plus />}
                  size="sm"
                  colorScheme="brand"
                  variant="ghost"
                  aria-label="Add Asset Account"
                  onClick={() => handleCreateAccountClick("asset")}
                />
              </Flex>
            </Flex>
            {assetGroups.length === 0 ? (
              <EmptyState
                title="No Asset Accounts"
                message="You don't have any asset accounts yet."
                buttonText="Create Asset Account"
                onClick={() => handleCreateAccountClick("asset")}
              />
            ) : (
              <Box>
                {assetGroups.map((group) =>
                  renderSubtypeGroup(group, "asset", showZeroBalanceAssets)
                )}
              </Box>
            )}
          </Box>
        </MotionBox>

        {/* Liabilities Section */}
        <MotionBox
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        >
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
                <Icon as={ShieldAlert} size={20} color={iconColor} />
                <Heading size="md" color={groupColor} letterSpacing="-0.02em">
                  Liabilities
                </Heading>
              </Flex>
              <Flex align="center" gap={2}>
                <Flex
                  as="button"
                  onClick={() => setShowZeroBalanceLiabilities(!showZeroBalanceLiabilities)}
                  align="center"
                  gap={1.5}
                  px={3}
                  py={1}
                  borderRadius="full"
                  border="1px solid"
                  borderColor={showZeroBalanceLiabilities ? "brand.300" : pillBorderColor}
                  bg={showZeroBalanceLiabilities ? pillActiveBg : "transparent"}
                  color={showZeroBalanceLiabilities ? "brand.500" : pillTextColor}
                  fontSize="xs"
                  fontWeight="medium"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ borderColor: "brand.400", bg: pillHoverBg }}
                >
                  <Icon as={showZeroBalanceLiabilities ? EyeOff : Eye} boxSize={3} />
                  {showZeroBalanceLiabilities ? "Hide zeros" : "Show zeros"}
                </Flex>
                <IconButton
                  icon={<Plus />}
                  size="sm"
                  colorScheme="brand"
                  variant="ghost"
                  aria-label="Add Liability Account"
                  onClick={() => handleCreateAccountClick("liability")}
                />
              </Flex>
            </Flex>
            {liabilityGroups.length === 0 ? (
              <EmptyState
                title="No Liability Accounts"
                message="You don't have any liability accounts yet."
                buttonText="Create Liability Account"
                onClick={() => handleCreateAccountClick("liability")}
              />
            ) : (
              <Box>
                {liabilityGroups.map((group) =>
                  renderSubtypeGroup(group, "liability", showZeroBalanceLiabilities)
                )}
              </Box>
            )}
          </Box>
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
