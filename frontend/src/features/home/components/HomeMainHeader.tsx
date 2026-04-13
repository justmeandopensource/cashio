import {
  Box,
  Heading,
  Button,
  useColorModeValue,
  Icon,
  Text,
  Flex,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { FC } from "react";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

interface HomeMainHeaderProps {
  onCreateLedger: () => void;
}

const HomeMainHeader: FC<HomeMainHeaderProps> = ({ onCreateLedger }) => {
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const titleColor = useColorModeValue("gray.900", "gray.50");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const headerBg = useColorModeValue("white", "gray.800");
  const btnGlow = useColorModeValue(
    "0 0 20px rgba(53,169,163,0.25)",
    "0 0 20px rgba(78,194,188,0.2)"
  );

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={10}
      bg={headerBg}
      borderBottom="1px solid"
      borderColor={borderColor}
    >
      {/* Thin gradient accent line at top */}
      <Box
        h="2px"
        bgGradient="linear(to-r, brand.400, brand.600, teal.300)"
      />

      <MotionFlex
        justify="space-between"
        align="center"
        px={{ base: 5, md: 8 }}
        py={{ base: 4, md: 6 }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Box>
          <Heading
            as="h1"
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="800"
            color={titleColor}
            letterSpacing="-0.03em"
          >
            My Ledgers
          </Heading>
          <Text
            fontSize="sm"
            color={subtitleColor}
            mt={1}
            display={{ base: "none", md: "block" }}
            letterSpacing="0.01em"
          >
            Select a ledger to get started
          </Text>
        </Box>

        <MotionBox
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            onClick={onCreateLedger}
            colorScheme="brand"
            size="sm"
            leftIcon={<Icon as={Plus} boxSize={4} strokeWidth={2.5} />}
            borderRadius="lg"
            fontWeight="bold"
            letterSpacing="0.01em"
            px={5}
            _hover={{
              boxShadow: btnGlow,
            }}
            transition="all 0.2s ease"
          >
            New Ledger
          </Button>
        </MotionBox>
      </MotionFlex>
    </Box>
  );
};

export default HomeMainHeader;
