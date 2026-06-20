import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Routes,Route,Navigate}from'react-router-dom';import './index.css';import Sidebar from './components/Sidebar';import DashboardPage from './pages/DashboardPage';import OrganizationsPage from './pages/OrganizationsPage';import OrganizationDetailPage from './pages/OrganizationDetailPage';import FollowUpsPage from './pages/FollowUpsPage';import EmailHistoryPage from './pages/EmailHistoryPage';import ReportsPage from './pages/ReportsPage';import SettingsPage from './pages/SettingsPage';import BackupsPage from './pages/BackupsPage';import AgendaPage from './pages/AgendaPage';import LoginPage from './pages/LoginPage';import { AuthProvider, useAuth } from './services/AuthContext';import DocumentsPage from './pages/DocumentsPage';
import VoiceAssistant from './components/VoiceAssistant';

function ProtectedLayout({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <div className="flex"><Sidebar/><main className="flex-1 p-6 relative">{children}</main><VoiceAssistant/></div>;
}

function LoginRoute() {
  const { token } = useAuth();
  if (token) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={
            <ProtectedLayout>
              <Routes>
                <Route path="/" element={<DashboardPage/>}/>
                <Route path="/agenda" element={<AgendaPage/>}/>
                <Route path="/organizations" element={<OrganizationsPage/>}/>
                <Route path="/organizations/:id" element={<OrganizationDetailPage/>}/>
                <Route path="/followups" element={<FollowUpsPage/>}/>
                <Route path="/email-history" element={<EmailHistoryPage/>}/>
                <Route path="/reports" element={<ReportsPage/>}/>
                <Route path="/settings" element={<SettingsPage/>}/>
                <Route path="/backups" element={<BackupsPage/>}/>
                <Route path="/documents" element={<DocumentsPage />} />
              </Routes>
            </ProtectedLayout>
          }/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
createRoot(document.getElementById('root')).render(<App/>);
