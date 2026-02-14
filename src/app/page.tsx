"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; // Added AnimatePresence
import { Eye, EyeOff, ArrowRight, Aperture, Sun, Moon, CheckCircle } from "lucide-react"; // Added CheckCircle
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { useRouter } from "next/navigation";

// --- Configuration: Infinite Scrolling Images ---
const galleryImages = [
  // Column 1
  [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop",
  ],
  // Column 2
  [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1520333789090-1afc82db536a?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  ],
  // Column 3
  [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534030347209-7147fd2e7a3a?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
  ],
];

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://photography-server-1.onrender.com/api";

// Role Routes
const ROLE_ROUTES: Record<string, string> = {
  superadmin: "/pages/superadmin",
  admin: "/pages/admindashboard",
  manager: "/pages/manager/dashboard",
  staff: "/pages/staff/dashboard",
  user: "/pages/dashboard",
  customer: "/pages/dashboard",
  client: "/pages/client/dashboard",
  photographer: "/pages/photographer/dashboard",
  editor: "/pages/editor/dashboard",
};

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false); // New state for success animation
  
  // Theme State
  const [theme, setTheme] = useState("dark");
  
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    email: "suryaadmin@gmail.com",
    password: "123"
  });

  useEffect(() => {
    setIsMounted(true);
    
    // 1. Load Theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    }

    // 2. Check Auth
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        handleRoleRedirect(user.role);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.clear();
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleRoleRedirect = (role: string) => {
    const normalizedRole = role.toLowerCase().trim();
    const redirectPath = ROLE_ROUTES[normalizedRole] || "/pages/dashboard";
    router.push(redirectPath);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLoginError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (response.data.success) {
        // 1. Trigger Success Animation
        setShowSuccess(true);

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("theme", theme);
        
        const userRole = response.data.user.role || "user";

        // 2. Wait 1.5s for the animation to play before redirecting
        setTimeout(() => {
            handleRoleRedirect(userRole);
        }, 1500);

      } else {
        setLoginError(response.data.message || "Login failed");
        setIsLoading(false); // Stop loading if failed
      }
    } catch (error: any) {
      setIsLoading(false); // Stop loading on error
      console.error("Login error details:", error);
      if (error.response) {
        setLoginError(error.response.data.message || `Login failed: ${error.response.status}`);
      } else if (error.request) {
        setLoginError("Cannot connect to server. Please check if server is running.");
      } else {
        setLoginError("An unexpected error occurred");
      }
    }
  };

  if (!isMounted) return null;

  return (
    // THEME WRAPPER: controlled by state
    <div className={`${theme} h-screen w-full relative`}>
        
      {/* --- SUCCESS NOTIFICATION ANIMATION --- */}
      <AnimatePresence>
        {showSuccess && (
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="fixed top-8 left-0 right-0 mx-auto w-max z-50 flex items-center gap-3 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md"
            >
                <div className="bg-white/20 p-1 rounded-full">
                    <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm">Login Successful</span>
                    <span className="text-xs text-emerald-50 opacity-90">Redirecting to dashboard...</span>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-300">
        
        {/* ================= LEFT PANEL: The Tool Interface ================= */}
        <div className="w-full lg:w-[480px] xl:w-[550px] h-full flex flex-col z-20 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-y-auto transition-colors duration-300">
          
          <div className="min-h-full flex flex-col justify-between p-6 lg:p-10 xl:p-12">
              
              {/* Header / Logo & Theme Toggle */}
              <div className="flex items-center justify-between mb-8 lg:mb-0">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-900 dark:bg-white text-white dark:text-black p-2 rounded-lg shadow-lg">
                    <Aperture className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Sevai</span>
                </div>

                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              {/* Main Form Area */}
              <div className="flex flex-col gap-6 lg:gap-8 my-auto">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 text-zinc-900 dark:text-white">
                    Manage your <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">
                      creative business.
                    </span>
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-base lg:text-lg">
                    Welcome back. Please enter your details.
                  </p>
                </motion.div>

                {loginError && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
                    <p className="text-red-600 dark:text-red-300 text-sm">{loginError}</p>
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                      Using: Email: {formData.email}
                    </p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-600 dark:text-zinc-300">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@sevai.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-zinc-900 dark:text-white h-12 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                      required
                      disabled={isLoading || showSuccess}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-zinc-600 dark:text-zinc-300">Password</Label>
                      <button
                        type="button"
                        onClick={() => setLoginError(null)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-zinc-900 dark:text-white h-12 rounded-lg pr-10 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        required
                        disabled={isLoading || showSuccess}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        disabled={isLoading || showSuccess}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={`w-full h-12 text-white dark:text-black font-semibold text-base transition-all rounded-lg mt-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                    ${showSuccess 
                        ? "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-400" 
                        : "bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200"
                    }`}
                    disabled={isLoading || showSuccess}
                  >
                    {isLoading || showSuccess ? (
                      <div className="flex items-center justify-center gap-2">
                         {showSuccess ? (
                             <>
                                <CheckCircle className="h-5 w-5 animate-bounce" />
                                <span>Success!</span>
                             </>
                         ) : (
                             <>
                                <div className="h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                <span>Signing In...</span>
                             </>
                         )}
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Sign In <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><Separator className="bg-zinc-200 dark:bg-zinc-800" /></div>
                  <div className="relative flex justify-center"><span className="bg-white dark:bg-zinc-950 px-2 text-xs uppercase text-zinc-400 dark:text-zinc-500">Or</span></div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full h-12 border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all"
                  disabled={isLoading || showSuccess}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84.01.01z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </Button>

              </div>

              {/* Footer */}
              <p className="text-zinc-500 text-sm mt-8 lg:mt-0 text-center lg:text-left">
                Don&apos;t have an account? <a href="#" className="text-zinc-900 dark:text-white font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Sign up for free</a>
              </p>
          </div>
        </div>

        {/* ================= RIGHT PANEL: Infinite Parallax Gallery ================= */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden bg-zinc-50 dark:bg-black items-center justify-center transition-colors duration-300">
          
          {/* Gradient Overlay to fade edges (Adapts to theme) */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-zinc-50 dark:from-black dark:via-transparent dark:to-black z-10 pointer-events-none transition-colors duration-300" />
          <div className="absolute inset-0 bg-gradient-to-l from-zinc-50 via-transparent to-transparent dark:from-black dark:via-transparent dark:to-transparent z-10 pointer-events-none transition-colors duration-300" />

          {/* The Grid Container */}
          <div className="grid grid-cols-3 gap-6 transform -rotate-6 scale-110 opacity-60 grayscale hover:grayscale-0 transition-all duration-700 ease-in-out">
            
            {/* Column 1: Moves UP */}
            <div className="flex flex-col gap-6">
              <InfiniteLoop direction="up" duration={45}>
                {galleryImages[0].map((src, i) => (
                   <GalleryImage key={i} src={src} />
                ))}
              </InfiniteLoop>
            </div>

            {/* Column 2: Moves DOWN (Slower) */}
            <div className="flex flex-col gap-6 pt-20">
               <InfiniteLoop direction="down" duration={55}>
                {galleryImages[1].map((src, i) => (
                   <GalleryImage key={i} src={src} />
                ))}
              </InfiniteLoop>
            </div>

            {/* Column 3: Moves UP */}
            <div className="flex flex-col gap-6">
               <InfiniteLoop direction="up" duration={50}>
                {galleryImages[2].map((src, i) => (
                   <GalleryImage key={i} src={src} />
                ))}
              </InfiniteLoop>
            </div>

          </div>

          {/* Content Overlay on Right Side */}
          <div className="absolute bottom-12 right-12 z-20 text-right max-w-md pointer-events-none select-none">
            <p className="text-zinc-900/80 dark:text-white/80 text-xl font-light italic leading-relaxed">
              &quot;Sevai transformed how I deliver galleries to my clients. It&apos;s simply beautiful.&quot;
            </p>
            <p className="text-indigo-600 dark:text-indigo-400 mt-4 font-medium tracking-wide">— Sarah J., Wedding Photographer</p>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function GalleryImage({ src }: { src: string }) {
  return (
    <div className="relative w-64 h-80 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 shadow-2xl shrink-0">
      <Image 
        src={src} 
        alt="Photography portfolio" 
        fill 
        className="object-cover opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-700 ease-out" 
        sizes="300px"
        priority={false}
      />
    </div>
  );
}

function InfiniteLoop({ children, direction = "up", duration = 20 }: { 
  children: React.ReactNode, 
  direction?: "up" | "down", 
  duration?: number 
}) {
  return (
    <div className="relative flex flex-col gap-6 h-full overflow-hidden">
      <motion.div
        animate={{ y: direction === "up" ? [0, -2000] : [-2000, 0] }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex flex-col gap-6"
      >
        {children}
        {children}
        {children}
        {children}
      </motion.div>
    </div>
  );
}