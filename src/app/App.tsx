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

const pageTitles: Record<string, string> = {
  dashboard: "Factory Dashboard",
  devices: "Device Management",
  automation: "Automation Rules",
  reports: "Analytics & Reports",
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
    "/settings": "settings",
  };

  // Update activeNav when route changes
  const currentNav = pathToNav[location.pathname] || "dashboard";

  const handleNavChange = (nav: string) => {
    setActiveNav(nav);
    const routes: Record<string, string> = {
      dashboard: "/dashboard",
      devices: "/devices",
      automation: "/automation",
      reports: "/reports",
      settings: "/settings",
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
    </Layout>
  );
}