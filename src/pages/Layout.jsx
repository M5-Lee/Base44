
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, Filter, Star, FileBarChart, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Earnings Dashboard",
    url: createPageUrl("Dashboard"),
    icon: TrendingUp,
  },
  {
    title: "Screening Tools",
    url: createPageUrl("Screening"),
    icon: Filter,
  },
  {
    title: "My Shortlist",
    url: createPageUrl("Shortlist"),
    icon: Star,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --background: 15 20 25;
          --foreground: 255 255 255;
          --card: 20 25 30;
          --card-foreground: 255 255 255;
          --primary: 79 140 244;
          --primary-foreground: 255 255 255;
          --secondary: 31 41 55;
          --secondary-foreground: 255 255 255;
          --muted: 31 41 55;
          --muted-foreground: 156 163 175;
          --accent: 31 41 55;
          --accent-foreground: 255 255 255;
          --destructive: 255 107 107;
          --destructive-foreground: 255 255 255;
          --border: 31 41 55;
          --input: 31 41 55;
          --ring: 79 140 244;
          --radius: 0.5rem;
        }
        
        body {
          background: rgb(15, 20, 25);
          color: rgb(255, 255, 255);
        }
        
        .earnings-gradient {
          background: linear-gradient(135deg, rgb(15, 20, 25) 0%, rgb(20, 25, 30) 100%);
        }
        
        .bullish-gradient {
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(0, 212, 170, 0.05) 100%);
        }
        
        .bearish-gradient {
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%);
        }
      `}</style>
      <div className="min-h-screen flex w-full earnings-gradient">
        <Sidebar className="border-r border-gray-700">
          <SidebarHeader className="border-b border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">Earnings Screener</h2>
                <p className="text-xs text-gray-400">Weekly Options Plays</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-3">
                Trading Tools
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-3">
                Market Status
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Market Hours</span>
                    <span className="text-green-400 font-medium">Open</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Earnings This Week</span>
                    <span className="text-white font-semibold">18</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Affordable Plays</span>
                    <span className="text-blue-400 font-semibold">12</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">Trader</p>
                <p className="text-xs text-gray-400 truncate">Options Screener</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-gray-800/50 border-b border-gray-700 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-white">Earnings Screener</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
