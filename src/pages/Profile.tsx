import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setDisplayName(profile.display_name);
    setUsername(profile.username);
    setDiscordUsername(profile.discord_username || "");
    setInitialized(true);
  }

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success("تم تحديث الصورة!");
    } catch {
      toast.error("فشل رفع الصورة");
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ display_name: displayName, username, discord_username: discordUsername });
      toast.success("تم حفظ التغييرات!");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم تغيير كلمة المرور!");
      setNewPassword("");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen text-muted-foreground">جاري التحميل...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border pb-4">
          <h2 className="text-xl font-bold">البروفايل</h2>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="w-28 h-28 border-4 border-primary">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                {profile?.display_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-foreground" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Profile Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>معلومات الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>اسم العرض</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>اسم المستخدم</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>يوزر الديسكورد</Label>
              <Input value={discordUsername} onChange={(e) => setDiscordUsername(e.target.value)} />
            </div>
            <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="w-full">
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>تغيير كلمة المرور</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button onClick={handleChangePassword} variant="secondary" className="w-full">
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
