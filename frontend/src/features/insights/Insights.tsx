import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@components/Layout";
import InsightsMain from "./components/InsightsMain";
import PageContainer from "@components/shared/PageContainer";
import PageHeader from "@components/shared/PageHeader";
import { PieChart, ChevronDown } from "lucide-react";
import { Box, Flex, FormControl, Select } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import useLedgerStore from "@/components/shared/store";
import { useQuery } from "@tanstack/react-query";
import config from "@/config";

interface Ledger {
  ledger_id: string;
  name: string;
  currency_symbol: string;
  description?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { ledgerId, setLedger } = useLedgerStore();
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | undefined>(
    ledgerId,
  );
  const [selectedVisualization, setSelectedVisualization] = useState<string>(
    searchParams.get("visualization") || "current-month-overview",
  );



  const { data: ledgers, isLoading } = useQuery<Ledger[]>({
    queryKey: ["ledgers"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${config.apiBaseUrl}/ledger/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ledgers");
      }

      return response.json();
    },
  });

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
      setLedger(
        selectedLedger.ledger_id,
        selectedLedger.name,
        selectedLedger.currency_symbol,
        selectedLedger.description || "",
        selectedLedger.notes || "",
        "",
        undefined,
        selectedLedger.created_at || "",
        selectedLedger.updated_at || "",
      );
    }
    setSelectedLedgerId(newLedgerId);
  };

  const handleVisualizationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVisualization = e.target.value;
    setSelectedVisualization(newVisualization);
    setSearchParams({ visualization: newVisualization });
  };

  const handleLogout = (): void => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <Layout handleLogout={handleLogout}>
      <PageHeader
        title="Insights"
        subtitle="Visualize your financial data"
        icon={PieChart}
        headerContent={
          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={4}
            w="100%"
          >
            <Box w="100%">
              <FormControl>
                <Select
                  value={selectedLedgerId || ""}
                  onChange={handleLedgerChange}
                  isDisabled={isLoading}
                  icon={<ChevronDown />}
                  variant="ghost"
                  color="white"
                  bg="whiteAlpha.100"
                  _hover={{ bg: "whiteAlpha.300" }}
                  size="md"
                  w="100%"
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
              <FormControl>
                <Select
                  value={selectedVisualization}
                  onChange={handleVisualizationChange}
                  icon={<ChevronDown />}
                  variant="ghost"
                  color="white"
                  bg="whiteAlpha.100"
                  _hover={{ bg: "whiteAlpha.300" }}
                  size="md"
                  minW={{ base: "100%", lg: "260px" }}
                  w="100%"
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
        <PageContainer>
          <InsightsMain
            ledgerId={selectedLedgerId}
            visualization={selectedVisualization}
          />
        </PageContainer>
      </Box>
    </Layout>
  );
};

export default Insights;
