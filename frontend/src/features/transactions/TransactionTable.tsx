import React, { useState, useMemo } from "react";
import { useColorModeValue } from "../../components/ui/color-mode";
import { formatDate } from "@/components/shared/utils";
import {
  Table,
  Tag,
  HoverCard,
  Box,
  Text,
  Flex,
  Icon,
  useDisclosure,
  Badge,
  Link as ChakraLink,
  HStack,
  VStack,
  Separator,
} from "@chakra-ui/react";
import { Trash2, Edit, Copy, ArrowDown } from "lucide-react";
import DeleteTransactionModal from "./DeleteTransactionModal";
import { splitCurrencyForDisplay } from "../mutual-funds/utils";
import { Link } from "react-router-dom";
import { SplitTransactionSkeleton, TransferDetailsSkeleton } from "./Skeletons";
import useLedgerStore from "@/components/shared/store";
import type { SplitTransaction, TransferDetails, Transaction } from "@/types";

interface TransactionTableProps {
  transactions: Transaction[];
   
  fetchSplitTransactions: (transactionId: string) => void;
   
  fetchTransferDetails: (transferId: string) => void;
  isSplitLoading: boolean;
  splitTransactions: SplitTransaction[];
  isTransferLoading: boolean;
  transferDetails?: TransferDetails;
   
  onDeleteTransaction: (transactionId: string) => Promise<void>;
   
  onEditTransaction: (transaction: Transaction) => void;
   
