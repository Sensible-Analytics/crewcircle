export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-blue">
      <h1>Privacy Policy</h1>
      <p>Last Updated: March 23, 2026</p>
      
      <h2>1. Introduction</h2>
      <p>CrewCircle (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>
      
      <h2>2. Australian Privacy Principles</h2>
      <p>We comply with the Australian Privacy Principles (APPs) contained in the Privacy Act 1988 (Cth). We take reasonable steps to ensure that personal information we collect is handled in a transparent and secure manner.</p>
      
      <h2>3. Data Residency</h2>
      <p>All CrewCircle data, including personal information of employees and employers, is stored on secure servers located in **Sydney, Australia (AWS ap-southeast-2 region)**. We do not transfer your data outside of Australia.</p>
      
      <h2>4. Information We Collect</h2>
      <ul>
        <li>**Account Information:** Name, email, phone number, and business details (including ABN).</li>
        <li>**Employee Data:** Names, contact details, and roles provided by employers.</li>
        <li>**Usage Data:** Rosters, availability, and time clock events (including GPS coordinates at the time of clock-in/out).</li>
        <li>**Billing Information:** Processed securely via Stripe; we do not store full credit card details.</li>
      </ul>
      
      <h2>5. GPS Tracking</h2>
      <p>We collect GPS coordinates only when an employee performs a clock-in or clock-out event. This information is used solely to verify the employee's location relative to the workplace geofence. **We do not track location in the background or continuously.**</p>
      
      <h2>6. Data Retention</h2>
      <p>In accordance with the Fair Work Act 2009, we retain employee and time-tracking records for a minimum of 7 years. You may request access to or correction of your personal information at any time.</p>
      
      <h2>7. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at support@crewcircle.com.au.</p>
    </div>
  );
}
