import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

const Theme = extendTheme({
  config,
  styles: {
    global: {
      '*': {
        WebkitTapHighlightColor: 'transparent',
      },
      body: {
        color: 'secondaryTextColor',
        bg: 'bodyBg',
      },
    },
  },
  colors: {
    brand: {
      50: '#e6f6f5',
      100: '#c0e9e6',
      200: '#9adcd8',
      300: '#74cfca',
      400: '#4ec2bc',
      500: '#35a9a3',
      600: '#2a8580',
      700: '#20625d',
      800: '#153f3b',
      900: '#0b1f1e',
    },
  },
  semanticTokens: {
    colors: {
      primaryTextColor: {
        default: 'gray.800',
        _dark: 'gray.100',
      },
      secondaryTextColor: {
        default: 'gray.700',
        _dark: 'gray.300',
      },
      tertiaryTextColor: {
        default: 'gray.600',
        _dark: 'gray.400',
      },
      bodyBg: {
        default: 'gray.100',
        _dark: 'gray.800',
      },
      primaryBg: {
        default: 'white',
        _dark: 'gray.700',
      },
      secondaryBg: {
        default: 'gray.100',
        _dark: 'gray.600',
      },
      cardDarkBg: {
        default: 'gray.100',
        _dark: '#384252',
      },
      tertiaryBg: {
        default: 'gray.200',
        _dark: 'gray.500',
      },
      split: {
        default: 'purple.400',
        _dark: 'purple.300',
      },
      transfer: {
        default: 'blue.400',
        _dark: 'blue.300',
      },
      asset: {
        default: 'orange.400',
        _dark: 'orange.300',
      },
      mutualFund: {
        default: 'green.400',
        _dark: 'green.300',
      },
      splitBg: {
        default: 'purple.50',
        _dark: 'purple.900',
      },
      transferBg: {
        default: 'blue.50',
        _dark: 'blue.900',
      },
      buttonPrimaryBg: {
        default: 'whiteAlpha.100',
        _dark: 'whiteAlpha.200',
      },
      buttonPrimaryHoverBg: {
        default: 'whiteAlpha.300',
        _dark: 'whiteAlpha.400',
      },
    },
  },
  components: {
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
    },
    Checkbox: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Switch: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
});

export default Theme;