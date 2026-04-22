import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { DevicesManagement } from "./components/DevicesManagement";
import { AutomationRules } from "./components/AutomationRules";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { Settings } from "./components/Settings";
import { DryingManagement } from "./components/DryingManagement";
import { BatchManagement } from "./components/BatchManagement";
import { UserManagement } from "./components/admin/UserManagement";
import { RoleManagement } from "./components/admin/RoleManagement";

const pageTitles: Record<string, string> = {
  dashboard: "Factory Dashboard",
  devices: "Device Management",
  automation: "Recipe Automation Rules",
  reports: "Analytics & Reports",
  drying: "Drying Management",
  batch: "Batch Management",
  settings: "System Settings",
  "user-management": "User Management",
  "role-management": "Role Management",
};

const pageMeta: Record<string, { title: string; desc: string }> = {
  settings: {
    title: "System Settings",
    desc: "Configure factory parameters, user accounts, MQTT broker endpoints, and notification preferences.",
  },
};

export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const navigate = useNavigate();
  const location = useLocation();

  // Map routes to navbar items
  const pathToNav: Record<string, string> = {
    "/dashboard": "dashboard",
    "/devices": "devices",
    "/automation": "automation",
    "/reports": "reports",
    "/drying": "drying",
    "/batch": "batch",
    "/settings": "settings",
    "/user-management": "user-management",
    "/role-management": "role-management",
  };

  // Update activeNav when route changes
  const currentNav =
    (pathToNav[location.pathname] || "dashboard");

  const handleNavChange = (nav: string) => {
    setActiveNav(nav);
    const routes: Record<string, string> = {
      dashboard: "/dashboard",
      devices: "/devices",
      automation: "/automation",
      reports: "/reports",
      settings: "/settings",
      drying: "/drying",
      batch: "/batch",
      "user-management": "/user-management",
      "role-management": "/role-management",
    };
    navigate(routes[nav]);
  };

  return (
    <Layout
      pageTitle={pageTitles[currentNav] ?? "Dashboard"}
      activeNav={currentNav}
      onNavChange={handleNavChange}
    >
      {currentNav === "dashboard" && <Dashboard />}
      {currentNav === "devices" && <DevicesManagement />}
      {currentNav === "automation" && <AutomationRules />}
      {currentNav === "reports" && <ReportsAnalytics />}
      {currentNav === "settings" && <Settings />}
      {currentNav === "drying" && <DryingManagement />}
      {currentNav === "batch" && <BatchManagement />}
      {currentNav === "user-management" && <UserManagement />}
      {currentNav === "role-management" && <RoleManagement />}

    </Layout>
  );
}