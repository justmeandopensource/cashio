import {
  Box,
  Skeleton,
  SkeletonText,
  SimpleGrid,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const shimmer = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

const HomeLedgerCardsSkeleton = () => {
  const skeletonCards = Array(2).fill(0);
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.100", "gray.700");
  const accentColor = useColorModeValue("gray.100", "gray.700");

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      {skeletonCards.map((_, index) => (
        <MotionBox
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.08 }}
        >
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            overflow="hidden"
            css={{ animation: `${shimmer} 2s ease-in-out ${index * 0.3}s infinite` }}
          >
            {/* Accent line placeholder */}
            <Box h="2px" bg={accentColor} />

            <Flex align="flex-start" gap={4} p={5}>
              <Skeleton
                w="52px"
                h="52px"
                borderRadius="xl"
                flexShrink={0}
              />
              <Box flex={1}>
                <Skeleton h="16px" w="55%" mb={2} borderRadius="md" />
                <SkeletonText noOfLines={2} spacing={2} skeletonHeight="12px" />
                <Skeleton h="11px" w="30%" mt={3} borderRadius="md" />
              </Box>
            </Flex>
          </Box>
        </MotionBox>
      ))}
    </SimpleGrid>
  );
};

export default HomeLedgerCardsSkeleton;
