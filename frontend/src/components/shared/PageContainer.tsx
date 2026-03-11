import { Box, BoxProps } from "@chakra-ui/react";
import { FC, ReactNode } from "react";

interface PageContainerProps extends BoxProps {
  children: ReactNode;
}

const PageContainer: FC<PageContainerProps> = ({ children, ...rest }) => {
  return (
    <Box p={{ base: 4, md: 8 }} {...rest}>
      {children}
    </Box>
  );
};

export default PageContainer;
