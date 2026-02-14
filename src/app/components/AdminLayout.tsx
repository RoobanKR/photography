"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Image as ImageIcon, 
  Calendar, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  HardDrive,
  Aperture,
  Sun,
  Moon,
  ChevronRight,
  Menu,           
  PanelLeftClose, 
  PanelLeftOpen,  
  X,
  CalendarDays,
  User,
  ChevronDown,
  Shield,
  Mail,
  HelpCircle,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: any;
  pageTitle?: string;
}

// Helper function to get active tab from path
const getActiveTabFromPath = (pathname: string) => {
  const routes = [
    { path: '/pages/admindashboard', tab: 'dashboard' },
    { path: '/admin/galleries', tab: 'galleries' },
    { path: '/pages/eventmanagement', tab: 'eventmanagement' },
    { path: '/admin/users', tab: 'users' },
    { path: '/admin/bookings', tab: 'bookings' },
    { path: '/admin/storage', tab: 'storage' },
    { path: '/admin/settings', tab: 'settings' },
  ];
  
  // Find the matching route
  const matchedRoute = routes.find(route => pathname.startsWith(route.path));
  
  // Return the tab or default to dashboard
  return matchedRoute?.tab || 'dashboard';
};

// --- Sidebar Item Component ---
const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active = false, 
  onClick, 
  collapsed,
  href
}: any) => (
  <button
    onClick={onClick}
    title={collapsed ? label : ""}
    className={`
      relative flex items-center transition-all duration-200 group rounded-lg mx-3 mb-1
      ${collapsed 
        ? "justify-center p-2.5 w-10" 
        : "gap-3 px-3 py-2.5 w-[calc(100%-24px)]"
      }
      ${active 
        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 dark:bg-blue-600 dark:text-white" 
        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
      }
    `}
  >
    <Icon className={`
      ${collapsed ? "w-5 h-5" : "w-4 h-4"} 
      ${active ? "text-white" : "text-slate-400 group-hover:text-blue-600 dark:text-zinc-500 dark:group-hover:text-blue-400"}
      transition-colors
    `} />
    
    {!collapsed && (
      <>
        <span className={`text-sm transition-all duration-300 origin-left ml-1 ${active ? "font-semibold" : "font-medium"}`}>
          {label}
        </span>
        {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/60" />}
      </>
    )}
  </button>
);

export default function AdminLayout({ children, user, pageTitle = "Dashboard" }: AdminLayoutProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState("dark");
  const [isMounted, setIsMounted] = useState(false);
  
  // Sidebar States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Set theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } else {
      setTheme("light");
      document.documentElement.classList.remove('dark');
    }
    
    // Set active tab based on current route
    const path = window.location.pathname;
    setActiveTab(getActiveTabFromPath(path));
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleLogout = () => {
    // Clear ALL localStorage items
    localStorage.clear();
    
    // Close dropdown
    setIsProfileDropdownOpen(false);
    
    // Redirect to home page
    router.push("/");
  };

  const handleNavigation = (tab: string, path: string) => {
    setActiveTab(tab);
    router.push(path);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  if (!isMounted) return null;

  return (
    <div className={theme}>
      {/* Background: Slate-50 (Cool White) for light mode */}
      <div className="flex h-screen w-full bg-slate-50 dark:bg-black text-slate-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
        
        {/* --- Mobile Overlay --- */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-30 bg-blue-900/20 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* --- Sidebar --- */}
        <aside 
          className={`
            fixed md:static inset-y-0 left-0 z-40 h-full flex flex-col transition-all duration-300 ease-in-out
            bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800
            ${isMobileMenuOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full md:translate-x-0"}
            ${isSidebarCollapsed ? "md:w-16" : "md:w-64"}
          `}
        >
          {/* Sidebar Header */}
          <div className={`h-16 flex items-center ${isSidebarCollapsed ? "justify-center px-0" : "justify-between px-5"}`}>
            
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0 shadow-sm shadow-blue-500/30">
                <Aperture className="h-5 w-5" />
              </div>
              {!isSidebarCollapsed && (
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Sevai
                </span>
              )}
            </div>

            {/* Collapse Toggle (Desktop) */}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Close (Mobile) */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            
            {!isSidebarCollapsed && (
              <div className="px-5 py-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                  Menu
                </p>
              </div>
            )}
            
            <SidebarItem 
              collapsed={isSidebarCollapsed} 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === "dashboard"} 
              onClick={() => handleNavigation("dashboard", "/pages/admindashboard")}
            />
            <SidebarItem 
              collapsed={isSidebarCollapsed} 
              icon={ImageIcon} 
              label="Galleries" 
              active={activeTab === "galleries"} 
              onClick={() => handleNavigation("galleries", "/admin/galleries")}
            />
            <SidebarItem 
              collapsed={isSidebarCollapsed} 
              icon={CalendarDays}
              label="Event Management" 
              active={activeTab === "eventmanagement"} 
              onClick={() => handleNavigation("eventmanagement", "/pages/eventmanagement")}
            />
            <SidebarItem 
              collapsed={isSidebarCollapsed} 
              icon={Users} 
              label="Users & Roles" 
              active={activeTab === "users"} 
              onClick={() => handleNavigation("users", "/admin/users")}
            />
            <SidebarItem 
              collapsed={isSidebarCollapsed} 
              icon={Calendar} 
              label="Bookings" 
              active={activeTab === "bookings"} 
              onClick={() => handleNavigation("bookings", "/admin/bookings")}
            />
            
            {/* Divider */}
            {!isSidebarCollapsed ? (
              <div className="px-5 py-2 mt-4">
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                  Settings
                </p>
              </div>
            ) : (
              <div className="my-4 border-t border-slate-100 dark:border-zinc-800 w-8 mx-auto" />
            )}

            <SidebarItem 
              collapsed={isSidebarCollapsed} 
              icon={HardDrive} 
              label="Storage" 
              active={activeTab === "storage"} 
              onClick={() => handleNavigation("storage", "/admin/storage")}
            />
            <SidebarItem 
              collapsed={isSidebarCollapsed} 
              icon={Settings} 
              label="Configuration" 
              active={activeTab === "settings"} 
              onClick={() => handleNavigation("settings", "/admin/settings")}
            />
          </div>

          {/* Sidebar Footer - Removed Logout from here since it's now in profile dropdown */}
          <div className="p-3 border-t border-slate-100 dark:border-zinc-900">
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-zinc-400 ${isSidebarCollapsed ? "justify-center" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {user?.name?.[0] || "A"}
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{user?.name || "Admin User"}</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">Administrator</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* --- Main Content --- */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Header */}
          <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6 z-10 transition-colors duration-300">
            
            {/* Left */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-slate-500 hover:text-blue-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div>
                <h1 className="text-lg font-semibold text-slate-800 dark:text-white leading-tight">{pageTitle}</h1>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Search */}
              <div className="relative hidden md:block group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 transition-all placeholder:text-slate-400"
                />
              </div>
              
              <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-200 px-3 py-1.5"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">{user?.name || "Admin User"}</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">Administrator</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-sm shadow-blue-500/20">
                    {user?.name?.[0] || "A"}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                    {/* Profile Info */}
                    <div className="p-4 border-b border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {user?.name?.[0] || "A"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{user?.name || "Admin User"}</p>
                          <p className="text-sm text-slate-500 dark:text-zinc-400">{user?.email || "admin@example.com"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Account Settings</span>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                        <Shield className="w-4 h-4" />
                        <span>Security</span>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                        <HelpCircle className="w-4 h-4" />
                        <span>Help & Support</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 dark:border-zinc-800 my-1"></div>

                    {/* Logout Button */}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50 dark:bg-black">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}