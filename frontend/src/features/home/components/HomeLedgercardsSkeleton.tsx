import {
  Box,
  Skeleton,
  SimpleGrid,
  Card,
  CardBody,
  useColorModeValue,
} from "@chakra-ui/react";

const HomeLedgerCardsSkeleton = () => {
  const skeletonCards = Array(2).fill(0);
  const bgColor = useColorModeValue("brand.50", "brand.900");

  return (
    <Box mb={8}>
      <Skeleton height="36px" width="120px" mb={6} />
      <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 4 }} spacing={6}>
        {skeletonCards.map((_, index) => (
          <Card key={index} bg={bgColor} opacity={0.85}>
            <CardBody display="flex" alignItems="center" p={6}>
              <Skeleton width="36px" height="36px" borderRadius="md" mr={4} />
              <Skeleton height="24px" width="70%" />
            </CardBody>
          </Card>
        ))}
        {/* "Add New" card skeleton */}
        <Card bg={bgColor} opacity={0.7}>
          <CardBody
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={6}
          >
            <Skeleton width="32px" height="32px" borderRadius="full" />
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default HomeLedgerCardsSkeleton;
