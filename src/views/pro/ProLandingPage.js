import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRight, Users, TrendingUp, Clock, Shield, BarChart3, CheckCircle, Zap } from 'lucide-react';

export const ProLandingPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/alimenta_logo.png" alt="Alimenta" className="h-8" />
              <span className="text-sm font-medium text-gray-500">Pro</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  For Athletes
                </button>
              </Link>
              <Link href="/login?role=nutritionist">
                <button className="px-6 py-2 text-primary font-medium hover:bg-orange-50 rounded-lg transition-colors">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-animated"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-2 bg-orange-100 rounded-full text-primary font-semibold text-sm mb-6">
            For Sports Nutritionists & Dietitians
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Manage Your Clients'
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600"> Nutrition Plans with AI</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Replace spreadsheets with AI-powered client management. Set macro boundaries, track compliance, scale your practice.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login?role=nutritionist">
              <button className="px-8 py-4 bg-gradient-to-r from-primary to-orange-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 items-center text-gray-600 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Save 10+ hours per week</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Unlimited clients</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Solution: Key Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Workflow, Supercharged
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Keep the flexibility of AI with the structure your practice needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Feature 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Client Management Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  See all your clients in one place. Track who's active, who needs a check-in, and who's crushing their goals.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Sort by last active, compliance, or custom tags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Invite clients via simple 8-character code</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Set Macro Boundaries</h3>
                <p className="text-gray-600 mb-4">
                  Define calorie and macro ranges for each client. The AI stays within your guardrails—every single meal.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Set min/max for calories, protein, carbs, and fats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Update anytime as client needs change</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Compliance & Feedback Tracking</h3>
                <p className="text-gray-600 mb-4">
                  See which meals clients rate highly, which they skip, and where you need to adjust guidance.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Weekly compliance percentage per client</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>View meal ratings and client notes</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Save Hours Every Week</h3>
                <p className="text-gray-600 mb-4">
                  Clients generate their own plans within your parameters. You review and adjust, not create from scratch.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Clients input training schedules themselves</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Leave notes on plans, not endless Slack messages</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From signup to your first client in under 5 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create Your Account"
              description="Sign up and get your unique 8-character invite code. Share it with clients via email, text, or your website."
            />
            <StepCard
              number="2"
              title="Set Client Boundaries"
              description="When a client connects, set their macro ranges and any notes. They'll see your guidance when generating plans."
            />
            <StepCard
              number="3"
              title="Monitor & Adjust"
              description="Track compliance, view meal ratings, and leave feedback. Update macro bounds as their training evolves."
            />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Alimenta Pro vs. DIY GPTs
          </h2>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              {/* Header */}
              <div className="bg-gray-50 p-6">
                <h3 className="font-bold text-gray-900 text-lg">Custom ChatGPT</h3>
              </div>
              <div className="bg-gradient-to-r from-primary to-orange-600 p-6">
                <h3 className="font-bold text-white text-lg">Alimenta Pro</h3>
              </div>

              {/* Rows */}
              <ComparisonRow
                feature="Client meal history"
                left="❌ Lost after session"
                leftBad={true}
              />
              <ComparisonRow
                feature=""
                right="✅ Persistent across weeks"
                rightGood={true}
              />

              <ComparisonRow
                feature="Macro enforcement"
                left="❌ Suggestions only"
                leftBad={true}
              />
              <ComparisonRow
                feature=""
                right="✅ Hard boundaries"
                rightGood={true}
              />

              <ComparisonRow
                feature="Compliance tracking"
                left="❌ Manual spreadsheets"
                leftBad={true}
              />
              <ComparisonRow
                feature=""
                right="✅ Automatic dashboards"
                rightGood={true}
              />

              <ComparisonRow
                feature="Client onboarding"
                left="❌ Email back-and-forth"
                leftBad={true}
              />
              <ComparisonRow
                feature=""
                right="✅ Simple invite code"
                rightGood={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonial Placeholder 
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-12">
            <div className="flex justify-center mb-6">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white"></div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
              </div>
            </div>
            <p className="text-xl text-gray-700 italic mb-4">
              "I was spending 2-3 hours per client per week on meal plans. Now it's 15 minutes of review time, and my clients are more engaged than ever."
            </p>
            <p className="font-semibold text-gray-900">— Beta Tester, Sports Nutritionist</p>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Scale Your Practice?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Start your free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login?role=nutritionist">
              <button className="px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105">
                Start Free Trial
              </button>
            </Link>
          </div>
          <p className="text-orange-100 text-sm mt-6">
            Questions? Email us at alimentanutrition@gmail.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/alimenta_logo.png" alt="Alimenta" className="h-8 opacity-80" />
              <span className="text-sm text-gray-600">Pro</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600">
              <Link href="/login" className="hover:text-gray-900">For Athletes</Link>
              <Link href="/login?role=nutritionist" className="hover:text-gray-900">Sign In</Link>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center mt-6">
            © 2025 Alimenta Pro. Built for nutritionists who demand results.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Helper Components
const PainPoint = ({ icon, title, description }) => (
  <div className="text-center">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }) => (
  <div className="relative">
    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-primary to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
      {number}
    </div>
    <div className="pt-8 p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{title}</h3>
      <p className="text-gray-600 text-center">{description}</p>
    </div>
  </div>
);

const ComparisonRow = ({ feature, left, right, leftBad, rightGood }) => (
  <>
    {feature && (
      <>
        <div className="col-span-2 bg-gray-50 px-6 py-3 font-semibold text-gray-900 text-sm">
          {feature}
        </div>
      </>
    )}
    {left && (
      <div className={`px-6 py-4 text-sm ${leftBad ? 'text-red-600' : 'text-gray-700'}`}>
        {left}
      </div>
    )}
    {right && (
      <div className={`px-6 py-4 text-sm ${rightGood ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
        {right}
      </div>
    )}
  </>
);

export default ProLandingPage;