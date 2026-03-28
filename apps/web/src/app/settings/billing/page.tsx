"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/clerk/useAuth';
import { sql } from '@/lib/neon/client';

interface Tenant {
  id: string;
  name: string;
  plan: string;
  abn: string | null;
  subscription_status: string | null;
}

export default function BillingPage() {
  const { user, tenantId, isLoading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAbnModal, setShowAbnModal] = useState(false);
  const [abnInput, setAbnInput] = useState('');
  const [abnError, setAbnError] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !tenantId) return;
      
      setIsLoading(true);
      try {
        const tenantData = await sql`
          SELECT id, name, plan, abn FROM tenants WHERE id = ${tenantId}
        `;
        
        if (tenantData.length > 0) {
          setTenant(tenantData[0] as Tenant);
        }

        const count = await sql`
          SELECT COUNT(*) as count FROM profiles 
          WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
        `;
        
        setEmployeeCount(Number(count[0]?.count) || 0);
      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [tenantId, authLoading]);

  const validateAbn = (abn: string): boolean => {
    const cleanAbn = abn.replace(/\s/g, '');
    if (cleanAbn.length !== 11 || !/^\d{11}$/.test(cleanAbn)) return false;
    
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanAbn[i]) * weights[i];
    }
    const checkDigit = sum % 89;
    const lastTwoDigits = parseInt(cleanAbn.substring(9, 11));
    return checkDigit === lastTwoDigits;
  };

  const handleUpgradeClick = () => {
    if (!tenant?.abn) {
      setShowAbnModal(true);
    } else {
      proceedToCheckout();
    }
  };

  const handleAbnSubmit = async () => {
    if (!validateAbn(abnInput)) {
      setAbnError('Invalid ABN. Must be 11 valid digits.');
      return;
    }

    setAbnError('');
    
    await sql`
      UPDATE tenants SET abn = ${abnInput.replace(/\s/g, '')} WHERE id = ${tenant!.id}
    `;

    setTenant({ ...tenant!, abn: abnInput });
    setShowAbnModal(false);
    proceedToCheckout();
  };

  const proceedToCheckout = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant!.id,
          email: user?.emailAddresses?.[0]?.emailAddress,
        }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Error starting upgrade:', error);
    }
  };

  if (authLoading || !user) {
    return <div className="p-6">Loading...</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

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
              onClick={handleUpgradeClick}
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

      {showAbnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-2">ABN Required for Paid Plan</h3>
            <p className="text-gray-600 mb-4">
              To upgrade to the paid plan, we need your Australian Business Number (ABN) for compliance purposes.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ABN
              </label>
              <input
                type="text"
                value={abnInput}
                onChange={(e) => setAbnInput(e.target.value)}
                placeholder="11 123 123 123"
                className={`w-full px-4 py-3 border rounded-lg ${
                  abnError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {abnError && <p className="text-sm text-red-600 mt-1">{abnError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAbnModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAbnSubmit}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
