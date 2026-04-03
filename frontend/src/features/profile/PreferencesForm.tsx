import React from "react";
import { Settings, BookText, Check } from "lucide-react";
import {
  Box,
  FormControl,
  FormLabel,
  VStack,
  Text,
  HStack,
  Icon,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useLedgers } from "@/features/ledger/hooks";
import { useUserProfile, useSetDefaultLedger } from "./hooks";
import { notify } from "@/components/shared/notify";

const MotionBox = motion(Box);

const PreferencesForm: React.FC = () => {
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const headerIconBg = useColorModeValue("brand.50", "rgba(56,178,172,0.1)");
  const headerIconColor = useColorModeValue("brand.600", "brand.300");
  const cardBg = useColorModeValue("white", "gray.750");
  const cardBorder = useColorModeValue("gray.200", "gray.600");
  const cardHoverBorder = useColorModeValue("brand.200", "brand.600");
  const selectedBg = useColorModeValue("brand.50", "rgba(56,178,172,0.1)");
  const selectedBorder = useColorModeValue("brand.400", "brand.400");
  const currencyBg = useColorModeValue("gray.100", "gray.600");
  const currencyColor = useColorModeValue("gray.600", "gray.200");
  const checkBg = useColorModeValue("brand.500", "brand.400");

  const { data: user } = useUserProfile();
  const { data: ledgers } = useLedgers();
  const { mutate: setDefault, isPending } = useSetDefaultLedger();

  const handleSetDefault = (ledgerId: number) => {
    if (isPending || ledgerId === user?.default_ledger_id) return;
    setDefault(ledgerId, {
      onSuccess: () => {
        notify({
          title: "Default ledger updated",
          description: "Your default ledger has been changed.",
          status: "success",
          duration: 3000,
        });
      },
      onError: () => {
        notify({
          title: "Failed to update",
          description: "Unable to set default ledger.",
          status: "error",
          duration: 5000,
        });
      },
    });
  };

  return (
    <Box w="full">
      <Box px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }}>
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          mb={8}
        >
          <HStack spacing={3}>
            <Box
              w={10}
              h={10}
              borderRadius="lg"
              bg={headerIconBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={Settings} color={headerIconColor} boxSize={5} />
            </Box>
            <Box>
              <Heading size="md" color={textColor} fontWeight="700">
                Preferences
              </Heading>
              <Text fontSize="sm" color={subtitleColor} mt={0.5}>
                Customize your app experience.
              </Text>
            </Box>
          </HStack>
        </MotionBox>

        {/* Default Ledger */}
        <MotionBox
          maxW="2xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
        >
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color={labelColor} mb={1}>
                Default Ledger
              </FormLabel>
              <Text fontSize="xs" color={subtitleColor} mb={4}>
                The default ledger is used on the dashboard for financial
                summaries, quick actions, and is pre-selected when you open the
                app.
              </Text>

              {!ledgers || ledgers.length === 0 ? (
                <Box
                  py={8}
                  textAlign="center"
                  borderRadius="xl"
                  border="1px dashed"
                  borderColor={cardBorder}
                >
                  <Icon
                    as={BookText}
                    boxSize={6}
                    color={subtitleColor}
                    mb={2}
                  />
                  <Text fontSize="sm" color={subtitleColor}>
                    No ledgers yet. Create a ledger to set it as default.
                  </Text>
                </Box>
              ) : (
                <VStack spacing={2} align="stretch">
                  {ledgers.map((ledger) => {
                    const isDefault =
                      user?.default_ledger_id != null &&
                      String(user.default_ledger_id) ===
                        String(ledger.ledger_id);
                    return (
                      <Box
                        key={ledger.ledger_id}
                        px={4}
                        py={3}
                        borderRadius="xl"
                        border="1.5px solid"
                        borderColor={isDefault ? selectedBorder : cardBorder}
                        bg={isDefault ? selectedBg : cardBg}
                        cursor={isPending ? "wait" : "pointer"}
                        onClick={() =>
                          handleSetDefault(Number(ledger.ledger_id))
                        }
                        _hover={{
                          borderColor: isDefault
                            ? selectedBorder
                            : cardHoverBorder,
                        }}
                        transition="all 0.15s ease"
                        opacity={isPending ? 0.6 : 1}
                      >
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Box
                              w={8}
                              h={8}
                              borderRadius="lg"
                              bg={currencyBg}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexShrink={0}
                            >
                              <Text
                                fontSize="sm"
                                fontWeight="700"
                                color={currencyColor}
                              >
                                {ledger.currency_symbol}
                              </Text>
                            </Box>
                            <Box>
                              <Text
                                fontSize="sm"
                                fontWeight="600"
                                color={textColor}
                              >
                                {ledger.name}
                              </Text>
                              {ledger.description && (
                                <Text
                                  fontSize="xs"
                                  color={subtitleColor}
                                  noOfLines={1}
                                >
                                  {ledger.description}
                                </Text>
                              )}
                            </Box>
                          </HStack>
                          {isDefault && (
                            <HStack spacing={1.5}>
                              <Box
                                w={5}
                                h={5}
                                borderRadius="full"
                                bg={checkBg}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Icon
                                  as={Check}
                                  boxSize={3}
                                  color="white"
                                  strokeWidth={3}
                                />
                              </Box>
                              <Text
                                fontSize="xs"
                                fontWeight="600"
                                color={headerIconColor}
                              >
                                Default
                              </Text>
                            </HStack>
                          )}
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </FormControl>
          </VStack>
        </MotionBox>
      </Box>
    </Box>
  );
};

export default PreferencesForm;
