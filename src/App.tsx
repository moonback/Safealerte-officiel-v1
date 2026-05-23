import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { MobileLayout } from './components/MobileLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import AlertDetailScreen from './screens/AlertDetailScreen';
import MapScreen from './screens/MapScreen';
import ReportScreen from './screens/ReportScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import NewAlertScreen from './screens/NewAlertScreen';
import AlertsScreen from './screens/AlertsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PersonalInfoScreen from './screens/PersonalInfoScreen';
import TeamsScreen from './screens/TeamsScreen';

function AppRoutes() {
  const { session, role, loading } = useAuth();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-safe-dark text-white">
        <div className="animate-spin w-10 h-10 border-4 border-safe-red border-t-transparent rounded-full" />
      </div>
    );
  }

  // DESKTOP (Admin)
  if (isDesktop) {
    if (!session) {
      return (
        <Routes>
          <Route path="/login" element={<OnboardingScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      );
    }

    return (
      <Routes>
        <Route path="/" element={<Navigate to={role === 'admin' ? "/admin" : "/app"} replace />} />
        <Route path="/admin" element={role === 'admin' ? <AdminDashboardScreen /> : <Navigate to="/" replace />} />
        <Route path="/admin/new-alert" element={role === 'admin' ? <NewAlertScreen /> : <Navigate to="/" replace />} />
        <Route path="/alert/:id" element={<AlertDetailScreen />} />
        <Route path="/teams/:id" element={<TeamsScreen />} />
        {/* Default catch-all for desktop -> admin */}
        <Route path="*" element={
           <div className="flex h-screen w-full items-center justify-center bg-safe-dark text-white p-6">
              <div className="text-center max-w-md">
                <h1 className="text-2xl mb-4 font-bold">Simulateur Mobile</h1>
                <p className="text-gray-400 mb-6">Réduisez la taille de la fenêtre de votre navigateur pour voir l'application citoyenne mobile, ou accédez au tableau de bord.</p>
                {role === 'admin' && <Link to="/admin" className="bg-safe-red px-6 py-3 rounded-xl inline-block mt-4">Aller au Tableau de Bord</Link>}
              </div>
           </div>
        } />
      </Routes>
    );
  }

  // MOBILE (Citoyen/Membres)
  if (!session) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboardScreen />} />
      <Route path="/admin/new-alert" element={<NewAlertScreen />} />
      <Route element={<MobileLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/alert/:id" element={<AlertDetailScreen />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/report/:step" element={<ReportScreen />} />
        <Route path="/alerts" element={<AlertsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/profile/info" element={<PersonalInfoScreen />} />
        <Route path="/teams/:id" element={<TeamsScreen />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
