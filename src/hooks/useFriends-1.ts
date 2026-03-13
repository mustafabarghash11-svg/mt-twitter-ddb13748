import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// جلب كل العلاقات (أصدقاء + طلبات)
export const useFriendships = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["friendships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .or(`requester_id.eq.${user!.id},receiver_id.eq.${user!.id}`);
      if (error) throw error;

      // جلب البروفايلات
      const otherIds = data.map(f =>
        f.requester_id === user!.id ? f.receiver_id : f.requester_id
      );

      if (!otherIds.length) return { friends: [], pendingReceived: [], pendingSent: [] };

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", otherIds);

      const withProfiles = data.map(f => ({
        ...f,
        otherProfile: profiles?.find(p =>
          p.user_id === (f.requester_id === user!.id ? f.receiver_id : f.requester_id)
        ),
      }));

      return {
        friends: withProfiles.filter(f => f.status === "accepted"),
        pendingReceived: withProfiles.filter(f => f.status === "pending" && f.receiver_id === user!.id),
        pendingSent: withProfiles.filter(f => f.status === "pending" && f.requester_id === user!.id),
      };
    },
    enabled: !!user,
  });
};

// إرسال طلب صداقة
export const useSendFriendRequest = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiverId: string) => {
      const { error } = await supabase
        .from("friendships")
        .insert({ requester_id: user!.id, receiver_id: receiverId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friendships"] }),
  });
};

// قبول / رفض طلب
export const useRespondToRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friendships"] }),
  });
};

// حذف صديق / إلغاء طلب
export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("friendships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friendships"] }),
  });
};

// البحث عن مستخدمين مع حالة الصداقة
export const useSearchUsersWithFriendStatus = (query: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["search-users-friends", query],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user!.id)
        .ilike("username", `%${query}%`)
        .limit(10);
      if (error) throw error;

      // جلب حالة الصداقة مع كل مستخدم
      const userIds = profiles.map(p => p.user_id);
      if (!userIds.length) return [];

      const { data: friendships } = await supabase
        .from("friendships")
        .select("*")
        .or(`requester_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .or(
          userIds.map(id => `requester_id.eq.${id},receiver_id.eq.${id}`).join(",")
        );

      return profiles.map(p => {
        const friendship = friendships?.find(f =>
          (f.requester_id === user!.id && f.receiver_id === p.user_id) ||
          (f.receiver_id === user!.id && f.requester_id === p.user_id)
        );
        return { ...p, friendship };
      });
    },
    enabled: query.length >= 2,
  });
};

// هل هذا المستخدم صديق؟
export const useIsFriend = (otherUserId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-friend", otherUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("friendships")
        .select("*")
        .or(`requester_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .eq("status", "accepted")
        .limit(20);

      return data?.some(f =>
        (f.requester_id === user!.id && f.receiver_id === otherUserId) ||
        (f.receiver_id === user!.id && f.requester_id === otherUserId)
      ) || false;
    },
    enabled: !!user && !!otherUserId,
  });
};
