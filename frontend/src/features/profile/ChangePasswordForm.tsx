import React from "react";
import { KeyRound, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  VStack,
  FormErrorMessage,
  Text,
  HStack,
  Icon,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";
import { useChangePassword } from "./hooks";
import { ChangePassword } from "./api";

const ChangePasswordForm: React.FC = () => {
  const toast = useToast();

   const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const inputHoverBorderColor = useColorModeValue("gray.300", "gray.500");
  const focusBorderColor = useColorModeValue("teal.400", "teal.300");
  const focusBoxShadow = useColorModeValue("0 0 0 3px rgba(56, 178, 172, 0.1)", "0 0 0 3px rgba(49, 151, 149, 0.6)");
  const iconColor = useColorModeValue("gray.500", "gray.400");
  const errorMessageColor = useColorModeValue("red.500", "red.300");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangePassword>();
  const { mutate: changePassword, isPending } = useChangePassword();

  const currentPassword = watch("current_password");
  const newPassword = watch("new_password");
  const isButtonDisabled =
    !currentPassword || !newPassword || currentPassword === newPassword;

  const onSubmit = (data: ChangePassword) => {
    changePassword(data, {
      onSuccess: () => {
        toast({
          title: "Password changed.",
          description: "Your password has been changed successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        reset();
      },
      onError: (error: any) => {
        toast({
          title: "An error occurred.",
          description:
            error.response?.data?.detail || "Unable to change your password.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  return (
     <Box w="full">
       <Box px={{ base: 6, md: 8 }} py={{ base: 6, md: 8 }}>
         <VStack spacing={6} align="stretch" mb={8}>
            <Box>
              <Heading size="md" color={tertiaryTextColor}>Change Password</Heading>
              <Text mt={2} fontSize="sm" color={tertiaryTextColor}>
                Update your password to keep your account secure.
              </Text>
            </Box>
         </VStack>
         <Box as="form" onSubmit={handleSubmit(onSubmit)} maxW="2xl">
           <VStack spacing={8} align="stretch">
            {/* Form Fields */}
            <Box>
              <VStack spacing={6} align="stretch">
                 <Box
                   display={{ base: "flex", lg: "grid" }}
                   flexDirection={{ base: "column", lg: "row" }}
                   gridTemplateColumns="1fr 1fr"
                   gap={{ base: 6, lg: 8 }}
                 >
                   <FormControl isInvalid={!!errors.current_password}>
                      <FormLabel
                        fontSize="sm"
                        fontWeight="600"
                        color={tertiaryTextColor}
                        mb={3}
                      >
                        <HStack spacing={2}>
                          <Icon as={Lock} boxSize={4} color={iconColor} />
                          <Text>Current Password</Text>
                        </HStack>
                      </FormLabel>
                    <Input
                      type="password"
                      {...register("current_password", {
                        required: "Current password is required",
                      })}
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
                    <FormErrorMessage fontSize="sm" color={errorMessageColor}>
                      {errors.current_password?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.new_password}>
                     <FormLabel
                       fontSize="sm"
                       fontWeight="600"
                       color={tertiaryTextColor}
                       mb={3}
                     >
                       <HStack spacing={2}>
                         <Icon as={KeyRound} boxSize={4} color={iconColor} />
                         <Text>New Password</Text>
                       </HStack>
                     </FormLabel>
                    <Input
                      type="password"
                      {...register("new_password", {
                        required: "New password is required",
                      })}
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
                    <FormErrorMessage fontSize="sm" color={errorMessageColor}>
                      {errors.new_password?.message}
                    </FormErrorMessage>
                  </FormControl>
                </Box>
              </VStack>
            </Box>



            {/* Change Password Button */}
            <Box pt={4}>
               <Button
                 type="submit"
                 isLoading={isPending}
                 loadingText="Changing password..."
                colorScheme="teal"
                isDisabled={isButtonDisabled}
                leftIcon={<KeyRound size={20} />}
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
                 Change Password
               </Button>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default ChangePasswordForm;
