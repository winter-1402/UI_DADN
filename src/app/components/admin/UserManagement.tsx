import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
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
import { User, UserRole, APIUser } from "@/types/rbac";
import { Trash2, Edit2, Plus } from "lucide-react";
import { userAPI } from "../../config/api.config";

const toUser = (u: APIUser): User => ({
  ...u,
  role: u.is_admin ? UserRole.ADMIN : UserRole.USER,
});

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    app_user_name: "",
    is_admin: false,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.list();
      const list: APIUser[] = response?.data ?? response ?? [];
      setUsers(list.map(toUser));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      const message =
        error instanceof Error ? error.message : "Không tải được danh sách người dùng";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (user: User, nextActive: boolean) => {
    setTogglingId(user.app_user_id);
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) =>
        u.app_user_id === user.app_user_id ? { ...u, is_active: nextActive } : u
      )
    );
    try {
      await userAPI.update(user.app_user_id, { is_active: nextActive });
      toast.success(
        nextActive
          ? `Đã kích hoạt ${user.email}`
          : `Đã vô hiệu hoá ${user.email}`
      );
      // Reload from server to keep client/source-of-truth in sync
      await fetchUsers();
    } catch (error) {
      // Rollback optimistic change
      setUsers((prev) =>
        prev.map((u) =>
          u.app_user_id === user.app_user_id ? { ...u, is_active: !nextActive } : u
        )
      );
      const message =
        error instanceof Error ? error.message : "Cập nhật trạng thái thất bại";
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };
  
  const handleAddUser = () => {
    if (!formData.email || !formData.app_user_name) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingId) {
      setUsers(
        users.map((u) =>
          u.app_user_id === editingId
            ? {
                ...u,
                email: formData.email,
                app_user_name: formData.app_user_name,
                is_admin: formData.is_admin,
                role: formData.is_admin ? UserRole.ADMIN : UserRole.USER,
              }
            : u
        )
      );
      setEditingId(null);
    } else {
      const newUser: User = {
        app_user_id: Math.max(...users.map((u) => u.app_user_id), 0) + 1,
        app_user_name: formData.app_user_name,
        email: formData.email,
        is_admin: formData.is_admin,
        is_active: true,
        created_at: new Date().toISOString(),
        role: formData.is_admin ? UserRole.ADMIN : UserRole.USER,
      };
      setUsers([...users, newUser]);
    }

    // Reset form
    setFormData({
      email: "",
      app_user_name: "",
      is_admin: false,
    });
    setIsOpen(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      email: user.email,
      app_user_name: user.app_user_name,
      is_admin: user.is_admin,
    });
    setEditingId(user.app_user_id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa người dùng này?")) {
      setUsers(users.filter((u) => u.app_user_id !== id));
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      email: "",
      app_user_name: "",
      is_admin: false,
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
              Quản lý tài khoản người dùng và phân quyền
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
                    Tên người dùng
                  </label>
                  <Input
                    value={formData.app_user_name}
                    onChange={(e) =>
                      setFormData({ ...formData, app_user_name: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_admin"
                    checked={formData.is_admin}
                    onChange={(e) =>
                      setFormData({ ...formData, is_admin: e.target.checked })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="is_admin" className="text-sm font-medium cursor-pointer">
                    Cấp quyền Admin
                  </label>
                </div>

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
                  <TableHead>Tên người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                      Chưa có người dùng nào
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => (
                  <TableRow key={user.app_user_id}>
                    <TableCell className="font-medium">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.app_user_name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.is_admin
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.is_admin ? "Admin" : "User"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          disabled={togglingId === user.app_user_id}
                          onCheckedChange={(checked) =>
                            handleToggleActive(user, checked)
                          }
                          aria-label={`Toàn trạng thái ${user.email}`}
                        />
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            user.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.is_active ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("vi-VN")}
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
                          onClick={() => handleDelete(user.app_user_id)}
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
