import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import RegisterForm from "@features/auth/components/RegisterForm";
import api from "@/lib/api";
import { notify } from "@/components/shared/notify";

interface RegisterFormData {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

interface ErrorResponse {
  detail?: string;
}

const Register: React.FC = () => {
  const [full_name, setFullName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const navigate = useNavigate();
  const fullNameRef = useRef<HTMLInputElement>(null as any);

  useEffect(() => {
    fullNameRef.current?.focus();
  }, []);

  const registerMutation = useMutation<
    void,
    AxiosError<ErrorResponse>,
    RegisterFormData
  >({
    mutationFn: (formDetails: RegisterFormData) =>
      api.post("/user/create", formDetails),
    onSuccess: () => {
      notify({
        title: "Account created",
        description: "Your account has been created successfully!",
        status: "success",
        duration: 3000,
      });
      navigate("/login");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      notify({
        title: "Account creation failed",
        description: error.response?.data?.detail || error.message,
        status: "error",
        duration: 3000,
      });
      setFullName("");
      setUsername("");
      setEmail("");
      setPassword("");
      fullNameRef.current?.focus();
    },
  });

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const formDetails: RegisterFormData = {
      full_name,
      username,
      email,
      password,
    };

    registerMutation.mutate(formDetails);
  };

  const pageBg = useColorModeValue("gray.50", "gray.900");

  return (
    <Flex
      align="center"
      justify="center"
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

      <RegisterForm
        onSubmit={handleSubmit}
        full_name={full_name}
        setFullName={setFullName}
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        fullNameRef={fullNameRef}
      />
    </Flex>
  );
};

export default Register;
