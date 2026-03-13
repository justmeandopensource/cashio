import React from "react";
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import Layout from "../../components/Layout";
import UpdateProfileForm from "./UpdateProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";
import SystemBackup from "./SystemBackup";
import { useNavigate } from "react-router-dom";
import PageContainer from "@components/shared/PageContainer";
import PageHeader from "@components/shared/PageHeader";
import { User } from "lucide-react";
import { useColorModeValue } from "@chakra-ui/react";

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const cardBg = useColorModeValue("white", "cardDarkBg");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const selectedTabColor = useColorModeValue("brand.700", "brand.200");
  const selectedTabBg = useColorModeValue("brand.50", "brand.900");
  const selectedTabBorderColor = useColorModeValue("brand.400", "brand.500");
  const hoverTabBg = useColorModeValue("brand.50", "brand.800");
  const tabColor = useColorModeValue("gray.600", "gray.400");
  const tabBg = useColorModeValue("primaryBg", "gray.700");

  // handle logout
  const handleLogout = (): void => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <Layout handleLogout={handleLogout}>
      <PageHeader
        title="User Profile"
        subtitle="Manage your account details and security"
        icon={User}
      />
      <Box flex={1} overflowY="auto">
        <PageContainer>
          <Box borderRadius="lg" boxShadow="lg" bg={tabBg} overflow="hidden">
            <Tabs
              variant="soft-rounded"
              colorScheme="brand"
              size={{ base: "md", md: "md" }}
            >
              <Box
                px={{ base: 2, md: 4 }}
                pt={{ base: 2, md: 3 }}
                pb={0}
                borderBottom="1px solid"
                borderColor={borderColor}
              >
                <TabList
                  borderBottom="none"
                  justifyContent={{ base: "space-around", md: "flex-start" }}
                  gap={1}
                  mb="-1px"
                >
                  {["Account Details", "Security", "System"].map((label) => (
                    <Tab
                      key={label}
                      px={{ base: 3, md: 4 }}
                      py={2}
                      fontWeight="medium"
                      fontSize="sm"
                      borderRadius="sm"
                      whiteSpace="nowrap"
                      flex={{ base: 1, md: "none" }}
                      color={tabColor}
                      border="1px solid"
                      borderColor="transparent"
                      borderBottomColor="transparent"
                      _selected={{
                        color: selectedTabColor,
                        bg: selectedTabBg,
                        fontWeight: "semibold",
                        borderColor: selectedTabBorderColor,
                        borderBottomColor: "transparent",
                      }}
                      _hover={{ bg: hoverTabBg }}
                    >
                      {label}
                    </Tab>
                  ))}
                </TabList>
              </Box>
              <TabPanels bg={cardBg}>
                <TabPanel p={{ base: 2, md: 4 }}>
                  <UpdateProfileForm />
                </TabPanel>
                <TabPanel p={{ base: 2, md: 4 }}>
                  <ChangePasswordForm />
                </TabPanel>
                <TabPanel p={{ base: 2, md: 4 }}>
                  <SystemBackup />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </PageContainer>
      </Box>
    </Layout>
  );
};

export default Profile;
