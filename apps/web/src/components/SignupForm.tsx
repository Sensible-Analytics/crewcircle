'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignupForm() {
  return (
    <div className="w-full max-w-md mx-auto">
      <SignUp />
    </div>
  );
}
