import React from "react";
import Layout from "@components/Layout";
import CategoriesMain from "@features/categories/components/CategoriesMain";
import PageContainer from "@components/shared/PageContainer";
import PageHeader from "@components/shared/PageHeader";
import { Bookmark } from "lucide-react";
import { Box, Button, Flex } from "@chakra-ui/react";
import { useLogout } from "@/lib/useLogout";

const Categories: React.FC = () => {
  const handleLogout = useLogout();

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
        colorScheme="brand"
        size="sm"
        borderRadius="lg"
        fontWeight="semibold"
        onClick={() => handleCreateCategory("income")}
        w={{ base: "100%", md: "100%", lg: "auto" }}
      >
        Create Income Category
      </Button>
      <Button
        colorScheme="brand"
        variant="outline"
        size="sm"
        borderRadius="lg"
        fontWeight="semibold"
        onClick={() => handleCreateCategory("expense")}
        w={{ base: "100%", md: "100%", lg: "auto" }}
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
        breadcrumbs={[{ label: "Categories" }]}
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
