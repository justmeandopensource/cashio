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
  Heading,
  ScaleFade,
  FormErrorMessage,
  InputLeftElement,
  useColorModeValue,
  HStack,
  Icon,
  FormHelperText,
} from "@chakra-ui/react";
import { LogIn, Eye, EyeOff, Mail, Lock } from "lucide-react";

interface LoginFormProps {
  // eslint-disable-next-line no-unused-vars
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  username: string;
  // eslint-disable-next-line no-unused-vars
  setUsername: (value: string) => void;
  password: string;
  // eslint-disable-next-line no-unused-vars
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

  // Derived validation states
  const usernameError = touched.username && !username;
  const passwordError = touched.password && !password;

  // Modern color scheme matching CreateLedgerModal
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");

  const handleSubmit = (event: React.FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    // Mark all fields as touched to show validation errors
    setTouched({ username: true, password: true });

    // Only submit if there are no errors
    if (username && password) {
      onSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleBlur = (field: keyof TouchedState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <ScaleFade in={true} initialScale={0.95} style={{ width: "100%" }}>
      <Box
        bg={bgColor}
        borderRadius={{ base: 0, sm: "xl" }}
        boxShadow={{ base: "none", sm: "2xl" }}
        maxW={{ base: "full", sm: "md" }}
        w={{ base: "100vw", sm: "full" }}
        borderWidth={{ base: 0, sm: "1px" }}
        borderColor={borderColor}
        overflow="hidden"
        mx={{ base: 0, sm: "auto" }}
        minH={{ base: "100vh", sm: "auto" }}
      >
        {/* Modern gradient header matching CreateLedgerModal */}
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
              <Icon as={LogIn} boxSize={{ base: 5, sm: 6 }} />
            </Box>

            <Box>
              <Heading
                fontSize={{ base: "xl", sm: "2xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                Welcome Back
              </Heading>
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                color="whiteAlpha.900"
                fontWeight="medium"
                mt={1}
              >
                Log in to your Cashio account
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
            {/* Form fields in modern card */}
            <Box
              bg={cardBg}
              p={{ base: 5, sm: 6 }}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
              w="100%"
            >
              <VStack spacing={5} align="stretch">
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
                      Enter your registered username
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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)
                      }
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
                    <FormHelperText mt={2}>
                      Enter your account password
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
              isLoading={isLoading}
              loadingText="Logging in"
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
              leftIcon={<Icon as={LogIn} boxSize={4} />}
              isDisabled={!username || !password}
            >
              Log In
            </Button>

            {/* Footer link */}
            <Box textAlign="center" py={4}>
              <Text fontSize="sm" color={tertiaryTextColor}>
                New to Cashio?{" "}
                <RouterLink to="/register">
                  <Text
                    as="span"
                    color="teal.500"
                    fontWeight="semibold"
                    _hover={{ color: "teal.600" }}
                  >
                    Create an account
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

export default LoginForm;
