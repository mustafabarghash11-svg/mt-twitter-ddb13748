import { useState } from "react";
import { UserPlus, UserCheck, UserX, Search, Users, Clock, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import {
  useFriendships,
  useSendFriendRequest,
  useRespondToRequest,
  useRemoveFriend,
  useSearchUsersWithFriendStatus,
} from "@/hooks/useFriends";
import { useStartConversation } from "@/hooks/useMessages";
import { toast } from "sonner";

export default function Friends() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: friendships, isLoading } = useFriendships();
  const { data: searchResults } = useSearchUsersWithFriendStatus(searchQuery);
  const sendRequest = useSendFriendRequest();
  const respond = useRespondToRequest();
  const remove = useRemoveFriend();
  const startConversation = useStartConversation();

  const pendingCount = friendships?.pendingReceived?.length || 0;

  const handleSendRequest = (userId: string) => {
    sendRequest.mutate(userId, {
      onSuccess: () => toast.success("تم إرسال طلب الصداقة!"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const handleAccept = (id: string) => {
    respond.mutate({ id, status: "accepted" }, {
      onSuccess: () => toast.success("تم قبول طلب الصداقة! 🎉"),
    });
  };

  const handleReject = (id: string) => {
    respond.mutate({ id, status: "rejected" }, {
      onSuccess: () => toast.success("تم رفض الطلب"),
    });
  };

  const handleRemove = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => toast.success("تم حذف الصديق"),
    });
  };

  const handleMessage = async (userId: string) => {
    const convId = await startConversation.mutateAsync(userId);
    navigate("/messages", { state: { conversationId: convId } });
  };

  const getFriendshipButton = (profile: any) => {
    const f = profile.friendship;
    if (!f) {
      return (
        <Button size="sm" onClick={() => handleSendRequest(profile.user_id)} className="rounded-full gap-1">
          <UserPlus className="w-4 h-4" /> إضافة
        </Button>
      );
    }
    if (f.status === "accepted") {
      return (
        <Button size="sm" variant="secondary" className="rounded-full gap-1" disabled>
          <UserCheck className="w-4 h-4" /> أصدقاء
        </Button>
      );
    }
    if (f.status === "pending") {
      return (
        <Button size="sm" variant="outline" className="rounded-full gap-1 text-muted-foreground" disabled>
          <Clock className="w-4 h-4" /> معلّق
        </Button>
      );
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4">
          <h2 className="text-xl font-bold">الأصدقاء</h2>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <div className="border-b border-border px-4">
            <TabsList className="bg-transparent gap-0 h-auto">
              <TabsTrigger value="friends" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                <Users className="w-4 h-4 ml-1" />
                الأصدقاء
                {(friendships?.friends?.length || 0) > 0 && (
                  <Badge variant="secondary" className="mr-2">{friendships?.friends?.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                <Clock className="w-4 h-4 ml-1" />
                الطلبات
                {pendingCount > 0 && (
                  <Badge className="mr-2 bg-primary">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="search" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                <Search className="w-4 h-4 ml-1" />
                بحث
              </TabsTrigger>
            </TabsList>
          </div>

          {/* قائمة الأصدقاء */}
          <TabsContent value="friends" className="mt-0">
            {isLoading ? (
              <p className="p-8 text-center text-muted-foreground">جاري التحميل...</p>
            ) : friendships?.friends?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا يوجد أصدقاء بعد</p>
                <p className="text-sm mt-1">ابحث عن أشخاص وأضفهم!</p>
              </div>
            ) : (
              friendships?.friends?.map((f: any) => (
                <div key={f.id} className="flex items-center gap-3 p-4 border-b border-border hover:bg-secondary/30 transition-colors">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={f.otherProfile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {f.otherProfile?.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{f.otherProfile?.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{f.otherProfile?.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full gap-1"
                      onClick={() => handleMessage(f.otherProfile?.user_id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      رسالة
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => handleRemove(f.id)}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* الطلبات الواردة */}
          <TabsContent value="requests" className="mt-0">
            {friendships?.pendingReceived?.length === 0 && friendships?.pendingSent?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد طلبات</p>
              </div>
            ) : (
              <>
                {(friendships?.pendingReceived?.length || 0) > 0 && (
                  <div>
                    <p className="px-4 py-2 text-sm font-semibold text-muted-foreground bg-secondary/30">طلبات واردة</p>
                    {friendships?.pendingReceived?.map((f: any) => (
                      <div key={f.id} className="flex items-center gap-3 p-4 border-b border-border">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={f.otherProfile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {f.otherProfile?.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{f.otherProfile?.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{f.otherProfile?.username}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAccept(f.id)} className="rounded-full gap-1">
                            <UserCheck className="w-4 h-4" /> قبول
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReject(f.id)} className="rounded-full text-destructive hover:text-destructive">
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(friendships?.pendingSent?.length || 0) > 0 && (
                  <div>
                    <p className="px-4 py-2 text-sm font-semibold text-muted-foreground bg-secondary/30">طلبات مرسلة</p>
                    {friendships?.pendingSent?.map((f: any) => (
                      <div key={f.id} className="flex items-center gap-3 p-4 border-b border-border">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={f.otherProfile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {f.otherProfile?.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{f.otherProfile?.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{f.otherProfile?.username}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemove(f.id)} className="rounded-full text-muted-foreground">
                          إلغاء
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* البحث */}
          <TabsContent value="search" className="mt-0">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن مستخدم..."
                  className="pl-10"
                />
              </div>
            </div>

            {searchQuery.length < 2 ? (
              <p className="p-8 text-center text-muted-foreground text-sm">اكتب اسم المستخدم للبحث</p>
            ) : searchResults?.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">لا توجد نتائج</p>
            ) : (
              searchResults?.map((profile: any) => (
                <div key={profile.id} className="flex items-center gap-3 p-4 border-b border-border hover:bg-secondary/30 transition-colors">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {profile.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{profile.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  </div>
                  {getFriendshipButton(profile)}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
