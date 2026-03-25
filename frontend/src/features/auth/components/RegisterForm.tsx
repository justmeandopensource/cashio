import React, { useState, RefObject } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  VStack,
  Text,
  FormErrorMessage,
  useColorModeValue,
  Progress,
  HStack,
  Icon,
  FormHelperText,
  Flex,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { UserPlus, Eye, EyeOff, Mail, Lock, User, AtSign } from "lucide-react";

const MotionBox = motion(Box);

interface RegisterFormProps {
   
  onSubmit: (event: React.FormEvent) => void;
  full_name: string;
   
  setFullName: (name: string) => void;
  username: string;
   
  setUsername: (username: string) => void;
  email: string;
   
  setEmail: (email: string) => void;
  password: string;
   
  setPassword: (password: string) => void;
  fullNameRef: RefObject<HTMLInputElement>;
}

interface TouchedState {
  full_name: boolean;
  username: boolean;
  email: boolean;
  password: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  full_name,
  setFullName,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  fullNameRef,
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const progressBg = useColorModeValue("gray.100", "gray.600");
  const [touched, setTouched] = useState<TouchedState>({
    full_name: false,
    username: false,
    email: false,
    password: false,
  });

  const getPasswordStrength = (pass: string): number => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[a-z]/.test(pass)) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(pass)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.750");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("brand.500", "brand.400");
  const tertiaryTextColor = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "gray.50");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const btnGlow = useColorModeValue(
    "0 0 24px rgba(53,169,163,0.3)",
    "0 0 24px rgba(78,194,188,0.25)"
  );

  const nameError = touched.full_name && !full_name;
  const usernameError = touched.username && !username;
  const emailError = touched.email && (!email || !/\S+@\S+\.\S+/.test(email));
  const passwordError = touched.password && (!password || password.length < 8);

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    setTouched({
      full_name: true,
      username: true,
      email: true,
      password: true,
    });

    if (
      full_name &&
      username &&
      email &&
      password &&
      password.length >= 8 &&
      /\S+@\S+\.\S+/.test(email)
    ) {
      onSubmit(event);
    }
  };

  const handleBlur = (field: keyof TouchedState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getStrengthColor = (strength: number): string => {
    if (strength < 50) return "red.400";
    if (strength < 75) return "orange.400";
    return "green.400";
  };

  const getStrengthText = (strength: number): string => {
    if (strength < 50) return "Weak";
    if (strength < 75) return "Good";
    return "Strong";
  };

  const getStrengthColorScheme = (strength: number): string => {
    if (strength < 50) return "red";
    if (strength < 75) return "orange";
    return "green";
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      w="100%"
    >
      <Box
        bg={bgColor}
        borderRadius={{ base: 0, sm: "2xl" }}
        boxShadow={{ base: "none", sm: "0 20px 60px -12px rgba(0,0,0,0.12)" }}
        maxW={{ base: "full", sm: "md" }}
        w="full"
        borderWidth={{ base: 0, sm: "1px" }}
        borderColor={borderColor}
        overflow="hidden"
        mx={{ base: 0, sm: "auto" }}
        minH={{ base: "100vh", sm: "auto" }}
        position="relative"
      >
        {/* Gradient accent line */}
        <Box
          h="3px"
          bgGradient="linear(to-r, brand.400, brand.600, teal.300)"
        />

        {/* Header */}
        <MotionBox
          px={{ base: 6, sm: 8 }}
          pt={{ base: 8, sm: 10 }}
          pb={2}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        >
          <HStack spacing={3} align="center" mb={2}>
            <Box
              p={2.5}
              bg={useColorModeValue("brand.50", "whiteAlpha.100")}
              borderRadius="xl"
            >
              <Icon as={UserPlus} boxSize={5} color="brand.500" />
            </Box>
            <Box>
              <Text
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="800"
                color={titleColor}
                letterSpacing="-0.03em"
                lineHeight="1.2"
              >
                Join Cashio
              </Text>
              <Text
                fontSize="sm"
                color={subtitleColor}
                mt={0.5}
                letterSpacing="0.01em"
              >
                Start managing your finances today
              </Text>
            </Box>
          </HStack>
        </MotionBox>

        {/* Form content */}
        <Box px={{ base: 6, sm: 8 }} py={{ base: 4, sm: 6 }}>
          <VStack
            as="form"
            spacing={6}
            onSubmit={handleSubmit}
          >
            {/* Personal Information Card */}
            <MotionBox
              bg={cardBg}
              p={{ base: 5, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
              w="100%"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            >
              <VStack spacing={5} align="stretch">
                <FormControl isInvalid={nameError}>
                  <FormLabel fontWeight="bold" mb={2} fontSize="sm">
                    Full Name
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      height="100%"
                      display="flex"
                      alignItems="center"
                    >
                      <Icon as={User} boxSize={4} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      ref={fullNameRef}
                      type="text"
                      placeholder="Enter your full name"
                      size="lg"
                      value={full_name}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => handleBlur("full_name")}
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      borderRadius="lg"
                      _hover={!nameError ? { borderColor: "brand.300" } : {}}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
                      }}
                      autoComplete="name"
                    />
                  </InputGroup>
                  {nameError ? (
                    <FormErrorMessage mt={2}>
                      Full name is required
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt={2} fontSize="xs">
                      Your full name for account identification
                    </FormHelperText>
                  )}
                </FormControl>

                <FormControl isInvalid={usernameError}>
                  <FormLabel fontWeight="bold" mb={2} fontSize="sm">
                    Username
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      height="100%"
                      display="flex"
                      alignItems="center"
                    >
                      <Icon as={AtSign} boxSize={4} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="text"
                      placeholder="Create a unique username"
                      size="lg"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={() => handleBlur("username")}
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      borderRadius="lg"
                      _hover={!usernameError ? { borderColor: "brand.300" } : {}}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
                      }}
                      autoComplete="username"
                    />
                  </InputGroup>
                  {usernameError ? (
                    <FormErrorMessage mt={2}>
                      Username is required
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt={2} fontSize="xs">
                      Choose a unique username for your account
                    </FormHelperText>
                  )}
                </FormControl>
              </VStack>
            </MotionBox>

            {/* Account Credentials Card */}
            <MotionBox
              bg={cardBg}
              p={{ base: 5, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
              w="100%"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            >
              <VStack spacing={5} align="stretch">
                <FormControl isInvalid={emailError}>
                  <FormLabel fontWeight="bold" mb={2} fontSize="sm">
                    Email Address
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      height="100%"
                      display="flex"
                      alignItems="center"
                    >
                      <Icon as={Mail} boxSize={4} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      size="lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur("email")}
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      borderRadius="lg"
                      _hover={!emailError ? { borderColor: "brand.300" } : {}}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
                      }}
                      autoComplete="email"
                    />
                  </InputGroup>
                  {emailError ? (
                    <FormErrorMessage mt={2}>
                      Valid email is required
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt={2} fontSize="xs">
                      We&apos;ll use this for account verification and updates
                    </FormHelperText>
                  )}
                </FormControl>

                <FormControl isInvalid={passwordError}>
                  <FormLabel fontWeight="bold" mb={2} fontSize="sm">
                    Password
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement
                      pointerEvents="none"
                      height="100%"
                      display="flex"
                      alignItems="center"
                    >
                      <Icon as={Lock} boxSize={4} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur("password")}
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                      bg={inputBg}
                      borderRadius="lg"
                      _hover={!passwordError ? { borderColor: "brand.300" } : {}}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
                      }}
                      autoComplete="new-password"
                    />
                    <InputRightElement height="100%">
                      <Button
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        _hover={{ bg: "transparent" }}
                        size="sm"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <Icon as={showPassword ? EyeOff : Eye} boxSize={4} />
                      </Button>
                    </InputRightElement>
                  </InputGroup>

                  {/* Password strength indicator */}
                  {password && (
                    <Box mt={3}>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          color={tertiaryTextColor}
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          Password strength
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          color={getStrengthColor(passwordStrength)}
                        >
                          {getStrengthText(passwordStrength)}
                        </Text>
                      </Flex>
                      <Progress
                        value={passwordStrength}
                        size="sm"
                        colorScheme={getStrengthColorScheme(passwordStrength)}
                        borderRadius="full"
                        bg={progressBg}
                      />
                    </Box>
                  )}

                  {passwordError ? (
                    <FormErrorMessage mt={2}>
                      Password must be at least 8 characters
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt={2} fontSize="xs">
                      Use mix of letters, numbers, and symbols
                    </FormHelperText>
                  )}
                </FormControl>
              </VStack>
            </MotionBox>

            <MotionBox
              w="100%"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
            >
              <Button
                type="submit"
                size="lg"
                w="full"
                colorScheme="brand"
                loadingText="Creating account"
                borderRadius="xl"
                fontWeight="800"
                letterSpacing="-0.01em"
                _hover={{
                  boxShadow: btnGlow,
                  transform: "translateY(-1px)",
                }}
                _active={{
                  transform: "translateY(0)",
                }}
                transition="all 0.2s ease"
                leftIcon={<Icon as={UserPlus} boxSize={4} />}
                isDisabled={
                  !full_name ||
                  !username ||
                  !email ||
                  !password ||
                  passwordStrength < 25
                }
              >
                Create Account
              </Button>
            </MotionBox>

            <MotionBox
              textAlign="center"
              py={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Text fontSize="sm" color={tertiaryTextColor}>
                Already have an account?{" "}
                <RouterLink to="/login">
                  <Text
                    as="span"
                    color="brand.500"
                    fontWeight="bold"
                    _hover={{ color: "brand.600" }}
                  >
                    Log In
                  </Text>
                </RouterLink>
              </Text>
            </MotionBox>
          </VStack>
        </Box>
      </Box>
    </MotionBox>
  );
};

export default RegisterForm;
