import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import LoginForm from "@features/auth/components/LoginForm";
import api, { setAuthToken } from "@/lib/api";
import { notify } from "@/components/shared/notify";

interface LoginResponse {
  access_token: string;
}

interface ErrorResponse {
  detail?: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const navigate = useNavigate();
  const usernameInputRef = useRef<HTMLInputElement>(null as any);

  useEffect(() => {
    setAuthToken(null);
    usernameInputRef.current?.focus();
  }, []);

  const loginMutation = useMutation({
    mutationFn: (formDetails: URLSearchParams) =>
      api.post<LoginResponse>("/user/login", formDetails, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    onSuccess: (response: AxiosResponse<LoginResponse>) => {
      setAuthToken(response.data.access_token);
      navigate("/");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      notify({
        title: "Login Failed",
        description:
          error.response?.data?.detail ||
          "Invalid credentials. Please try again.",
        status: "error",
        duration: 3000,
      });
      setUsername("");
      setPassword("");
      usernameInputRef.current?.focus();
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formDetails = new URLSearchParams();
    formDetails.append("username", username);
    formDetails.append("password", password);

    loginMutation.mutate(formDetails);
  };

  const pageBg = useColorModeValue("gray.50", "gray.900");

  return (
    <Flex
      align="center"
      justify={{ base: "flex-start", md: "center" }}
      minH="100vh"
      bg={pageBg}
      px={0}
      position="relative"
      overflow="hidden"
    >
      {/* Subtle background accent */}
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        w="500px"
        h="500px"
        borderRadius="full"
        bg={useColorModeValue("brand.50", "brand.900")}
        opacity={0.4}
        filter="blur(120px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-15%"
        left="-5%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg={useColorModeValue("teal.50", "teal.900")}
        opacity={0.3}
        filter="blur(100px)"
        pointerEvents="none"
      />

      <LoginForm
        onSubmit={handleSubmit}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        usernameInputRef={usernameInputRef}
        isLoading={loginMutation.isPending}
        maxW="400px"
        w="100%"
      />
    </Flex>
  );
};

export default Login;
