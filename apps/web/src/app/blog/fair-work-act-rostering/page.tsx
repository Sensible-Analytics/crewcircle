export const metadata = {
  title: 'Fair Work Act & Rostering: What Australian SMBs Need to Know',
  description: 'Understanding your obligations under the Fair Work Act when creating employee rosters. Learn about maximum hours, break requirements, and compliance best practices.',
};

export default function FairWorkBlogPost() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <article className="prose prose-blue max-w-none">
        <div className="mb-8">
          <span className="text-blue-600 font-medium">Compliance</span>
          <h1 className="text-4xl font-bold mt-2 mb-4">Fair Work Act & Rostering: What Australian SMBs Need to Know</h1>
          <p className="text-gray-500">March 26, 2026 · 8 min read</p>
        </div>

        <p className="text-lg text-gray-600 mb-8">
          As an Australian small business owner, understanding your legal obligations under the Fair Work Act is essential when creating employee rosters. This guide covers the key requirements you need to know.
        </p>

        <h2>Maximum Hours and Overtime</h2>
        <p>
          Under the Fair Work Act, full-time employees cannot be required to work more than 38 hours per week unless the additional hours are reasonable. What constitutes "reasonable" depends on factors including:
        </p>
        <ul>
          <li>The employee's personal circumstances (family responsibilities, etc.)</li>
          <li>The workplace's usual hours of operation</li>
          <li>Any overtime penalty rates agreed to in the employment contract</li>
        </ul>

        <h2>Meal Breaks and Rest Periods</h2>
        <p>
          Most awards and enterprise agreements require meal breaks after certain periods of work. Common requirements include:
        </p>
        <ul>
          <li>A 30-60 minute unpaid meal break after 5 hours of work</li>
          <li>10 minute paid rest break for every 3-4 hours worked</li>
          <li>Extra breaks in hot or cold environments</li>
        </ul>
        <p>
          CrewCircle helps you track these requirements automatically based on your employees' award classification.
        </p>

        <h2>Notice Requirements</h2>
        <p>
          When publishing rosters, you may need to provide advance notice to employees. While the Fair Work Act doesn't specify exact notice periods for roster changes, most awards require:
        </p>
        <ul>
          <li>7-14 days notice for roster changes in retail businesses</li>
          <li>Consultation with employees about significant roster changes</li>
          <li>Clear communication of shift times and locations</li>
        </ul>

        <h2>Record-Keeping Requirements</h2>
        <p>
          The Fair Work Act requires employers to keep accurate records of:
        </p>
        <ul>
          <li>Hours worked by each employee</li>
          <li>Meal breaks and rest periods taken</li>
          <li>Overtime hours and penalty rates applied</li>
          <li>Roster publications and employee acknowledgments</li>
        </ul>
        <p>
          CrewCircle maintains these records automatically and provides 7-year retention in compliance with Australian law.
        </p>

        <h2>Penalties for Non-Compliance</h2>
        <p>
          Failure to comply with Fair Work Act requirements can result in:
        </p>
        <ul>
          <li>Back-pay claims for underpaid overtime</li>
          <li>Civil penalties up to $18,780 per contravention (for individuals)</li>
          <li>Civil penalties up to $93,900 per contravention (for corporations)</li>
          <li>Reputational damage and employee dissatisfaction</li>
        </ul>

        <h2>How CrewCircle Helps</h2>
        <p>
          CrewCircle is designed with Australian compliance in mind:
        </p>
        <ul>
          <li><strong>Automatic Award Detection:</strong> Identify which modern award applies to each employee</li>
          <li><strong>Conflict Alerts:</strong> Get notified when shifts violate maximum hours or break requirements</li>
          <li><strong>Audit Trail:</strong> Complete history of roster publications and changes</li>
          <li><strong>Compliant Exports:</strong> Generate reports that meet Fair Work Act record-keeping requirements</li>
        </ul>

        <div className="bg-blue-50 p-6 rounded-xl mt-8">
          <h3 className="font-bold text-lg mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            This guide is for informational purposes only. For specific legal advice about your situation, consult a qualified employment lawyer or contact the Fair Work Ombudsman.
          </p>
          <a href="https://www.fairwork.gov.au" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium">
            Visit Fair Work Ombudsman →
          </a>
        </div>
      </article>
    </div>
  );
}
