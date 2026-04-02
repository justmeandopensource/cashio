import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  Heading,
  Icon,
  Select,
  SimpleGrid,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;
import { Target, Plus, Calendar, CalendarDays } from "lucide-react";
import Layout from "@components/Layout";
import PageHeader from "@components/shared/PageHeader";
import PageContainer from "@components/shared/PageContainer";
import useLedgerStore from "@/components/shared/store";
import BudgetList from "./components/BudgetList";
import BudgetModal from "./components/BudgetModal";
import { useLedgers } from "@features/ledger/hooks";
import { useLogout } from "@/lib/useLogout";

const Budget: React.FC = () => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const setLedger = useLedgerStore((s) => s.setLedger);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | undefined>(ledgerId);
  const [modalPeriod, setModalPeriod] = useState<string>("monthly");
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    setSelectedLedgerId(ledgerId);
  }, [ledgerId]);

  const { data: ledgers, isLoading: isLoadingLedgers } = useLedgers();

  const handleLedgerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    const selected = ledgers?.find((l) => l.ledger_id == newId);
    if (selected) {
      setLedger({
        ledgerId: selected.ledger_id,
        ledgerName: selected.name,
        currencySymbol: selected.currency_symbol,
        description: selected.description || "",
        notes: selected.notes || "",
        navServiceType: selected.nav_service_type || "",
        createdAt: selected.created_at || "",
        updatedAt: selected.updated_at || "",
      });
    }
    setSelectedLedgerId(newId);
  };

  const openModalForPeriod = (period: string) => {
    setModalPeriod(period);
    onOpen();
  };

  const selectBg = useColorModeValue("white", "gray.700");
  const selectBorderColor = useColorModeValue("gray.200", "gray.600");
  const selectColor = useColorModeValue("gray.700", "gray.200");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const columnBorderColor = useColorModeValue("gray.100", "gray.700");
  const columnHeaderBg = useColorModeValue("gray.50", "gray.800");
  const periodTitleColor = useColorModeValue("gray.700", "gray.200");
  const periodIconColor = useColorModeValue("brand.500", "brand.400");
  const emptyIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.12)");
  const emptyTitleColor = useColorModeValue("gray.700", "gray.200");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");

  const activeCurrencySymbol =
    currencySymbol ||
    ledgers?.find((l) => l.ledger_id == selectedLedgerId)?.currency_symbol ||
    "£";

  const handleLogout = useLogout();

  return (
    <Layout handleLogout={handleLogout}>
      <PageHeader
        title="Budget"
        subtitle="Track spending against targets"
        icon={Target}
        breadcrumbs={[{ label: "Budget" }]}
        headerContent={
          <Box>
            <Text
              fontSize="2xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color={labelColor}
              mb={1}
            >
              Ledger
            </Text>
            <FormControl>
              <Select
                value={selectedLedgerId || ""}
                onChange={handleLedgerChange}
                isDisabled={isLoadingLedgers}
                size="sm"
                borderRadius="lg"
                bg={selectBg}
                borderColor={selectBorderColor}
                color={selectColor}
                focusBorderColor="brand.500"
                _hover={{ borderColor: "brand.400" }}
                minW="160px"
              >
                <option value="">Select Ledger</option>
                {ledgers?.map((l) => (
                  <option key={l.ledger_id} value={l.ledger_id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>
        }
        actions={
          selectedLedgerId ? (
            <Box>
              <Box fontSize="2xs" mb={1} visibility="hidden">_</Box>
              <Button
                leftIcon={<Icon as={Plus} boxSize={4} />}
                colorScheme="teal"
                size="sm"
                borderRadius="lg"
                onClick={() => openModalForPeriod("monthly")}
              >
                Add Budget
              </Button>
            </Box>
          ) : undefined
        }
      />

      <Box flex={1} overflowY="auto">
        {selectedLedgerId ? (
          <PageContainer>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Monthly column */}
              <Box
                border="1px solid"
                borderColor={columnBorderColor}
                borderRadius="xl"
                overflow="hidden"
              >
                <Flex
                  align="center"
                  px={5}
                  py={3.5}
                  bg={columnHeaderBg}
                  borderBottom="1px solid"
                  borderColor={columnBorderColor}
                  gap={2.5}
                >
                  <Icon as={Calendar} boxSize={4} color={periodIconColor} />
                  <Text fontWeight="bold" fontSize="sm" color={periodTitleColor} letterSpacing="-0.01em">
                    Monthly
                  </Text>
                </Flex>
                <Box p={{ base: 3, md: 4 }}>
                  <BudgetList
                    ledgerId={selectedLedgerId}
                    period="monthly"
                    currencySymbol={activeCurrencySymbol}
                  />
                </Box>
              </Box>

              {/* Yearly column */}
              <Box
                border="1px solid"
                borderColor={columnBorderColor}
                borderRadius="xl"
                overflow="hidden"
              >
                <Flex
                  align="center"
                  px={5}
                  py={3.5}
                  bg={columnHeaderBg}
                  borderBottom="1px solid"
                  borderColor={columnBorderColor}
                  gap={2.5}
                >
                  <Icon as={CalendarDays} boxSize={4} color={periodIconColor} />
                  <Text fontWeight="bold" fontSize="sm" color={periodTitleColor} letterSpacing="-0.01em">
                    Yearly
                  </Text>
                </Flex>
                <Box p={{ base: 3, md: 4 }}>
                  <BudgetList
                    ledgerId={selectedLedgerId}
                    period="yearly"
                    currencySymbol={activeCurrencySymbol}
                  />
                </Box>
              </Box>
            </SimpleGrid>
          </PageContainer>
        ) : (
          <Center flexDirection="column" py={20} px={6} textAlign="center">
            <Box
              w="72px"
              h="72px"
              borderRadius="2xl"
              bg={emptyIconBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={5}
              css={{ animation: `${floatAnimation} 3s ease-in-out infinite` }}
            >
              <Icon as={Target} boxSize={8} color="brand.400" strokeWidth={1.5} />
            </Box>
            <Heading fontSize="xl" fontWeight="bold" color={emptyTitleColor} mb={2}>
              No ledger selected
            </Heading>
            <Text fontSize="sm" color={emptySubColor} maxW="320px" lineHeight="tall">
              Choose a ledger from the dropdown above to set up monthly and yearly spending budgets for your categories.
            </Text>
          </Center>
        )}
      </Box>

      {selectedLedgerId && (
        <BudgetModal
          isOpen={isOpen}
          onClose={onClose}
          ledgerId={selectedLedgerId}
          period={modalPeriod}
          mode="create"
        />
      )}
    </Layout>
  );
};

export default Budget;
