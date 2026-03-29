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

const pageTitles: Record<string, string> = {
  dashboard: "Factory Dashboard",
  devices: "Device Management",
  automation: "Recipe Automation Rules",
  reports: "Analytics & Reports",
  drying: "Drying Management",
  batch: "Batch Management",
  settings: "System Settings",
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
  };

  // Update activeNav when route changes
  const currentNav = location.pathname.startsWith("/settings")
    ? "settings"
    : location.pathname.startsWith("/batch")
      ? "batch"
    : location.pathname.startsWith("/drying")
      ? "drying"
    : (pathToNav[location.pathname] || "dashboard");

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

    </Layout>
  );
}