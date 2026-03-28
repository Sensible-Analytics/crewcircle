'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function DemoLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const tenantId = searchParams.get('tenantId');
    const email = searchParams.get('email');

    if (token) {
      sessionStorage.setItem('demo_token', token);
      if (role) sessionStorage.setItem('demo_role', decodeURIComponent(role));
      if (tenantId) sessionStorage.setItem('demo_tenant_id', tenantId);
      if (email) sessionStorage.setItem('demo_email', decodeURIComponent(email));

      router.replace('/roster');
    } else {
      router.replace('/demo');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-lg text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="animate-spin h-8 w-8 text-orange-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h1>
        <p className="text-gray-600">Entering demo mode</p>
      </div>
    </div>
  );
}

export default function DemoLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-orange-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <DemoLoginContent />
    </Suspense>
  );
}
