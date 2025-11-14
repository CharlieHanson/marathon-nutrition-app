import React from 'react';
import { ArrowRight, Calendar, Utensils, Sparkles, TrendingUp, Shield, ChefHat } from 'lucide-react';

export const LandingPage = ({ onSignIn, onSignUp, onViewDemo }) => {

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/alimenta_logo.png" alt="Alimenta" className="h-8" />
            </div>
            <button
              onClick={onSignIn || (() => {})}
              className="px-6 py-2 text-primary font-medium hover:bg-orange-50 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-animated"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Fuel Your Training with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600"> AI-Powered Nutrition</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get personalized weekly meal plans that adapt to your training schedule, dietary restrictions, and fitness goals. Powered by advanced AI and validated by machine learning.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={onSignUp || (() => {})}
              className="px-8 py-4 bg-gradient-to-r from-primary to-orange-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onViewDemo || (() => {})}
              className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg border-2 border-gray-200 hover:border-primary transition-all"
            >
              View Demo
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600">Personalized Planning</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">5</div>
              <div className="text-gray-600">Specialized AI Models</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">87%</div>
              <div className="text-gray-600">ML Prediction Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: Training Integration */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-block p-3 bg-orange-100 rounded-lg mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Sync with Your Training Schedule
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Input your weekly workouts and watch your nutrition adapt automatically.
              </p>
              <ul className="space-y-4">
                <FeaturePoint text="Track multiple workout types: runs, strength training, cycling, and more" />
                <FeaturePoint text="Adjust meal plans based on workout intensity levels" />
                <FeaturePoint text="Optimize nutrition timing around your training" />
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-600 rounded-2xl transform rotate-3"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80" 
                    alt="Athlete training" 
                    className="rounded-lg w-full h-64 object-cover"
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">Monday: 10 mile run</span>
                      <span className="text-primary font-bold">Intensity: 7/10</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">Tuesday: Strength training</span>
                      <span className="text-primary font-bold">Intensity: 6/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Dietary Restrictions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl transform -rotate-3"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80" 
                    alt="Healthy food" 
                    className="rounded-lg w-full h-64 object-cover"
                  />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <Shield className="w-5 h-5 mx-auto mb-1 text-green-600" />
                      <span className="text-sm font-medium">Gluten-Free</span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <Shield className="w-5 h-5 mx-auto mb-1 text-green-600" />
                      <span className="text-sm font-medium">Vegetarian</span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <Shield className="w-5 h-5 mx-auto mb-1 text-green-600" />
                      <span className="text-sm font-medium">Dairy-Free</span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <Shield className="w-5 h-5 mx-auto mb-1 text-green-600" />
                      <span className="text-sm font-medium">Nut Allergies</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="inline-block p-3 bg-green-100 rounded-lg mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Your Restrictions, Our Priority
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Whether you're vegetarian, gluten-free, or managing allergies, our AI creates meal plans that respect your dietary needs without compromising on nutrition or taste.
              </p>
              <ul className="space-y-4">
                <FeaturePoint text="Support for all major dietary restrictions and allergies" />
                <FeaturePoint text="Cuisine preferences from Mediterranean to Asian" />
                <FeaturePoint text="Never see ingredients you dislike" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: AI-Powered Generation */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-block p-3 bg-purple-100 rounded-lg mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                AI-Generated Meal Plan
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Powered by GPT-4.0 for meal generation and validated by 5 specialized machine learning models achieving 87% accuracy.
              </p>
              <ul className="space-y-4">
                <FeaturePoint text="Macro predictions validated by ML (±75 cal, ±3g protein)" />
                <FeaturePoint text="Personalized recipes with step-by-step instructions" />
                <FeaturePoint text="Auto-generated grocery lists organized by category" />
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl transform rotate-3"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1644704265419-96ddaf628e71?w=800&q=80" 
                    alt="Meal planning on phone" 
                    className="rounded-lg w-full h-64 object-cover"
                  />
                  <div className="mt-4 space-y-3">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Utensils className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold">Dinner</span>
                      </div>
                      <p className="text-sm text-gray-600">Steak with mashed potatoes and broccoli</p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">720 cal</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">60g P</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">39g C</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">24g F</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            From signup to your first personalized meal plan in under 5 minutes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              icon={<Calendar className="w-8 h-8" />}
              title="Add Your Training Schedule"
              description="Input your weekly workouts with exercise types, distances, and intensity levels"
            />
            <StepCard
              number="2"
              icon={<Shield className="w-8 h-8" />}
              title="Set Your Preferences"
              description="Tell us about your dietary restrictions, food preferences, and fitness goals"
            />
            <StepCard
              number="3"
              icon={<ChefHat className="w-8 h-8" />}
              title="Generate Your Plan"
              description="Get AI-powered weekly meal plans with recipes and grocery lists"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Nutrition?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join athletes who are fueling their training with intelligent meal planning
          </p>
          <button
            onClick={onSignUp || (() => {})}
            className="px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Start Free Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <img src="/alimenta_logo.png" alt="Alimenta" className="h-8 mx-auto mb-4 opacity-80" />
          <p className="text-sm text-gray-600">
            © 2025 Alimenta. Built with AI for athletes who demand precision.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Helper Components
const FeaturePoint = ({ text }) => (
  <li className="flex items-start gap-3">
    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1">
      <ArrowRight className="w-4 h-4 text-primary" />
    </div>
    <span className="text-gray-600">{text}</span>
  </li>
);

const StepCard = ({ number, icon, title, description }) => (
  <div className="relative">
    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-primary to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
      {number}
    </div>
    <div className="pt-8 p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="inline-block p-3 bg-orange-50 rounded-lg mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

export default LandingPage;