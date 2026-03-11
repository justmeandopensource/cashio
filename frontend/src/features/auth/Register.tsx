import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Flex, useToast, useColorModeValue } from "@chakra-ui/react";
import RegisterForm from "@features/auth/components/RegisterForm";
import api from "@/lib/api";

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
  const toast = useToast();
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
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
        status: "success",
        position: "top-right",
        duration: 3000,
      });
      navigate("/login");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: "Account creation failed",
        description: error.response?.data?.detail || error.message,
        status: "error",
        position: "top-right",
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

  const pageBg = useColorModeValue("primaryBg", "primaryBg");

  return (
    <Flex
      align="center"
      justify="center"
      minH="100vh"
      bg={pageBg}
      px={0}
    >
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
