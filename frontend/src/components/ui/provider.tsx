"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { system } from "@components/Theme"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider defaultTheme="system" enableSystem {...props} />
    </ChakraProvider>
  )
}
