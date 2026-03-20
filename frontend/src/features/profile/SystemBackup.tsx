import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  HStack,
  Tag,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Heading,
  Icon,
  Card,
  CardBody,
  SimpleGrid,
  Flex,
  IconButton,
  Tooltip,
  Badge,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  uploadBackup,
  downloadBackup,
} from "./api";
import { toastDefaults } from "@/components/shared/utils";
import { useColorModeValue } from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
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

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const SystemBackup: React.FC = () => {
  const toast = useToast();

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
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const {
    isOpen: isRestoreOpen,
    onOpen: onRestoreOpen,
    onClose: onRestoreClose,
  } = useDisclosure();

  const {
    isOpen: isUploadRestoreOpen,
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
      toast({
        ...toastDefaults,
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
          toast({
            ...toastDefaults,
            title: "Success",
            description: "Database backup completed.",
            status: "success",
          }),
        )
        .catch((err) =>
          toast({
            ...toastDefaults,
            title: "Error",
            description: err.message,
            status: "error",
            duration: 5000,
          }),
        );
    },
    onError: (error: Error) =>
      toast({
        ...toastDefaults,
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBackup,
    onSuccess: (_, variables) => {
      toast({
        ...toastDefaults,
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
          toast({
            ...toastDefaults,
            title: "Success",
            description: "Backup file deleted.",
            status: "success",
          }),
        )
        .catch((err) =>
          toast({
            ...toastDefaults,
            title: "Error",
            description: err.message,
            status: "error",
            duration: 5000,
          }),
        );
    },
    onError: (error: Error) =>
      toast({
        ...toastDefaults,
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      }),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreBackup,
    onSuccess: () => {
      toast({
        ...toastDefaults,
        title: "Restore Started",
        description: "Please wait, the system will restart.",
        status: "info",
      });
      setIsRestoring(true);
      const checkFn = async () => {
        try {
          await queryClient.refetchQueries({ queryKey: ["backups"] });
          return true;
        } catch {
          return false;
        }
      };
      poll(checkFn, 60000, 3000)
        .then(() => {
          toast({
            ...toastDefaults,
            title: "Success",
            description: "Database restore completed successfully.",
            status: "success",
          });
          queryClient.invalidateQueries({ queryKey: ["backups"] });
        })
        .catch(() =>
          toast({
            ...toastDefaults,
            title: "Error",
            description: "Restore process timed out or failed.",
            status: "error",
            duration: 5000,
          }),
        )
        .finally(() => setIsRestoring(false));
    },
    onError: (error: Error) =>
      toast({
        ...toastDefaults,
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadBackup,
    onSuccess: (data) => {
      toast({
        ...toastDefaults,
        title: "Upload Successful",
        description: data.message,
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      handleRestoreClick(data.filename);
    },
    onError: (error: Error) =>
      toast({
        ...toastDefaults,
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
      toast({
        ...toastDefaults,
        title: "Download Started",
        description: `Downloading ${filename}`,
        status: "success",
      });
    } catch {
      toast({
        ...toastDefaults,
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
        <VStack spacing={5} py={12}>
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
              <Icon as={Database} color={iconColor} boxSize={7} />
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
          <VStack spacing={5}>
            <Spinner size="xl" color="brand.400" thickness="3px" />
            <VStack spacing={1}>
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
        <VStack spacing={{ base: 6, md: 8 }} align="stretch" maxW="4xl">
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HStack spacing={3} mb={1}>
              <Box
                w={10}
                h={10}
                borderRadius="lg"
                bg={iconBg}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={ShieldCheck} color={iconColor} boxSize={5} />
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
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              {/* Create Backup Card */}
              <Card
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
                <CardBody px={5} py={5}>
                  <HStack spacing={4}>
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
                        <Icon as={Plus} color={iconColor} boxSize={5} strokeWidth={2.5} />
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
                </CardBody>
              </Card>

              {/* Upload & Restore Card */}
              <Card
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
                <CardBody px={5} py={5}>
                  <HStack spacing={4}>
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
                        <Icon as={Upload} color={uploadIconColor} boxSize={5} strokeWidth={2.5} />
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
                </CardBody>
              </Card>
            </SimpleGrid>
            <input
              type="file"
              accept=".dump"
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
              <Card
                bg={errorBg}
                borderRadius="xl"
                border="1px"
                borderColor={errorBorderColor}
                shadow="none"
              >
                <CardBody px={5} py={4}>
                  <HStack spacing={3}>
                    <Icon as={AlertTriangle} color={errorTextColor} boxSize={5} />
                    <Text color={errorTextColor} fontWeight="500" fontSize="sm">
                      Failed to load backups. Please try again.
                    </Text>
                  </HStack>
                </CardBody>
              </Card>
            )}

            {backups && backups.length > 0 && (
              <VStack spacing={3} align="stretch">
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
                      <CardBody px={{ base: 4, md: 5 }} py={{ base: 3, md: 4 }}>
                        <Flex
                          direction={{ base: "column", md: "row" }}
                          justify="space-between"
                          align={{ base: "stretch", md: "center" }}
                          gap={{ base: 3, md: 4 }}
                        >
                          {/* File info */}
                          <HStack spacing={3} flex={1} minW={0}>
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
                              <Icon as={HardDrive} color={iconColor} boxSize={5} />
                            </Box>
                            <Box flex={1} minW={0}>
                              <Text
                                fontSize="sm"
                                fontWeight="600"
                                color={textColor}
                                noOfLines={1}
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
                            spacing={2}
                            flexShrink={0}
                            justify={{ base: "flex-end", md: "flex-end" }}
                          >
                            <Tooltip label="Download" hasArrow placement="top">
                              <IconButton
                                aria-label="Download backup"
                                icon={<Icon as={Download} boxSize={4} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                borderRadius="lg"
                                onClick={() => handleDownloadClick(file)}
                              />
                            </Tooltip>
                            <Tooltip label="Restore" hasArrow placement="top">
                              <IconButton
                                aria-label="Restore backup"
                                icon={<Icon as={RotateCcw} boxSize={4} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="brand"
                                borderRadius="lg"
                                onClick={() => handleRestoreClick(file)}
                              />
                            </Tooltip>
                            <Tooltip label="Delete" hasArrow placement="top">
                              <IconButton
                                aria-label="Delete backup"
                                icon={<Icon as={Trash2} boxSize={4} />}
                                size="sm"
                                variant="ghost"
                                color={dangerColor}
                                borderRadius="lg"
                                onClick={() => deleteMutation.mutate(file)}
                                _hover={{ bg: deleteIconHoverBg }}
                              />
                            </Tooltip>
                          </HStack>
                        </Flex>
                      </CardBody>
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
                <Card
                  bg={emptyBg}
                  borderRadius="xl"
                  border="1px dashed"
                  borderColor={emptyBorderColor}
                  shadow="none"
                >
                  <CardBody px={6} py={10}>
                    <VStack spacing={3}>
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
                          <Icon as={Database} color={iconColor} boxSize={7} />
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
                    </VStack>
                  </CardBody>
                </Card>
              </MotionBox>
            )}
          </Box>
        </VStack>
      </Box>

      {/* Restore Confirmation Modal */}
      <Modal isOpen={isRestoreOpen} returnFocusOnClose={false} onClose={onRestoreClose} isCentered size="md">
        <ModalOverlay bg={overlayBg} backdropFilter="blur(4px)" />
        <ModalContent
          bg={modalBg}
          border="1px"
          borderColor={modalBorderColor}
          borderRadius="xl"
          mx={4}
        >
          <ModalHeader color={textColor} pb={2} fontSize="lg">
            Confirm Restore
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color={subtitleColor} fontSize="sm">
              Are you sure you want to restore the database from
            </Text>
            <Tag colorScheme="brand" size="sm" mt={2} fontFamily="mono">
              {selectedFile}
            </Tag>
            <HStack mt={5} spacing={2} align="flex-start">
              <Icon as={AlertTriangle} color={dangerColor} boxSize={4} mt={0.5} flexShrink={0} />
              <Text fontSize="sm" fontWeight="500" color={dangerColor}>
                This will overwrite all current data. This action cannot be undone.
              </Text>
            </HStack>
          </ModalBody>
          <ModalFooter pt={4}>
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
              colorScheme="red"
              onClick={confirmRestore}
              isLoading={restoreMutation.isPending}
              size="sm"
              borderRadius="lg"
              leftIcon={<Icon as={RotateCcw} boxSize={3.5} />}
            >
              Restore
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Upload and Restore Confirmation Modal */}
      <Modal isOpen={isUploadRestoreOpen} returnFocusOnClose={false} onClose={onUploadRestoreClose} isCentered size="md">
        <ModalOverlay bg={overlayBg} backdropFilter="blur(4px)" />
        <ModalContent
          bg={modalBg}
          border="1px"
          borderColor={modalBorderColor}
          borderRadius="xl"
          mx={4}
        >
          <ModalHeader color={textColor} pb={2} fontSize="lg">
            Upload & Restore
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color={subtitleColor} fontSize="sm">
              You are about to upload and restore from:
            </Text>
            <Tag mt={2} colorScheme="green" size="sm" fontFamily="mono">
              {fileToUpload?.name}
            </Tag>
            <HStack mt={5} spacing={2} align="flex-start">
              <Icon as={AlertTriangle} color={dangerColor} boxSize={4} mt={0.5} flexShrink={0} />
              <Text fontSize="sm" fontWeight="500" color={dangerColor}>
                This will upload the file and immediately begin restoring, overwriting all current
                data. This cannot be undone.
              </Text>
            </HStack>
          </ModalBody>
          <ModalFooter pt={4}>
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
              colorScheme="red"
              onClick={confirmUploadAndRestore}
              isLoading={uploadMutation.isPending}
              size="sm"
              borderRadius="lg"
              leftIcon={<Icon as={Upload} boxSize={3.5} />}
            >
              Upload & Restore
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SystemBackup;
