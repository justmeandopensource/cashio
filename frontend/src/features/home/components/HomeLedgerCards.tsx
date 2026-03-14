import { useNavigate } from "react-router-dom";
import {
  Box,
  SimpleGrid,
  Text,
  Icon,
  useColorModeValue,
  HStack,
  Flex,
} from "@chakra-ui/react";
import { Plus, ArrowRight, Calendar, BookOpen } from "lucide-react";
import useLedgerStore from "@/components/shared/store";

interface HomeLedgerCardsProps {
  ledgers?: Array<{
    ledger_id: string;
    name: string;
    currency_symbol: string;
    description: string;
    notes: string;
    created_at: string;
    updated_at: string;
  }>;
  onOpen: () => void;
}

const HomeLedgerCards = ({ ledgers = [], onOpen }: HomeLedgerCardsProps) => {
  const navigate = useNavigate();
  const { setLedger } = useLedgerStore();

  const handleLedgerClick = (
    ledgerId: string,
    ledgerName: string,
    currencySymbol: string,
    description: string,
    notes: string,
    navServiceType: string,
    apiKey: string | undefined,
    createdAt: string,
    updatedAt: string
  ) => {
    setLedger(
      ledgerId,
      ledgerName,
      currencySymbol,
      description,
      notes,
      navServiceType,
      apiKey,
      createdAt,
      updatedAt
    );
    navigate(`/ledger`);
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const cardBorder = useColorModeValue("gray.200", "gray.600");
  const cardHoverBg = useColorModeValue("gray.50", "gray.600");
  const cardHoverBorder = useColorModeValue("brand.400", "brand.500");
  const nameColor = useColorModeValue("gray.900", "gray.50");
  const descColor = useColorModeValue("gray.500", "gray.400");
  const dateColor = useColorModeValue("gray.400", "gray.500");
  const arrowColor = useColorModeValue("gray.300", "gray.600");
  const arrowHoverColor = useColorModeValue("brand.500", "brand.400");

  const emptyIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.15)");
  const emptyTitleColor = useColorModeValue("gray.700", "gray.200");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Assign a gradient per ledger based on index for visual variety
  const gradients = [
    "linear(135deg, brand.400, brand.600)",
    "linear(135deg, purple.400, purple.600)",
    "linear(135deg, teal.400, teal.600)",
    "linear(135deg, orange.400, orange.600)",
    "linear(135deg, pink.400, pink.600)",
  ];

  if (ledgers.length === 0) {
    return (
      <Box
        textAlign="center"
        py={20}
        px={6}
        display="flex"
        flexDirection="column"
        alignItems="center"
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
        >
          <Icon as={BookOpen} boxSize={8} color="brand.500" />
        </Box>
        <Text fontSize="xl" fontWeight="bold" color={emptyTitleColor} mb={2}>
          No ledgers yet
        </Text>
        <Text fontSize="sm" color={emptySubColor} mb={8} maxW="320px">
          Create your first ledger to start tracking your finances.
        </Text>
        <Box
          as="button"
          onClick={onOpen}
          display="inline-flex"
          alignItems="center"
          gap={2}
          px={5}
          py={2.5}
          borderRadius="lg"
          bg="brand.500"
          color="white"
          fontWeight="semibold"
          fontSize="sm"
          _hover={{ bg: "brand.600" }}
          transition="background 0.15s"
        >
          <Icon as={Plus} boxSize={4} />
          Create your first ledger
        </Box>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      {ledgers.map((ledger, index) => {
        const gradient = gradients[index % gradients.length];
        return (
          <Box
            key={ledger.ledger_id}
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            p={5}
            cursor="pointer"
            role="group"
            onClick={() =>
              handleLedgerClick(
                ledger.ledger_id,
                ledger.name,
                ledger.currency_symbol,
                ledger.description,
                ledger.notes,
                "",
                undefined,
                ledger.created_at,
                ledger.updated_at
              )
            }
            _hover={{
              borderColor: cardHoverBorder,
              bg: cardHoverBg,
              transform: "translateY(-2px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
            _active={{ transform: "scale(0.98)", bg: cardHoverBg }}
            transition="transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease"
          >
            <Flex align="flex-start" gap={4}>
              {/* Currency badge */}
              <Box
                w="52px"
                h="52px"
                borderRadius="xl"
                bgGradient={gradient}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontWeight="bold"
                fontSize="xl"
                flexShrink={0}
                boxShadow="sm"
              >
                {ledger.currency_symbol}
              </Box>

              {/* Content */}
              <Box flex={1} minW={0}>
                <Text
                  fontWeight="bold"
                  fontSize="md"
                  color={nameColor}
                  noOfLines={1}
                  lineHeight="1.3"
                >
                  {ledger.name}
                </Text>
                {ledger.description ? (
                  <Text
                    fontSize="sm"
                    color={descColor}
                    noOfLines={2}
                    mt={1}
                    lineHeight="1.5"
                  >
                    {ledger.description}
                  </Text>
                ) : (
                  <Text fontSize="sm" color={dateColor} mt={1}>
                    No description
                  </Text>
                )}
                <HStack spacing={1.5} mt={2.5}>
                  <Icon as={Calendar} boxSize={3} color={dateColor} />
                  <Text fontSize="xs" color={dateColor}>
                    {formatDate(ledger.created_at)}
                  </Text>
                </HStack>
              </Box>

              {/* Arrow */}
              <Icon
                as={ArrowRight}
                boxSize={4}
                color={arrowColor}
                alignSelf="center"
                flexShrink={0}
                transition="color 0.15s ease, transform 0.15s ease"
                _groupHover={{
                  color: arrowHoverColor,
                  transform: "translateX(2px)",
                }}
              />
            </Flex>
          </Box>
        );
      })}

    </SimpleGrid>
  );
};

export default HomeLedgerCards;
