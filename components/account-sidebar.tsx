"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  User, 
  PawPrint, 
  Bell, 
  Heart, 
  LogOut, 
  Menu, 
  Building2, 
  MessageSquare,
  UserCog,
  PenSquare
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import Header from "@/components/header";

// Menu items for shelter accounts
const shelterMenuItems = [
  { 
    title: "Account Settings", 
    href: "/account", 
    icon: <User className="h-5 w-5 mr-3" /> 
  },
  { 
    title: "Shelter Profile", 
    href: "/account/profile", 
    icon: <Building2 className="h-5 w-5 mr-3" /> 
  },
  { 
    title: "My Pets", 
    href: "/account/pets", 
    icon: <PawPrint className="h-5 w-5 mr-3" /> 
  },
  { 
    title: "Adoption Requests", 
    href: "/account/adoption-requests", 
    icon: <MessageSquare className="h-5 w-5 mr-3" /> 
  },
];

// Menu items for volunteer accounts
const volunteerMenuItems = [
  { 
    title: "Account Settings", 
    href: "/account", 
    icon: <User className="h-5 w-5 mr-3" /> 
  },
  { 
    title: "My Profile", 
    href: "/account/profile", 
    icon: <UserCog className="h-5 w-5 mr-3" /> 
  },
  { 
    title: "Favorites", 
    href: "/account/favorites", 
    icon: <Heart className="h-5 w-5 mr-3" /> 
  },
  { 
    title: "Pet Alerts", 
    href: "/account/alerts", 
    icon: <Bell className="h-5 w-5 mr-3" /> 
  },
  { 
    title: "Found Pets", 
    href: "/account/found-pets", 
    icon: <PenSquare className="h-5 w-5 mr-3" /> 
  },
];

export default function AccountSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user role from database
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserRole(data.role);
        }
      }
    };
    
    checkUserRole();
  }, []);

  const isActive = (path: string) => {
    if (path === "/account" && pathname === "/account") {
      return true;
    }
    if (path !== "/account" && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // Determine which menu items to show based on user role
  const getMenuItems = () => {
    switch (userRole) {
      case "shelter":
        return shelterMenuItems;
      case "volunteer":
        return volunteerMenuItems;
      default:
        // If role is not determined yet or is unknown, show a basic set
        return [{ 
          title: "Account Settings", 
          href: "/account", 
          icon: <User className="h-5 w-5 mr-3" /> 
        }];
    }
  };

  const renderMenuItems = () => (
    <div className="flex flex-col space-y-1">
      {getMenuItems().map(item => (
        <Button
          key={item.href}
          variant="neutral"
          className={cn(
            "justify-start h-12 px-4",
            isActive(item.href) ? "bg-muted" : "hover:bg-muted/50"
          )}
          onClick={() => {
            router.push(item.href);
            setOpen(false);
          }}
        >
          {item.icon}
          {item.title}
        </Button>
      ))}
      <Button 
        variant="destructive" 
        className="justify-start h-12 px-4 mt-auto hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-3" />
        Sign Out
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r bg-card p-4">
          <div className="mb-6 px-4 py-2">
            <h2 className="text-xl font-semibold">Account</h2>
            <p className="text-sm text-muted-foreground">
              {userRole === "shelter" ? "Shelter Dashboard" : "Volunteer Dashboard"}
            </p>
          </div>
          {renderMenuItems()}
        </aside>

        {/* Mobile menu */}
        <div className="md:hidden fixed top-[4.5rem] left-4 z-40">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="neutral" size="icon" className="h-10 w-10 rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 pt-12">
              <div className="mb-6 px-4 py-2">
                <h2 className="text-xl font-semibold">Account</h2>
                <p className="text-sm text-muted-foreground">
                  {userRole === "shelter" ? "Shelter Dashboard" : "Volunteer Dashboard"}
                </p>
              </div>
              {renderMenuItems()}
            </SheetContent>
          </Sheet>
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
} 