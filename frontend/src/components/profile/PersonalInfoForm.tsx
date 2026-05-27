import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";

type EditableField = {
  key: keyof Pick<User, "displayName" | "username" | "email" | "phone">;
  label: string;
  type?: string;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "displayName", label: "Tên hiển thị" },
  { key: "username", label: "Tên người dùng" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Số điện thoại" },
];

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const [formData, setFormData] = useState({
    displayName: userInfo?.displayName ?? "",
    username: userInfo?.username ?? "",
    email: userInfo?.email ?? "",
    phone: userInfo?.phone ?? "",
    bio: userInfo?.bio ?? "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { setUser } = useAuthStore();

  if (!userInfo) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("displayName", formData.displayName);
      formDataObj.append("email", formData.email);
      formDataObj.append("phone", formData.phone);
      formDataObj.append("bio", formData.bio);

      const response = await userService.updateProfile(formDataObj);
      
      setMessage({ type: "success", text: response.message });
      setUser(response.user);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Cập nhật thất bại",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto dismiss success message sau 1s
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERSONAL_FIELDS.map(({ key, label, type }) => (
              <div
                key={key}
                className="space-y-2"
              >
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={type ?? "text"}
                  value={formData[key as keyof typeof formData] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  disabled={key === "username"}
                  className="glass-light border-border/30"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Giới thiệu</Label>
            <Textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Viết gì đó về bạn..."
              maxLength={500}
              className="glass-light border-border/30 resize-none"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                overflowY: 'auto'
              }}
            />
            <p className="text-sm text-muted-foreground">
              {formData.bio.length}/500
            </p>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-700"
                  : "bg-red-500/20 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </>
  );
};

export default PersonalInfoForm;
