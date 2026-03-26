import React from "react";
import {
  FormControl,
  Stack,
  Radio,
  RadioGroup,
  Box,
  VStack,
} from "@chakra-ui/react";
import FormTags from "@/components/shared/FormTags";
import type { InternalFilters, FilterThemeColors } from "./types";

interface FilterTagsSectionProps {
  filters: InternalFilters;
  handleInputChange: <K extends keyof InternalFilters>(field: K, value: InternalFilters[K]) => void;
  colors: FilterThemeColors;
}

const FilterTagsSection: React.FC<FilterTagsSectionProps> = ({
  filters,
  handleInputChange,
  colors,
}) => {
  const { borderColor, cardBg, inputBorderColor } = colors;

  return (
    <Box
      bg={cardBg}
      p={{ base: 4, sm: 6 }}
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
    >
      <VStack spacing={5} align="stretch">
        <FormTags
          tags={filters.tags}
          setTags={(tags) => handleInputChange("tags", tags)}
          borderColor={inputBorderColor}
          buttonColorScheme="teal"
        />
        <FormControl>
          <RadioGroup
            value={filters.tags_match}
            onChange={(value) => handleInputChange("tags_match", value as "any" | "all")}
          >
            <Stack direction="row" spacing={6}>
              <Radio value="any" colorScheme="teal" size="lg">
                Match Any Tag
              </Radio>
              <Radio value="all" colorScheme="teal" size="lg">
                Match All Tags
              </Radio>
            </Stack>
          </RadioGroup>
        </FormControl>
      </VStack>
    </Box>
  );
};

export default FilterTagsSection;
