import {
  Box,
  Flex,
  Skeleton,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { FC } from "react";

const LedgerMainHeaderSkeleton: FC = () => {
  const bgColor = useColorModeValue("white", "gray.700");

  return (
    <Box
      bg={bgColor}
      p={{ base: 4, md: 5, lg: 6 }}
      borderRadius="lg"
      boxShadow="md"
      mb={8}
    >
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        flexDirection={{ base: "column", md: "column", lg: "row" }}
        gap={{ base: 4, md: 4, lg: 0 }}
      >
        {/* Left Section: Back Icon and Ledger Name */}
        <Flex alignItems="center" gap={3}>
          {/* Back to Home Icon */}
          <IconButton
            aria-label="Back to Home"
            icon={<ArrowBackIcon boxSize={6} />}
            variant="ghost"
            color="teal.500"
            size="lg"
            isDisabled={true}
            opacity={0.7}
            _hover={{ bg: "teal.50" }}
          />

          {/* Ledger Name Skeleton */}
          <Flex alignItems="center" gap={2}>
            <Skeleton height="36px" width="180px" />
            <Skeleton height="24px" width="24px" borderRadius="md" />
          </Flex>
        </Flex>

        {/* Right Section: Add Transaction and Transfer Funds Buttons Skeletons */}
        <Flex
          gap={3}
          flexDirection={{ base: "column", md: "column", lg: "row" }}
          w={{ base: "100%", md: "100%", lg: "auto" }}
        >
          {/* Button to Add a New Transaction Skeleton */}
          <Skeleton
            height="40px"
            width={{ base: "100%", lg: "150px" }}
            borderRadius="md"
          />

          {/* Button to Transfer Funds Skeleton */}
          <Skeleton
            height="40px"
            width={{ base: "100%", lg: "150px" }}
            borderRadius="md"
          />
        </Flex>
      </Flex>
    </Box>
  );
};

export default LedgerMainHeaderSkeleton;
