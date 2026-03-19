import React from "react";
import { Box, Flex, Skeleton, useColorModeValue } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const shimmer = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

// Skeleton component for split transactions
export const SplitTransactionSkeleton: React.FC = () => {
  const bg = useColorModeValue("splitBg", "splitBg");
  return (
    <Box borderWidth="1px" borderRadius="lg" p={2} bg={bg} css={{ animation: `${shimmer} 1.8s ease-in-out infinite` }}>
      {[1, 2, 3].map((item) => (
        <Flex
          key={item}
          justify="space-between"
          p={2}
          borderBottomWidth={item !== 3 ? "1px" : "0"}
        >
          <Skeleton height="18px" width="120px" borderRadius="md" />
          <Skeleton height="18px" width="80px" borderRadius="md" />
        </Flex>
      ))}
    </Box>
  );
};

// Skeleton component for transfer details
export const TransferDetailsSkeleton: React.FC = () => {
  const bg = useColorModeValue("transferBg", "transferBg");
  return (
    <Box borderWidth="1px" borderRadius="lg" p={3} bg={bg} css={{ animation: `${shimmer} 1.8s ease-in-out 0.2s infinite` }}>
      <Skeleton height="16px" width="100px" mb={1} borderRadius="md" />
      <Skeleton height="20px" width="140px" mb={1} borderRadius="md" />
      <Skeleton height="14px" width="120px" borderRadius="md" />
    </Box>
  );
};
