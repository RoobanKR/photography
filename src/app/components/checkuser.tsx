// components/CheckUser.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CheckUserProps {
  // Optional: You can add props if needed later
}

const CheckUser: React.FC<CheckUserProps> = () => {
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        // 1. Get token from localStorage
        const token = localStorage.getItem('token');
        
        // 2. If no token, redirect to home page
        if (!token) {
          console.log('No token found, redirecting to /');
          router.push('/');
          return;
        }

        // 3. Verify token with your backend API
        const response = await fetch('https://photography-server-1.onrender.com/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for cookies if used
        });

        // 4. If token is NOT valid (response not ok), redirect to home
        if (!response.ok) {
          console.log('Token invalid or expired, redirecting to /');
          localStorage.removeItem('token'); // Clean up invalid token
          router.push('/');
          return;
        }

        // 5. If we reach here, token is valid - do nothing
        console.log('Token verified successfully');
        
      } catch (error) {
        // 6. If any error occurs, redirect to home
        console.error('Error checking token:', error);
        localStorage.removeItem('token'); // Clean up on error
        router.push('/');
      }
    };

    checkToken();
  }, [router]); // Only re-run if router changes

  // This component doesn't render anything visible
  return null;
};

export default CheckUser;