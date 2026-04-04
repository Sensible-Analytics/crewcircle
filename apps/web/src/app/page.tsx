import Link from "next/link";
import Logo from "@/components/Logo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-amber-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50">
        <Logo size="md" />
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">How it works</Link>
          <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Pricing</Link>
          <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Blog</Link>
          <Link href="https://github.com/Sensible-Analytics/crewcircle" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Login</Link>
          <Link href="/signup" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section - Warm and Human */}
      <header className="px-6 py-16 md:py-24 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto md:flex md:items-center md:gap-12">
          <div className="md:flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-6">
              <span className="text-xl">☕</span>
              Built for Aussie cafes, shops & tradies
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Finally, rostering that{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">gets sorted</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl leading-relaxed">
              Stop fighting with WhatsApp chains and scribbled whiteboards. 
              CrewCircle helps your small team know when they&apos;re working — no dramas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="px-8 py-4 bg-orange-500 text-white rounded-xl text-lg font-bold hover:bg-orange-600 transition-all hover:scale-105 shadow-lg hover:shadow-xl text-center">
                Start Your Free Trial
              </Link>
              <Link href="/demo" className="px-8 py-4 bg-white text-orange-600 border-2 border-orange-200 rounded-xl text-lg font-bold hover:bg-orange-50 transition-all text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Try Demo
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                No credit card needed
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                14 days free
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Set up in 5 mins
              </div>
            </div>
          </div>
          <div className="hidden md:block md:flex-1 mt-12 md:mt-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-300 to-amber-300 rounded-3xl blur-xl opacity-30 transform rotate-2"></div>
              <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-amber-200">
                {/* Real Aussie cafe team image */}
                <img 
                  src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&h=500&fit=crop&q=80" 
                  alt="Australian cafe team working together"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="text-white font-medium">Sarah & the team at Fitzroy Espresso</p>
                  <p className="text-white/80 text-sm">Melbourne, Victoria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof - Aussie Businesses */}
      <section className="bg-white py-12 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-gray-500 mb-8">Loved by businesses across Australia</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-2xl">☕</span>
              <span className="font-medium">Melbourne Cafes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-2xl">🍽️</span>
              <span className="font-medium">Sydney Restaurants</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-2xl">👕</span>
              <span className="font-medium">Brisbane Retail</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-2xl">🔧</span>
              <span className="font-medium">Perth Tradies</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-2xl">🏥</span>
              <span className="font-medium">Adelaide Healthcare</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section - See It In Action */}
      <section id="demo" className="px-6 py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">See it in action</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Roster your week in minutes</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Watch how easy it is to create a roster, send it to your team, and track their hours.</p>
          </div>
          
          {/* Animated Demo GIF/Screenshot */}
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-900">
              {/* Browser chrome */}
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-gray-400">crewcircle.co/roster</span>
                </div>
              </div>
              {/* Demo content - animated roster UI */}
              <div className="bg-gray-100 p-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">📅 Weekly Roster - The Daily Grind</h3>
                    <span className="text-sm text-gray-500">Mar 24 - Mar 30</span>
                  </div>
                  {/* Animated roster grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 animate-pulse">
                      <div className="w-24 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-700">Sarah 👋</span>
                      </div>
                      <div className="flex gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                          <div key={day} className={`w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium ${i < 3 ? 'bg-orange-400 text-white' : 'bg-gray-100'}`}>
                            {i < 3 ? '7-3' : ''}
                          </div>
                        ))}
                        <div className="w-12 h-10 bg-green-400 text-white rounded-lg flex items-center justify-center text-xs font-medium">10-4</div>
                        <div className="w-12 h-10 bg-purple-400 text-white rounded-lg flex items-center justify-center text-xs font-medium">9-3</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">Jake 🎸</span>
                      </div>
                      <div className="flex gap-2">
                        {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                          <div key={day} className={`w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium ${day ? 'bg-blue-400 text-white' : 'bg-gray-100'}`}>
                            {day ? '2-10' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-green-700">Emma 🌿</span>
                      </div>
                      <div className="flex gap-2">
                        {['Mon', 'Tue', '', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                          <div key={day} className={`w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium ${day ? 'bg-green-400 text-white' : 'bg-gray-100'}`}>
                            {day ? '8-4' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Publish button */}
                  <div className="mt-6 pt-6 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-500">3 employees • 42 hours scheduled</span>
                    <button className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors">
                      📤 Publish Roster
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-500 mt-4 text-sm">Your team gets notified instantly when the roster goes live</p>
          </div>
        </div>
      </section>

      {/* Features Section - Aussie Scenarios */}
      <section id="features" className="px-6 py-20 md:py-28 bg-amber-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">No more roster dramas</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Stuff that actually matters for your small biz — sorted in a way that makes sense.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-amber-100">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Sorted your roster by Friday arvo</h3>
              <p className="text-gray-600">Drag shifts around, copy last week, publish with one click. Your team sees it on their phones before they leave the pub.</p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-amber-100">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Clock in from their phone</h3>
              <p className="text-gray-600">GPS-verified so Sarah can&apos;t clock in from home. She&apos;s actually at the shop when she says she is.</p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-amber-100">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Award stuff sorted</h3>
              <p className="text-gray-600">We crunch the hospitality award numbers so you don&apos;t have to. Fair Work compliant, no worries.</p>
            </div>
            {/* Feature 4 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-amber-100">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Team sees updates instantly</h3>
              <p className="text-gray-600">No more &quot;did you see the roster?&quot; messages. They get a notification, done.</p>
            </div>
            {/* Feature 5 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-amber-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Timesheets in one click</h3>
              <p className="text-gray-600">Export to CSV for your bookkeeper. Track your labour costs so you know if you can afford that new espresso machine.</p>
            </div>
            {/* Feature 6 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-amber-100">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Know your team</h3>
              <p className="text-gray-600">Set roles, track availability, see who&apos;s keen for extra shifts. Jamie wants more hours? Sorted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Detailed Scenarios with Avatars */}
      <section className="px-6 py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">See CrewCircle in action</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">From owner to employee - here's how everyone uses the app.</p>
          </div>

          {/* Owner Journey - Web */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white text-xl">👩‍💼</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Maria's Journey - The Owner</h3>
                <p className="text-gray-500 text-sm">Using CrewCircle on her laptop to manage the team</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="text-xs font-bold text-orange-600 mb-2">STEP 1</div>
                  <h4 className="font-bold text-gray-900 mb-2">Sign Up Free</h4>
                  <p className="text-sm text-gray-600 mb-4">Enter your email & business name. No ABN needed for trial!</p>
                  {/* Screenshot mockup */}
                  <div className="bg-white rounded-lg border shadow-sm p-4">
                    <div className="text-xs text-gray-400 mb-2">crewcircle.co/signup</div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                      <div className="h-8 bg-orange-500 rounded mt-3"></div>
                    </div>
                  </div>
                </div>
                {/* Speech bubble */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                  <div className="bg-orange-500 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
                    "Took me 60 seconds. Just email + business name. Done!"
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="text-xs font-bold text-orange-600 mb-2">STEP 2</div>
                  <h4 className="font-bold text-gray-900 mb-2">Build Roster</h4>
                  <p className="text-sm text-gray-600 mb-4">Drag & drop shifts onto the weekly calendar.</p>
                  {/* Screenshot mockup */}
                  <div className="bg-white rounded-lg border shadow-sm p-4">
                    <div className="text-xs text-gray-400 mb-2">crewcircle.co/roster</div>
                    <div className="grid grid-cols-7 gap-1">
                      {['M','T','W','T','F','S','S'].map(d => <div key={d} className="text-xs text-center text-gray-300">{d}</div>)}
                      <div className="col-span-7 flex gap-1 mt-1">
                        <div className="h-6 bg-orange-400 rounded flex-1"></div>
                        <div className="h-6 bg-blue-400 rounded flex-1"></div>
                        <div className="h-6 bg-green-400 rounded flex-1"></div>
                        <div className="h-6 bg-gray-100 rounded flex-1"></div>
                        <div className="h-6 bg-gray-100 rounded flex-1"></div>
                        <div className="h-6 bg-gray-100 rounded flex-1"></div>
                        <div className="h-6 bg-gray-100 rounded flex-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Speech bubble */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                  <div className="bg-orange-500 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
                    "I just drag Sarah to Monday morning... done!"
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="text-xs font-bold text-orange-600 mb-2">STEP 3</div>
                  <h4 className="font-bold text-gray-900 mb-2">Publish Roster</h4>
                  <p className="text-sm text-gray-600 mb-4">One click sends roster to all team members.</p>
                  {/* Screenshot mockup */}
                  <div className="bg-white rounded-lg border shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">3 employees</span>
                      <button className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg">📤 Publish</button>
                    </div>
                  </div>
                </div>
                {/* Speech bubble */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                  <div className="bg-orange-500 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
                    "Hit publish and boom - everyone's notified instantly!"
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="bg-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="text-xs font-bold text-orange-600 mb-2">STEP 4</div>
                  <h4 className="font-bold text-gray-900 mb-2">Track Hours</h4>
                  <p className="text-sm text-gray-600 mb-4">See who clocked in, export timesheets for payroll.</p>
                  {/* Screenshot mockup */}
                  <div className="bg-white rounded-lg border shadow-sm p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-400 rounded-full"></div>
                        <div className="text-xs">Sarah - 7:02am ✓</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                        <div className="text-xs">Jake - 9:58am ✓</div>
                      </div>
                      <div className="text-xs text-green-600 mt-2">All on-site ✓</div>
                    </div>
                  </div>
                </div>
                {/* Speech bubble */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                  <div className="bg-orange-500 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
                    "Export to CSV for my bookkeeper - sorted!"
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Journey - Mobile */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl">👨‍🍳</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Jake's Journey - The Employee</h3>
                <p className="text-gray-500 text-sm">Using CrewCircle app on his phone to check shifts & clock in</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="text-xs font-bold text-blue-600 mb-2">STEP 1</div>
                  <h4 className="font-bold text-gray-900 mb-2">Get Invited</h4>
                  <p className="text-sm text-gray-600 mb-4">Owner sends invite via email or SMS.</p>
                  {/* Phone mockup */}
                  <div className="bg-gray-900 rounded-3xl p-3 mx-auto w-40">
                    <div className="bg-white rounded-2xl p-3 text-center">
                      <div className="text-xs text-gray-500">From: The Daily Grind</div>
                      <div className="text-xs font-bold text-blue-600 mt-1">You're invited!</div>
                      <div className="text-xs text-gray-400 mt-1">Tap to join...</div>
                    </div>
                  </div>
                </div>
                {/* Speech bubble */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                  <div className="bg-blue-500 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
                    "Got a text saying 'You're on the roster this week'"
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="text-xs font-bold text-blue-600 mb-2">STEP 2</div>
                  <h4 className="font-bold text-gray-900 mb-2">View Roster</h4>
                  <p className="text-sm text-gray-600 mb-4">See upcoming shifts on phone calendar.</p>
                  {/* Phone mockup */}
                  <div className="bg-gray-900 rounded-3xl p-3 mx-auto w-40">
                    <div className="bg-white rounded-2xl p-3">
                      <div className="text-xs font-bold text-center mb-2">This Week</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Mon</span>
                          <span className="text-blue-600 font-bold">2-10pm</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Tue</span>
                          <span className="text-blue-600 font-bold">2-10pm</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Wed</span>
                          <span>—</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Speech bubble */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                  <div className="bg-blue-500 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
                    "Open my phone and boom - I know when I work!"
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="text-xs font-bold text-blue-600 mb-2">STEP 3</div>
                  <h4 className="font-bold text-gray-900 mb-2">Clock In</h4>
                  <p className="text-sm text-gray-600 mb-4">Tap to clock in when arriving at work.</p>
                  {/* Phone mockup */}
                  <div className="bg-gray-900 rounded-3xl p-3 mx-auto w-40">
                    <div className="bg-white rounded-2xl p-3 text-center">
                      <div className="text-xs text-gray-500 mb-2">Your shift starts at 2pm</div>
                      <button className="w-full py-3 bg-green-500 text-white font-bold rounded-lg animate-pulse">
                        ⏰ Clock In
                      </button>
                    </div>
                  </div>
                </div>
                {/* Speech bubble */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                  <div className="bg-blue-500 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
                    "Tap clock in when I walk through the door"
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="text-xs font-bold text-blue-600 mb-2">STEP 4</div>
                  <h4 className="font-bold text-gray-900 mb-2">Get Notified</h4>
                  <p className="text-sm text-gray-600 mb-4">Instant alerts when roster changes.</p>
                  {/* Phone mockup */}
                  <div className="bg-gray-900 rounded-3xl p-3 mx-auto w-40">
                    <div className="bg-white rounded-2xl p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-500">✓</span>
                        <span>Roster Updated</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Wed shift changed: 2pm → 10am</div>
                    </div>
                  </div>
                </div>
                {/* Speech bubble */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                  <div className="bg-blue-500 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
                    "If Maria changes my shift, I get a notification immediately"
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="text-center mt-16 p-8 bg-amber-50 rounded-2xl">
            <p className="text-lg text-gray-700">
              <span className="font-bold text-orange-600">Owner?</span> Use web to roster, publish, track hours.<br/>
              <span className="font-bold text-blue-600">Employee?</span> Use phone to view shifts, clock in, get notified.
            </p>
            <p className="text-gray-500 mt-4 text-sm">Both free during 14-day trial. No credit card needed.</p>
          </div>
        </div>
      </section>

      {/* Testimonials - Real Aussie Businesses */}
      <section className="px-6 py-20 md:py-28 bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What other small biz owners say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-amber-100">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {'★'.repeat(5)}
              </div>
              <p className="text-gray-700 mb-6 italic">
                &quot;Finally stopped arguing with my team about Sunday rosters. They see it on their phone, no more &apos;I didn&apos;t know&apos; excuses. Absolute game changer for our cafe.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <p className="font-bold text-gray-900">Maria Papadopoulos</p>
                  <p className="text-sm text-gray-500">Cafe owner, Fitzroy VIC</p>
                </div>
              </div>
            </div>
            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-amber-100">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {'★'.repeat(5)}
              </div>
              <p className="text-gray-700 mb-6 italic">
                &quot;We&apos;re a tradie business with 8 blokes. Trying to manage rosters via a whiteboard was a joke. This sorted us right out. Jake actually knows when he&apos;s working now.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  D
                </div>
                <div>
                  <p className="font-bold text-gray-900">Dave Mitchell</p>
                  <p className="text-sm text-gray-500">Plumbing business, Newcastle NSW</p>
                </div>
              </div>
            </div>
            {/* Testimonial 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-amber-100">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {'★'.repeat(5)}
              </div>
              <p className="text-gray-700 mb-6 italic">
                &quot;The GPS clock-in stopped the &apos;I was there at 7am but the app didn&apos;t work&apos; nonsense. Finally. Award stuff is confusing but this handles it.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  J
                </div>
                <div>
                  <p className="font-bold text-gray-900">Jenny Chen</p>
                  <p className="text-sm text-gray-500">Restaurant manager, Sydney NSW</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pricing that won&apos;t make you cry</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Start free, stay free if you&apos;re a tiny team. No lock-in contracts.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 bg-white border-2 border-gray-200 rounded-3xl hover:border-orange-200 transition-all">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <p className="text-gray-500 mb-6">For the little guys starting out.</p>
              <div className="text-5xl font-extrabold mb-6">$0<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <ul className="space-y-4 mb-8 text-gray-600">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Up to 5 employees
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Full rostering features
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Mobile app for your team
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  GPS clock in/out
                </li>
              </ul>
              <Link href="/signup" className="block text-center py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:border-orange-400 hover:text-orange-600 transition-colors">
                Start for Free
              </Link>
            </div>
            {/* Starter Plan */}
            <div className="p-8 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-3xl relative shadow-xl">
              <div className="absolute top-0 right-0 bg-white text-orange-600 px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-bl-xl rounded-tr-3xl">
                Most Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <p className="text-orange-100 mb-6">For growing teams.</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-extrabold">$4</span>
                <span className="text-orange-200 font-medium">+ GST / employee / mo</span>
              </div>
              <ul className="space-y-4 mb-8 text-orange-100">
                <li className="flex items-center gap-3">
                  <span className="text-green-300">✓</span>
                  Unlimited employees
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-300">✓</span>
                  Pay for what you use
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-300">✓</span>
                  Priority support
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-300">✓</span>
                  CSV export for payroll
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-300">✓</span>
                  Labour cost tracking
                </li>
              </ul>
              <Link href="/signup" className="block text-center py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg">
                Start Free Trial
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-8 text-sm">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="px-6 py-20 bg-amber-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">From the blog</h2>
              <p className="text-gray-600">Tips for Aussie small business owners</p>
            </div>
            <Link href="/blog" className="text-orange-600 font-medium hover:text-orange-700">View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/blog/fair-work-act-rostering" className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-all group">
              <div className="h-48 bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <span className="text-6xl opacity-50">📋</span>
              </div>
              <div className="p-6">
                <div className="text-sm text-orange-600 font-medium mb-2">Compliance</div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-orange-600 transition-colors">Fair Work Act & Rostering: What You Need to Know</h3>
                <p className="text-gray-600 text-sm">Understanding your obligations when creating rosters for your team.</p>
              </div>
            </Link>
            <div className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-all">
              <div className="h-48 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <span className="text-6xl opacity-50">⏰</span>
              </div>
              <div className="p-6">
                <div className="text-sm text-green-600 font-medium mb-2">Tips</div>
                <h3 className="text-lg font-bold mb-2">5 Ways to Stop Time Theft at Your Business</h3>
                <p className="text-gray-600 text-sm">Practical tips to ensure accurate time tracking.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-all">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-sky-500 flex items-center justify-center">
                <span className="text-6xl opacity-50">👥</span>
              </div>
              <div className="p-6">
                <div className="text-sm text-blue-600 font-medium mb-2">Guide</div>
                <h3 className="text-lg font-bold mb-2">How to Onboard New Staff Quickly</h3>
                <p className="text-gray-600 text-sm">Get new hires rostered and clocking in fast.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-orange-500 to-amber-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to sort your rostering?</h2>
          <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
            Join 500+ Aussie businesses who&apos;ve stopped stressing about rosters. Takes 5 minutes to set up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-4 bg-white text-orange-600 rounded-xl text-lg font-bold hover:bg-gray-100 transition-all shadow-lg">
              Start Your Free Trial
            </Link>
            <Link href="https://github.com/Sensible-Analytics/crewcircle" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl text-lg font-bold hover:bg-white/10 transition-all">
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Logo variant="light" size="md" className="mb-4" />
              <p className="text-gray-400 max-w-sm mb-6">
                Rostering made simple for Australian small businesses. 
                Built with ❤️ in Melbourne.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/Sensible-Analytics/crewcircle" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="https://twitter.com/crewcircleapp" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="https://github.com/Sensible-Analytics/crewcircle/wiki" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="https://github.com/Sensible-Analytics/crewcircle" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Open Source</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© 2026 CrewCircle. Data hosted in Sydney, Australia.</p>
            <p className="text-sm">
              Made with ❤️ by{" "}
              <a href="https://crewcircle.co" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">
                CrewCircle
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
