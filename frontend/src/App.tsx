import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Spinner, Center } from "@chakra-ui/react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "@components/ErrorFallback";
import ProtectedRoute from "@components/ProtectedRoute";
import { setOnUnauthorized, setAuthToken, setRefreshToken } from "@/lib/api";

const Login = lazy(() => import("@features/auth/Login"));
const Register = lazy(() => import("@features/auth/Register"));
const Home = lazy(() => import("@features/home/Home"));
const Ledger = lazy(() => import("@features/ledger/Ledger"));
const Account = lazy(() => import("@features/account/Account"));
const Categories = lazy(() => import("@features/categories/Categories"));
const Insights = lazy(() => import("./features/insights/Insights"));
const Profile = lazy(() => import("@features/profile/Profile"));
const NetWorth = lazy(() => import("@features/net-worth/NetWorth"));
const Budget = lazy(() => import("@features/budget/Budget"));

/** Registers the 401 handler so axios redirects via React Router instead of full reload */
const UnauthorizedHandler: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setOnUnauthorized(() => {
      setAuthToken(null);
      setRefreshToken(null);
      navigate("/login");
    });
  }, [navigate]);
  return null;
};

/** Wraps children in an ErrorBoundary that resets when the route changes */
const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[location.pathname]}>
      {children}
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <UnauthorizedHandler />
      <Suspense fallback={<Center h="100vh"><Spinner size="xl" /></Center>}>
        <RouteErrorBoundary>
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
              <Route path="/net-worth" element={<NetWorth />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </RouteErrorBoundary>
      </Suspense>
    </Router>
  );
};

export default App;
