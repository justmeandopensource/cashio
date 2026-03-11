import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@components/Layout";
import CategoriesMain from "@features/categories/components/CategoriesMain";
import PageContainer from "@components/shared/PageContainer";
import PageHeader from "@components/shared/PageHeader";
import { Bookmark } from "lucide-react";
import { Box, Button, Flex } from "@chakra-ui/react";

const Categories: React.FC = () => {
  const navigate = useNavigate();

  // handle logout
  const handleLogout = (): void => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  // Handle create category
  const handleCreateCategory = (type: "income" | "expense") => {
    // This will be passed down to CategoriesMain
    const event = new CustomEvent('createCategory', { detail: { type } });
    window.dispatchEvent(event);
  };

  // Create category buttons for the header
  const categoryButtons = (
    <Flex
      gap={3}
      flexDirection={{ base: "column", md: "column", lg: "row" }}
      w={{ base: "100%", md: "100%", lg: "auto" }}
      alignItems={{ base: "center", md: "center", lg: "flex-start" }}
    >
      <Button
        color="white"
        variant="ghost"
        bg="whiteAlpha.100"
        onClick={() => handleCreateCategory("income")}
        w={{ base: "100%", md: "100%", lg: "auto" }}
        _hover={{ bg: "whiteAlpha.300" }}
      >
        Create Income Category
      </Button>
      <Button
        color="white"
        variant="ghost"
        bg="whiteAlpha.100"
        onClick={() => handleCreateCategory("expense")}
        w={{ base: "100%", md: "100%", lg: "auto" }}
        _hover={{ bg: "whiteAlpha.300" }}
      >
        Create Expense Category
      </Button>
    </Flex>
  );

  return (
    <Layout handleLogout={handleLogout}>
      <PageHeader
        title="Categories"
        subtitle="Manage your expense categories"
        icon={Bookmark}
        actions={categoryButtons}
      />
      <Box flex={1} overflowY="auto">
        <PageContainer>
          <CategoriesMain />
        </PageContainer>
      </Box>
    </Layout>
  );
};

export default Categories;
