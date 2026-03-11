import { FC } from "react";
import {
  Box,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

const EmptyStateTransactions: FC = () => {
  const bgColor = useColorModeValue("gray.50", "cardDarkBg");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const headingColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Box
      p={8}
      textAlign="center"
      bg={bgColor}
      borderRadius="lg"
      boxShadow="sm"
    >
      <VStack spacing={4}>
        <VStack spacing={2}>
          <Text fontSize="lg" fontWeight="semibold" color={headingColor}>
            No Transactions Yet
          </Text>
          <Text fontSize="sm" color={textColor} maxW="300px">
            Transaction history will appear here once you start buying and selling physical assets.
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

export default EmptyStateTransactions;