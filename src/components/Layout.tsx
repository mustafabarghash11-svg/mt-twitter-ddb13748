import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, MessageCircle, LogOut, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useFriendships } from "@/hooks/useFriends";

const Layout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const { data: friendships } = useFriendships();

  const pendingCount = friendships?.pendingReceived?.length || 0;

  const links = [
    { to: "/", icon: Home, label: "الرئيسية" },
    { to: "/friends", icon: Users, label: "الأصدقاء", badge: pendingCount },
    { to: "/messages", icon: MessageCircle, label: "الرسائل" },
    { to: "/profile", icon: User, label: "البروفايل" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-16 md:w-64 bg-card border-r border-border flex flex-col z-50">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold hidden md:block">
            <span className="text-primary">MT</span> TWITTER
          </h1>
          <span className="text-primary font-bold text-xl md:hidden block text-center">MT</span>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {links.map(({ to, icon: Icon, label, badge }) => (
            <Link
              key={to}
              to={to}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                location.pathname === to
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 shrink-0" />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
              </div>
              <span className="hidden md:block">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden md:block">تسجيل الخروج</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 ml-16 md:ml-64">
        {children}
      </main>
    </div>
  );
};

export default Layout;
