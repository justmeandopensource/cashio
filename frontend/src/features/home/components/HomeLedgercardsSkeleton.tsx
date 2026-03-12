import {
  Box,
  Skeleton,
  SkeletonText,
  SimpleGrid,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";

const HomeLedgerCardsSkeleton = () => {
  const skeletonCards = Array(2).fill(0);
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      {skeletonCards.map((_, index) => (
        <Box
          key={index}
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="xl"
          p={5}
        >
          <Flex align="flex-start" gap={4}>
            <Skeleton w="52px" h="52px" borderRadius="xl" flexShrink={0} />
            <Box flex={1}>
              <Skeleton h="16px" w="55%" mb={2} borderRadius="md" />
              <SkeletonText noOfLines={2} spacing={2} skeletonHeight="12px" />
              <Skeleton h="11px" w="30%" mt={3} borderRadius="md" />
            </Box>
          </Flex>
        </Box>
      ))}

    </SimpleGrid>
  );
};

export default HomeLedgerCardsSkeleton;
