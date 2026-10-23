import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineSlotRecipe,
} from "@chakra-ui/react";

// Every modal uses `size={{ base: "full", sm: "xl" }}`. The stock `full` variant sets
// minH/margin/radius that the other sizes never reset, so at wider breakpoints the dialog
// stayed full-height. Make the non-full sizes restore those values explicitly.
const dialogSizeReset = {
  content: {
    minH: "auto",
    "--dialog-margin": "var(--dialog-base-margin)",
    borderRadius: "l3",
  },
};
const dialogRecipe = defineSlotRecipe({
  slots: ["content"],
  variants: {
    size: {
      xs: dialogSizeReset,
      sm: dialogSizeReset,
      md: dialogSizeReset,
      lg: dialogSizeReset,
      xl: dialogSizeReset,
    },
  },
});

// v3's `line` table variant paints every row with the page `bg` token (black in dark mode),
// which clashes with the cards the tables sit in. Chakra v2's `simple` rows were transparent.
const tableRecipe = defineSlotRecipe({
  slots: ["row"],
  variants: {
    variant: {
      line: {
        row: { bg: "transparent" },
      },
    },
  },
});

/** Light/dark pair referencing palette tokens (e.g. "gray.800") or raw CSS colours ("#384252"). */
const pair = (light: string, dark: string) => ({
  value: { base: ref(light), _dark: ref(dark) },
});
const ref = (c: string) => (c.startsWith("#") ? c : `{colors.${c}}`);

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: "brand",
    },
    "*": {
      WebkitTapHighlightColor: "transparent",
    },
    body: {
      color: "secondaryTextColor",
      bg: "bodyBg",
    },
  },
  theme: {
    slotRecipes: {
      dialog: dialogRecipe,
      table: tableRecipe,
    },
    tokens: {
      colors: {
        brand: {
          50: { value: "#e6f6f5" },
          100: { value: "#c0e9e6" },
          200: { value: "#9adcd8" },
          300: { value: "#74cfca" },
          400: { value: "#4ec2bc" },
          500: { value: "#35a9a3" },
          600: { value: "#2a8580" },
          700: { value: "#20625d" },
          800: { value: "#153f3b" },
          900: { value: "#0b1f1e" },
          950: { value: "#06100f" },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Palette keys required for colorPalette="brand" (Button, Checkbox, Switch, focus rings).
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "white" },
          fg: pair("brand.700", "brand.300"),
          muted: { value: { base: "{colors.brand.100}", _dark: "{colors.brand.900}" } },
          subtle: { value: { base: "{colors.brand.50}", _dark: "{colors.brand.950}" } },
          emphasized: { value: { base: "{colors.brand.200}", _dark: "{colors.brand.800}" } },
          focusRing: { value: "{colors.brand.500}" },
        },
        primaryTextColor: pair("gray.800", "gray.100"),
        secondaryTextColor: pair("gray.700", "gray.300"),
        tertiaryTextColor: pair("gray.600", "gray.400"),
        bodyBg: pair("white", "gray.800"),
        primaryBg: pair("white", "gray.700"),
        secondaryBg: pair("gray.100", "gray.600"),
        cardDarkBg: pair("gray.100", "#384252"),
        tertiaryBg: pair("gray.200", "gray.500"),
        split: pair("purple.400", "purple.300"),
        transfer: pair("blue.400", "blue.300"),
        asset: pair("orange.400", "orange.300"),
        mutualFund: pair("green.400", "green.300"),
        splitBg: pair("purple.50", "purple.900"),
        transferBg: pair("blue.50", "blue.900"),
        buttonPrimaryBg: pair("whiteAlpha.100", "whiteAlpha.200"),
        buttonPrimaryHoverBg: pair("whiteAlpha.300", "whiteAlpha.400"),
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);

export default system;
