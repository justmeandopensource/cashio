import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Spinner, Center } from "@chakra-ui/react";
import ProtectedRoute from "@components/ProtectedRoute";

const Login = lazy(() => import("@features/auth/Login"));
const Register = lazy(() => import("@features/auth/Register"));
const Home = lazy(() => import("@features/home/Home"));
const Ledger = lazy(() => import("@features/ledger/Ledger"));
const Account = lazy(() => import("@features/account/Account"));
const Categories = lazy(() => import("@features/categories/Categories"));
const Insights = lazy(() => import("./features/insights/Insights"));
const Profile = lazy(() => import("@features/profile/Profile"));

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<Center h="100vh"><Spinner size="xl" /></Center>}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/account/:accountId" element={<Account />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
