import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTweets = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tweets"],
    queryFn: async () => {
      const { data: tweets, error } = await supabase
        .from("tweets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for all tweet authors
      const userIds = [...new Set(tweets.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      // Fetch likes counts and user's likes
      const tweetIds = tweets.map(t => t.id);
      const { data: likes } = await supabase
        .from("tweet_likes")
        .select("*")
        .in("tweet_id", tweetIds);

      // Fetch comments counts
      const { data: comments } = await supabase
        .from("tweet_comments")
        .select("*")
        .in("tweet_id", tweetIds);

      return tweets.map(tweet => ({
        ...tweet,
        profile: profiles?.find(p => p.user_id === tweet.user_id),
        likes_count: likes?.filter(l => l.tweet_id === tweet.id).length || 0,
        comments_count: comments?.filter(c => c.tweet_id === tweet.id).length || 0,
        is_liked: likes?.some(l => l.tweet_id === tweet.id && l.user_id === user?.id) || false,
      }));
    },
  });
};

export const useCreateTweet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from("tweets")
        .insert({ content, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweets"] }),
  });
};

export const useDeleteTweet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tweetId: string) => {
      const { error } = await supabase.from("tweets").delete().eq("id", tweetId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweets"] }),
  });
};

export const useUpdateTweet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase.from("tweets").update({ content }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweets"] }),
  });
};

export const useToggleLike = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tweetId, isLiked }: { tweetId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from("tweet_likes")
          .delete()
          .eq("tweet_id", tweetId)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tweet_likes")
          .insert({ tweet_id: tweetId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweets"] }),
  });
};

export const useTweetComments = (tweetId: string) => {
  return useQuery({
    queryKey: ["comments", tweetId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from("tweet_comments")
        .select("*")
        .eq("tweet_id", tweetId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      return comments.map(comment => ({
        ...comment,
        profile: profiles?.find(p => p.user_id === comment.user_id),
      }));
    },
    enabled: !!tweetId,
  });
};

export const useAddComment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tweetId, content }: { tweetId: string; content: string }) => {
      const { error } = await supabase
        .from("tweet_comments")
        .insert({ tweet_id: tweetId, content, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, { tweetId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", tweetId] });
      queryClient.invalidateQueries({ queryKey: ["tweets"] });
    },
  });
};
