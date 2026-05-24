import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import InboxPage from './pages/Inbox';
import ContactsPage from './pages/Contacts';
import AIPage from './pages/AI';
import CRMPage from './pages/CRM';
import AnalyticsPage from './pages/Analytics';
import AdminPage from './pages/Admin';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/ai" element={<AIPage />} />
                <Route path="/crm" element={<CRMPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
