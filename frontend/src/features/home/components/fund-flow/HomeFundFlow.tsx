import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  Icon,
  Skeleton,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  ArrowRight,
  GitCompareArrows,
  Waypoints,
} from "lucide-react";
import { useFundFlow } from "@/features/insights/hooks";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import type { FundFlowData, FundFlowLink } from "./types";

const MotionBox = motion(Box);

const PERIOD_OPTIONS = [
  { value: "current_month", label: "Current Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_12_months", label: "Last 12 Months" },
] as const;

interface CorridorSection {
  title: string;
  icon: typeof ArrowLeftRight;
  links: FundFlowLink[];
}

function groupLinksBySections(links: FundFlowLink[]): CorridorSection[] {
  // Group: same-ledger links by ledger name, cross-ledger links together
  const ledgerGroups = new Map<string, FundFlowLink[]>();
  const crossLedger: FundFlowLink[] = [];

  for (const link of links) {
    if (link.is_cross_ledger) {
      crossLedger.push(link);
    } else {
      const ledgerName = link.source_ledger_name;
      const group = ledgerGroups.get(ledgerName) || [];
      group.push(link);
      ledgerGroups.set(ledgerName, group);
    }
  }

  const sections: CorridorSection[] = [];

  // Same-ledger sections first, sorted by ledger name
  const sortedLedgers = Array.from(ledgerGroups.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [ledgerName, sectionLinks] of sortedLedgers) {
    sections.push({
      title: `${ledgerName} Transfers`,
      icon: ArrowLeftRight,
      links: sectionLinks,
    });
  }

  // Cross-ledger section last
  if (crossLedger.length > 0) {
    sections.push({
      title: "Cross-Ledger Transfers",
      icon: GitCompareArrows,
      links: crossLedger,
    });
  }

  return sections;
}

interface CorridorRowProps {
  link: FundFlowLink;
  maxAmount: number;
  index: number;
  isCrossLedger?: boolean;
}

const CorridorRow: React.FC<CorridorRowProps> = ({
  link,
  maxAmount,
  index,
  isCrossLedger,
}) => {
  const barBg = useColorModeValue("brand.50", "rgba(56,178,172,0.1)");
  const barFill = useColorModeValue("brand.400", "brand.300");
  const crossBarFill = useColorModeValue("purple.400", "purple.300");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subtextColor = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const arrowColor = useColorModeValue("gray.300", "gray.500");

  const barPct = maxAmount > 0 ? (link.total_amount / maxAmount) * 100 : 0;
  const fill = isCrossLedger ? crossBarFill : barFill;

  return (
    <MotionBox
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      px={4}
      py={3}
      _hover={{ bg: hoverBg }}
      sx={{ transition: "background 0.1s ease" }}
    >
      {/* Source → Destination header */}
      <Flex align="center" gap={2} mb={1.5} flexWrap="wrap">
        <Text
          fontSize="xs"
          fontWeight="700"
          color={textColor}
          noOfLines={1}
          flex={1}
          minW={0}
        >
          {link.source_account_name}
        </Text>

        <Icon
          as={ArrowRight}
          boxSize={3.5}
          color={arrowColor}
          flexShrink={0}
        />

        <Text
          fontSize="xs"
          fontWeight="700"
          color={textColor}
          noOfLines={1}
          flex={1}
          minW={0}
        >
          {link.target_account_name}
        </Text>

        {/* Amount */}
        <VStack spacing={0} align="end" flexShrink={0}>
          <Text fontSize="xs" fontWeight="700" color={textColor}>
            {formatNumberAsCurrency(link.total_amount, link.source_currency)}
          </Text>
          {isCrossLedger && link.target_amount != null && (
            <Text fontSize="2xs" color={subtextColor}>
              &rarr;{" "}
              {formatNumberAsCurrency(link.target_amount, link.target_currency)}
            </Text>
          )}
        </VStack>
      </Flex>

      {/* Flow bar + transfer count */}
      <Flex align="center" gap={3}>
        <Box flex={1} h="6px" borderRadius="full" bg={barBg} overflow="hidden">
          <Box
            h="100%"
            w={`${Math.max(barPct, 2)}%`}
            bg={fill}
            borderRadius="full"
            transition="width 0.4s ease"
          />
        </Box>

        <Text
          fontSize="2xs"
          color={subtextColor}
          fontWeight="500"
          flexShrink={0}
        >
          {link.transfer_count} transfer
          {link.transfer_count !== 1 ? "s" : ""}
        </Text>
      </Flex>
    </MotionBox>
  );
};

