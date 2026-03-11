import React, { useEffect } from "react";
import { Save, User, Mail, Calendar, Clock } from "lucide-react";
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
  Divider,
  Card,
  CardBody,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";
import { useUpdateUserProfile, useUserProfile } from "./hooks";
import { UserUpdate } from "./api";

const UpdateProfileForm: React.FC = () => {
  const toast = useToast();

   const textColor = useColorModeValue("gray.700", "gray.200");
   const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
   const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputReadOnlyBg = useColorModeValue("gray.50", "gray.800");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const inputHoverBorderColor = useColorModeValue("gray.300", "gray.500");
  const focusBorderColor = useColorModeValue("teal.400", "teal.300");
  const focusBoxShadow = useColorModeValue("0 0 0 3px rgba(56, 178, 172, 0.1)", "0 0 0 3px rgba(49, 151, 149, 0.6)");
  const iconColor = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const cardBorderColor = useColorModeValue("gray.100", "gray.600");
  const cardIconBgGreen = useColorModeValue("green.100", "green.900");
  const cardIconColorGreen = useColorModeValue("green.600", "green.300");
  const cardIconBgBlue = useColorModeValue("blue.100", "blue.900");
   const cardIconColorBlue = useColorModeValue("blue.600", "blue.300");
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

  if (isUserLoading) {
    return (
      <Box w="full" px={{ base: 6, md: 8 }} py={{ base: 6, md: 8 }}>
        <VStack spacing={4} py={8}>
          <Box
            w={12}
            h={12}
            borderRadius="full"
            bg={cardIconBgGreen}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={User} color={cardIconColorGreen} boxSize={6} />
          </Box>
          <Text color={secondaryTextColor} fontSize="lg">
            Loading your profile...
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box w="full">
      <Box px={{ base: 6, md: 8 }} py={{ base: 6, md: 8 }}>
        <VStack spacing={6} align="stretch" mb={8}>
          <Box>
             <Heading size="md" color={tertiaryTextColor}>Account Details</Heading>
             <Text mt={2} fontSize="sm" color={tertiaryTextColor}>
               Manage your personal information and account settings.
             </Text>
          </Box>
        </VStack>
        <Box as="form" onSubmit={handleSubmit(onSubmit)} maxW="2xl">
          <VStack spacing={8} align="stretch">
            {/* Form Fields */}
            <Box>
              <VStack spacing={6} align="stretch">
                {/* Username - First Row */}
                <Box
                  display={{ base: "block", lg: "grid" }}
                  gridTemplateColumns="1fr 1fr"
                  gap={8}
                >
                  <FormControl>
                     <FormLabel
                       fontSize="sm"
                       fontWeight="600"
                       color={tertiaryTextColor}
                       mb={3}
                     >
                       <HStack spacing={2}>
                         <Icon as={User} boxSize={4} color={iconColor} />
                         <Text>Username</Text>
                       </HStack>
                     </FormLabel>
                    <Input
                      type="text"
                      value={user?.username}
                      isReadOnly
                      bg={inputReadOnlyBg}
                      borderColor={inputBorderColor}
                      borderRadius="md"
                      h="52px"
                      fontSize="md"
                      fontWeight="500"
                      color={textColor}
                      _hover={{ borderColor: inputHoverBorderColor }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: focusBoxShadow,
                      }}
                    />
                  </FormControl>
                </Box>

                 {/* Full Name and Email - Side by Side */}
                 <Box
                   display={{ base: "flex", lg: "grid" }}
                   flexDirection={{ base: "column", lg: "row" }}
                   gridTemplateColumns="1fr 1fr"
                   gap={{ base: 6, lg: 8 }}
                 >
                   <FormControl>
                      <FormLabel
                        fontSize="sm"
                        fontWeight="600"
                        color={tertiaryTextColor}
                        mb={3}
                      >
                        <HStack spacing={2}>
                          <Icon as={User} boxSize={4} color={iconColor} />
                          <Text>Full Name</Text>
                        </HStack>
                      </FormLabel>
                    <Input
                      type="text"
                      {...register("full_name")}
                      bg={inputBg}
                      borderColor={inputBorderColor}
                      borderRadius="md"
                      h="52px"
                      fontSize="md"
                      _hover={{ borderColor: inputHoverBorderColor }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: focusBoxShadow,
                      }}
                    />
                  </FormControl>

                  <FormControl>
                     <FormLabel
                       fontSize="sm"
                       fontWeight="600"
                       color={tertiaryTextColor}
                       mb={3}
                     >
                       <HStack spacing={2}>
                         <Icon as={Mail} boxSize={4} color={iconColor} />
                         <Text>Email Address</Text>
                       </HStack>
                     </FormLabel>
                    <Input
                      type="email"
                      {...register("email")}
                      bg={inputBg}
                      borderColor={inputBorderColor}
                      borderRadius="md"
                      h="52px"
                      fontSize="md"
                      _hover={{ borderColor: inputHoverBorderColor }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: focusBoxShadow,
                      }}
                    />
                  </FormControl>
                </Box>
              </VStack>
            </Box>

            <Divider borderColor={inputBorderColor} />

            {/* Account Details Section */}
            <Box maxW={{ base: "full", lg: "75%" }}>
               <Text fontSize="sm" fontWeight="600" color={tertiaryTextColor} mb={4}>
                 Account Details
               </Text>
              <Card
                bg={cardBg}
                borderRadius="md"
                border="1px"
                borderColor={cardBorderColor}
              >
                <CardBody px={6} py={5}>
                  <HStack
                    spacing={8}
                    align="start"
                    flexDir={{ base: "column", md: "row" }}
                  >
                    <HStack spacing={3} flex={1}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="md"
                        bg={cardIconBgGreen}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={Calendar} color={cardIconColorGreen} boxSize={5} />
                      </Box>
                      <Box flex={1}>
                         <Text fontSize="sm" fontWeight="500" color={tertiaryTextColor}>
                           Account Created
                         </Text>
                         <Text fontSize="md" fontWeight="600" color={tertiaryTextColor}>
                           {user?.created_at
                             ? new Date(user.created_at).toLocaleDateString(
                                 "en-US",
                                 {
                                   year: "numeric",
                                   month: "long",
                                   day: "numeric",
                                 },
                               )
                             : "N/A"}
                         </Text>
                      </Box>
                    </HStack>

                    <HStack spacing={3} flex={1}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="md"
                        bg={cardIconBgBlue}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={Clock} color={cardIconColorBlue} boxSize={5} />
                      </Box>
                      <Box flex={1}>
                         <Text fontSize="sm" fontWeight="500" color={tertiaryTextColor}>
                           Last Updated
                         </Text>
                         <Text fontSize="md" fontWeight="600" color={tertiaryTextColor}>
                           {user?.updated_at
                             ? new Date(user.updated_at).toLocaleDateString(
                                 "en-US",
                                 {
                                   year: "numeric",
                                   month: "long",
                                   day: "numeric",
                                 },
                               )
                             : "N/A"}
                         </Text>
                      </Box>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            </Box>

            {/* Save Button */}
            <Box pt={4}>
              <Button
                type="submit"
                isLoading={isUpdating}
                loadingText="Saving changes..."
                colorScheme="teal"
                isDisabled={!isDirty}
                leftIcon={<Save size={20} />}
                size="lg"
                borderRadius="md"
                h="56px"
                fontSize="md"
                fontWeight="600"
                px={8}
                _hover={{
                  transform: "translateY(-1px)",
                  shadow: "lg",
                }}
                _active={{
                  transform: "translateY(0)",
                }}
                transition="all 0.2s"
                shadow="md"
              >
                Save Changes
              </Button>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default UpdateProfileForm;
