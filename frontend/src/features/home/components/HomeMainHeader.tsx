import {
  Box,
  Heading,
  Button,
  useColorModeValue,
  Icon,
  HStack,
  Text,
  Flex,
} from "@chakra-ui/react";
import { BookText } from "lucide-react";
import { FC } from "react";

interface HomeMainHeaderProps {
  onCreateLedger: () => void;
}

const HomeMainHeader: FC<HomeMainHeaderProps> = ({ onCreateLedger }) => {
  const gradientBg = useColorModeValue(
    "linear(135deg, brand.500, brand.600)",
    "linear(135deg, brand.600, brand.700)"
  );

  return (
    <Box
      bgGradient={gradientBg}
      color="white"
      p={6}
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="lg"
    >
      <Flex
        justifyContent="space-between"
        align={{ base: "center", md: "center" }}
        flexDirection={{ base: "column", md: "row" }}
        gap={4}
        width="100%"
      >
        <HStack spacing={3} align="center" flex={1} justifyContent={{ base: "flex-start", md: "flex-start" }} width={{ base: "100%", md: "auto" }}>
          <Box
            p={3}
            bg="whiteAlpha.200"
            borderRadius="md"
            backdropFilter="blur(20px)"
            border="1px solid whiteAlpha.300"
            boxShadow="xl"
          >
            <Icon as={BookText} boxSize={6} />
          </Box>
          <Box>
            <Heading
              as="h1"
              size="lg"
              fontWeight="bold"
              letterSpacing="-0.02em"
            >
              My Ledgers
            </Heading>
            <Text fontSize="sm" color="whiteAlpha.900" fontWeight="medium">
              Select or create a new ledger
            </Text>
          </Box>
        </HStack>

        <Button
          color="white"
          variant="ghost"
          bg="whiteAlpha.100"
          onClick={onCreateLedger}
          w={{ base: "100%", md: "auto" }}
          _hover={{ bg: "whiteAlpha.300" }}
          flexShrink={0}
        >
          Create New Ledger
        </Button>
      </Flex>
    </Box>
  );
};

export default HomeMainHeader;
