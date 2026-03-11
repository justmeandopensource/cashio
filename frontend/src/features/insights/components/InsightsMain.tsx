import React from "react";
import {
  Box,
} from "@chakra-ui/react";
import InsightsMainCharts from "./InsightsMainCharts";

interface InsightsMainProps {
  ledgerId?: string;
  visualization: string;
}

const InsightsMain: React.FC<InsightsMainProps> = ({ ledgerId, visualization }) => {
  return (
    <Box>
      <InsightsMainCharts
        ledgerId={ledgerId}
        visualization={visualization}
      />
    </Box>
  );
};

export default InsightsMain;
