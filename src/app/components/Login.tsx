import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { useAuth } from "@/context/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError("Vui lòng nhập email và mật khẩu");
        setIsLoading(false);
        return;
      }

      // Use the auth context login
      await login(email, password);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md space-y-6">
        <Card className="p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Hệ thống quản lý nhà máy
            </h1>
            <p className="text-slate-600">Factory Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Mật khẩu
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </Card>

        <Card className="p-6 shadow-lg bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-slate-900 mb-3">
            Demo Credentials
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-700">Admin Account:</p>
              <p className="text-slate-600">
                Email: <code className="bg-white px-2 py-1 rounded">admin@example.com</code>
              </p>
              <p className="text-slate-600">
                Password: <code className="bg-white px-2 py-1 rounded">password</code>
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-700">User Account:</p>
              <p className="text-slate-600">
                Email: <code className="bg-white px-2 py-1 rounded">user@example.com</code>
              </p>
              <p className="text-slate-600">
                Password: <code className="bg-white px-2 py-1 rounded">password</code>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
