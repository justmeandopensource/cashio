import { useSearchParams } from "react-router-dom";
import Layout from "@components/Layout";
import InsightsMain from "./components/InsightsMain";
import PageContainer from "@components/shared/PageContainer";
import PageHeader from "@components/shared/PageHeader";
import { PieChart } from "lucide-react";
import { Box, Flex, FormControl, Select, Text, useColorModeValue } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import useLedgerStore from "@/components/shared/store";
import { useLedgers } from "@features/ledger/hooks";
import { useLogout } from "@/lib/useLogout";

const visualizationOptions = [
  {
    value: "income-expense-trend",
    label: "Income vs Expense Trend",
  },
  {
    value: "current-month-overview",
    label: "Current Month Overview",
  },
  {
    value: "category-trend",
    label: "Category Trend",
  },
  {
    value: "tag-trend",
    label: "Tag Trend",
  },
  {
    value: "expense-by-store",
    label: "Expense by Store",
  },
  {
    value: "expense-by-location",
    label: "Expense by Location",
  },
  {
    value: "expense-calendar-heatmap",
    label: "Expense Calendar Heatmap",
  },
  {
    value: "mutual-funds-allocation",
    label: "MF - Value by AMC",
  },
  {
    value: "mutual-funds-asset-class-allocation",
    label: "MF - Asset Class Allocation",
  },
  {
    value: "mutual-funds-yearly-investments",
    label: "MF - Yearly Investments",
  },
  {
    value: "mutual-funds-corpus",
    label: "MF - Corpus",
  },
];

const Insights = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const setLedger = useLedgerStore((s) => s.setLedger);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | undefined>(
    ledgerId,
  );
  const [selectedVisualization, setSelectedVisualization] = useState<string>(
    searchParams.get("visualization") || "current-month-overview",
  );



  const { data: ledgers, isLoading } = useLedgers();

  useEffect(() => {
    setSelectedLedgerId(ledgerId);
  }, [ledgerId]);

  useEffect(() => {
    const visualizationFromUrl = searchParams.get("visualization");
    if (visualizationFromUrl && visualizationFromUrl !== selectedVisualization) {
      setSelectedVisualization(visualizationFromUrl);
    }
  }, [searchParams, selectedVisualization]);

  const handleLedgerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLedgerId = e.target.value;
    const selectedLedger = ledgers?.find(
      (ledger) => ledger.ledger_id == newLedgerId,
    );
    if (selectedLedger) {
      setLedger({
        ledgerId: selectedLedger.ledger_id,
        ledgerName: selectedLedger.name,
        currencySymbol: selectedLedger.currency_symbol,
        description: selectedLedger.description || "",
        notes: selectedLedger.notes || "",
        navServiceType: "",
        createdAt: selectedLedger.created_at || "",
        updatedAt: selectedLedger.updated_at || "",
      });
    }
    setSelectedLedgerId(newLedgerId);
  };

  const handleVisualizationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVisualization = e.target.value;
    setSelectedVisualization(newVisualization);
    setSearchParams({ visualization: newVisualization });
  };

  const selectBg = useColorModeValue("white", "gray.700");
  const selectBorderColor = useColorModeValue("gray.200", "gray.600");
  const selectHoverBorderColor = useColorModeValue("brand.400", "brand.400");
  const selectColor = useColorModeValue("gray.700", "gray.200");
  const labelColor = useColorModeValue("gray.400", "gray.500");

  const handleLogout = useLogout();

  return (
    <Layout handleLogout={handleLogout}>
      <PageHeader
        title="Insights"
        subtitle="Visualize your financial data"
        icon={PieChart}
        breadcrumbs={[{ label: "Insights" }]}
        headerContent={
          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={3}
            w="100%"
          >
            <Box w="100%">
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
                  isDisabled={isLoading}
                  size="sm"
                  w="100%"
                  borderRadius="md"
                  bg={selectBg}
                  borderColor={selectBorderColor}
                  color={selectColor}
                  focusBorderColor="brand.500"
                  _hover={{ borderColor: selectHoverBorderColor }}
                >
                  <option value="">Select Ledger</option>
                  {ledgers?.map((ledger) => (
                    <option key={ledger.ledger_id} value={ledger.ledger_id}>
                      {ledger.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box w="100%">
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color={labelColor}
                mb={1}
              >
                Visualization
              </Text>
              <FormControl>
                <Select
                  value={selectedVisualization}
                  onChange={handleVisualizationChange}
                  size="sm"
                  minW={{ base: "100%", lg: "260px" }}
                  w="100%"
                  borderRadius="md"
                  bg={selectBg}
                  borderColor={selectBorderColor}
                  color={selectColor}
                  focusBorderColor="brand.500"
                  _hover={{ borderColor: selectHoverBorderColor }}
                >
                  {visualizationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Flex>
        }
      />
      <Box flex={1} overflowY="auto">
        {selectedLedgerId ? (
          <PageContainer>
            <InsightsMain
              ledgerId={selectedLedgerId}
              visualization={selectedVisualization}
            />
          </PageContainer>
        ) : (
          <InsightsMain
            ledgerId={selectedLedgerId}
            visualization={selectedVisualization}
          />
        )}
      </Box>
    </Layout>
  );
};

export default Insights;
