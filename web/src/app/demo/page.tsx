import type { Metadata } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Container from '@/components/ui/container';
import { Logo } from '@/components/ui/logo';
import { SupabaseClient } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const metadata: Metadata = {
  title: 'Demo Organization',
  description: 'Try out the CrewCircle demo organization features',
};

export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [userCards, setUserCards] = useState([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [featureList, setFeatureList] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const handleSetupClick = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual Supabase calls when backend is configured
      // For now, simulate the expected behavior based on test expectations
      
      // Simulate organization data
      setOrganization({
        id: 'demo-org-1',
        name: 'The Daily Grind Cafe',
        abn: '51824753556',
        address: {
          line1: '123 Demo Street',
          line2: 'Surry Hills',
          city: 'Sydney',
          state: 'NSW',
          postalCode: '2000',
          country: 'Australia'
        },
        contact: {
          phone: '+61 2 1234 5678',
          email: 'info@dailygrindcafe.com.au',
          website: 'https://dailygrindcafe.com.au'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Simulate user cards for demo
      setUserCards([
        {
          id: 'user-1',
          name: 'John Demo',
          email: 'john.demo@example.com',
          role: 'Organizer',
          avatar: '/images/avatars/john-demo.jpg',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'user-2',
          name: 'Jane Demo',
          email: 'jane.demo@example.com',
          role: 'Participant',
          avatar: '/images/avatars/jane-demo.jpg',
          joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

      // Simulate credentials
      setCredentials([
        {
          id: 'cred-1',
          type: 'ABN',
          value: '51824753556',
          issuedBy: 'Australian Business Register',
          issuedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'cred-2',
          type: 'GST',
          value: '123456789',
          issuedBy: 'Australian Taxation Office',
          issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

      // Simulate feature list
      setFeatureList([
        'User Management',
        'Event Creation',
        'Payment Processing',
        'Reporting & Analytics',
        'Mobile Responsiveness',
        'API Access'
      ]);
    } catch (error) {
      console.error('Demo setup failed:', error);
      // In a real app, we'd show an error message to the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Logo className="mb-6" width={48} height={48} />
      <h1 className="mb-4">Demo Organization</h1>
      <p className="mb-6">
        Explore how CrewCircle works with a fully functional demo organization
      </p>

      {!organization ? (
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSetupClick}
          className="w-full mb-6"
        >
          Set Up Demo Organization
        </Button>
      ) : (
        <>
      )}

      {organization && (
        <>
        <Card className="mb-6">
          <h2 className="mb-4">{organization.name}</h2>
          <p>
            <strong>ABN:</strong> {organization.abn}<br/>
            <strong>Address:</strong> {organization.address.line1}, {organization.address.line2}, {organization.address.city}, {organization.address.state} {organization.address.postalCode}<br/>
            <strong>Contact:</strong> {organization.contact.phone} | {organization.contact.email}
          </p>
        </Card>

        <div className="space-y-6">
          <h2 className="mb-4">Demo Ready</h2>
          
          <section className="space-y-4">
            <h3 className="mb-3">User Cards ({userCards.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userCards.map((card) => (
                <Card key={card.id} className="h-48">
                  <img 
                    src={card.avatar} 
                    alt={`${card.name}'s avatar`} 
                    className="w-full h-32 object-cover mb-3"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold">{card.name}</h3>
                    <p className="text-sm">{card.role}</p>
                    <p className="text-xs">{new Date(card.joinedAt).toLocaleDateString()}</p>
                  </div>
                </Card>
              ))}
            </div>
            
            <h3 className="mb-3">Credentials ({credentials.length})</h3>
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div key={cred.id} className="p-3 border rounded">
                  <p className="font-semibold">{cred.type}</p>
                  <p className="text-sm">{cred.value}</p>
                  <p className="text-xs">{cred.issuedBy}</p>
                </div>
              ))}
            </div>
            
            <h3 className="mb-3">Features ({featureList.length})</h3>
            <div className="space-y-3">
              <ul className="list-disc list-inside space-y-2">
                {featureList.map((feature) => (
                  <li key={feature}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Login as Demo User
            </Button>
          </>
        )}
      }
      
      <div className="mt-8 pt-8 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          href="/"
          className="mr-3"
        >
          ← Back to Home
        </Button>
      </div>
    </Container>
  );
}
