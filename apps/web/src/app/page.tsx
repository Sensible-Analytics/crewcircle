import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">CrewCircle</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
          <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
          <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 py-20 bg-gradient-to-b from-blue-50 to-white text-center md:text-left md:flex md:items-center md:gap-12 md:max-w-7xl md:mx-auto">
        <div className="md:flex-1">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Rostering simplified for <span className="text-blue-600">Australian SMBs</span>.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
            The all-in-one platform for employee scheduling, time tracking, and team management. Built for Melbourne cafes, Sydney retail, and everywhere in between.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link href="/signup" className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg">
              Start Your Free Trial
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              No credit card required
            </div>
          </div>
          <div className="mt-8 flex items-center gap-4 text-sm text-gray-500">
            <span className="font-semibold text-gray-900">Trusted by:</span>
            <span>Local Cafes</span>
            <span>Retail Shops</span>
            <span>Service Businesses</span>
          </div>
        </div>
        <div className="hidden md:block md:flex-1">
          <div className="relative h-[400px] w-full bg-blue-100 rounded-2xl border-4 border-white shadow-2xl overflow-hidden">
             {/* Mock UI for Roster */}
             <div className="p-4 bg-white h-full">
                <div className="flex gap-2 mb-4">
                  <div className="w-1/4 h-8 bg-gray-100 rounded"></div>
                  <div className="w-3/4 h-8 bg-gray-100 rounded"></div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(21)].map((_, i) => (
                    <div key={i} className={`h-12 rounded ${i % 3 === 0 ? 'bg-blue-200' : 'bg-gray-50'}`}></div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to run your team.</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Skip the spreadsheets. CrewCircle handles the heavy lifting so you can focus on your business.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="p-6 border rounded-2xl hover:border-blue-300 transition-colors bg-white shadow-sm">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Drag-and-Drop Rostering</h3>
            <p className="text-gray-600">Build weekly rosters in minutes. Conflict detection ensures you never double-book an employee or ignore availability.</p>
          </div>
          <div className="p-6 border rounded-2xl hover:border-blue-300 transition-colors bg-white shadow-sm">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-3">GPS Time Clock</h3>
            <p className="text-gray-600">Employees clock in via the mobile app. Geofencing verifies they are on-site, reducing time theft and manual errors.</p>
          </div>
          <div className="p-6 border rounded-2xl hover:border-blue-300 transition-colors bg-white shadow-sm">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-3">AU Compliance</h3>
            <p className="text-gray-600">Built for Australia. 7-year record retention, Privacy Act compliant, and data hosted locally in AWS Sydney (ap-southeast-2).</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, fair pricing.</h2>
            <p className="text-gray-600">Start for free, then grow at your own pace.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 bg-white border rounded-3xl shadow-sm">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <p className="text-gray-500 mb-6">For micro-businesses starting out.</p>
              <div className="text-4xl font-extrabold mb-6">$0</div>
              <ul className="space-y-4 mb-8 text-gray-600">
                <li className="flex items-center gap-2">✓ Up to 5 employees</li>
                <li className="flex items-center gap-2">✓ Full rostering features</li>
                <li className="flex items-center gap-2">✓ Mobile app access</li>
                <li className="flex items-center gap-2">✓ Time clock & GPS</li>
              </ul>
              <Link href="/signup" className="block text-center py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">Start for Free</Link>
            </div>
            <div className="p-8 bg-white border-2 border-blue-600 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-bl-lg">Recommended</div>
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <p className="text-gray-500 mb-6">For growing teams.</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">$4</span>
                <span className="text-gray-500 font-medium">+ GST / employee / month</span>
              </div>
              <ul className="space-y-4 mb-8 text-gray-600">
                <li className="flex items-center gap-2">✓ Unlimited employees</li>
                <li className="flex items-center gap-2">✓ Metered billing</li>
                <li className="flex items-center gap-2">✓ Priority support</li>
                <li className="flex items-center gap-2">✓ CSV timesheet export</li>
              </ul>
              <Link href="/signup" className="block text-center py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Upgrade Anytime</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">CrewCircle</span>
            </div>
            <p className="text-gray-500 max-w-sm mb-6">
              Employee management platform for Australian SMBs. Locally hosted, locally supported.
            </p>
            <p className="text-xs text-gray-400">© 2026 CrewCircle. Data hosted in ap-southeast-2 (Sydney).</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#features">Features</Link></li>
              <li><Link href="#pricing">Pricing</Link></li>
              <li><Link href="/signup">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