  onCopyTransaction: (transaction: Transaction) => void;
  onQuickFilter?: (field: string, value: string) => void;
  showAccountName?: boolean;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  fetchSplitTransactions,
  fetchTransferDetails,
  isSplitLoading,
  splitTransactions,
  isTransferLoading,
  transferDetails,
  onDeleteTransaction,
  onEditTransaction,
  onCopyTransaction,
  onQuickFilter,
  showAccountName = false,
}) => {
  const { open, onOpen, onClose } = useDisclosure();
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);

  const currencySymbol = useLedgerStore((s) => s.currencySymbol);


  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const tableBorderColor = useColorModeValue("gray.100", "gray.600");
  const headerColor = useColorModeValue("gray.400", "gray.500");
  const accountLinkColor = useColorModeValue("brand.500", "brand.300");
  const storeTagBg = useColorModeValue("brand.50", "brand.800");
  const storeTagColor = useColorModeValue("brand.700", "brand.200");
  const storeTagBorderColor = useColorModeValue("brand.200", "brand.600");
  const tagBg = useColorModeValue("gray.100", "gray.600");
  const tagColor = useColorModeValue("gray.600", "gray.200");
  const creditColor = useColorModeValue("brand.500", "brand.300");
  const debitColor = useColorModeValue("red.500", "red.300");
  const editIconColor = useColorModeValue("blue.500", "blue.300");
  const editIconHoverColor = useColorModeValue("blue.600", "blue.400");
  const copyIconColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
  const copyIconHoverColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const deleteIconColor = useColorModeValue("red.500", "red.300");
  const deleteIconHoverColor = useColorModeValue("red.600", "red.400");
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const transferTooltipBg = useColorModeValue("white", "gray.800");
  const transferTooltipBorderColor = useColorModeValue("gray.100", "gray.600");
  const transferTooltipLabelColor = useColorModeValue("gray.400", "gray.500");
  const transferTooltipAccountColor = useColorModeValue("gray.800", "gray.100");
  const transferTooltipLedgerColor = useColorModeValue("gray.500", "gray.400");
  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison === 0) {
          return parseInt(b.transaction_id) - parseInt(a.transaction_id);
        }
        return dateComparison;
      }),
    [transactions]
  );

  return (
    <>
      <Box
        borderRadius="xl"
        overflow="hidden"
        border="1px solid"
        borderColor={tableBorderColor}
      >
        <Table.Root variant="line" size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader width="8%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Date</Table.ColumnHeader>
              <Table.ColumnHeader width="15%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Category</Table.ColumnHeader>
              {showAccountName && <Table.ColumnHeader width="12%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Account</Table.ColumnHeader>}
              <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Notes</Table.ColumnHeader>
              <Table.ColumnHeader width="6%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Type</Table.ColumnHeader>
              <Table.ColumnHeader width="10%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor} textAlign='end'>
                Credit
              </Table.ColumnHeader>
              <Table.ColumnHeader width="10%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor} textAlign='end'>
                Debit
              </Table.ColumnHeader>
              <Table.ColumnHeader width="2%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>
                Actions
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
             {sortedTransactions.map((transaction) => {
                const displayCredit = transaction.filter_matched_split?.credit ?? transaction.credit;
                const displayDebit = transaction.filter_matched_split?.debit ?? transaction.debit;
                const displayCategoryName = transaction.filter_matched_split?.category_name ?? transaction.category_name;
                const displayCategoryId = transaction.filter_matched_split?.category_id ?? transaction.category_id;
                return (
                  <Table.Row
                    key={transaction.transaction_id}
                    _hover={{ bg: hoverBg }}
                    transition="background 0.15s ease"
                    css={{
                      '&:hover .action-icons': {
                        opacity: 1,
                      }
                    }}
                  >
                    <Table.Cell width="8%" borderBottomColor={tableBorderColor}><Text color={tertiaryTextColor} fontSize="sm">{formatDate(transaction.date)}</Text></Table.Cell>
                    <Table.Cell width="15%" borderBottomColor={tableBorderColor}>
                      {onQuickFilter && displayCategoryId ? (
                        <ChakraLink
                          color={accountLinkColor}
                          truncate
                          display="block"
                          title={displayCategoryName}
                          fontSize="sm"
                          onClick={() => onQuickFilter("category_id", displayCategoryId)}
                        >
                          {displayCategoryName}
                        </ChakraLink>
                      ) : (
                        <Text color={tertiaryTextColor} truncate title={displayCategoryName} fontSize="sm">{displayCategoryName}</Text>
                      )}
                    </Table.Cell>
                    {showAccountName && (
                      <Table.Cell width="12%" borderBottomColor={tableBorderColor}>
                        {transaction.account_name && transaction.account_id && (
                          <ChakraLink
                            color={accountLinkColor}
                            truncate
                            display="block"
                            title={transaction.account_name}
                            fontSize="sm"
                            asChild><Link to={`/account/${transaction.account_id}`}>
                              {transaction.account_name}
                            </Link></ChakraLink>
                        )}
                      </Table.Cell>
                    )}
                    <Table.Cell borderBottomColor={tableBorderColor}>
                      <Flex alignItems="center" flexWrap="wrap" gap={2}>
                        {transaction.notes && (
                          <Text color={tertiaryTextColor} title={transaction.notes} flexShrink={1} minW={0} fontSize="sm">
                            {transaction.notes}
                          </Text>
                        )}
                        {transaction.store && (
                          <Tag.Root
                            size="sm"
                            borderRadius="full"
                            bg={storeTagBg}
                            color={storeTagColor}
                            border="1px solid"
                            borderColor={storeTagBorderColor}
                            fontSize="xs"
                            fontWeight="medium"
                            flexShrink={0}
                            cursor={onQuickFilter ? "pointer" : undefined}
                            _hover={onQuickFilter ? { opacity: 0.8 } : undefined}
                            onClick={onQuickFilter ? () => onQuickFilter("store", transaction.store!) : undefined}
                          >
                            <Tag.Label>{transaction.store}</Tag.Label>
                          </Tag.Root>
                        )}
                        {transaction.location && (
                          <Tag.Root
                            size="sm"
                            borderRadius="full"
                            bg={storeTagBg}
                            color={storeTagColor}
                            border="1px solid"
                            borderColor={storeTagBorderColor}
                            fontSize="xs"
                            fontWeight="medium"
                            flexShrink={0}
                            cursor={onQuickFilter ? "pointer" : undefined}
                            _hover={onQuickFilter ? { opacity: 0.8 } : undefined}
                            onClick={onQuickFilter ? () => onQuickFilter("location", transaction.location!) : undefined}
                          >
                            <Tag.Label>{transaction.location}</Tag.Label>
                          </Tag.Root>
                        )}
                        {transaction.tags && transaction.tags.map((tag) => (
                          <Tag.Root
                            key={tag.tag_id}
                            size="sm"
                            borderRadius="md"
                            bg={tagBg}
                            color={tagColor}
                            flexShrink={0}
                            fontSize="xs"
                            cursor={onQuickFilter ? "pointer" : undefined}
                            _hover={onQuickFilter ? { opacity: 0.8 } : undefined}
                            onClick={onQuickFilter ? () => onQuickFilter("tags", tag.name) : undefined}
                          >
                            <Tag.Label>{tag.name}</Tag.Label>
                          </Tag.Root>
                        ))}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell width="6%" borderBottomColor={tableBorderColor}>
                      <Flex gap={1} flexWrap="nowrap">
                        {transaction.is_split && !transaction.is_transfer && !transaction.is_mf_transaction && (
                          <HoverCard.Root
                            openDelay={250}
                            closeDelay={100}
                            onOpenChange={e => {
                              if (e.open) {
                                fetchSplitTransactions(transaction.transaction_id);
                              }
                            }}
                            positioning={{
                              strategy: 'fixed',
                              placement: 'right',
                              gutter: 10
                            }}>
                            <HoverCard.Trigger asChild>
                              <Badge
                                colorPalette="purple"
                                variant="subtle"
                                cursor="default"
                                px={1.5}
                                borderRadius="md"
                                fontSize="0.6em"
                                fontWeight="bold"
                                letterSpacing="0.03em"
                                data-testid="transactiontable-split-indicator"
                              >
                                SPLIT
                              </Badge>
                            </HoverCard.Trigger>
                            <HoverCard.Positioner>
                              <HoverCard.Content
                                bg={transferTooltipBg}
                                borderColor={transferTooltipBorderColor}
                                borderWidth="1px"
                                boxShadow="0 8px 24px -4px rgba(0,0,0,0.12)"
                                borderRadius="xl"
                                width="auto"
                                minW="260px"
                                maxW="420px"
                                p={0}
                                _focus={{ outline: "none" }}>
                                <HoverCard.Arrow><HoverCard.ArrowTip /></HoverCard.Arrow>
                                <Box p={0}>
                                  {isSplitLoading ? (
                                    <Flex justify="center" align="center" minH="80px" p={3}>
                                      <SplitTransactionSkeleton />
                                    </Flex>
                                  ) : (
                                    <Box>
                                      <Box px={3} pt={3} pb={2}>
                                        <Text
                                          fontSize="10px"
                                          fontWeight="bold"
                                          textTransform="uppercase"
                                          letterSpacing="wider"
                                          color={transferTooltipLabelColor}
                                        >
                                          Split Details
                                        </Text>
                                      </Box>
                                      <Separator borderColor={transferTooltipBorderColor} />
                                      <VStack gap={0} align="stretch">{splitTransactions.map((split) => (
                                          <Box key={split.split_id} px={3} py={2.5}>
                                            <Flex justify="space-between" align="baseline" gap={4}>
                                              <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor} lineClamp={1}>
                                                {split.category_name}
                                              </Text>
                                              <HStack gap={0} align="baseline" flexShrink={0}>
                                                <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor}>
                                                  {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").main}
                                                </Text>
                                                <Text fontSize="xs" color={transferTooltipLedgerColor}>
                                                  {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").decimals}
                                                </Text>
                                              </HStack>
                                            </Flex>
                                            {split.notes && (
                                              <Text fontSize="xs" color={transferTooltipLedgerColor} mt={0.5} lineClamp={1}>
                                                {split.notes}
                                              </Text>
                                            )}
                                          </Box>
                                        ))}</VStack>
                                    </Box>
                                  )}
                                </Box>
                              </HoverCard.Content>
                            </HoverCard.Positioner>
                          </HoverCard.Root>
                        )}
                        {(transaction.is_transfer || transaction.is_mf_transaction) && transaction.is_split && (
                          <HoverCard.Root
                            openDelay={250}
                            closeDelay={100}
                            onOpenChange={e => {
                              if (e.open) {
                                fetchSplitTransactions(transaction.transaction_id);
                              }
                            }}
                            positioning={{
                              strategy: 'fixed',
                              placement: 'right',
                              gutter: 10
                            }}>
                            <HoverCard.Trigger asChild>
                              <Badge
                                colorPalette="orange"
                                variant="subtle"
                                cursor="default"
                                px={1.5}
                                borderRadius="md"
                                fontSize="0.6em"
                                fontWeight="bold"
                                letterSpacing="0.03em"
                              >
                                FEE
                              </Badge>
                            </HoverCard.Trigger>
                            <HoverCard.Positioner>
                              <HoverCard.Content
                                bg={transferTooltipBg}
                                borderColor={transferTooltipBorderColor}
                                borderWidth="1px"
                                boxShadow="0 8px 24px -4px rgba(0,0,0,0.12)"
                                borderRadius="xl"
                                width="auto"
                                minW="220px"
                                maxW="360px"
                                p={0}
                                _focus={{ outline: "none" }}>
                                <HoverCard.Arrow><HoverCard.ArrowTip /></HoverCard.Arrow>
                                <Box p={0}>
                                  {isSplitLoading ? (
                                    <Flex justify="center" align="center" minH="60px" p={3}>
                                      <SplitTransactionSkeleton />
                                    </Flex>
                                  ) : (
                                    <Box>
                                      <Box px={3} pt={3} pb={2}>
                                        <Text
                                          fontSize="10px"
                                          fontWeight="bold"
                                          textTransform="uppercase"
                                          letterSpacing="wider"
                                          color={transferTooltipLabelColor}
                                        >
                                          {transaction.is_mf_transaction ? "MF Charges" : "Transfer Fee"}
                                        </Text>
                                      </Box>
                                      <Separator borderColor={transferTooltipBorderColor} />
                                      <VStack gap={0} align="stretch">{splitTransactions
                                          .filter(s => s.category_name)
                                          .map(s => (
                                            <Box key={s.split_id} px={3} py={2.5}>
                                              <Flex justify="space-between" align="baseline" gap={4}>
                                                <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor} lineClamp={1}>
                                                  {s.category_name}
                                                </Text>
                                                <HStack gap={0} align="baseline" flexShrink={0}>
                                                  <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor}>
                                                    {splitCurrencyForDisplay(s.debit, currencySymbol || "₹").main}
                                                  </Text>
                                                  <Text fontSize="xs" color={transferTooltipLedgerColor}>
                                                    {splitCurrencyForDisplay(s.debit, currencySymbol || "₹").decimals}
                                                  </Text>
                                                </HStack>
                                              </Flex>
                                            </Box>
                                          ))}</VStack>
                                    </Box>
                                  )}
                                </Box>
                              </HoverCard.Content>
                            </HoverCard.Positioner>
                          </HoverCard.Root>
                        )}
                         {transaction.is_asset_transaction && (
                           <Badge
                             colorPalette="orange"
                             variant="subtle"
                             px={1.5}
                             borderRadius="md"
                             fontSize="0.6em"
                             fontWeight="bold"
                             letterSpacing="0.03em"
                           >
                             ASSET
                           </Badge>
                         )}
                         {transaction.is_mf_transaction && (
                           <Badge
                             colorPalette="green"
                             variant="subtle"
                             px={1.5}
                             borderRadius="md"
                             fontSize="0.6em"
                             fontWeight="bold"
                             letterSpacing="0.03em"
                           >
                             FUND
                           </Badge>
                         )}
                        {transaction.is_transfer && (
                       <HoverCard.Root
                         openDelay={250}
                         closeDelay={100}
                         onOpenChange={e => {
                           if (e.open) {
                             fetchTransferDetails(transaction.transfer_id!);
                           }
                         }}
                         positioning={{
                           placement: 'right',
                           gutter: 10
                         }}>
                         <HoverCard.Trigger asChild>
                           <Badge
                             colorPalette={transaction.is_cross_ledger_transfer ? "purple" : "blue"}
                             variant="subtle"
                             cursor="default"
                             px={1.5}
                             borderRadius="md"
                             fontSize="0.6em"
                             fontWeight="bold"
                             letterSpacing="0.03em"
                             data-testid="transactiontable-transfer-indicator"
                           >
                             TRANS
                           </Badge>
                         </HoverCard.Trigger>
                         <HoverCard.Positioner>
                           <HoverCard.Content
                             bg={transferTooltipBg}
                             borderColor={transferTooltipBorderColor}
                             borderWidth="1px"
                             boxShadow="0 8px 24px -4px rgba(0,0,0,0.12)"
                             borderRadius="xl"
                             width="220px"
                             p={0}
                             _focus={{ outline: "none" }}>
                             <HoverCard.Arrow><HoverCard.ArrowTip /></HoverCard.Arrow>
                             <Box p={3}>
                               {isTransferLoading ? (
                                 <Flex justify="center" align="center" minH="60px">
                                   <TransferDetailsSkeleton />
                                 </Flex>
                               ) : transferDetails ? (
                                 <VStack gap={2} align="stretch">
                                   <Box>
                                     <Text
                                       fontSize="10px"
                                       fontWeight="bold"
                                       textTransform="uppercase"
                                       letterSpacing="wider"
                                       color={transferTooltipLabelColor}
                                       mb={0.5}
                                     >
                                       From
                                     </Text>
                                     <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor} lineHeight="short">
                                       {transferDetails.source_account_name}
                                     </Text>
                                     <Text fontSize="xs" color={transferTooltipLedgerColor}>
                                       {transferDetails.source_ledger_name}
                                     </Text>
                                   </Box>
                                   <Flex align="center" gap={2}>
                                     <Separator borderColor={transferTooltipBorderColor} />
                                     <Icon boxSize={3} color={transferTooltipLabelColor} flexShrink={0} asChild><ArrowDown /></Icon>
                                     <Separator borderColor={transferTooltipBorderColor} />
                                   </Flex>
                                   <Box>
                                     <Text
                                       fontSize="10px"
                                       fontWeight="bold"
                                       textTransform="uppercase"
                                       letterSpacing="wider"
                                       color={transferTooltipLabelColor}
                                       mb={0.5}
                                     >
                                       To
                                     </Text>
                                     <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor} lineHeight="short">
                                       {transferDetails.destination_account_name}
                                     </Text>
                                     <Text fontSize="xs" color={transferTooltipLedgerColor}>
                                       {transferDetails.destination_ledger_name}
                                     </Text>
                                   </Box>
                                 </VStack>
                               ) : null}
                             </Box>
                           </HoverCard.Content>
                         </HoverCard.Positioner>
                       </HoverCard.Root>
                        )}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell width="10%" borderBottomColor={tableBorderColor} textAlign='end'>
                      {displayCredit !== 0 && (
                        <HStack gap={0} align="baseline" justify="flex-end">
                          <Text color={creditColor} fontWeight="semibold" fontSize="sm">
                            {splitCurrencyForDisplay(displayCredit, currencySymbol || "₹").main}
                          </Text>
                          <Text fontSize="xs" color={creditColor} opacity={0.7}>
                            {splitCurrencyForDisplay(displayCredit, currencySymbol || "₹").decimals}
                          </Text>
                        </HStack>
                      )}
                    </Table.Cell>
                    <Table.Cell width="10%" borderBottomColor={tableBorderColor} textAlign='end'>
                      {displayDebit !== 0 && (
                        <HStack gap={0} align="baseline" justify="flex-end">
                          <Text color={debitColor} fontWeight="semibold" fontSize="sm">
                            {splitCurrencyForDisplay(displayDebit, currencySymbol || "₹").main}
                          </Text>
                          <Text fontSize="xs" color={debitColor} opacity={0.7}>
                            {splitCurrencyForDisplay(displayDebit, currencySymbol || "₹").decimals}
                          </Text>
                        </HStack>
                      )}
                    </Table.Cell>
                    <Table.Cell width="2%" borderBottomColor={tableBorderColor}>
                      <Flex
                        gap={2}
                        opacity={0}
                        transition="opacity 0.2s ease"
                        className="action-icons"
                      >
                          {!transaction.is_asset_transaction && !transaction.is_mf_transaction && transaction.transfer_type !== "destination" && (
                            <>
                              <ChakraLink
                                onClick={() => onEditTransaction(transaction)}
                                _hover={{ textDecoration: "none" }}
                              >
                                <Icon
                                  boxSize={4}
                                  color={editIconColor}
                                  _hover={{ color: editIconHoverColor }}
                                  transition="color 0.15s ease"
                                  data-testid="transactiontable-edit-icon"
                                  asChild><Edit /></Icon>
                              </ChakraLink>
                              <ChakraLink
                                onClick={() => onCopyTransaction(transaction)}
                                _hover={{ textDecoration: "none" }}
                              >
                                <Icon
                                  boxSize={4}
                                  color={copyIconColor}
                                  _hover={{ color: copyIconHoverColor }}
                                  transition="color 0.15s ease"
                                  data-testid="transactiontable-copy-icon"
                                  asChild><Copy /></Icon>
                              </ChakraLink>
                            </>
                          )}
                          {!transaction.is_asset_transaction && !transaction.is_mf_transaction && (
                            <ChakraLink
                              onClick={() => {
                                setSelectedTransactionId(transaction.transaction_id);
                                onOpen();
                              }}
                              _hover={{ textDecoration: "none" }}
                            >
                              <Icon
                                boxSize={4}
                                color={deleteIconColor}
                                _hover={{ color: deleteIconHoverColor }}
                                transition="color 0.15s ease"
                                data-testid="transactiontable-trash-icon"
                                asChild><Trash2 /></Icon>
                            </ChakraLink>
                          )}
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
          </Table.Body>
        </Table.Root>
      </Box>

      <DeleteTransactionModal
        isOpen={open}
        onClose={onClose}
        onDelete={onDeleteTransaction}
        transactionId={selectedTransactionId}
      />
    </>
  );
};

export default TransactionTable;
