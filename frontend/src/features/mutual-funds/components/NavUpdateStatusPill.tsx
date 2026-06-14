import { FC, useMemo } from "react";
import {
  HStack,
  Icon,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  PopoverHeader,
  VStack,
  Button,
  Box,
  Spinner,
  useColorModeValue,
  Tooltip,
  Divider,
} from "@chakra-ui/react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RotateCw,
  Play,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNavUpdateStatus,
  triggerNavUpdate,
  NavUpdateRunStatus,
} from "../api";

const STATUS_QUERY_KEY = ["nav-update-status"] as const;

const formatRelative = (iso: string | null): string => {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

const formatAbsolute = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
};

interface NavUpdateStatusPillProps {
  /** When true, render the compact mobile variant (single text line). */
  compact?: boolean;
}

const NavUpdateStatusPill: FC<NavUpdateStatusPillProps> = ({ compact = false }) => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: STATUS_QUERY_KEY,
    queryFn: getNavUpdateStatus,
    // Poll quickly while a run is in flight, slowly otherwise.
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "running" ? 2_000 : 60_000;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const triggerMutation = useMutation({
    mutationFn: triggerNavUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_QUERY_KEY });
    },
  });

  // Theme tokens
  const subText = useColorModeValue("gray.600", "gray.400");
  const mutedText = useColorModeValue("gray.500", "gray.500");
  const pillBgIdle = useColorModeValue("gray.50", "gray.700");
  const pillBgSuccess = useColorModeValue("green.50", "green.900");
  const pillBgPartial = useColorModeValue("orange.50", "orange.900");
  const pillBgFailed = useColorModeValue("red.50", "red.900");
  const pillBgRunning = useColorModeValue("blue.50", "blue.900");
  const pillBorderIdle = useColorModeValue("gray.200", "gray.600");
  const pillBorderSuccess = useColorModeValue("green.200", "green.700");
  const pillBorderPartial = useColorModeValue("orange.200", "orange.700");
  const pillBorderFailed = useColorModeValue("red.200", "red.700");
  const pillBorderRunning = useColorModeValue("blue.200", "blue.700");
  const successColor = useColorModeValue("green.600", "green.300");
  const partialColor = useColorModeValue("orange.600", "orange.300");
  const failedColor = useColorModeValue("red.600", "red.300");
  const runningColor = useColorModeValue("blue.600", "blue.300");
  const popoverBg = useColorModeValue("white", "gray.800");

  const visual = useMemo(() => {
    const status: NavUpdateRunStatus | undefined = data?.status;
    switch (status) {
      case "success":
        return { label: "Up to date", icon: CheckCircle2, color: successColor, bg: pillBgSuccess, border: pillBorderSuccess };
      case "partial":
        return { label: "Partial", icon: AlertTriangle, color: partialColor, bg: pillBgPartial, border: pillBorderPartial };
      case "failed":
      case "skipped_locked":
        return { label: status === "failed" ? "Failed" : "Skipped (busy)", icon: XCircle, color: failedColor, bg: pillBgFailed, border: pillBorderFailed };
      case "running":
        return { label: "Running…", icon: RotateCw, color: runningColor, bg: pillBgRunning, border: pillBorderRunning };
      default:
        return { label: "No run yet", icon: Clock, color: subText, bg: pillBgIdle, border: pillBorderIdle };
    }
  }, [data?.status, successColor, partialColor, failedColor, runningColor, subText, pillBgIdle, pillBgSuccess, pillBgPartial, pillBgFailed, pillBgRunning, pillBorderIdle, pillBorderSuccess, pillBorderPartial, pillBorderFailed, pillBorderRunning]);

  if (isLoading) {
    return compact ? (
      <Text fontSize="xs" color={mutedText}>Auto-update: loading…</Text>
    ) : (
      <HStack spacing={2} px={3} py={1} bg={pillBgIdle} borderRadius="full" border="1px solid" borderColor={pillBorderIdle}>
        <Spinner size="xs" />
        <Text fontSize="xs" color={subText}>Auto-update</Text>
      </HStack>
    );
  }

  if (isError || !data) {
    return compact ? (
      <Text fontSize="xs" color={failedColor}>Auto-update: unavailable</Text>
    ) : (
      <HStack spacing={2} px={3} py={1} bg={pillBgFailed} borderRadius="full" border="1px solid" borderColor={pillBorderFailed}>
        <Icon as={XCircle} boxSize={3.5} color={failedColor} />
        <Text fontSize="xs" color={failedColor}>Auto-update unavailable</Text>
      </HStack>
    );
  }

  const finishedRelative = data.finished_at ? formatRelative(data.finished_at) : null;
  const startedRelative = data.started_at ? formatRelative(data.started_at) : null;
  const headlineRelative = data.status === "running" ? startedRelative : finishedRelative;
  const totalFunds = data.total_funds;
  const updatedCount = data.total_updated;

  const summaryLine =
    data.status === "running"
      ? `Started ${startedRelative ?? "now"}`
      : data.status === "idle"
      ? "No run yet"
      : `Auto-updated ${finishedRelative ?? "—"} · ${updatedCount}/${totalFunds}`;

  if (compact) {
    return (
      <HStack spacing={2}>
        <Icon as={visual.icon} boxSize={3.5} color={visual.color} />
        <Text fontSize="xs" color={subText}>{summaryLine}</Text>
        {data.status !== "running" && (
          <Text
            fontSize="xs"
            color="brand.500"
            cursor="pointer"
            onClick={() => triggerMutation.mutate()}
            _hover={{ textDecoration: "underline" }}
          >
            Run now
          </Text>
        )}
      </HStack>
    );
  }

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Box as="button" type="button" cursor="pointer" _focus={{ outline: "none", boxShadow: "outline" }} borderRadius="full">
          <Tooltip label="Auto NAV update — click for details" placement="top">
            <HStack
              spacing={2}
              px={3}
              py={1}
              bg={visual.bg}
              borderRadius="full"
              border="1px solid"
              borderColor={visual.border}
              transition="all 0.15s ease"
              _hover={{ filter: "brightness(0.97)" }}
            >
              {data.status === "running" ? (
                <Spinner size="xs" color={visual.color} />
              ) : (
                <Icon as={visual.icon} boxSize={3.5} color={visual.color} />
              )}
              <Text fontSize="xs" fontWeight="semibold" color={visual.color}>
                {visual.label}
              </Text>
              {headlineRelative && data.status !== "idle" && (
                <Text fontSize="xs" color={subText}>
                  · {headlineRelative}
                </Text>
              )}
              {data.status !== "running" && data.status !== "idle" && totalFunds > 0 && (
                <Text fontSize="xs" color={subText}>
                  · {updatedCount}/{totalFunds}
                </Text>
              )}
            </HStack>
          </Tooltip>
        </Box>
      </PopoverTrigger>
      <PopoverContent bg={popoverBg} borderRadius="lg" boxShadow="lg" maxW="340px" _focus={{ outline: "none" }}>
        <PopoverArrow bg={popoverBg} />
        <PopoverHeader fontWeight="bold" border="none" pb={2}>
          Auto NAV update
        </PopoverHeader>
        <PopoverBody pt={0}>
          <VStack align="stretch" spacing={2}>
            <DetailRow label="Status" value={visual.label} valueColor={visual.color} />
            <DetailRow label="Last run" value={formatAbsolute(data.finished_at ?? data.started_at)} />
            <DetailRow label="Triggered by" value={data.triggered_by ?? "—"} />
            <DetailRow label="Ledgers" value={String(data.total_ledgers)} />
            <DetailRow
              label="Funds updated"
              value={`${data.total_updated} / ${data.total_funds}`}
            />
            {data.total_failed > 0 && (
              <DetailRow label="Failed" value={String(data.total_failed)} valueColor={failedColor} />
            )}
            {data.error && (
              <Box mt={1}>
                <Text fontSize="xs" color={failedColor} noOfLines={3}>
                  {data.error}
                </Text>
              </Box>
            )}

            {data.ledgers.length > 0 && (
              <>
                <Divider my={1} />
                <Text fontSize="xs" color={mutedText} mb={1}>Per-ledger breakdown</Text>
                <VStack align="stretch" spacing={1}>
                  {data.ledgers.map((l) => (
                    <HStack key={l.ledger_id} justify="space-between" fontSize="xs">
                      <Text color={subText} noOfLines={1}>
                        {l.ledger_name ?? `Ledger ${l.ledger_id}`}
                      </Text>
                      <Text color={l.failed > 0 ? partialColor : subText} fontWeight="semibold">
                        {l.updated}/{l.total_funds}
                        {l.failed > 0 && ` · ${l.failed} failed`}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </>
            )}

            <Divider my={1} />
            <Button
              leftIcon={<Play size={14} />}
              size="sm"
              colorScheme="brand"
              onClick={() => triggerMutation.mutate()}
              isLoading={triggerMutation.isPending || data.status === "running"}
              loadingText={data.status === "running" ? "Running…" : "Starting…"}
              isDisabled={data.status === "running"}
            >
              Run now in background
            </Button>
            {triggerMutation.isError && (
              <Text fontSize="xs" color={failedColor}>
                Could not start a run. Try again in a moment.
              </Text>
            )}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

const DetailRow: FC<DetailRowProps> = ({ label, value, valueColor }) => {
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const defaultValueColor = useColorModeValue("gray.800", "gray.100");
  return (
    <HStack justify="space-between" fontSize="xs">
      <Text color={labelColor}>{label}</Text>
      <Text color={valueColor ?? defaultValueColor} fontWeight="semibold">
        {value}
      </Text>
    </HStack>
  );
};

export default NavUpdateStatusPill;
