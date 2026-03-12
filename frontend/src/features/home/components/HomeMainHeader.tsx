import {
  Box,
  Heading,
  Button,
  useColorModeValue,
  Icon,
  Text,
  Flex,
} from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { FC } from "react";

interface HomeMainHeaderProps {
  onCreateLedger: () => void;
}

const HomeMainHeader: FC<HomeMainHeaderProps> = ({ onCreateLedger }) => {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "gray.50");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const headerShadow = useColorModeValue("sm", "0 2px 8px rgba(0,0,0,0.6)");

  return (
    <Box
      px={{ base: 4, md: 8 }}
      py={6}
      borderBottom="1px solid"
      borderColor={borderColor}
      boxShadow={headerShadow}
      sx={{ clipPath: "inset(0 -20px -20px 0)" }}
    >
      <Flex justify="space-between" align="center">
        <Box>
          <Heading
            as="h1"
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="bold"
            color={titleColor}
            letterSpacing="-0.02em"
          >
            My Ledgers
          </Heading>
          <Text fontSize="sm" color={subtitleColor} mt={0.5}>
            Select a ledger to get started
          </Text>
        </Box>

        <Button
          onClick={onCreateLedger}
          colorScheme="brand"
          size="sm"
          leftIcon={<Icon as={Plus} boxSize={4} />}
          borderRadius="lg"
          fontWeight="semibold"
        >
          New Ledger
        </Button>
      </Flex>
    </Box>
  );
};

export default HomeMainHeader;
