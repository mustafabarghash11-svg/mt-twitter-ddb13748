import { useState, useRef, useEffect } from "react";
import { Search, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useStartConversation,
  useSearchUsers,
} from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const Messages = () => {
  const { user } = useAuth();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convsLoading } = useConversations();
  const { data: messages } = useConversationMessages(selectedConv);
  const sendMessage = useSendMessage();
  const startConversation = useStartConversation();
  const { data: searchResults } = useSearchUsers(searchQuery);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedConv) return;
    sendMessage.mutate(
      { conversationId: selectedConv, content: messageText },
      { onSuccess: () => setMessageText("") }
    );
  };

  const handleStartConversation = async (otherUserId: string) => {
    const convId = await startConversation.mutateAsync(otherUserId);
    setSelectedConv(convId);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="flex h-screen">
        {/* Conversations list */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border space-y-3">
            <h2 className="text-xl font-bold">الرسائل</h2>
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

          {/* Search results */}
          {searchQuery.length >= 2 && searchResults && (
            <div className="border-b border-border">
              {searchResults.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => handleStartConversation(u.user_id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">{u.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="font-medium text-sm">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </button>
              ))}
              {searchResults.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground text-center">لم يتم العثور على نتائج</p>
              )}
            </div>
          )}

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {convsLoading ? (
              <p className="p-4 text-center text-muted-foreground">جاري التحميل...</p>
            ) : conversations?.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground">لا توجد محادثات</p>
            ) : (
              conversations?.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-border hover:bg-secondary/50 transition-colors ${
                    selectedConv === conv.id ? "bg-secondary" : ""
                  }`}
                >
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={conv.otherProfile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {conv.otherProfile?.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="font-medium truncate">{conv.otherProfile?.display_name || "مستخدم"}</p>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage?.content || "ابدأ المحادثة"}</p>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!selectedConv ? "hidden md:flex" : "flex"}`}>
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>اختر محادثة للبدء</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button className="md:hidden text-primary" onClick={() => setSelectedConv(null)}>
                  ←
                </button>
                {(() => {
                  const conv = conversations?.find((c: any) => c.id === selectedConv);
                  return (
                    <>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conv?.otherProfile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {conv?.otherProfile?.display_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{conv?.otherProfile?.display_name || "مستخدم"}</span>
                    </>
                  );
                })()}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages?.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.sender_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] opacity-60 mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { locale: ar, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالة..."
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!messageText.trim()} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
