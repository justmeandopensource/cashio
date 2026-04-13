import React, { useState, ChangeEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Text,
  FormErrorMessage,
  InputLeftElement,
  useColorModeValue,
  HStack,
  Icon,
  FormHelperText,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff, Mail, Lock } from "lucide-react";

const MotionBox = motion.create(Box);

interface LoginFormProps {
   
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  username: string;
   
  setUsername: (value: string) => void;
  password: string;
   
  setPassword: (value: string) => void;
  usernameInputRef: React.RefObject<HTMLInputElement>;
  isLoading?: boolean;
  maxW?: string;
  w?: string;
}

interface TouchedState {
  username: boolean;
  password: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  username,
  setUsername,
  password,
  setPassword,
  usernameInputRef,
  isLoading,
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [touched, setTouched] = useState<TouchedState>({
    username: false,
    password: false,
  });

  const usernameError = touched.username && !username;
  const passwordError = touched.password && !password;

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

  const handleSubmit = (event: React.FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    setTouched({ username: true, password: true });

    if (username && password) {
      onSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleBlur = (field: keyof TouchedState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
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
        w={{ base: "100vw", sm: "full" }}
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
              <Icon as={LogIn} boxSize={5} color="brand.500" />
            </Box>
            <Box>
              <Text
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="800"
                color={titleColor}
                letterSpacing="-0.03em"
                lineHeight="1.2"
              >
                Welcome Back
              </Text>
              <Text
                fontSize="sm"
                color={subtitleColor}
                mt={0.5}
                letterSpacing="0.01em"
              >
                Log in to your Cashio account
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
            <MotionBox
              bg={cardBg}
              p={{ base: 5, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
              w="100%"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
            >
              <VStack spacing={5} align="stretch">
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
                      <Icon as={Mail} boxSize={4} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      ref={usernameInputRef}
                      type="text"
                      placeholder="Enter your username"
                      size="lg"
                      value={username}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setUsername(e.target.value)
                      }
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
                      Enter your registered username
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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)
                      }
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
                      autoComplete="current-password"
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
                  {passwordError ? (
                    <FormErrorMessage mt={2}>
                      Password is required
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt={2} fontSize="xs">
                      Enter your account password
                    </FormHelperText>
                  )}
                </FormControl>
              </VStack>
            </MotionBox>

            <MotionBox
              w="100%"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
            >
              <Button
                type="submit"
                size="lg"
                w="full"
                colorScheme="brand"
                isLoading={isLoading}
                loadingText="Logging in"
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
                leftIcon={<Icon as={LogIn} boxSize={4} />}
                isDisabled={!username || !password}
              >
                Log In
              </Button>
            </MotionBox>

            <MotionBox
              textAlign="center"
              py={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              <Text fontSize="sm" color={tertiaryTextColor}>
                New to Cashio?{" "}
                <RouterLink to="/register">
                  <Text
                    as="span"
                    color="brand.500"
                    fontWeight="bold"
                    _hover={{ color: "brand.600" }}
                  >
                    Create an account
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

export default LoginForm;
