import {
  Box,
  Flex,
  Skeleton,
  useColorModeValue,
} from "@chakra-ui/react";
import { FC } from "react";

const LedgerMainHeaderSkeleton: FC = () => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  return (
    <Box
      bg={bgColor}
      borderBottom="1px solid"
      borderColor={borderColor}
    >
      {/* Gradient accent line placeholder */}
      <Box h="2px" bg={useColorModeValue("gray.100", "gray.700")} />

      <Flex
        px={{ base: 5, md: 8 }}
        py={{ base: 3, md: 6 }}
        justifyContent="space-between"
        alignItems={{ base: "flex-start", md: "center" }}
        flexDirection={{ base: "column", md: "row" }}
        gap={{ base: 3, md: 4 }}
      >
        {/* Left Section: Back Icon and Ledger Name */}
        <Flex alignItems="center" gap={3}>
          <Skeleton w="20px" h="20px" borderRadius="md" />
          <Flex alignItems="center" gap={2}>
            <Skeleton height="28px" width="160px" borderRadius="md" />
          </Flex>
        </Flex>

        {/* Right Section: Action Buttons */}
        <Flex
          gap={2}
          w={{ base: "100%", md: "auto" }}
        >
          <Skeleton
            height="32px"
            width={{ base: "50%", md: "140px" }}
            borderRadius="md"
          />
          <Skeleton
            height="32px"
            width={{ base: "50%", md: "140px" }}
            borderRadius="md"
          />
        </Flex>
      </Flex>
    </Box>
  );
};

export default LedgerMainHeaderSkeleton;
