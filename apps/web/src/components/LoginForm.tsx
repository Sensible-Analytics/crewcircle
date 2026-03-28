'use client';

import { SignIn } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function LoginForm() {
  useEffect(() => {
    const demoEmail = sessionStorage.getItem('demo_email');
    const demoPassword = sessionStorage.getItem('demo_password');
    if (demoEmail && demoPassword) {
      sessionStorage.removeItem('demo_email');
      sessionStorage.removeItem('demo_password');
    }
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <SignIn />
    </div>
  );
}
