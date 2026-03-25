export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-blue">
      <h1>Terms of Service</h1>
      <p>Last Updated: March 23, 2026</p>
      
      <h2>1. Agreement to Terms</h2>
      <p>By accessing or using CrewCircle, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
      
      <h2>2. Subscription and Billing</h2>
      <p>CrewCircle offers a Free tier and a Starter subscription. The Starter subscription is billed monthly at a rate of $4 AUD (plus GST) per active employee. An employee is considered "active" if their profile exists and has not been soft-deleted.</p>
      
      <h2>3. Multi-Tenant Isolation</h2>
      <p>We provide multi-tenant isolation through database-level security. Each business account's data is isolated and only accessible to authorized members of that account.</p>
      
      <h2>4. Employer Responsibilities</h2>
      <p>As an employer using CrewCircle, you are responsible for:
        <ul>
          <li>Ensuring all employee data is accurate and up to date.</li>
          <li>Complying with the Fair Work Act 2009 regarding record-keeping and awards.</li>
          <li>Providing required notices to employees before implementing GPS-verified time tracking.</li>
        </ul>
      </p>
      
      <h2>5. Limitation of Liability</h2>
      <p>While we strive for 100% uptime, CrewCircle is provided "as is". We are not liable for any losses resulting from service interruptions or data entry errors.</p>
      
      <h2>6. Termination</h2>
      <p>You may cancel your subscription at any time via the billing settings. Upon cancellation, your account will revert to the Free tier at the end of the current billing cycle. Data is retained for 7 years in accordance with our Privacy Policy.</p>
      
      <h2>7. Governing Law</h2>
      <p>These terms are governed by the laws of Victoria, Australia.</p>
    </div>
  );
}
