import React from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, HelpCircle, Shield, FileText } from 'lucide-react';
import Head from 'next/head';

export default function HelpPage() {
  const router = useRouter();

  const faqs = [
    {
      question: 'How does the AI meal planning work?',
      answer: 'Our AI uses GPT-4o to generate personalized meal plans based on your training schedule, dietary restrictions, and food preferences. Each meal is validated by specialized machine learning models for accurate macro predictions.',
    },
    {
      question: 'Can I customize my meal plan?',
      answer: 'Yes! You can regenerate individual meals, rate meals to improve future recommendations, and adjust your dietary preferences at any time. The AI learns from your ratings to provide better suggestions.',
    },
    {
      question: 'How accurate are the macro predictions?',
      answer: 'Our ML models achieve 87% accuracy with predictions typically within ±75 calories and ±3g of protein. The models are trained on extensive nutrition databases and continuously improved.',
    },
    {
      question: 'Do you support dietary restrictions?',
      answer: 'Absolutely! We support all major dietary restrictions including vegetarian, vegan, gluten-free, dairy-free, and various allergies. You can specify your preferences during onboarding or in settings.',
    },
    {
      question: 'How does the training integration work?',
      answer: 'Simply input your weekly workout schedule with exercise types, distances, and intensity levels. The AI automatically adjusts your meal plans to match your training needs, including carb-loading for intense sessions.',
    },
    {
      question: 'Is there a mobile app?',
      answer: 'Yes! Our mobile app is coming soon to iOS. You can access all features including meal tracking, training sync, and meal generation on the go.',
    },
    {
      question: 'How do I track my meal completion?',
      answer: 'On the meals page, you can check off meals as you complete them throughout the day. This helps you track your progress and see how many meals you\'ve completed.',
    },
    {
      question: 'Can I share my meal plan?',
      answer: 'Yes! You can share individual recipes and grocery lists. Use the share button on any recipe or grocery list to send it to friends or save it for later.',
    },
  ];

  return (
    <>
      <Head>
        <title>Help & Support - Alimenta</title>
        <meta name="description" content="Get help with Alimenta nutrition planning" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-white to-orange-50">
        {/* Header with Back Button */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 h-16">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Legal Links */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Legal Information</h2>
            <div className="space-y-4">
              <button
                onClick={() => {
                  // Navigate to privacy policy page (to be created)
                  router.push('/privacy');
                }}
                className="w-full flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-gray-900">Privacy Policy</span>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary transform rotate-180 transition-transform" />
              </button>
              
              <button
                onClick={() => {
                  // Navigate to terms of service page (to be created)
                  router.push('/terms');
                }}
                className="w-full flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-gray-900">Terms of Service</span>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary transform rotate-180 transition-transform" />
              </button>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Still have questions? We're here to help!
            </p>
            <a
              href="mailto:alimentanutrition@gmail.com"
              className="text-primary hover:text-orange-600 font-semibold transition-colors"
            >
              alimentanutrition@gmail.com
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
