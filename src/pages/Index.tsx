import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Layout from "@/components/Layout";
import TweetCard from "@/components/TweetCard";
import { useTweets, useCreateTweet } from "@/hooks/useTweets";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const Index = () => {
  const [content, setContent] = useState("");
  const { data: tweets, isLoading } = useTweets();
  const { data: profile } = useProfile();
  const createTweet = useCreateTweet();

  const handleTweet = () => {
    if (!content.trim()) return;
    createTweet.mutate(content, {
      onSuccess: () => {
        setContent("");
        toast.success("تم نشر التغريدة!");
      },
    });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4">
          <h2 className="text-xl font-bold">الصفحة الرئيسية</h2>
        </div>

        {/* Tweet composer */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {profile?.display_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ماذا يحدث؟"
                className="border-0 bg-transparent resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[80px]"
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleTweet}
                  disabled={!content.trim() || createTweet.isPending}
                  className="rounded-full px-6"
                >
                  غرّد
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tweets feed */}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
        ) : tweets?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">لا توجد تغريدات بعد. كن أول من يغرّد!</div>
        ) : (
          tweets?.map((tweet: any) => <TweetCard key={tweet.id} tweet={tweet} />)
        )}
      </div>
    </Layout>
  );
};

export default Index;
