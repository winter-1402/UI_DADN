import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { AdminOnly } from "@/components/permission/PermissionGuards";
import { Checkbox } from "@/app/components/ui/checkbox";
import { UserRole, Permission, rolePermissions } from "@/types/rbac";
import { Badge } from "@/app/components/ui/badge";

interface RolePermissionSet {
  role: UserRole;
  permissions: Permission[];
}

const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

const PERMISSION_CATEGORIES = {
  "Dashboard & Monitoring": [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_DRYING_STATUS,
    Permission.VIEW_SENSOR_DATA,
    Permission.VIEW_DEVICE_STATUS,
  ],
  "Batch Management": [
    Permission.CREATE_BATCH,
    Permission.RUN_BATCH,
    Permission.STOP_BATCH,
    Permission.EDIT_BATCH,
  ],
  "Drying Control": [
    Permission.MANUAL_CONTROL,
    Permission.SCHEDULED_CONTROL,
    Permission.ADJUST_PARAMETERS,
    Permission.TOGGLE_THRESHOLD,
  ],
  "Reporting & Logs": [
    Permission.VIEW_EVENT_LOGS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],
  "User Management": [
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_PERMISSIONS,
  ],
  "System Configuration": [
    Permission.MANAGE_DEVICES,
    Permission.CONFIGURE_SENSORS,
    Permission.MANAGE_RECIPES,
    Permission.MANAGE_POLICIES,
    Permission.SET_THRESHOLDS,
    Permission.MANAGE_AUTOMATION_RULES,
  ],
  Settings: [
    Permission.ACCESS_SETTINGS,
    Permission.CONFIGURE_MQTT,
    Permission.MANAGE_NOTIFICATIONS,
  ],
};

export function RoleManagement() {
  const [customRoles, setCustomRoles] = useState<RolePermissionSet[]>([
    {
      role: UserRole.USER,
      permissions: rolePermissions[UserRole.USER],
    },
    {
      role: UserRole.ADMIN,
      permissions: rolePermissions[UserRole.ADMIN],
    },
  ]);

  const togglePermission = (roleIndex: number, permission: Permission) => {
    setCustomRoles(
      customRoles.map((role, idx) => {
        if (idx === roleIndex) {
          const hasPermission = role.permissions.includes(permission);
          return {
            ...role,
            permissions: hasPermission
              ? role.permissions.filter((p) => p !== permission)
              : [...role.permissions, permission],
          };
        }
        return role;
      })
    );
  };

  const hasAllPermissions = (roleIndex: number, permissions: Permission[]) => {
    return permissions.every((p) =>
      customRoles[roleIndex].permissions.includes(p)
    );
  };

  const hasSomePermissions = (roleIndex: number, permissions: Permission[]) => {
    return permissions.some((p) =>
      customRoles[roleIndex].permissions.includes(p)
    );
  };

  const toggleCategoryPermissions = (
    roleIndex: number,
    permissions: Permission[]
  ) => {
    if (hasAllPermissions(roleIndex, permissions)) {
      // Remove all
      setCustomRoles(
        customRoles.map((role, idx) => {
          if (idx === roleIndex) {
            return {
              ...role,
              permissions: role.permissions.filter(
                (p) => !permissions.includes(p)
              ),
            };
          }
          return role;
        })
      );
    } else {
      // Add all
      setCustomRoles(
        customRoles.map((role, idx) => {
          if (idx === roleIndex) {
            const newPerms = new Set([...role.permissions, ...permissions]);
            return {
              ...role,
              permissions: Array.from(newPerms),
            };
          }
          return role;
        })
      );
    }
  };

  return (
    <AdminOnly
      fallback={
        <div className="p-6">
          <p className="text-red-600">
            Chỉ admin mới có thể quản lý vai trò
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Quản lý Vai trò và Quyền hạn
          </h2>
          <p className="text-slate-600 mt-2">
            Cấu hình quyền hạn cho từng vai trò trong hệ thống
          </p>
        </div>

        <div className="grid gap-6">
          {customRoles.map((roleSet, roleIndex) => (
            <Card key={roleSet.role} className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {roleSet.role === UserRole.ADMIN ? "Admin" : "User"}
                </h3>
                <p className="text-sm text-slate-600">
                  {roleSet.role === UserRole.ADMIN
                    ? "Có toàn bộ quyền hạn của hệ thống"
                    : "Quyền hạn cơ bản để vận hành máy sấy"}
                </p>
              </div>

              <div className="space-y-6">
                {Object.entries(PERMISSION_CATEGORIES).map(
                  ([category, permissions]) => (
                    <div key={category}>
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                        <Checkbox
                          id={`category-${roleSet.role}-${category}`}
                          checked={hasAllPermissions(roleIndex, permissions)}
                          indeterminate={
                            hasSomePermissions(roleIndex, permissions) &&
                            !hasAllPermissions(roleIndex, permissions)
                          }
                          onCheckedChange={() =>
                            toggleCategoryPermissions(roleIndex, permissions)
                          }
                        />
                        <label
                          htmlFor={`category-${roleSet.role}-${category}`}
                          className="font-semibold text-slate-900 cursor-pointer"
                        >
                          {category}
                        </label>
                        <span className="ml-auto text-sm text-slate-600">
                          {permissions.filter((p) =>
                            roleSet.permissions.includes(p)
                          ).length}{" "}
                          / {permissions.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 ml-6">
                        {permissions.map((permission) => (
                          <div
                            key={permission}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`perm-${roleSet.role}-${permission}`}
                              checked={roleSet.permissions.includes(permission)}
                              onCheckedChange={() =>
                                togglePermission(roleIndex, permission)
                              }
                            />
                            <label
                              htmlFor={`perm-${roleSet.role}-${permission}`}
                              className="text-sm cursor-pointer text-slate-700"
                            >
                              {permission
                                .split("_")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase()
                                )
                                .join(" ")}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 pt-6 border-t flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {roleSet.permissions.length} Quyền được cấp
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 justify-end pt-6">
          <Button variant="outline">Hủy</Button>
          <Button>Lưu thay đổi</Button>
        </div>
      </div>
    </AdminOnly>
  );
}
