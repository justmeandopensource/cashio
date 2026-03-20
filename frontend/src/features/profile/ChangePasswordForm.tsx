import React from "react";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  FormErrorMessage,
  Text,
  HStack,
  Icon,
  Heading,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useChangePassword } from "./hooks";
import { ChangePassword } from "./api";
import { notify } from "@/components/shared/notify";

const MotionBox = motion(Box);

const ChangePasswordForm: React.FC = () => {
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const inputHoverBorderColor = useColorModeValue("gray.300", "gray.500");
  const focusBorderColor = useColorModeValue("brand.400", "brand.300");
  const focusBoxShadow = useColorModeValue(
    "0 0 0 3px rgba(56, 178, 172, 0.1)",
    "0 0 0 3px rgba(49, 151, 149, 0.6)",
  );
  const iconColor = useColorModeValue("gray.400", "gray.500");
  const errorMessageColor = useColorModeValue("red.500", "red.300");
  const headerIconBg = useColorModeValue("brand.50", "rgba(56,178,172,0.1)");
  const headerIconColor = useColorModeValue("brand.600", "brand.300");
  const labelColor = useColorModeValue("gray.600", "gray.400");

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
        notify({
          title: "Password changed.",
          description: "Your password has been changed successfully.",
          status: "success",
          duration: 5000,
        });
        reset();
      },
      onError: (error: any) => {
        notify({
          title: "An error occurred.",
          description:
            error.response?.data?.detail || "Unable to change your password.",
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
              <Icon as={ShieldCheck} color={headerIconColor} boxSize={5} />
            </Box>
            <Box>
              <Heading size="md" color={textColor} fontWeight="700">
                Change Password
              </Heading>
              <Text fontSize="sm" color={subtitleColor} mt={0.5}>
                Update your password to keep your account secure.
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
            <Box
              display={{ base: "flex", lg: "grid" }}
              flexDirection={{ base: "column", lg: "row" }}
              gridTemplateColumns="1fr 1fr"
              gap={{ base: 5, lg: 8 }}
            >
              <FormControl isInvalid={!!errors.current_password}>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={labelColor}
                  mb={2}
                >
                  Current Password
                </FormLabel>
                <InputGroup>
                  <InputLeftElement h="48px" pointerEvents="none">
                    <Icon as={Lock} boxSize={4} color={iconColor} />
                  </InputLeftElement>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    {...register("current_password", {
                      required: "Current password is required",
                    })}
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
                <FormErrorMessage fontSize="xs" color={errorMessageColor}>
                  {errors.current_password?.message}
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.new_password}>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={labelColor}
                  mb={2}
                >
                  New Password
                </FormLabel>
                <InputGroup>
                  <InputLeftElement h="48px" pointerEvents="none">
                    <Icon as={KeyRound} boxSize={4} color={iconColor} />
                  </InputLeftElement>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    {...register("new_password", {
                      required: "New password is required",
                    })}
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
                <FormErrorMessage fontSize="xs" color={errorMessageColor}>
                  {errors.new_password?.message}
                </FormErrorMessage>
              </FormControl>
            </Box>

            {/* Submit */}
            <Box pt={2}>
              <Button
                type="submit"
                isLoading={isPending}
                loadingText="Changing..."
                isDisabled={isButtonDisabled}
                leftIcon={<Icon as={KeyRound} boxSize={4} />}
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
                Change Password
              </Button>
            </Box>
          </VStack>
        </MotionBox>
      </Box>
    </Box>
  );
};

export default ChangePasswordForm;
