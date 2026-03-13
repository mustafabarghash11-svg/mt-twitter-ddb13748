import { useState } from "react";
import { Heart, MessageCircle, Trash2, Edit, X, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike, useDeleteTweet, useUpdateTweet, useTweetComments, useAddComment } from "@/hooks/useTweets";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

type TweetData = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: { display_name: string; username: string; avatar_url: string | null } | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
};

const TweetCard = ({ tweet }: { tweet: TweetData }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(tweet.content);

  const toggleLike = useToggleLike();
  const deleteTweet = useDeleteTweet();
  const updateTweet = useUpdateTweet();
  const addComment = useAddComment();
  const { data: comments } = useTweetComments(showComments ? tweet.id : "");

  const isOwner = user?.id === tweet.user_id;

  const handleLike = () => {
    toggleLike.mutate({ tweetId: tweet.id, isLiked: tweet.is_liked });
  };

  const handleDelete = () => {
    deleteTweet.mutate(tweet.id, {
      onSuccess: () => toast.success("تم حذف التغريدة"),
    });
  };

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    updateTweet.mutate(
      { id: tweet.id, content: editContent },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("تم تعديل التغريدة");
        },
      }
    );
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate(
      { tweetId: tweet.id, content: commentText },
      { onSuccess: () => setCommentText("") }
    );
  };

  return (
    <div className="border-b border-border p-4 hover:bg-secondary/30 transition-colors">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={tweet.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {tweet.profile?.display_name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{tweet.profile?.display_name}</span>
            <span className="text-muted-foreground text-sm">@{tweet.profile?.username}</span>
            <span className="text-muted-foreground text-xs">
              · {formatDistanceToNow(new Date(tweet.created_at), { locale: ar, addSuffix: true })}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[60px]" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate}><Check className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-foreground whitespace-pre-wrap break-words">{tweet.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{tweet.comments_count}</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors text-sm ${
                tweet.is_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart className={`w-4 h-4 ${tweet.is_liked ? "fill-current" : ""}`} />
              <span>{tweet.likes_count}</span>
            </button>

            {isOwner && (
              <>
                <button onClick={() => { setIsEditing(true); setEditContent(tweet.content); }} className="text-muted-foreground hover:text-primary transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Comments */}
          {showComments && (
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              {comments?.map((comment: any) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={comment.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {comment.profile?.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-medium">{comment.profile?.display_name}</span>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="اكتب تعليقاً..."
                  className="min-h-[40px] text-sm"
                />
                <Button size="sm" onClick={handleComment} disabled={!commentText.trim()}>
                  تعليق
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
