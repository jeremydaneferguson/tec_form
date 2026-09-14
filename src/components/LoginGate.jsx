'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginGate({ children }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('tecFormLoggedIn') === 'true';

    if (!loggedIn) {
      router.replace('/login');
      return;
    }

    setIsReady(true);
  }, [router]);

  if (!isReady) {
    return null;
  }

  return children;
}
