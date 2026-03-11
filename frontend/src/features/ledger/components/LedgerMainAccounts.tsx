import React, { useState } from "react";
import {
  Flex,
  Box,
  Table,
  Tbody,
  Tr,
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
import { Link as RouterLink } from "react-router-dom";
import { Plus, Repeat, Eye, EyeOff, Building, ShieldAlert } from "lucide-react";
import CreateAccountModal from "@components/modals/CreateAccountModal";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../mutual-funds/utils";

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
  const cardBorderColor = useColorModeValue("tertiaryBg", "tertiaryBg");
  const groupCardBg = useColorModeValue("teal.50", "teal.900");
  const groupCardBorderColor = useColorModeValue("brand.200", "brand.700");
   const groupTextColor = useColorModeValue("brand.700", "brand.200");
   const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
   const loadingBg = useColorModeValue("gray.50", "primaryBg");

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
            >
              <Td pl={`${level * 24 + 8}px`}>
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
                     fontSize={account.is_group ? "md" : "sm"}
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
                      />
                    </ChakraLink>
                  )}
                  {!account.is_group && (
                    <Flex
                      gap={2}
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
                          size={16}
                          color={iconColor}
                          _hover={{ color: hoverIconColor }}
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
              variant={account.is_group ? "filled" : "outline"}
              bg={account.is_group ? groupCardBg : cardBg}
              borderColor={account.is_group ? groupCardBorderColor : cardBorderColor}
              size="sm"
              boxShadow="sm"
              _hover={{ boxShadow: "md" }}
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
                    <Flex gap={2} align="center" justify="flex-end">
                      <ChakraLink
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddTransaction(account.account_id, undefined);
                        }}
                        _hover={{ textDecoration: "none" }}
                      >
                        <Icon
                          as={Plus}
                          size={16}
                          color={iconColor}
                          _hover={{ color: hoverIconColor }}
                        />
                      </ChakraLink>
                      <ChakraLink
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransferFunds(account.account_id);
                        }}
                        _hover={{ textDecoration: "none" }}
                      >
                        <Icon
                          as={Repeat}
                          size={16}
                          color={iconColor}
                          _hover={{ color: hoverIconColor }}
                        />
                      </ChakraLink>
                    </Flex>
                  ) : (
                    <ChakraLink
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateAccountClick(
                          account.type,
                          account.account_id
                        );
                      }}
                      _hover={{ textDecoration: "none" }}
                    >
                      <Icon
                        as={Plus}
                        size={16}
                        color={iconColor}
                        _hover={{ color: hoverIconColor }}
                      />
                    </ChakraLink>
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
    <Box textAlign="center" py={6} px={4}>
      <Text fontSize="lg" fontWeight="medium" mb={2}>
        {title}
      </Text>
      <Text color="secondaryTextColor" mb={4} fontSize="sm">
        {message}
      </Text>
      <Button
        leftIcon={<Plus />}
        onClick={onClick}
        size="sm"
        colorScheme="brand"
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
    return (
      <Box bg={loadingBg} p={{ base: 3, md: 4, lg: 6 }} borderRadius="lg">
        <LoadingState />
      </Box>
    );
  }

  return (
    <Box bg={loadingBg} p={{ base: 3, md: 4, lg: 6 }} borderRadius="lg">
      <SimpleGrid
        columns={{ base: 1, md: 1, lg: 2 }}
        spacing={{ base: 4, md: 6 }}
      >
        <Box
          bg={cardBg}
          p={{ base: 3, md: 4 }}
          borderRadius="md"
          boxShadow="sm"
          _hover={{ boxShadow: "md", transition: "all 0.2s" }}
        >
          <Flex
            justifyContent="space-between"
            alignItems="center"
            mb={4}
            flexWrap={{ base: "wrap", sm: "nowrap" }}
          >
            <Flex align="center" gap={2}>
              <Icon as={Building} size={20} color={iconColor} />
              <Heading size="md" color={groupColor} mb={{ base: 1, sm: 0 }}>
                Assets
              </Heading>
            </Flex>
            <Flex align="center" gap={2}>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="brand"
                onClick={() => setShowZeroBalanceAssets(!showZeroBalanceAssets)}
                leftIcon={showZeroBalanceAssets ? <EyeOff size={14} /> : <Eye size={14} />}
              >
                {showZeroBalanceAssets
                  ? "Hide zero balances"
                  : "Show zero balances"}
              </Button>
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
        <Box
          bg={cardBg}
          p={{ base: 3, md: 4 }}
          borderRadius="md"
          boxShadow="sm"
          _hover={{ boxShadow: "md", transition: "all 0.2s" }}
        >
          <Flex
            justifyContent="space-between"
            alignItems="center"
            mb={4}
            flexWrap={{ base: "wrap", sm: "nowrap" }}
          >
            <Flex align="center" gap={2}>
              <Icon as={ShieldAlert} size={20} color={iconColor} />
              <Heading size="md" color={groupColor} mb={{ base: 1, sm: 0 }}>
                Liabilities
              </Heading>
            </Flex>
            <Flex align="center" gap={2}>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="brand"
                onClick={() =>
                  setShowZeroBalanceLiabilities(!showZeroBalanceLiabilities)
                }
                leftIcon={showZeroBalanceLiabilities ? <EyeOff size={14} /> : <Eye size={14} />}
              >
                {showZeroBalanceLiabilities
                  ? "Hide zero balances"
                  : "Show zero balances"}
              </Button>
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
