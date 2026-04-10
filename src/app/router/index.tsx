import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { NetworkDhtPage } from "@/pages/network/NetworkDhtPage";
import { NetworkPeersPage } from "@/pages/network/NetworkPeersPage";
import { NetworkServersPage } from "@/pages/network/NetworkServersPage";
import { SearchPage } from "@/pages/search/SearchPage";
import { SettingsBootstrapPage } from "@/pages/settings/SettingsBootstrapPage";
import { SettingsLoggingPage } from "@/pages/settings/SettingsLoggingPage";
import { SettingsRuntimePage } from "@/pages/settings/SettingsRuntimePage";
import { SettingsStatePage } from "@/pages/settings/SettingsStatePage";
import { SharedPage } from "@/pages/shared/SharedPage";
import { TransfersPage } from "@/pages/transfers/TransfersPage";
import { createBrowserRouter, Navigate } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "transfers", element: <TransfersPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "shared", element: <SharedPage /> },
      { path: "network/servers", element: <NetworkServersPage /> },
      { path: "network/peers", element: <NetworkPeersPage /> },
      { path: "network/dht", element: <NetworkDhtPage /> },
      { path: "settings/runtime", element: <SettingsRuntimePage /> },
      { path: "settings/bootstrap", element: <SettingsBootstrapPage /> },
      { path: "settings/state", element: <SettingsStatePage /> },
      { path: "settings/logging", element: <SettingsLoggingPage /> },
    ],
  },
]);