const HomeFundFlow: React.FC = () => {
  const [periodType, setPeriodType] = useState("current_month");
  const { data, isLoading } = useFundFlow(periodType);
  const flowData = data as FundFlowData | undefined;

  const cardBg = useColorModeValue("white", "cardDarkBg");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const dividerColor = useColorModeValue("gray.100", "gray.600");
  const emptyIconBg = useColorModeValue("gray.50", "gray.700");
  const emptyTextColor = useColorModeValue("gray.400", "gray.500");
  const activeBtnBg = useColorModeValue("brand.500", "brand.400");
  const activeBtnColor = "white";
  const inactiveBtnBg = useColorModeValue("gray.100", "gray.600");
  const inactiveBtnColor = useColorModeValue("gray.600", "gray.300");
  const sectionHeaderColor = useColorModeValue("gray.500", "gray.400");
  const sectionHeaderBg = useColorModeValue("gray.50", "gray.750");

  const sections = useMemo(
    () => groupLinksBySections(flowData?.links ?? []),
    [flowData?.links],
  );

  // Global max for consistent bar scaling across all sections
  const maxAmount = useMemo(() => {
    const links = flowData?.links ?? [];
    return links.length > 0
      ? Math.max(...links.map((l) => l.total_amount))
      : 0;
  }, [flowData?.links]);

  if (isLoading) {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HStack spacing={1.5} mb={3}>
          <Icon as={Waypoints} boxSize={3.5} color={labelColor} />
          <Text
            fontSize="xs"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wider"
            color={labelColor}
          >
            Fund Flow Map
          </Text>
        </HStack>
        <Skeleton borderRadius="xl" h="200px" />
      </MotionBox>
    );
  }

  const hasData = sections.length > 0;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Section header + period toggle */}
      <Flex
        justify="space-between"
        align="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <HStack spacing={1.5}>
          <Icon as={Waypoints} boxSize={3.5} color={labelColor} />
          <Text
            fontSize="xs"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wider"
            color={labelColor}
          >
            Fund Flow Map
          </Text>
        </HStack>

        <ButtonGroup size="xs" isAttached>
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              onClick={() => setPeriodType(opt.value)}
              bg={periodType === opt.value ? activeBtnBg : inactiveBtnBg}
              color={
                periodType === opt.value ? activeBtnColor : inactiveBtnColor
              }
              _hover={{
                bg: periodType === opt.value ? activeBtnBg : inactiveBtnBg,
                opacity: 0.9,
              }}
              fontWeight="600"
              fontSize="2xs"
              borderRadius="md"
              px={3}
            >
              {opt.label}
            </Button>
          ))}
        </ButtonGroup>
      </Flex>

      <Box
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
      >
        {!hasData ? (
          /* Empty state */
          <Flex direction="column" align="center" py={8} px={4} gap={2}>
            <Box
              w={10}
              h={10}
              borderRadius="lg"
              bg={emptyIconBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={ArrowLeftRight} boxSize={5} color={emptyTextColor} />
            </Box>
            <Text fontSize="xs" fontWeight="600" color={emptyTextColor}>
              No fund transfers found
            </Text>
            <Text
              fontSize="2xs"
              color={emptyTextColor}
              textAlign="center"
              maxW="260px"
            >
              Transfer funds between your accounts to see how money flows across
              your ledgers.
            </Text>
          </Flex>
        ) : (
          <Box maxH="520px" overflowY="auto">
            {sections.map((section, sIdx) => {
              const isCross = section.icon === GitCompareArrows;
              let rowIndex = 0;

              return (
                <Box key={section.title}>
                  {/* Section header */}
                  <HStack
                    spacing={1.5}
                    px={4}
                    py={2}
                    bg={sectionHeaderBg}
                    borderBottom="1px solid"
                    borderTop={sIdx > 0 ? "1px solid" : "none"}
                    borderColor={dividerColor}
                    position="sticky"
                    top={0}
                    zIndex={1}
                  >
                    <Icon
                      as={section.icon}
                      boxSize={3}
                      color={sectionHeaderColor}
                    />
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      color={sectionHeaderColor}
                    >
                      {section.title}
                    </Text>
                    <Text fontSize="2xs" color={sectionHeaderColor}>
                      ({section.links.length})
                    </Text>
                  </HStack>

                  {/* Corridor rows */}
                  <VStack
                    spacing={0}
                    align="stretch"
                    divider={
                      <Box
                        borderBottom="1px solid"
                        borderColor={dividerColor}
                      />
                    }
                  >
                    {section.links.map((link) => (
                      <CorridorRow
                        key={`${link.source_account_id}-${link.target_account_id}`}
                        link={link}
                        maxAmount={maxAmount}
                        index={rowIndex++}
                        isCrossLedger={isCross}
                      />
                    ))}
                  </VStack>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </MotionBox>
  );
};

export default HomeFundFlow;
