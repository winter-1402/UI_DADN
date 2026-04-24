import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Boxes,
  Settings,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Users,
  Factory,
  BookOpen
} from "lucide-react";
export function useIsAdmin() {
  // Tạm thời hardcode trả về true để bạn có thể xem được 
  // toàn bộ các menu của Admin trong quá trình thiết kế UI.
  // Sau này khi team Backend (Hiếu, Huy) làm phân quyền xong thì sẽ thay đổi logic ở đây.
  return true; 
}
interface NavItem {
  icon: React.ReactNode;
  label: string;
  id: string;
  badge?: number;
  adminOnly?: boolean;
}

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
}

// Đã cập nhật lại Menu theo chuẩn tài liệu Describe.md
const navItems: NavItem[] = [
  // --- Dành cho mọi User ---
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", id: "dashboard" },
  { icon: <Factory size={20} />, label: "Quản lý Phân xưởng", id: "factory-layout" }, // Quản lý Khu vực, Máy sấy, Sensor, Output
  // Batch management moved into Devices page
  { icon: <BarChart3 size={20} />, label: "Báo cáo & Thống kê", id: "reports" },
  
  // --- Chỉ dành cho Admin ---
  { icon: <BookOpen size={20} />, label: "Danh mục & Công thức", id: "master-data", adminOnly: true }, // Cài đặt Recipe, Fruit, Policy, Threshold
  { icon: <Users size={20} />, label: "Quản lý Người dùng", id: "user-management", adminOnly: true },
  { icon: <Settings size={20} />, label: "Cài đặt Hệ thống", id: "settings", adminOnly: true },
];

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = useIsAdmin(); // Hook kiểm tra quyền Admin

  // Lọc các menu: Nếu là Admin thì thấy hết, nếu là User thường thì ẩn các menu adminOnly
  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside
      className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      } min-h-screen relative shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500 shrink-0">
          <Leaf size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white truncate font-bold text-sm">
              FruitDry MES
            </p>
            <p className="text-emerald-400 truncate text-xs">
              Factory Management
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
              ${
                activeNav === item.id
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <span
                className={`truncate text-left text-sm ${activeNav === item.id ? "font-semibold" : "font-normal"}`}
              >
                {item.label}
              </span>
            )}
            {!collapsed && item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Version & Collapse */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed && (
          <p className="text-slate-500 mb-2 px-1 text-xs">
            v3.0.0 — MES System
          </p>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="ml-2 text-xs">Thu gọn</span>}
        </button>
      </div>
    </aside>
  );
}