import React, { useState, useRef, useEffect } from "react";
import { useColorModeValue } from "../../components/ui/color-mode";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  VStack,
  Text,
  HStack,
  Tag,
  useDisclosure,
  Spinner,
  Heading,
  Icon,
  Card,
  SimpleGrid,
  Flex,
  IconButton,
  Badge,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { Tooltip } from '@/components/ui/tooltip';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  uploadBackup,
  downloadBackup,
  getRestoreStatus,
  resetRestoreStatus,
  type RestoreStatus,
} from "./api";
import { setAuthToken, setRefreshToken } from "@/lib/api";
import { notify } from "@/components/shared/notify";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Database,
  Trash2,
  RotateCcw,
  Plus,
  Upload,
  Download,
  HardDrive,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card.Root);

const SystemBackup: React.FC = () => {
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "cardDarkBg");
  const cardBorderColor = useColorModeValue("gray.200", "gray.700");
  const cardHoverBorderColor = useColorModeValue("brand.200", "brand.700");
  const errorBg = useColorModeValue("red.50", "rgba(254,178,178,0.06)");
  const errorBorderColor = useColorModeValue("red.200", "red.800");
  const errorTextColor = useColorModeValue("red.600", "red.300");
  const emptyBg = useColorModeValue("gray.50", "gray.800");
  const emptyBorderColor = useColorModeValue("gray.200", "gray.700");
  const emptyTextColor = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("brand.50", "rgba(56,178,172,0.1)");
  const iconColor = useColorModeValue("brand.600", "brand.300");
  const actionCardBg = useColorModeValue("brand.50", "rgba(56,178,172,0.06)");
  const actionCardBorder = useColorModeValue("brand.100", "brand.800");
  const uploadCardBg = useColorModeValue("purple.50", "rgba(159,122,234,0.06)");
  const uploadCardBorder = useColorModeValue("purple.100", "purple.800");
  const uploadIconColor = useColorModeValue("purple.500", "purple.300");
  const uploadIconBg = useColorModeValue("purple.50", "rgba(159,122,234,0.1)");
  const filenameBg = useColorModeValue("gray.50", "gray.800");
  const sectionLabelColor = useColorModeValue("gray.400", "gray.500");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorderColor = useColorModeValue("gray.200", "gray.700");
  const overlayBg = useColorModeValue("blackAlpha.600", "blackAlpha.700");
  const dangerColor = useColorModeValue("red.500", "red.300");
  const deleteIconHoverBg = useColorModeValue("red.50", "rgba(254,178,178,0.1)");
  const indexBadgeBg = useColorModeValue("gray.100", "gray.700");
  const indexBadgeColor = useColorModeValue("gray.500", "gray.400");

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const {
    open: isRestoreOpen,
    onOpen: onRestoreOpen,
    onClose: onRestoreClose,
  } = useDisclosure();

  const {
    open: isUploadRestoreOpen,
    onOpen: onUploadRestoreOpen,
    onClose: onUploadRestoreClose,
  } = useDisclosure();

  const {
    data: backups,
    isLoading,
    isError,
  } = useQuery<string[], Error>({
    queryKey: ["backups"],
    queryFn: getBackups,
  });

  const poll = (
    check: () => Promise<boolean>,
    timeout = 30000,
    interval = 2000,
  ) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      const intervalId = setInterval(async () => {
        if (Date.now() - startTime > timeout) {
          clearInterval(intervalId);
          reject(new Error("Operation timed out."));
          return;
        }
        if (await check()) {
          clearInterval(intervalId);
          resolve();
        }
      }, interval);
    });
  };

  const createMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: (data) => {
      notify({
        title: "Backup Started",
        description: `Creating backup: ${data.filename}`,
        status: "info",
      });
      const checkFn = async () => {
        await queryClient.invalidateQueries({ queryKey: ["backups"] });
        const newBackups = queryClient.getQueryData<string[]>(["backups"]);
        return newBackups?.includes(data.filename) || false;
      };
      poll(checkFn)
        .then(() =>
          notify({
            title: "Success",
            description: "Database backup completed.",
            status: "success",
          }),
        )
        .catch((err) =>
          notify({
            title: "Error",
            description: err.message,
            status: "error",
            duration: 5000,
          }),
        );
    },
    onError: (error: Error) =>
      notify({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBackup,
    onSuccess: (_, variables) => {
      notify({
        title: "Deletion Started",
        description: `Deleting backup: ${variables}`,
        status: "info",
      });
      const checkFn = async () => {
        await queryClient.invalidateQueries({ queryKey: ["backups"] });
        const newBackups = queryClient.getQueryData<string[]>(["backups"]);
        return !newBackups?.includes(variables);
      };
      poll(checkFn)
        .then(() =>
          notify({
            title: "Success",
            description: "Backup file deleted.",
            status: "success",
          }),
        )
        .catch((err) =>
          notify({
            title: "Error",
            description: err.message,
            status: "error",
            duration: 5000,
          }),
        );
    },
    onError: (error: Error) =>
      notify({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      }),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreBackup,
    onSuccess: () => {
      notify({
        title: "Restore Started",
        description: "Please wait, the system will restart.",
        status: "info",
      });
      setIsRestoring(true);
      setRestoreStatus(null);
      // Poll restore status every 2s
      const intervalId = setInterval(async () => {
        try {
          const status = await getRestoreStatus();
          setRestoreStatus(status);
          if (status.state === "restore_complete" || status.state === "restore_failed") {
            clearInterval(intervalId);
            setIsRestoring(false);
          }
        } catch {
          // Ignore polling errors during restore — server may be restarting
        }
      }, 2000);
      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(intervalId);
        setIsRestoring(false);
      }, 300000);
    },
    onError: (error: Error) =>
      notify({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      }),
  });

  // Watch restore status for completion or failure
  useEffect(() => {
    if (!restoreStatus) return;
    if (restoreStatus.state === "restore_failed") {
      notify({
        title: "Restore Failed",
        description: restoreStatus.error || "Unknown error during restore",
        status: "error",
        duration: 10000,
      });
      resetRestoreStatus().catch(() => {});
    }
  }, [restoreStatus]);

  const uploadMutation = useMutation({
    mutationFn: uploadBackup,
    onSuccess: (data) => {
      notify({
        title: "Upload Successful",
        description: data.message,
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      handleRestoreClick(data.filename);
    },
    onError: (error: Error) =>
      notify({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      }),
  });

  const handleRestoreClick = (filename: string) => {
    setSelectedFile(filename);
    onRestoreOpen();
  };

  const confirmRestore = () => {
    if (selectedFile) {
      restoreMutation.mutate(selectedFile);
      onRestoreClose();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      onUploadRestoreOpen();
    }
    event.target.value = "";
  };

  const confirmUploadAndRestore = () => {
    if (fileToUpload) {
      uploadMutation.mutate(fileToUpload);
    }
    onUploadRestoreClose();
  };

  const handleDownloadClick = async (filename: string) => {
    try {
      await downloadBackup(filename);
      notify({
        title: "Download Started",
        description: `Downloading ${filename}`,
        status: "success",
      });
    } catch {
      notify({
        title: "Download Failed",
        description: "Failed to download the backup file. Please try again.",
        status: "error",
        duration: 5000,
      });
    }
  };

  /** Try to extract a readable date from the backup filename */
  const parseBackupDate = (filename: string): string | null => {
    // Match patterns like 2025-03-19, 2025_03_19, 20250319
    const match = filename.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})[-_T]?(\d{2})[-_:]?(\d{2})/);
    if (match) {
      const [, y, mo, d, h, mi] = match;
      const date = new Date(`${y}-${mo}-${d}T${h}:${mi}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <Box w="full" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
        <VStack gap={5} py={12}>
          <MotionBox
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Box
              w={14}
              h={14}
              borderRadius="xl"
              bg={iconBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon color={iconColor} boxSize={7} asChild><Database /></Icon>
            </Box>
          </MotionBox>
          <Text color={subtitleColor} fontSize="md" fontWeight="500">
            Loading backups...
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box position="relative" w="full">
      {/* Full-screen restore overlay */}
      {isRestoring && (
        <Flex
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.800"
          zIndex="modal"
          align="center"
          justify="center"
          backdropFilter="blur(4px)"
        >
          <VStack gap={5}>
            <Spinner size="xl" color="brand.400" borderWidth="3px" />
            <VStack gap={1}>
              <Heading size="md" color="white">
                Restoring database...
              </Heading>
              <Text color="whiteAlpha.700" fontSize="sm">
                Please wait, this may take a moment.
              </Text>
            </VStack>
          </VStack>
        </Flex>
      )}

      <Box px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }}>
        <VStack gap={{ base: 6, md: 8 }} align="stretch" maxW="4xl">
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HStack gap={3} mb={1}>
              <Box
                w={10}
                h={10}
                borderRadius="lg"
                bg={iconBg}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon color={iconColor} boxSize={5} asChild><ShieldCheck /></Icon>
              </Box>
              <Box>
                <Heading size="md" color={textColor} fontWeight="700">
                  Database Backups
                </Heading>
                <Text fontSize="sm" color={subtitleColor} mt={0.5}>
                  Create, restore, or manage your database backup files.
                </Text>
              </Box>
            </HStack>
          </MotionBox>

          {/* Action Cards */}
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
          >
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
              {/* Create Backup Card */}
              <Card.Root
                bg={actionCardBg}
                border="1px"
                borderColor={actionCardBorder}
                borderRadius="xl"
                shadow="none"
                cursor="pointer"
                onClick={() => !createMutation.isPending && createMutation.mutate()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!createMutation.isPending) createMutation.mutate();
                  }
                }}
                _hover={{
                  shadow: "md",
                  borderColor: iconColor,
                  transform: "translateY(-2px)",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.2s"
                opacity={createMutation.isPending ? 0.7 : 1}
                pointerEvents={createMutation.isPending ? "none" : "auto"}
              >
                <Card.Body px={5} py={5}>
                  <HStack gap={4}>
                    <Box
                      w={11}
                      h={11}
                      borderRadius="lg"
                      bg={iconBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      {createMutation.isPending ? (
                        <Spinner size="sm" color={iconColor} />
                      ) : (
                        <Icon color={iconColor} boxSize={5} strokeWidth={2.5} asChild><Plus /></Icon>
                      )}
                    </Box>
                    <Box>
                      <Text fontWeight="600" fontSize="md" color={textColor}>
                        Create Backup
                      </Text>
                      <Text fontSize="xs" color={subtitleColor} mt={0.5}>
                        Snapshot your current database
                      </Text>
                    </Box>
                  </HStack>
                </Card.Body>
              </Card.Root>

              {/* Upload & Restore Card */}
              <Card.Root
                bg={uploadCardBg}
                border="1px"
                borderColor={uploadCardBorder}
                borderRadius="xl"
                shadow="none"
                cursor="pointer"
                onClick={() => !uploadMutation.isPending && inputFileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!uploadMutation.isPending) inputFileRef.current?.click();
                  }
                }}
                _hover={{
                  shadow: "md",
                  borderColor: uploadIconColor,
                  transform: "translateY(-2px)",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.2s"
                opacity={uploadMutation.isPending ? 0.7 : 1}
                pointerEvents={uploadMutation.isPending ? "none" : "auto"}
              >
                <Card.Body px={5} py={5}>
                  <HStack gap={4}>
                    <Box
                      w={11}
                      h={11}
                      borderRadius="lg"
                      bg={uploadIconBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      {uploadMutation.isPending ? (
                        <Spinner size="sm" color={uploadIconColor} />
                      ) : (
                        <Icon color={uploadIconColor} boxSize={5} strokeWidth={2.5} asChild><Upload /></Icon>
                      )}
                    </Box>
                    <Box>
                      <Text fontWeight="600" fontSize="md" color={textColor}>
                        Upload & Restore
                      </Text>
                      <Text fontSize="xs" color={subtitleColor} mt={0.5}>
                        Restore from an external .dump file
                      </Text>
                    </Box>
                  </HStack>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>
            <input
              type="file"
              accept=".sql,.gz,.sql.gz"
              ref={inputFileRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </MotionBox>

          {/* Available Backups */}
          <Box>
            <HStack mb={4} justify="space-between" align="center">
              <Text
                fontSize="xs"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="wider"
                color={sectionLabelColor}
              >
                Available Backups
              </Text>
              {backups && backups.length > 0 && (
                <Badge
                  bg={indexBadgeBg}
                  color={indexBadgeColor}
                  fontSize="xs"
                  fontWeight="600"
                  borderRadius="full"
                  px={2.5}
                  py={0.5}
                >
                  {backups.length}
                </Badge>
              )}
            </HStack>

            {isError && (
              <Card.Root
                bg={errorBg}
                borderRadius="xl"
                border="1px"
                borderColor={errorBorderColor}
                shadow="none"
              >
                <Card.Body px={5} py={4}>
                  <HStack gap={3}>
                    <Icon color={errorTextColor} boxSize={5} asChild><AlertTriangle /></Icon>
                    <Text color={errorTextColor} fontWeight="500" fontSize="sm">
                      Failed to load backups. Please try again.
                    </Text>
                  </HStack>
                </Card.Body>
              </Card.Root>
            )}

            {backups && backups.length > 0 && (
              <VStack gap={3} align="stretch">
                {backups.map((file, index) => {
                  const dateStr = parseBackupDate(file);
                  return (
                    <MotionCard
                      key={file}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      bg={cardBg}
                      borderRadius="xl"
                      border="1px"
                      borderColor={cardBorderColor}
                      shadow="sm"
                      _hover={{
                        borderColor: cardHoverBorderColor,
                        shadow: "md",
                      }}
                      // @ts-expect-error chakra transition prop conflicts with framer-motion
                      cssTransition="border-color 0.2s, box-shadow 0.2s"
                    >
                      <Card.Body px={{ base: 4, md: 5 }} py={{ base: 3, md: 4 }}>
                        <Flex
                          direction={{ base: "column", md: "row" }}
                          justify="space-between"
                          align={{ base: "stretch", md: "center" }}
                          gap={{ base: 3, md: 4 }}
                        >
                          {/* File info */}
                          <HStack gap={3} flex={1} minW={0}>
                            <Box
                              w={10}
                              h={10}
                              borderRadius="lg"
                              bg={iconBg}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexShrink={0}
                            >
                              <Icon color={iconColor} boxSize={5} asChild><HardDrive /></Icon>
                            </Box>
                            <Box flex={1} minW={0}>
                              <Text
                                fontSize="sm"
                                fontWeight="600"
                                color={textColor}
                                lineClamp={1}
                              >
                                <Box
                                  as="span"
                                  bg={filenameBg}
                                  px={2}
                                  py={0.5}
                                  borderRadius="md"
                                  fontFamily="mono"
                                  fontSize="xs"
                                >
                                  {file}
                                </Box>
                              </Text>
                              {dateStr && (
                                <Text fontSize="xs" color={subtitleColor} mt={1}>
                                  {dateStr}
                                </Text>
                              )}
                            </Box>
                          </HStack>

                          {/* Actions */}
                          <HStack
                            gap={2}
                            flexShrink={0}
                            justify={{ base: "flex-end", md: "flex-end" }}
                          >
                            <Tooltip content="Download" showArrow positioning={{
                              placement: "top"
                            }}>
                              <IconButton
                                aria-label="Download backup"
                                size="sm"
                                variant="ghost"
                                colorPalette="blue"
                                borderRadius="lg"
                                onClick={() => handleDownloadClick(file)}><Icon boxSize={4} asChild><Download /></Icon></IconButton>
                            </Tooltip>
                            <Tooltip content="Restore" showArrow positioning={{
                              placement: "top"
                            }}>
                              <IconButton
                                aria-label="Restore backup"
                                size="sm"
                                variant="ghost"
                                colorPalette="brand"
                                borderRadius="lg"
                                onClick={() => handleRestoreClick(file)}><Icon boxSize={4} asChild><RotateCcw /></Icon></IconButton>
                            </Tooltip>
                            <Tooltip content="Delete" showArrow positioning={{
                              placement: "top"
                            }}>
                              <IconButton
                                aria-label="Delete backup"
                                size="sm"
                                variant="ghost"
                                color={dangerColor}
                                borderRadius="lg"
                                onClick={() => deleteMutation.mutate(file)}
                                _hover={{ bg: deleteIconHoverBg }}><Icon boxSize={4} asChild><Trash2 /></Icon></IconButton>
                            </Tooltip>
                          </HStack>
                        </Flex>
                      </Card.Body>
                    </MotionCard>
                  );
                })}
              </VStack>
            )}

            {backups?.length === 0 && !isLoading && (
              <MotionBox
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card.Root
                  bg={emptyBg}
                  borderRadius="xl"
                  border="1px dashed"
                  borderColor={emptyBorderColor}
                  shadow="none"
                >
                  <Card.Body px={6} py={10}>
                    <VStack gap={3}>
                      <MotionBox
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Box
                          w={14}
                          h={14}
                          borderRadius="2xl"
                          bg={iconBg}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon color={iconColor} boxSize={7} asChild><Database /></Icon>
                        </Box>
                      </MotionBox>
                      <Text
                        color={textColor}
                        fontSize="md"
                        fontWeight="600"
                        textAlign="center"
                      >
                        No backups yet
                      </Text>
                      <Text
                        color={emptyTextColor}
                        fontSize="sm"
                        textAlign="center"
                        maxW="xs"
                      >
                        Create your first backup to safeguard your data.
                      </Text>
                      <Text
                        color={emptyTextColor}
                        fontSize="xs"
                        textAlign="center"
                        maxW="sm"
                        mt={1}
                      >
                        Lost access? Use{" "}
                        <Box as="code" bg={filenameBg} px={1.5} py={0.5} borderRadius="md" fontSize="xs">
                          ./cashio-backup restore &lt;file&gt;
                        </Box>{" "}
                        from the command line.
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </MotionBox>
            )}
          </Box>
        </VStack>
      </Box>

      {/* Restore Confirmation Modal */}
      <Dialog.Root
        open={isRestoreOpen}
        placement='center'
        size='md'
        onOpenChange={e => {
          if (!e.open) {
            onRestoreClose();
          }
        }}>
        <Portal>

          <Dialog.Backdrop bg={overlayBg} backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg={modalBg}
              border="1px"
              borderColor={modalBorderColor}
              borderRadius="xl"
              mx={4}>
              <Dialog.Header color={textColor} pb={2} fontSize="lg">
                Confirm Restore
              </Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body>
                <Text color={subtitleColor} fontSize="sm">
                  Are you sure you want to restore the database from
                </Text>
                <Tag.Root colorPalette="brand" size="sm" mt={2} fontFamily="mono">
                  <Tag.Label>{selectedFile}</Tag.Label>
                </Tag.Root>
                <HStack mt={5} gap={2} align="flex-start">
                  <Icon color={dangerColor} boxSize={4} mt={0.5} flexShrink={0} asChild><AlertTriangle /></Icon>
                  <Text fontSize="sm" fontWeight="500" color={dangerColor}>
                    This will overwrite all current data. This action cannot be undone.
                  </Text>
                </HStack>
              </Dialog.Body>
              <Dialog.Footer pt={4}>
                <Button
                  variant="ghost"
                  mr={3}
                  onClick={onRestoreClose}
                  size="sm"
                  borderRadius="lg"
                  color={subtitleColor}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  onClick={confirmRestore}
                  loading={restoreMutation.isPending}
                  size="sm"
                  borderRadius="lg"><Icon boxSize={3.5} asChild><RotateCcw /></Icon>Restore
                              </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>

        </Portal>
      </Dialog.Root>

      {/* Upload and Restore Confirmation Modal */}
      <Dialog.Root
        open={isUploadRestoreOpen}
        placement='center'
        size='md'
        onOpenChange={e => {
          if (!e.open) {
            onUploadRestoreClose();
          }
        }}>
        <Portal>

          <Dialog.Backdrop bg={overlayBg} backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg={modalBg}
              border="1px"
              borderColor={modalBorderColor}
              borderRadius="xl"
              mx={4}>
              <Dialog.Header color={textColor} pb={2} fontSize="lg">
                Upload & Restore
              </Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body>
                <Text color={subtitleColor} fontSize="sm">
                  You are about to upload and restore from:
                </Text>
                <Tag.Root mt={2} colorPalette="green" size="sm" fontFamily="mono">
                  <Tag.Label>{fileToUpload?.name}</Tag.Label>
                </Tag.Root>
                <HStack mt={5} gap={2} align="flex-start">
                  <Icon color={dangerColor} boxSize={4} mt={0.5} flexShrink={0} asChild><AlertTriangle /></Icon>
                  <Text fontSize="sm" fontWeight="500" color={dangerColor}>
                    This will upload the file and immediately begin restoring, overwriting all current
                    data. This cannot be undone.
                  </Text>
                </HStack>
              </Dialog.Body>
              <Dialog.Footer pt={4}>
                <Button
                  variant="ghost"
                  mr={3}
                  onClick={onUploadRestoreClose}
                  size="sm"
                  borderRadius="lg"
                  color={subtitleColor}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  onClick={confirmUploadAndRestore}
                  loading={uploadMutation.isPending}
                  size="sm"
                  borderRadius="lg"><Icon boxSize={3.5} asChild><Upload /></Icon>Upload & Restore
                              </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>

        </Portal>
      </Dialog.Root>

      {/* Restore Complete Modal */}
      <Dialog.Root
        open={restoreStatus?.state === "restore_complete"}
        placement='center'
        closeOnInteractOutside={false}
        closeOnEscape={false}
        size='md'
      >
        <Portal>

          <Dialog.Backdrop bg={overlayBg} backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg={modalBg}
              border="1px"
              borderColor="green.300"
              borderRadius="xl"
              mx={4}>
              <Dialog.Body pt={8} pb={6} textAlign="center">
                <VStack gap={4}>
                  <Box
                    w={16}
                    h={16}
                    borderRadius="full"
                    bg="green.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon color="green.500" boxSize={9} asChild><CheckCircle /></Icon>
                  </Box>
                  <Heading size="md" color={textColor}>
                    Restore Complete
                  </Heading>
                  <Text color={subtitleColor} fontSize="sm" maxW="sm">
                    Database restored successfully. Your session has expired. Please log in with your
                    credentials.
                  </Text>
                  <Button
                    colorPalette="brand"
                    size="lg"
                    borderRadius="lg"
                    mt={2}
                    onClick={() => {
                      setAuthToken(null);
                      setRefreshToken(null);
                      navigate("/login");
                    }}
                  >
                    Go to Login
                  </Button>
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>

        </Portal>
      </Dialog.Root>

      {/* Restore Failed Modal */}
      <Dialog.Root
        open={restoreStatus?.state === "restore_failed"}
        placement='center'
        size='md'
        onOpenChange={e => {
          if (!e.open) {
            resetRestoreStatus().catch(() => {});
            setRestoreStatus(null);
          }
        }}
      >
        <Portal>

          <Dialog.Backdrop bg={overlayBg} backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content bg={modalBg} border="1px" borderColor="red.300" borderRadius="xl" mx={4}>
              <Dialog.Header color={textColor} pb={2} fontSize="lg">
                Restore Failed
              </Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body>
                <HStack gap={2} align="flex-start">
                  <Icon color={dangerColor} boxSize={5} mt={0.5} flexShrink={0} asChild><AlertTriangle /></Icon>
                  <Text color={textColor} fontSize="sm">
                    {restoreStatus?.error || "An unknown error occurred during restore."}
                  </Text>
                </HStack>
              </Dialog.Body>
              <Dialog.Footer pt={4}>
                <Button
                  variant="solid"
                  colorPalette="brand"
                  onClick={() => {
                    resetRestoreStatus().catch(() => {});
                    setRestoreStatus(null);
                  }}
                  size="sm"
                  borderRadius="lg"
                >
                  Dismiss
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>

        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default SystemBackup;
