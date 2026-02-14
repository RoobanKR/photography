// app/components/ProtectedRoute.tsx
"use client";

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://photography-server-1.onrender.com/api';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/forgot-password'];

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // If it's a public route, allow access
      if (publicRoutes.includes(pathname)) {
        setIsLoading(false);
        return;
      }

      // If no token and not a public route, redirect to login
      if (!token) {
        router.push('/');
        setIsLoading(false);
        return;
      }

      try {
        // Verify token with backend
        await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(true);
      } catch (error) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Allow access if authenticated or if it's a public route
  if (isAuthenticated || publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return null;
}