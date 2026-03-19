import React, { useEffect } from "react";
import { Save, User, Mail, Calendar, Clock, AtSign } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  VStack,
  Text,
  HStack,
  Icon,
  Heading,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useUpdateUserProfile, useUserProfile } from "./hooks";
import { UserUpdate } from "./api";

const MotionBox = motion(Box);

const UpdateProfileForm: React.FC = () => {
  const toast = useToast();

  const textColor = useColorModeValue("gray.800", "gray.100");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputReadOnlyBg = useColorModeValue("gray.50", "gray.800");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const inputHoverBorderColor = useColorModeValue("gray.300", "gray.500");
  const focusBorderColor = useColorModeValue("brand.400", "brand.300");
  const focusBoxShadow = useColorModeValue(
    "0 0 0 3px rgba(56, 178, 172, 0.1)",
    "0 0 0 3px rgba(49, 151, 149, 0.6)",
  );
  const iconColor = useColorModeValue("gray.400", "gray.500");
  const headerIconBg = useColorModeValue("brand.50", "rgba(56,178,172,0.1)");
  const headerIconColor = useColorModeValue("brand.600", "brand.300");
  const sectionLabelColor = useColorModeValue("gray.400", "gray.500");
  const metaCardBg = useColorModeValue("gray.50", "gray.800");
  const metaCardBorder = useColorModeValue("gray.200", "gray.700");
  const metaIconBg = useColorModeValue("brand.50", "rgba(56,178,172,0.1)");
  const metaIconColor = useColorModeValue("brand.500", "brand.300");
  const metaValueColor = useColorModeValue("gray.800", "gray.100");
  const readOnlyTextColor = useColorModeValue("gray.500", "gray.400");

  const { data: user, isLoading: isUserLoading } = useUserProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<UserUpdate>();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUserProfile();

  useEffect(() => {
    if (user) {
      reset(user);
    }
  }, [user, reset]);

  const onSubmit = (data: UserUpdate) => {
    updateUser(data, {
      onSuccess: () => {
        toast({
          title: "Profile updated.",
          description: "Your profile has been updated successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      },
      onError: () => {
        toast({
          title: "An error occurred.",
          description: "Unable to update your profile.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isUserLoading) {
    return (
      <Box w="full" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
        <VStack spacing={5} py={12}>
          <MotionBox
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Box
              w={14}
              h={14}
              borderRadius="xl"
              bg={headerIconBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={User} color={headerIconColor} boxSize={7} />
            </Box>
          </MotionBox>
          <Text color={subtitleColor} fontSize="md" fontWeight="500">
            Loading your profile...
          </Text>
        </VStack>
      </Box>
    );
  }

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
              <Icon as={User} color={headerIconColor} boxSize={5} />
            </Box>
            <Box>
              <Heading size="md" color={textColor} fontWeight="700">
                Account Details
              </Heading>
              <Text fontSize="sm" color={subtitleColor} mt={0.5}>
                Manage your personal information and account settings.
              </Text>
            </Box>
          </HStack>
        </MotionBox>

        {/* Form */}
        <MotionBox
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          maxW="2xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
        >
          <VStack spacing={6} align="stretch">
            {/* Username (read-only) */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color={labelColor} mb={2}>
                Username
              </FormLabel>
              <InputGroup>
                <InputLeftElement h="48px" pointerEvents="none">
                  <Icon as={AtSign} boxSize={4} color={iconColor} />
                </InputLeftElement>
                <Input
                  type="text"
                  value={user?.username || ""}
                  isReadOnly
                  bg={inputReadOnlyBg}
                  borderColor={inputBorderColor}
                  borderRadius="lg"
                  h="48px"
                  fontSize="sm"
                  fontWeight="500"
                  color={readOnlyTextColor}
                  pl={10}
                  cursor="default"
                  _hover={{ borderColor: inputBorderColor }}
                  _focus={{ borderColor: inputBorderColor, boxShadow: "none" }}
                />
              </InputGroup>
            </FormControl>

            {/* Full Name and Email */}
            <Box
              display={{ base: "flex", lg: "grid" }}
              flexDirection="column"
              gridTemplateColumns="1fr 1fr"
              gap={{ base: 5, lg: 8 }}
            >
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color={labelColor} mb={2}>
                  Full Name
                </FormLabel>
                <InputGroup>
                  <InputLeftElement h="48px" pointerEvents="none">
                    <Icon as={User} boxSize={4} color={iconColor} />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    {...register("full_name")}
                    bg={inputBg}
                    borderColor={inputBorderColor}
                    borderRadius="lg"
                    h="48px"
                    fontSize="sm"
                    pl={10}
                    _hover={{ borderColor: inputHoverBorderColor }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: focusBoxShadow,
                    }}
                    _placeholder={{ color: iconColor, fontSize: "sm" }}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color={labelColor} mb={2}>
                  Email Address
                </FormLabel>
                <InputGroup>
                  <InputLeftElement h="48px" pointerEvents="none">
                    <Icon as={Mail} boxSize={4} color={iconColor} />
                  </InputLeftElement>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...register("email")}
                    bg={inputBg}
                    borderColor={inputBorderColor}
                    borderRadius="lg"
                    h="48px"
                    fontSize="sm"
                    pl={10}
                    _hover={{ borderColor: inputHoverBorderColor }}
                    _focus={{
                      borderColor: focusBorderColor,
                      boxShadow: focusBoxShadow,
                    }}
                    _placeholder={{ color: iconColor, fontSize: "sm" }}
                  />
                </InputGroup>
              </FormControl>
            </Box>

            {/* Account Metadata */}
            <Box pt={2}>
              <Text
                fontSize="xs"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="wider"
                color={sectionLabelColor}
                mb={3}
              >
                Account Info
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <HStack
                  spacing={3}
                  bg={metaCardBg}
                  border="1px solid"
                  borderColor={metaCardBorder}
                  borderRadius="xl"
                  px={4}
                  py={3}
                >
                  <Box
                    w={9}
                    h={9}
                    borderRadius="lg"
                    bg={metaIconBg}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Icon as={Calendar} color={metaIconColor} boxSize={4} />
                  </Box>
                  <Box>
                    <Text fontSize="xs" color={subtitleColor} fontWeight="500">
                      Created
                    </Text>
                    <Text fontSize="sm" fontWeight="600" color={metaValueColor}>
                      {formatDate(user?.created_at)}
                    </Text>
                  </Box>
                </HStack>

                <HStack
                  spacing={3}
                  bg={metaCardBg}
                  border="1px solid"
                  borderColor={metaCardBorder}
                  borderRadius="xl"
                  px={4}
                  py={3}
                >
                  <Box
                    w={9}
                    h={9}
                    borderRadius="lg"
                    bg={metaIconBg}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Icon as={Clock} color={metaIconColor} boxSize={4} />
                  </Box>
                  <Box>
                    <Text fontSize="xs" color={subtitleColor} fontWeight="500">
                      Last Updated
                    </Text>
                    <Text fontSize="sm" fontWeight="600" color={metaValueColor}>
                      {formatDate(user?.updated_at)}
                    </Text>
                  </Box>
                </HStack>
              </SimpleGrid>
            </Box>

            {/* Save Button */}
            <Box pt={2}>
              <Button
                type="submit"
                isLoading={isUpdating}
                loadingText="Saving..."
                isDisabled={!isDirty}
                leftIcon={<Icon as={Save} boxSize={4} />}
                size="md"
                borderRadius="lg"
                h="48px"
                fontSize="sm"
                fontWeight="600"
                px={6}
                _hover={{
                  transform: "translateY(-1px)",
                  shadow: "md",
                }}
                _active={{
                  transform: "translateY(0)",
                }}
                transition="all 0.2s"
                shadow="sm"
              >
                Save Changes
              </Button>
            </Box>
          </VStack>
        </MotionBox>
      </Box>
    </Box>
  );
};

export default UpdateProfileForm;
