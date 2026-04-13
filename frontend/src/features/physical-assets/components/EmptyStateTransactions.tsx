import { FC } from "react";
import {
  Box,
  Text,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

const MotionBox = motion.create(Box);

const floatKeyframes = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const EmptyStateTransactions: FC = () => {
  const emptyIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.12)");
  const emptyTitleColor = useColorModeValue("gray.800", "gray.100");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");

  return (
    <MotionBox
      textAlign="center"
      py={14}
      px={6}
      display="flex"
      flexDirection="column"
      alignItems="center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Box
        w="72px"
        h="72px"
        borderRadius="2xl"
        bg={emptyIconBg}
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={5}
        css={{ animation: `${floatKeyframes} 3s ease-in-out infinite` }}
      >
        <Icon as={BookOpen} boxSize={8} color="brand.500" strokeWidth={1.5} />
      </Box>
      <Text fontSize="xl" fontWeight="800" color={emptyTitleColor} mb={2} letterSpacing="-0.02em">
        No Transactions Yet
      </Text>
      <Text fontSize="sm" color={emptySubColor} maxW="320px" lineHeight="1.6">
        Transaction history will appear here once you start buying and selling physical assets.
      </Text>
    </MotionBox>
  );
};

export default EmptyStateTransactions;
