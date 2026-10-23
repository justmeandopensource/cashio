import React from "react";
import { Icon, Box, Grid, GridItem, Field, Text } from "@chakra-ui/react";
import { Check } from "lucide-react";
import ChakraDatePicker from "@/components/shared/ChakraDatePicker";
import type { InternalFilters, FilterThemeColors } from "./types";

interface FilterDateRangeProps {
  filters: InternalFilters;
  handleInputChange: <K extends keyof InternalFilters>(field: K, value: InternalFilters[K]) => void;
  colors: FilterThemeColors;
}

const FilterDateRange: React.FC<FilterDateRangeProps> = ({
  filters,
  handleInputChange,
  colors,
}) => {
  const { borderColor, cardBg, secondaryTextColor } = colors;

  return (
    <Box
      bg={cardBg}
      p={{ base: 4, sm: 6 }}
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
    >
      <Text fontWeight="semibold" mb={3} display="flex" alignItems="center" gap={1.5}>
        Date Range
        {(filters.from_date || filters.to_date) && (
          <Icon boxSize={3.5} color="teal.500" asChild><Check /></Icon>
        )}
      </Text>
      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm" color={secondaryTextColor} mb={1}>
              From Date
            </Field.Label>
            <ChakraDatePicker
              selected={filters.from_date}
              onChange={(date) => handleInputChange("from_date", date)}
              shouldCloseOnSelect={true}
              placeholderText="From"
            />
          </Field.Root>
        </GridItem>
        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm" color={secondaryTextColor} mb={1}>
              To Date
            </Field.Label>
            <ChakraDatePicker
              selected={filters.to_date}
              onChange={(date) => handleInputChange("to_date", date)}
              shouldCloseOnSelect={true}
              placeholderText="To"
              minDate={filters.from_date}
            />
          </Field.Root>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default FilterDateRange;
