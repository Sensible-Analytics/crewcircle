// Demo Mode Configuration
// Controls demo organization settings via environment variables

export const demoConfig = {
  // Enable demo mode - when true, shows demo users on /demo page
  enabled: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',

  // Demo tenant ID - pre-created in database via migration
  tenantId: process.env.NEXT_PUBLIC_DEMO_TENANT_ID || '4fdcd51f-04bc-4f72-8909-3bc0f75934f1',

  // Demo users - must exist in Clerk AND have profiles in database
  users: [
    {
      email: 'demo-owner@crewcircle.co',
      name: 'Maria Papadopoulos',
      role: 'owner' as const,
      firstName: 'Maria',
      lastName: 'Papadopoulos',
    },
    {
      email: 'demo-manager@crewcircle.co',
      name: 'Jake Thompson',
      role: 'manager' as const,
      firstName: 'Jake',
      lastName: 'Thompson',
    },
    {
      email: 'demo-employee1@crewcircle.co',
      name: 'Sarah Chen',
      role: 'employee' as const,
      firstName: 'Sarah',
      lastName: 'Chen',
    },
    {
      email: 'demo-employee2@crewcircle.co',
      name: 'Emma Wilson',
      role: 'employee' as const,
      firstName: 'Emma',
      lastName: 'Wilson',
    },
  ],
};

export const isDemoMode = () => demoConfig.enabled;
