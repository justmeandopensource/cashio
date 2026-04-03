import HomeLedgerCards from "@features/home/components/HomeLedgerCards";
import { lazy, Suspense } from "react";
const CreateLedgerModal = lazy(() => import("@components/modals/CreateLedgerModal"));
import PageContainer from "@components/shared/PageContainer";
import HomeMainHeader from "./HomeMainHeader";
import { Box } from "@chakra-ui/react";

import type { Ledger } from "@/types";

interface HomeMainProps {
  ledgers?: Ledger[];
  defaultLedgerId: number | null;
  onOpen: () => void;
  isOpen: boolean;
  onClose: () => void;

  handleCreateLedger: (name: string, currency: string, description: string, notes: string, navServiceType: string) => void;
}

const HomeMain = ({
  ledgers = [],
  defaultLedgerId,
  onOpen,
  isOpen,
  onClose,
  handleCreateLedger,
}: HomeMainProps) => {
  return (
    <>
      <HomeMainHeader onCreateLedger={onOpen} />
      <Box flex={1} overflowY="auto">
        <PageContainer>
          <HomeLedgerCards ledgers={ledgers} defaultLedgerId={defaultLedgerId} onOpen={onOpen} />
        </PageContainer>
      </Box>
      <Suspense fallback={<div>Loading...</div>}>
        <CreateLedgerModal
          isOpen={isOpen}
          onClose={onClose}
          handleCreateLedger={handleCreateLedger}
        />
      </Suspense>
    </>
  );
};

export default HomeMain;
