import { Button, Center, Heading, Text, VStack } from "@chakra-ui/react";
import { FallbackProps } from "react-error-boundary";

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <Center flex={1} p={8}>
      <VStack spacing={4} textAlign="center">
        <Heading size="lg" color="primaryTextColor">
          Something went wrong
        </Heading>
        <Text color="tertiaryTextColor" maxW="md">
          {error instanceof Error ? error.message : "An unexpected error occurred."}
        </Text>
        <Button onClick={resetErrorBoundary}>Try again</Button>
      </VStack>
    </Center>
  );
};

export default ErrorFallback;
