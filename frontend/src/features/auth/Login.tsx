import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import { Flex, useToast, useColorModeValue } from "@chakra-ui/react";
import LoginForm from "@features/auth/components/LoginForm";
import api from "@/lib/api";

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
  const toast = useToast();
  const usernameInputRef = useRef<HTMLInputElement>(null as any);

  useEffect(() => {
    // On component mount, clear any existing token to ensure a clean login.
    // This helps prevent the "double login" issue.
    localStorage.removeItem("access_token");
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
      // Set the new token and then navigate.
      localStorage.setItem("access_token", response.data.access_token);
      navigate("/");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: "Login Failed",
        description:
          error.response?.data?.detail ||
          "Invalid credentials. Please try again.",
        status: "error",
        position: "top-right",
        duration: 3000,
        isClosable: true,
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

  const pageBg = useColorModeValue("primaryBg", "primaryBg");

  return (
    <Flex
      align="center"
      justify={{ base: "flex-start", md: "center" }}
      minH="100vh"
      bg={pageBg}
      px={0}
    >
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
