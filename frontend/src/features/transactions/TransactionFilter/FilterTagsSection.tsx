import React from "react";
import {
  Stack,
  RadioGroup,
  Box,
  VStack,
  Field,
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
      <VStack gap={5} align="stretch">
        <FormTags
          tags={filters.tags}
          setTags={(tags) => handleInputChange("tags", tags)}
          borderColor={inputBorderColor}
          buttonColorScheme="teal"
        />
        <Field.Root>
          <RadioGroup.Root
            value={filters.tags_match}
            colorPalette="teal"
            size="lg"
            onValueChange={(e) => handleInputChange("tags_match", e.value as "any" | "all")}>
            <Stack direction="row" gap={6}>
              <RadioGroup.Item value="any"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>Match Any Tag
                                </RadioGroup.ItemText></RadioGroup.Item>
              <RadioGroup.Item value="all"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>Match All Tags
                                </RadioGroup.ItemText></RadioGroup.Item>
            </Stack>
          </RadioGroup.Root>
        </Field.Root>
      </VStack>
    </Box>
  );
};

export default FilterTagsSection;
