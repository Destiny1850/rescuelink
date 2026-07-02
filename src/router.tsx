import { createBrowserRouter } from 'react-router-dom';

import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

import { CatalogPage } from './modules/public-adoption/pages/CatalogPage';
import { AnimalDetailPage } from './modules/public-adoption/pages/AnimalDetailPage';
import { ApplicationFormPage } from './modules/public-adoption/pages/ApplicationFormPage';
import { ShelterProfilePage } from './modules/public-adoption/pages/ShelterProfilePage';

import { LoginPage } from './modules/shelter-dashboard/pages/LoginPage';
import { AnimalsInventoryPage } from './modules/shelter-dashboard/pages/AnimalsInventoryPage';
import { ApplicationsInboxPage } from './modules/shelter-dashboard/pages/ApplicationsInboxPage';
import { TelegramChannelPage } from './modules/shelter-dashboard/pages/TelegramChannelPage';
import { StatsPage } from './modules/shelter-dashboard/pages/StatsPage';
import { ShelterProfileEditPage } from './modules/shelter-dashboard/pages/ShelterProfileEditPage';
import { ProtectedRoute } from './modules/shelter-dashboard/components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <CatalogPage /> },
      { path: '/animal/:id', element: <AnimalDetailPage /> },
      { path: '/animal/:id/postular', element: <ApplicationFormPage /> },
      { path: '/refugio/:slug', element: <ShelterProfilePage /> },
      { path: '/albergue/login', element: <LoginPage /> },
    ],
  },
  {
    path: '/albergue',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <AnimalsInventoryPage /> },
          { path: 'solicitudes', element: <ApplicationsInboxPage /> },
          { path: 'telegram', element: <TelegramChannelPage /> },
          { path: 'estadisticas', element: <StatsPage /> },
          { path: 'perfil', element: <ShelterProfileEditPage /> },
        ],
      },
    ],
  },
]);
