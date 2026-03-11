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
  Heading,
  FormErrorMessage,
  ScaleFade,
  useColorModeValue,
  Progress,
  HStack,
  Icon,
  FormHelperText,
  Flex,
} from "@chakra-ui/react";
import { UserPlus, Eye, EyeOff, Mail, Lock, User, AtSign } from "lucide-react";

interface RegisterFormProps {
  // eslint-disable-next-line no-unused-vars
  onSubmit: (event: React.FormEvent) => void;
  full_name: string;
  // eslint-disable-next-line no-unused-vars
  setFullName: (name: string) => void;
  username: string;
  // eslint-disable-next-line no-unused-vars
  setUsername: (username: string) => void;
  email: string;
  // eslint-disable-next-line no-unused-vars
  setEmail: (email: string) => void;
  password: string;
  // eslint-disable-next-line no-unused-vars
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
  const [touched, setTouched] = useState<TouchedState>({
    full_name: false,
    username: false,
    email: false,
    password: false,
  });

  // Password strength indicators
  const getPasswordStrength = (pass: string): number => {
    if (!pass) return 0;

    let strength = 0;
    // Length check
    if (pass.length >= 8) strength += 25;
    // Contains lowercase letters
    if (/[a-z]/.test(pass)) strength += 25;
    // Contains uppercase letters
    if (/[A-Z]/.test(pass)) strength += 25;
    // Contains numbers or special chars
    if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(pass)) strength += 25;

    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  // Modern color scheme matching CreateLedgerModal
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");

  // Validation errors
  const nameError = touched.full_name && !full_name;
  const usernameError = touched.username && !username;
  const emailError = touched.email && (!email || !/\S+@\S+\.\S+/.test(email));
  const passwordError = touched.password && (!password || password.length < 8);

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    // Mark all fields as touched to show validation errors
    setTouched({
      full_name: true,
      username: true,
      email: true,
      password: true,
    });

    // Only submit if there are no errors
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

  // Get color for password strength indicator
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
    <ScaleFade in={true} initialScale={0.95}>
      <Box
        bg={bgColor}
        borderRadius={{ base: 0, sm: "xl" }}
        boxShadow={{ base: "none", sm: "2xl" }}
        maxW={{ base: "full", sm: "md" }}
        w="full"
        borderWidth={{ base: 0, sm: "1px" }}
        borderColor={borderColor}
        overflow="hidden"
        mx={{ base: 0, sm: "auto" }}
        minH={{ base: "100vh", sm: "auto" }}
      >
        {/* Modern gradient header matching CreateLedgerModal - Left Justified */}
        <Box
          bgGradient="linear(135deg, teal.400, teal.600)"
          color="white"
          px={{ base: 4, sm: 8 }}
          py={{ base: 6, sm: 8 }}
          position="relative"
        >
          <HStack
            spacing={{ base: 3, sm: 4 }}
            align="center"
            justify="flex-start"
          >
            <Box
              p={{ base: 2, sm: 3 }}
              bg="whiteAlpha.200"
              borderRadius="md"
              backdropFilter="blur(10px)"
            >
              <Icon as={UserPlus} boxSize={{ base: 5, sm: 6 }} />
            </Box>

            <Box>
              <Heading
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                Join Cashio
              </Heading>
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
                mt={1}
              >
                Start managing your finances today
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Form content */}
        <Box px={{ base: 4, sm: 8 }} py={{ base: 4, sm: 8 }}>
          <VStack
            as="form"
            spacing={{ base: 5, md: 6 }}
            onSubmit={handleSubmit}
          >
            {/* Personal Information Card */}
            <Box
              bg={cardBg}
              p={{ base: 5, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
              w="100%"
            >
              <VStack spacing={5} align="stretch">
                <FormControl isInvalid={nameError}>
                  <FormLabel fontWeight="semibold" mb={2}>
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
                      borderRadius="md"
                      _hover={!nameError ? { borderColor: "teal.300" } : {}}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                      autoComplete="name"
                    />
                  </InputGroup>
                  {nameError ? (
                    <FormErrorMessage mt={2}>
                      Full name is required
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt={2}>
                      Your full name for account identification
                    </FormHelperText>
                  )}
                </FormControl>

                <FormControl isInvalid={usernameError}>
                  <FormLabel fontWeight="semibold" mb={2}>
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
                      borderRadius="md"
                      _hover={!usernameError ? { borderColor: "teal.300" } : {}}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                      autoComplete="username"
                    />
                  </InputGroup>
                  {usernameError ? (
                    <FormErrorMessage mt={2}>
                      Username is required
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt={2}>
                      Choose a unique username for your account
                    </FormHelperText>
                  )}
                </FormControl>
              </VStack>
            </Box>

            {/* Account Credentials Card */}
            <Box
              bg={cardBg}
              p={{ base: 5, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
              w="100%"
            >
              <VStack spacing={5} align="stretch">
                <FormControl isInvalid={emailError}>
                  <FormLabel fontWeight="semibold" mb={2}>
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
                      borderRadius="md"
                      _hover={!emailError ? { borderColor: "teal.300" } : {}}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                      autoComplete="email"
                    />
                  </InputGroup>
                  {emailError ? (
                    <FormErrorMessage mt={2}>
                      Valid email is required
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt={2}>
                      We&apos;ll use this for account verification and updates
                    </FormHelperText>
                  )}
                </FormControl>

                <FormControl isInvalid={passwordError}>
                  <FormLabel fontWeight="semibold" mb={2}>
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
                      borderRadius="md"
                      _hover={!passwordError ? { borderColor: "teal.300" } : {}}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
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
                          fontSize="sm"
                          fontWeight="medium"
                          color={tertiaryTextColor}
                        >
                          Password strength
                        </Text>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
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
                        bg="gray.200"
                      />
                    </Box>
                  )}

                  {passwordError ? (
                    <FormErrorMessage mt={2}>
                      Password must be at least 8 characters
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt={2}>
                      Use mix of letters, numbers, and symbols
                    </FormHelperText>
                  )}
                </FormControl>
              </VStack>
            </Box>

            {/* Action button */}
            <Button
              type="submit"
              size="lg"
              w="full"
              colorScheme="teal"
              loadingText="Creating account"
              borderRadius="md"
              boxShadow="md"
              _hover={{
                boxShadow: "lg",
                transform: "translateY(-2px)",
              }}
              _active={{
                boxShadow: "md",
                transform: "translateY(0)",
              }}
              transition="all 0.2s"
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

            {/* Footer link */}
            <Box textAlign="center" py={4}>
              <Text fontSize="sm" color={tertiaryTextColor}>
                Already have an account?{" "}
                <RouterLink to="/login">
                  <Text
                    as="span"
                    color="teal.500"
                    fontWeight="semibold"
                    _hover={{ color: "teal.600" }}
                  >
                    Log In
                  </Text>
                </RouterLink>
              </Text>
            </Box>
          </VStack>
        </Box>
      </Box>
    </ScaleFade>
  );
};

export default RegisterForm;
