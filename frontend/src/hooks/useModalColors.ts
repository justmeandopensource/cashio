import { useColorModeValue } from "@chakra-ui/react";

/**
 * Shared color mode values used across modal components.
 * Eliminates the repeated useColorModeValue declarations in every modal.
 */
export const useModalColors = () => ({
  bgColor: useColorModeValue("white", "gray.800"),
  borderColor: useColorModeValue("gray.100", "gray.700"),
  cardBg: useColorModeValue("gray.50", "gray.700"),
  footerBg: useColorModeValue("gray.50", "gray.900"),
  inputBg: useColorModeValue("white", "gray.700"),
  inputBorderColor: useColorModeValue("gray.200", "gray.600"),
  focusBorderColor: useColorModeValue("teal.500", "teal.300"),
  textColorSecondary: useColorModeValue("gray.500", "gray.400"),
  textColorTertiary: useColorModeValue("gray.600", "gray.200"),
  modalHeaderBorderColor: useColorModeValue("gray.100", "gray.700"),
  modalTitleColor: useColorModeValue("gray.900", "gray.50"),
  modalSubtitleColor: useColorModeValue("gray.500", "gray.400"),
  modalIconColor: useColorModeValue("gray.400", "gray.500"),
  highlightColor: useColorModeValue("teal.50", "teal.900"),
  helperTextColor: useColorModeValue("gray.500", "gray.400"),
  secondaryTextColor: useColorModeValue("gray.600", "gray.300"),
});
