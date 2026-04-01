import React from "react";
import {
  Box,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import Layout from "../../components/Layout";
import UpdateProfileForm from "./UpdateProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";
import SystemBackup from "./SystemBackup";
import PageContainer from "@components/shared/PageContainer";
import PageHeader from "@components/shared/PageHeader";
import { User, Lock, Database } from "lucide-react";
import { useLogout } from "@/lib/useLogout";

const Profile: React.FC = () => {
  const cardBg = useColorModeValue("white", "cardDarkBg");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const selectedTabColor = useColorModeValue("brand.700", "brand.200");
  const selectedTabBg = useColorModeValue("brand.50", "rgba(56,178,172,0.12)");
  const selectedTabBorderColor = useColorModeValue("brand.400", "brand.500");
  const hoverTabBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const tabColor = useColorModeValue("gray.500", "gray.400");
  const tabBg = useColorModeValue("white", "gray.800");
  const tabIconColor = useColorModeValue("gray.400", "gray.500");
  const tabSelectedIconColor = useColorModeValue("brand.500", "brand.300");

  const handleLogout = useLogout();

  const tabs = [
    { label: "Account", icon: User },
    { label: "Security", icon: Lock },
    { label: "Backups", icon: Database },
  ];

  return (
    <Layout handleLogout={handleLogout}>
      <PageHeader
        title="User Profile"
        subtitle="Manage your account details and security"
        icon={User}
        breadcrumbs={[{ label: "Profile" }]}
      />
      <Box flex={1} overflowY="auto">
        <PageContainer>
          <Box
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            bg={tabBg}
            overflow="hidden"
            shadow="sm"
          >
            <Tabs variant="unstyled" size="md" isLazy>
              <Box
                px={{ base: 2, md: 4 }}
                pt={{ base: 2, md: 3 }}
                pb={0}
                borderBottom="1px solid"
                borderColor={borderColor}
              >
                <TabList
                  borderBottom="none"
                  gap={{ base: 0, md: 1 }}
                  mb="-1px"
                >
                  {tabs.map(({ label, icon }) => (
                    <Tab
                      key={label}
                      px={{ base: 3, md: 4 }}
                      py={2.5}
                      fontWeight="500"
                      fontSize="sm"
                      borderRadius="md"
                      borderBottomRadius={0}
                      whiteSpace="nowrap"
                      flex={{ base: 1, md: "none" }}
                      color={tabColor}
                      borderBottom="2px solid"
                      borderColor="transparent"
                      transition="all 0.15s ease"
                      _selected={{
                        color: selectedTabColor,
                        bg: selectedTabBg,
                        fontWeight: "600",
                        borderBottomColor: selectedTabBorderColor,
                      }}
                      _hover={{ bg: hoverTabBg }}
                      _focus={{ boxShadow: "none" }}
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Icon
                        as={icon}
                        boxSize={3.5}
                        color="inherit"
                        sx={{
                          "[aria-selected=true] &": {
                            color: tabSelectedIconColor,
                          },
                          "[aria-selected=false] &": {
                            color: tabIconColor,
                          },
                        }}
                      />
                      {label}
                    </Tab>
                  ))}
                </TabList>
              </Box>
              <TabPanels bg={cardBg}>
                <TabPanel p={{ base: 0, md: 0 }}>
                  <UpdateProfileForm />
                </TabPanel>
                <TabPanel p={{ base: 0, md: 0 }}>
                  <ChangePasswordForm />
                </TabPanel>
                <TabPanel p={{ base: 0, md: 0 }}>
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
