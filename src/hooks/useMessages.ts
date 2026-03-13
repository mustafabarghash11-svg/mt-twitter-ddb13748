import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      // Get user's conversation IDs
      const { data: participations, error: pError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user!.id);
      if (pError) throw pError;

      if (!participations?.length) return [];

      const convIds = participations.map(p => p.conversation_id);

      // Get conversations
      const { data: conversations, error: cError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", convIds)
        .order("created_at", { ascending: false });
      if (cError) throw cError;

      // Get all participants for these conversations
      const { data: allParticipants } = await supabase
        .from("conversation_participants")
        .select("*")
        .in("conversation_id", convIds);

      // Get other user profiles
      const otherUserIds = allParticipants
        ?.filter(p => p.user_id !== user!.id)
        .map(p => p.user_id) || [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", otherUserIds);

      // Get last message for each conversation
      const results = await Promise.all(
        conversations!.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          const otherParticipant = allParticipants?.find(
            p => p.conversation_id === conv.id && p.user_id !== user!.id
          );
          const otherProfile = profiles?.find(p => p.user_id === otherParticipant?.user_id);

          return { ...conv, lastMessage: lastMsg, otherProfile: otherProfile };
        })
      );

      return results;
    },
    enabled: !!user,
  });
};

export const useConversationMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      return data.map(msg => ({
        ...msg,
        profile: profiles?.find(p => p.user_id === msg.sender_id),
      }));
    },
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useStartConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      // Check if conversation already exists
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user!.id);

      if (myConvs?.length) {
        const { data: sharedConvs } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", otherUserId)
          .in("conversation_id", myConvs.map(c => c.conversation_id));

        if (sharedConvs?.length) return sharedConvs[0].conversation_id;
      }

      // Create new conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();
      if (convError) throw convError;

      // Add participants
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conv.id, user_id: user!.id },
          { conversation_id: conv.id, user_id: otherUserId },
        ]);
      if (partError) throw partError;

      return conv.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
};

export const useSearchUsers = (query: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["search-users", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user!.id)
        .ilike("username", `%${query}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: query.length >= 2,
  });
};
