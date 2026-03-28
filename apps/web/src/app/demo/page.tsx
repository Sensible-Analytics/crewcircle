'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

const DEMO_USERS = [
  { email: 'demo-owner@crewcircle.co', password: 'Demo2026!', role: 'Owner (Maria)', color: 'orange', tenantId: '4fdcd51f-04bc-4f72-8909-3bc0f75934f1' },
  { email: 'demo-manager@crewcircle.co', password: 'Demo2026!', role: 'Manager (Jake)', color: 'blue', tenantId: '4fdcd51f-04bc-4f72-8909-3bc0f75934f1' },
  { email: 'demo-employee1@crewcircle.co', password: 'Demo2026!', role: 'Employee (Sarah)', color: 'green', tenantId: '4fdcd51f-04bc-4f72-8909-3bc0f75934f1' },
  { email: 'demo-employee2@crewcircle.co', password: 'Demo2026!', role: 'Employee (Emma)', color: 'purple', tenantId: '4fdcd51f-04bc-4f72-8909-3bc0f75934f1' },
];

export default function DemoPage() {
  const router = useRouter();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);

  const setupDemo = async () => {
    setIsSettingUp(true);
    setError(null);

    try {
      const response = await fetch('/api/demo', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setIsReady(true);
      } else {
        setError(data.error || 'Failed to set up demo');
      }
    } catch (err) {
      setError('Failed to set up demo. Please try again.');
    } finally {
      setIsSettingUp(false);
    }
  };

  const loginAsUser = async (email: string, password: string, role: string, tenantId: string) => {
    setIsLoggingIn(email);

    try {
      const response = await fetch('/api/demo/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, tenantId }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        const params = new URLSearchParams({
          token: data.token,
          email: encodeURIComponent(email),
          role: encodeURIComponent(role),
          tenantId: tenantId,
        });
        router.push(`/demo-login?${params.toString()}`);
      } else {
        setError(data.error || 'Failed to sign in. Please try again.');
        setIsLoggingIn(null);
      }
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      setIsLoggingIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50">
        <Logo size="md" />
        <Link href="/" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">
          Back to home
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Try CrewCircle Demo</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore all features with a pre-configured demo organization for 
            <span className="font-semibold text-orange-600"> The Daily Grind Cafe</span> in Sydney.
          </p>
        </div>

        {!isReady ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">The Daily Grind Cafe</h2>
              <p className="text-gray-600">A fictional cafe in Surry Hills, Sydney with 4 team members</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={setupDemo}
              disabled={isSettingUp}
              className="px-8 py-4 bg-orange-500 text-white rounded-xl text-lg font-bold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSettingUp ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up demo...
                </span>
              ) : (
                'Set Up Demo Organization'
              )}
            </button>

            <p className="mt-4 text-sm text-gray-500">
              This will create a demo cafe with 4 users, rosters, shifts, and clock events
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Demo Ready!</h2>
                  <p className="text-gray-600">Click any user below to explore their view</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => loginAsUser(user.email, user.password, user.role, user.tenantId)}
                    disabled={isLoggingIn !== null}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        user.color === 'orange' ? 'bg-orange-100' :
                        user.color === 'blue' ? 'bg-blue-100' :
                        user.color === 'green' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        <span className={`text-xl font-bold ${
                          user.color === 'orange' ? 'text-orange-600' :
                          user.color === 'blue' ? 'text-blue-600' :
                          user.color === 'green' ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          {user.role.split(' ')[1]?.[0] || user.role[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{user.role}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {isLoggingIn === user.email && (
                          <p className="text-xs text-orange-600 mt-1">Signing in...</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role.startsWith('Owner') ? 'bg-orange-100 text-orange-700' :
                        user.role.startsWith('Manager') ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.role.split(' ')[0]}
                      </span>
                      <span className="text-xs text-gray-400">
                        Full access to {user.role.startsWith('Owner') ? 'all features' : 
                          user.role.startsWith('Manager') ? 'scheduling & team' : 'their own shifts'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">💡 Demo Mode:</span> You're exploring as a {isLoggingIn ? 'logging in...' : 'selected user'}. 
                  All actions are simulated - no real data is affected.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What's included in the demo:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">4 team members</p>
                    <p className="text-sm text-gray-600">Owner, Manager, and 2 Employees with different roles</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Sydney location</p>
                    <p className="text-sm text-gray-600">Surry Hills cafe with GPS geofencing enabled</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Weekly roster with shifts</p>
                    <p className="text-sm text-gray-600">Pre-populated roster for the current week</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Clock events</p>
                    <p className="text-sm text-gray-600">Sample clock-in records for today (if weekday)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Employee availability</p>
                    <p className="text-sm text-gray-600">Availability records for all team members</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
