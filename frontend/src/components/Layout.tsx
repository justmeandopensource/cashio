import React, { ReactNode } from "react";
import { Flex, Box } from "@chakra-ui/react";
import Sidebar from "@components/Sidebar";

interface LayoutProps {
  children: ReactNode;
  handleLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  handleLogout,
}) => {
  return (
    <Flex minH="100vh" direction={{ base: "column", md: "row" }}>
      {/* Sidebar */}
      <Sidebar handleLogout={handleLogout} />

      {/* Main Content */}
      <Box flex={1} as="main" display="flex" flexDirection="column" maxH="100vh">
        {children}
      </Box>
    </Flex>
  );
};

export default Layout;
