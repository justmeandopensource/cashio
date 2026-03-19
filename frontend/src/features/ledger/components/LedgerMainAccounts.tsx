import React, { useState } from "react";
import {
  Flex,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  Icon,
  useDisclosure,
  SimpleGrid,
  Link as ChakraLink,
  IconButton,
  Heading,
  HStack,
  Card,
  CardHeader,
  Stack,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import { Plus, Repeat, Eye, EyeOff, Building, ShieldAlert, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import CreateAccountModal from "@components/modals/CreateAccountModal";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../mutual-funds/utils";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

interface Account {
  account_id: string;
  name: string;
  type: "asset" | "liability";
  net_balance?: number;
  is_group: boolean;
  parent_account_id?: string;
}

interface LedgerMainAccountsProps {
  accounts: Account[];
  isLoading: boolean;
  // eslint-disable-next-line no-unused-vars
  onAddTransaction: (accountId?: string, transaction?: any) => void;
  // eslint-disable-next-line no-unused-vars
  onTransferFunds: (accountId?: string, transaction?: any) => void;
}

const LedgerMainAccounts: React.FC<LedgerMainAccountsProps> = ({
  accounts,
  isLoading,
  onAddTransaction,
  onTransferFunds,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currencySymbol } = useLedgerStore();
  const [accountType, setAccountType] = useState<"asset" | "liability" | null>(
    null
  );
  const [parentAccountId, setParentAccountId] = useState<string | null>(null);
  const [showZeroBalanceAssets, setShowZeroBalanceAssets] = useState(false);
  const [showZeroBalanceLiabilities, setShowZeroBalanceLiabilities] =
    useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({});

  // Separate accounts into Assets and Liabilities
  const assetAccounts = accounts.filter((account) => account.type === "asset");
  const liabilityAccounts = accounts.filter(
    (account) => account.type === "liability"
  );

  // Toggle expansion of group accounts
  const toggleGroupExpansion = (accountId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedGroups((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  // Color variables for balance display
  const positiveColor = useColorModeValue("green.500", "green.300");
  const negativeColor = useColorModeValue("red.500", "red.300");
  const groupPositiveColor = useColorModeValue("green.400", "green.400");

  // Helper function to determine text color based on account type, balance, and whether it's a group account
  const getBalanceColor = (
    balance: number,
    accountType: "asset" | "liability",
    isGroup: boolean
  ) => {
    if (accountType === "asset") {
      if (balance >= 0) {
        return isGroup ? groupPositiveColor : positiveColor;
      } else {
        return negativeColor;
      }
    } else if (accountType === "liability") {
      if (balance <= 0) {
        return isGroup ? groupPositiveColor : positiveColor;
      } else {
        return negativeColor;
      }
    }
    return "secondaryTextColor";
  };

  // Function to compute the balance for group accounts
  const computeGroupBalance = (accountId: string): number => {
    let totalBalance = 0;

    const childAccounts = accounts.filter(
      (account) => account.parent_account_id === accountId
    );

    childAccounts.forEach((childAccount) => {
      if (childAccount.is_group) {
        totalBalance += computeGroupBalance(childAccount.account_id);
      } else {
        totalBalance += childAccount.net_balance || 0;
      }
    });

    return totalBalance;
  };

  // Open modal for creating a new account
  const handleCreateAccountClick = (
    type: "asset" | "liability",
    parentId: string | null = null
  ) => {
    setAccountType(type);
    setParentAccountId(parentId);
    onOpen();
  };

  const groupBg = useColorModeValue("teal.50", "teal.900");
  const hoverBg = useColorModeValue("secondaryBg", "secondaryBg");
  const groupColor = useColorModeValue("brand.600", "brand.200");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const hoverIconColor = useColorModeValue("brand.600", "brand.400");
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const cardBorderColor = useColorModeValue("gray.200", "gray.600");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const groupCardBg = useColorModeValue("teal.50", "teal.900");
  const groupTextColor = useColorModeValue("brand.700", "brand.200");
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const pillBorderColor = useColorModeValue("gray.300", "gray.600");
  const pillActiveBg = useColorModeValue("brand.50", "brand.900");
  const pillHoverBg = useColorModeValue("gray.50", "gray.800");
  const pillTextColor = useColorModeValue("gray.600", "gray.400");
  const groupAccentColor = useColorModeValue("brand.400", "brand.500");
  const guideLineColor = useColorModeValue("brand.100", "whiteAlpha.200");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const sectionHoverShadow = useColorModeValue(
    "0 8px 24px -4px rgba(53,169,163,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)",
    "0 8px 24px -4px rgba(78,194,188,0.1), 0 4px 12px -2px rgba(0,0,0,0.2)"
  );

  // Summary card accent colors
  const assetAccentColor = useColorModeValue("teal.400", "teal.300");
  const liabilityAccentColor = useColorModeValue("orange.400", "orange.300");
  const netWorthPositiveAccentColor = useColorModeValue("green.400", "green.300");
  const netWorthNegativeAccentColor = useColorModeValue("red.400", "red.300");

  // Summary totals — root-level accounts only (groups aggregate their children)
  const totalAssets = assetAccounts
    .filter((a) => !a.parent_account_id)
    .reduce(
      (sum, a) =>
        sum + (a.is_group ? computeGroupBalance(a.account_id) : a.net_balance || 0),
      0
    );
  const totalLiabilities = liabilityAccounts
    .filter((a) => !a.parent_account_id)
    .reduce(
      (sum, a) =>
        sum + (a.is_group ? computeGroupBalance(a.account_id) : a.net_balance || 0),
      0
    );
  const netWorth = totalAssets - totalLiabilities;

  // Function to render accounts in table format (for larger screens)
  const renderAccountsTable = (
    accounts: Account[],
    parentId: string | null = null,
    level: number = 0,
    showZeroBalance: boolean
  ) => {
    return accounts
      .filter((account) => account.parent_account_id === parentId)
      .filter(
        (account) =>
          showZeroBalance ||
          (account.is_group
            ? computeGroupBalance(account.account_id) !== 0
            : account.net_balance !== 0)
      )
      .map((account) => {
        const balance = account.is_group
          ? computeGroupBalance(account.account_id)
          : account.net_balance || 0;
        const balanceColor = getBalanceColor(
          balance,
          account.type,
          account.is_group
        );

        const trSx = {
          "&:hover .action-icons": {
            opacity: !account.is_group ? 1 : 0,
          },
        };

        return (
          <React.Fragment key={account.account_id}>
            <Tr
              bg={account.is_group ? groupBg : "transparent"}
              _hover={{ bg: hoverBg }}
              position="relative"
              sx={trSx}
              transition="background 0.15s ease"
            >
              <Td pl={`${level * 24 + 8}px`} position="relative">
                {account.is_group && (
                  <Box
                    position="absolute"
                    left={0}
                    top={0}
                    bottom={0}
                    width="3px"
                    bg={groupAccentColor}
                    borderRadius="0 2px 2px 0"
                  />
                )}
                {!account.is_group && level > 0 && (
                  <Box
                    position="absolute"
                    left={`${(level - 1) * 24 + 20}px`}
                    top={0}
                    bottom={0}
                    width="1px"
                    bg={guideLineColor}
                  />
                )}
                {!account.is_group ? (
                  <ChakraLink
                    as={RouterLink}
                    to={`/account/${account.account_id}`}
                    _hover={{ textDecoration: "none" }}
                  >
                    <Text
                      fontWeight="normal"
                      color={tertiaryTextColor}
                      fontSize="sm"
                      _hover={{ color: "brand.500" }}
                      transition="color 0.15s ease"
                    >
                      {account.name}
                    </Text>
                  </ChakraLink>
                ) : (
                  <Text fontWeight="bold" color={groupColor} fontSize="md">
                    {account.name}
                  </Text>
                )}
              </Td>
               <Td isNumeric>
                 <HStack spacing={0} align="baseline" justify="flex-end">
                   <Text
                     fontWeight="semibold"
                     color={balanceColor}
                     fontSize="md"
                   >
                     {splitCurrencyForDisplay(balance, currencySymbol || "₹").main}
                   </Text>
                   <Text
                     fontSize="xs"
                     color={balanceColor}
                     opacity={0.7}
                   >
                     {splitCurrencyForDisplay(balance, currencySymbol || "₹").decimals}
                   </Text>
                 </HStack>
               </Td>
              <Td>
                <Box display="flex" gap={2}>
                  {account.is_group && (
                    <ChakraLink
                      onClick={() =>
                        handleCreateAccountClick(
                          account.type,
                          account.account_id
                        )
                      }
                      _hover={{ textDecoration: "none" }}
                      data-testid={`ledgermainaccounts-group-account-plus-icon-${account.account_id}`}
                    >
                      <Icon
                        as={Plus}
                        size={16}
                        color={iconColor}
                        _hover={{ color: hoverIconColor }}
                        transition="color 0.15s ease"
                      />
                    </ChakraLink>
                  )}
                  {!account.is_group && (
                    <Flex
                      gap={2}
                      opacity={0.3}
                      transition="opacity 0.2s"
                      className="action-icons"
                    >
                      <ChakraLink
                        onClick={() => onAddTransaction(account.account_id, undefined)}
                        _hover={{ textDecoration: "none" }}
                      >
                        <Icon
                          as={Plus}
                          size={16}
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
                          size={16}
                          color={iconColor}
                          _hover={{ color: hoverIconColor }}
                          transition="color 0.15s ease"
                        />
                      </ChakraLink>
                    </Flex>
                  )}
                </Box>
              </Td>
            </Tr>
            {renderAccountsTable(
              accounts,
              account.account_id,
              level + 1,
              showZeroBalance
            )}
          </React.Fragment>
        );
      });
  };

  // Function to render accounts in card format (for mobile/tablet)
  const renderAccountsAccordion = (
    accounts: Account[],
    parentId: string | null = null,
    level: number = 0,
    showZeroBalance: boolean
  ) => {
    const filteredAccounts = accounts
      .filter((account) => account.parent_account_id === parentId)
      .filter(
        (account) =>
          showZeroBalance ||
          (account.is_group
            ? computeGroupBalance(account.account_id) !== 0
            : account.net_balance !== 0)
      );

    if (filteredAccounts.length === 0) return null;

    return (
      <Stack
        spacing={3}
        pl={level > 0 ? 4 : 0}
        mt={level > 0 ? 3 : 0}
        mb={level > 0 ? 3 : 0}
      >
        {filteredAccounts.map((account) => {
          const balance = account.is_group
            ? computeGroupBalance(account.account_id)
            : account.net_balance || 0;
          const balanceColor = getBalanceColor(
            balance,
            account.type,
            account.is_group
          );
          const hasChildren = accounts.some(
            (a) => a.parent_account_id === account.account_id
          );
          const isExpanded = expandedGroups[account.account_id];

          return (
            <Card
              key={account.account_id}
              variant="outline"
              bg={account.is_group ? groupCardBg : cardBg}
              borderColor={cardBorderColor}
              borderLeftWidth={account.is_group ? "3px" : "1px"}
              borderLeftColor={account.is_group ? groupAccentColor : cardBorderColor}
              size="sm"
              boxShadow="sm"
              _hover={{ boxShadow: "md" }}
              transition="box-shadow 0.2s ease"
            >
              <CardHeader
                py={2}
                px={3}
                onClick={
                  account.is_group && hasChildren
                    ? (e) => toggleGroupExpansion(account.account_id, e)
                    : undefined
                }
                cursor={account.is_group && hasChildren ? "pointer" : "default"}
              >
                <Flex justifyContent="space-between" alignItems="flex-start">
                  <Flex direction="column" flex="1">
                    <Flex alignItems="center" gap={2} mb={1}>
                      {!account.is_group ? (
                        <ChakraLink
                          as={RouterLink}
                          to={`/account/${account.account_id}`}
                          _hover={{ textDecoration: "none" }}
                        >
                          <Text
                            fontWeight={account.is_group ? "medium" : "normal"}
                            color={account.is_group ? groupTextColor : tertiaryTextColor}
                          >
                            {account.name}
                          </Text>
                        </ChakraLink>
                      ) : (
                        <Text fontWeight="medium" color={groupTextColor}>
                          {account.name}
                        </Text>
                      )}
                    </Flex>
                     <HStack spacing={0} align="baseline">
                       <Text
                         fontWeight="semibold"
                         color={balanceColor}
                       >
                         {splitCurrencyForDisplay(balance, currencySymbol || "₹").main}
                       </Text>
                       <Text
                         fontSize="xs"
                         color={balanceColor}
                         opacity={0.7}
                       >
                         {splitCurrencyForDisplay(balance, currencySymbol || "₹").decimals}
                       </Text>
                     </HStack>
                  </Flex>
                  {!account.is_group ? (
                    <Flex gap={1} align="center" justify="flex-end">
                      <IconButton
                        icon={<Plus size={14} />}
                        size="xs"
                        variant="ghost"
                        colorScheme="brand"
                        aria-label="Add transaction"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddTransaction(account.account_id, undefined);
                        }}
                      />
                      <IconButton
                        icon={<Repeat size={14} />}
                        size="xs"
                        variant="ghost"
                        colorScheme="brand"
                        aria-label="Transfer funds"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransferFunds(account.account_id);
                        }}
                      />
                    </Flex>
                  ) : (
                    <Flex gap={1} align="center">
                      <IconButton
                        icon={<Plus size={14} />}
                        size="xs"
                        variant="ghost"
                        colorScheme="brand"
                        aria-label="Add sub-account"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateAccountClick(
                            account.type,
                            account.account_id
                          );
                        }}
                      />
                      {hasChildren && (
                        <Icon
                          as={isExpanded ? ChevronUp : ChevronDown}
                          size={16}
                          color={iconColor}
                        />
                      )}
                    </Flex>
                  )}
                </Flex>
              </CardHeader>
              {account.is_group && hasChildren && isExpanded && (
                <Box px={3} pb={3}>
                  {renderAccountsAccordion(
                    accounts,
                    account.account_id,
                    level + 1,
                    showZeroBalance
                  )}
                </Box>
              )}
            </Card>
          );
        })}
      </Stack>
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
      <Button
        leftIcon={<Plus />}
        onClick={onClick}
        size="sm"
        colorScheme="brand"
        borderRadius="lg"
        fontWeight="bold"
      >
        {buttonText}
      </Button>
    </Box>
  );

  // Loading state component
  const LoadingState: React.FC = () => (
    <Box textAlign="center" py={10}>
      <Spinner size="xl" color="brand.500" />
    </Box>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  const summaryCards = [
    {
      icon: Building,
      label: "Assets",
      value: totalAssets,
      accentColor: assetAccentColor,
      colorFn: () => totalAssets >= 0 ? positiveColor : negativeColor,
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
      colorFn: () => netWorth >= 0 ? positiveColor : negativeColor,
    },
  ];

  return (
    <Box p={{ base: 2, md: 4 }}>
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
              {/* Accent line at top */}
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
                <Flex
                  w={5}
                  h={5}
                  borderRadius="md"
                  align="center"
                  justify="center"
                >
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
                  {splitCurrencyForDisplay(value, currencySymbol || "₹").main}
                </Text>
                <Text
                  fontSize="xs"
                  color={colorFn()}
                  opacity={0.6}
                >
                  {splitCurrencyForDisplay(value, currencySymbol || "₹").decimals}
                </Text>
              </HStack>
            </Box>
          </MotionBox>
        ))}
      </MotionSimpleGrid>

      {/* Assets & Liabilities detail */}
      <SimpleGrid
        columns={{ base: 1, md: 1, lg: 2 }}
        spacing={{ base: 4, md: 6 }}
      >
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
                <Heading size="md" color={groupColor} mb={{ base: 1, sm: 0 }} letterSpacing="-0.02em">
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
                  data-testid="ledgermainaccounts-add-asset-account-plus-icon"
                  onClick={() => handleCreateAccountClick("asset")}
                />
              </Flex>
            </Flex>
            {assetAccounts.length === 0 ? (
              <EmptyState
                title="No Asset Accounts"
                message="You don't have any asset accounts yet."
                buttonText="Create Asset Account"
                onClick={() => handleCreateAccountClick("asset")}
              />
            ) : (
              <>
                <Box display={{ base: "none", xl: "block" }}>
                  <Table
                    variant="simple"
                    size="sm"
                    data-testid="ledgermainaccounts-asset-accounts-table"
                  >
                    <Thead>
                      <Tr>
                        <Th
                          color={columnHeaderColor}
                          fontSize="2xs"
                          fontWeight="semibold"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          pb={2}
                          borderBottomColor={sectionBorderColor}
                        >
                          Account
                        </Th>
                        <Th
                          color={columnHeaderColor}
                          fontSize="2xs"
                          fontWeight="semibold"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          pb={2}
                          isNumeric
                          borderBottomColor={sectionBorderColor}
                        >
                          Balance
                        </Th>
                        <Th pb={2} borderBottomColor={sectionBorderColor} />
                      </Tr>
                    </Thead>
                    <Tbody>
                      {renderAccountsTable(
                        assetAccounts,
                        null,
                        0,
                        showZeroBalanceAssets
                      )}
                    </Tbody>
                  </Table>
                </Box>
                <Box display={{ base: "block", xl: "none" }}>
                  {renderAccountsAccordion(
                    assetAccounts,
                    null,
                    0,
                    showZeroBalanceAssets
                  )}
                </Box>
              </>
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
                <Heading size="md" color={groupColor} mb={{ base: 1, sm: 0 }} letterSpacing="-0.02em">
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
                  data-testid="ledgermainaccounts-add-liability-account-plus-icon"
                  onClick={() => handleCreateAccountClick("liability")}
                />
              </Flex>
            </Flex>
            {liabilityAccounts.length === 0 ? (
              <EmptyState
                title="No Liability Accounts"
                message="You don't have any liability accounts yet."
                buttonText="Create Liability Account"
                onClick={() => handleCreateAccountClick("liability")}
              />
            ) : (
              <>
                <Box display={{ base: "none", xl: "block" }}>
                  <Table
                    variant="simple"
                    size="sm"
                    data-testid="ledgermainaccounts-liability-accounts-table"
                  >
                    <Thead>
                      <Tr>
                        <Th
                          color={columnHeaderColor}
                          fontSize="2xs"
                          fontWeight="semibold"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          pb={2}
                          borderBottomColor={sectionBorderColor}
                        >
                          Account
                        </Th>
                        <Th
                          color={columnHeaderColor}
                          fontSize="2xs"
                          fontWeight="semibold"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          pb={2}
                          isNumeric
                          borderBottomColor={sectionBorderColor}
                        >
                          Balance
                        </Th>
                        <Th pb={2} borderBottomColor={sectionBorderColor} />
                      </Tr>
                    </Thead>
                    <Tbody>
                      {renderAccountsTable(
                        liabilityAccounts,
                        null,
                        0,
                        showZeroBalanceLiabilities
                      )}
                    </Tbody>
                  </Table>
                </Box>
                <Box display={{ base: "block", xl: "none" }}>
                  {renderAccountsAccordion(
                    liabilityAccounts,
                    null,
                    0,
                    showZeroBalanceLiabilities
                  )}
                </Box>
              </>
            )}
          </Box>
        </MotionBox>
      </SimpleGrid>
      <CreateAccountModal
        isOpen={isOpen}
        onClose={onClose}
        accountType={accountType === "asset" ? "asset" : "liability"}
        parentAccountId={parentAccountId}
      />
    </Box>
  );
};

export default LedgerMainAccounts;
