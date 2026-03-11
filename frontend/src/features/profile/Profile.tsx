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
  const selectedTabColor = useColorModeValue("teal.700", "teal.200");
  const selectedTabBg = useColorModeValue("teal.50", "teal.900");
  const selectedTabBorderColor = useColorModeValue("teal.400", "teal.600");
  const hoverTabBg = useColorModeValue("teal.25", "teal.800");
  const tabColor = useColorModeValue("gray.600", "gray.400");

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
          <Box borderRadius="lg" boxShadow="lg" bg={cardBg} overflow="hidden">
             <Tabs
               variant="soft-rounded"
               colorScheme="teal"
               size={{ base: "md", md: "md" }}
             >
              <Box
                p={{ base: 2, md: 4 }}
                borderBottom="1px solid"
                borderColor={borderColor}
              >
                <TabList
                  minW={{ base: "auto", md: "auto" }}
                  borderBottom="none"
                  justifyContent={{ base: "space-around", md: "flex-start" }}
                >
                   <Tab
                     px={{ base: 4, md: 6 }}
                     py={4}
                     fontWeight="medium"
                     borderRadius="md"
                     whiteSpace="nowrap"
                     flex={{ base: 1, md: "none" }}
                     color={tabColor}
                     _selected={{
                       color: selectedTabColor,
                       bg: selectedTabBg,
                       fontWeight: "semibold",
                       border: "1px solid",
                       borderColor: selectedTabBorderColor,
                     }}
                     _hover={{
                       bg: hoverTabBg,
                     }}
                   >
                     Account Details
                   </Tab>
                   <Tab
                     px={{ base: 4, md: 6 }}
                     py={4}
                     fontWeight="medium"
                     borderRadius="md"
                     whiteSpace="nowrap"
                     flex={{ base: 1, md: "none" }}
                     color={tabColor}
                     _selected={{
                       color: selectedTabColor,
                       bg: selectedTabBg,
                       fontWeight: "semibold",
                       border: "1px solid",
                       borderColor: selectedTabBorderColor,
                     }}
                     _hover={{
                       bg: hoverTabBg,
                     }}
                   >
                     Security
                   </Tab>
                   <Tab
                     px={{ base: 4, md: 6 }}
                     py={4}
                     fontWeight="medium"
                     borderRadius="md"
                     whiteSpace="nowrap"
                     flex={{ base: 1, md: "none" }}
                     color={tabColor}
                     _selected={{
                       color: selectedTabColor,
                       bg: selectedTabBg,
                       fontWeight: "semibold",
                       border: "1px solid",
                       borderColor: selectedTabBorderColor,
                     }}
                     _hover={{
                       bg: hoverTabBg,
                     }}
                   >
                     System
                   </Tab>
                </TabList>
              </Box>
              <TabPanels>
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
