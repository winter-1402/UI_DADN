import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { AdminOnly } from "@/components/permission/PermissionGuards";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { User, UserRole, ScopeLevel } from "@/types/rbac";
import { Trash2, Edit2, Plus } from "lucide-react";

export function UserManagement() {
  // Mock data - replace with API calls
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      email: "admin@example.com",
      fullName: "Admin User",
      role: UserRole.ADMIN,
      scope: {
        level: ScopeLevel.FACTORY,
        factoryId: "factory-1",
      },
      active: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "2",
      email: "user@example.com",
      fullName: "Regular User",
      role: UserRole.USER,
      scope: {
        level: ScopeLevel.AREA,
        factoryId: "factory-1",
        areaId: "area-1",
      },
      active: true,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
  ]);

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: UserRole.USER,
    scopeLevel: ScopeLevel.AREA,
    factoryId: "factory-1",
    areaId: "area-1",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleAddUser = () => {
    if (!formData.email || !formData.fullName) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingId) {
      setUsers(
        users.map((u) =>
          u.id === editingId
            ? {
                ...u,
                email: formData.email,
                fullName: formData.fullName,
                role: formData.role as UserRole,
                scope: {
                  level: formData.scopeLevel as ScopeLevel,
                  factoryId: formData.factoryId,
                  areaId: formData.scopeLevel === ScopeLevel.AREA ? formData.areaId : undefined,
                },
                updatedAt: new Date(),
              }
            : u
        )
      );
      setEditingId(null);
    } else {
      const newUser: User = {
        id: String(Math.random()),
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role as UserRole,
        scope: {
          level: formData.scopeLevel as ScopeLevel,
          factoryId: formData.factoryId,
          areaId: formData.scopeLevel === ScopeLevel.AREA ? formData.areaId : undefined,
        },
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUsers([...users, newUser]);
    }

    // Reset form
    setFormData({
      email: "",
      fullName: "",
      role: UserRole.USER,
      scopeLevel: ScopeLevel.AREA,
      factoryId: "factory-1",
      areaId: "area-1",
    });
    setIsOpen(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      scopeLevel: user.scope.level,
      factoryId: user.scope.factoryId || "factory-1",
      areaId: user.scope.areaId || "area-1",
    });
    setEditingId(user.id);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa người dùng này?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      email: "",
      fullName: "",
      role: UserRole.USER,
      scopeLevel: ScopeLevel.AREA,
      factoryId: "factory-1",
      areaId: "area-1",
    });
  };

  return (
    <AdminOnly
      fallback={
        <div className="p-6">
          <p className="text-red-600">
            Chỉ admin mới có thể quản lý người dùng
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Quản lý Người dùng
            </h2>
            <p className="text-slate-600 mt-2">
              Quản lý tài khoản người dùng, vai trò và phạm vi truy cập
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm người dùng
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
                </DialogTitle>
                <DialogDescription>
                  Điền thông tin người dùng bên dưới
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Họ tên
                  </label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vai trò
                  </label>
                  <Select value={formData.role} onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      role: value as UserRole,
                    })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.USER}>User</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phạm vi truy cập
                  </label>
                  <Select
                    value={formData.scopeLevel}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        scopeLevel: value as ScopeLevel,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ScopeLevel.FACTORY}>
                        Toàn nhà máy
                      </SelectItem>
                      <SelectItem value={ScopeLevel.AREA}>Khu vực</SelectItem>
                      <SelectItem value={ScopeLevel.DRYER}>
                        Máy sấy
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.scopeLevel === ScopeLevel.AREA && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Khu vực
                    </label>
                    <Input
                      value={formData.areaId}
                      onChange={(e) =>
                        setFormData({ ...formData, areaId: e.target.value })
                      }
                      placeholder="area-1"
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleAddUser}>
                    {editingId ? "Cập nhật" : "Thêm"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Email</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Phạm vi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === UserRole.ADMIN
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role === UserRole.ADMIN ? "Admin" : "User"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {user.scope.level === ScopeLevel.FACTORY
                          ? "Toàn nhà máy"
                          : user.scope.level === ScopeLevel.AREA
                            ? `Khu vực (${user.scope.areaId})`
                            : `Máy sấy (${user.scope.dryerId})`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.active ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                          className="gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user.id)}
                          className="gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminOnly>
  );
}
