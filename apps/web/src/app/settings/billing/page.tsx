"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/packages/supabase/src/client.browser';
import { useAuth } from '@/packages/supabase/src/useAuth';

export default function BillingPage() {
  const { user } = useAuth();
  const supabase = createBrowserSupabaseClient();
  const [tenant, setTenant] = useState<any>(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get current profile to get tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single();

      if (profile) {
        // Get tenant data
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .single();
        
        setTenant(tenantData);

        // Get employee count
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id)
          .is('deleted_at', null);
        
        setEmployeeCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          email: user?.email,
        }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Error starting upgrade:', error);
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Billing & Subscription</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Current Plan</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2 py-1 rounded text-sm font-bold uppercase ${
              tenant?.plan === 'starter' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {tenant?.plan || 'Free'}
            </span>
            {tenant?.subscription_status === 'active' && (
              <span className="text-green-600 text-sm font-medium">Active</span>
            )}
          </div>
          <p className="text-gray-600 mb-4">
            {tenant?.plan === 'starter' 
              ? 'You are on the Starter plan with unlimited employees.'
              : 'You are on the Free plan, limited to 5 employees.'
            }
          </p>
          {tenant?.plan !== 'starter' && (
            <button
              onClick={handleUpgrade}
              className="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
            >
              Upgrade to Starter ($4 + GST / emp / mo)
            </button>
          )}
        </div>

        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Usage</h2>
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Active Employees</span>
              <span className="text-sm font-bold">{employeeCount} / {tenant?.plan === 'starter' ? '∞' : '5'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${employeeCount >= 5 ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${Math.min((employeeCount / 5) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          {tenant?.plan === 'starter' && (
            <p className="text-sm text-gray-500">
              Estimated next bill: <span className="font-bold text-gray-900">${(employeeCount * 4).toFixed(2)} AUD</span> (+ GST)
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
        <h3 className="font-semibold mb-2">Billing Information</h3>
        <p className="text-sm text-gray-600 mb-4">
          All prices are in Australian Dollars (AUD). Subscriptions are billed monthly based on the number of active employees during the billing cycle.
        </p>
        <div className="flex gap-4">
          <button className="text-blue-600 hover:underline text-sm font-medium">View Past Invoices</button>
          <button className="text-blue-600 hover:underline text-sm font-medium">Payment Methods</button>
          <button className="text-red-600 hover:underline text-sm font-medium">Cancel Subscription</button>
        </div>
      </div>
    </div>
  );
}
