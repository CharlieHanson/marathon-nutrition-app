import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Calendar, Utensils, Sparkles, TrendingUp, Shield, ChefHat, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';

export const LandingPage = () => {
  const router = useRouter();
  const { enableGuestMode } = useAuth();

  const handleViewDemo = () => {
    enableGuestMode();
    router.push('/training');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/alimenta_logo.png" alt="Alimenta" className="h-8" />
            </div>
            <div className="flex items-center gap-4">
              <Link href="/pro">
                <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  For Nutritionists
                </button>
              </Link>
              <Link href="/login">
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
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-animated"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Fuel Your Training with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600"> AI-Powered Nutrition</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get personalized weekly meal plans that adapt to your training schedule, dietary restrictions, and fitness goals. Powered by advanced AI that learns from your ratings and gets smarter with every meal.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <button className="px-8 py-4 bg-gradient-to-r from-primary to-orange-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <button
              onClick={handleViewDemo}
              className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg border-2 border-gray-200 hover:border-primary transition-all"
            >
              View Demo
            </button>
          </div>

          {/* Stats with RAG */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600 text-sm">AI Planning</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-gray-600 text-sm">Unique Meal Combinations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">5</div>
              <div className="text-gray-600 text-sm">Specialized ML Models</div>
            </div>
          </div>

          {/* Tech Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 text-sm font-medium rounded-full shadow-sm">
              🤖 Powered by GPT-4o
            </span>
            <span className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 text-sm font-medium rounded-full shadow-sm">
              🧠 RAG-Based Learning
            </span>
            <span className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 text-sm font-medium rounded-full shadow-sm">
              ⚡ Real-Time Generation
            </span>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <MobileAppCarousel />

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
                Powered by GPT-4o for meal generation and validated by 5 specialized machine learning models achieving 87% accuracy.
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

      {/* Feature 4: RAG Learning System */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block p-3 bg-blue-100 rounded-lg mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Gets Smarter With Every Rating
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our advanced AI learns from your preferences using semantic search and vector embeddings, creating meal plans that truly match your taste.
            </p>
          </div>

          {/* How RAG Works - Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">⭐</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  Rate Your Meals
                </h3>
                <p className="text-gray-600 text-center">
                  Give 4-5 stars to meals you love. Our AI captures the essence of what makes them special.
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ArrowRight className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🧠</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  AI Learns Patterns
                </h3>
                <p className="text-gray-600 text-center">
                  Advanced machine learning identifies flavor profiles, ingredients, and cooking styles you prefer.
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ArrowRight className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div>
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  Better Recommendations
                </h3>
                <p className="text-gray-600 text-center">
                  Future meal plans feature more foods you actually want to eat, personalized to your unique tastes.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Credibility */}
          <div className="mt-16 max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Powered by Advanced Technology
              </h3>
              <p className="text-gray-600">
                Enterprise-grade AI that adapts to your preferences
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-orange-50 rounded-xl">
                <div className="text-3xl mb-2">🔍</div>
                <div className="font-bold text-gray-900 mb-1">Semantic Search</div>
                <div className="text-sm text-gray-600">Vector embeddings find similar meals you'll love</div>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-xl">
                <div className="text-3xl mb-2">⚖️</div>
                <div className="font-bold text-gray-900 mb-1">Weighted Scoring</div>
                <div className="text-sm text-gray-600">Balances similarity, ratings, and recency</div>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-xl">
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-bold text-gray-900 mb-1">Context-Aware</div>
                <div className="text-sm text-gray-600">Adapts to your current training phase</div>
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
          <Link href="/login">
            <button className="px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105">
              Start Free Today
            </button>
          </Link>
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

// Mobile App Carousel Component
const MobileAppCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Your daily nutrition overview at a glance',
      // Replace with your actual screenshot path
      image: '/mobile-screenshots/dashboard.png',
    },
    {
      id: 'meals',
      title: 'Meal Plan',
      description: 'AI-generated meals tailored to your training',
      image: '/mobile-screenshots/meals.png',
    },
    {
      id: 'training',
      title: 'Training',
      description: 'Sync your workouts for optimized nutrition',
      image: '/mobile-screenshots/training.png',
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize dietary needs and restrictions',
      image: '/mobile-screenshots/preferences.png',
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Smartphone className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold text-sm">Coming Soon to iOS</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Take Alimenta Anywhere
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The same powerful AI nutrition planning, now in your pocket. Track meals, adjust training, and generate plans on the go.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          {/* Phone Mockup with Screenshots */}
          <div className="flex justify-center items-center">
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative mx-auto w-[280px] h-[580px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                {/* Screen */}
                <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-900 rounded-b-2xl z-10"></div>
                  
                  {/* Screenshot Container */}
                  <div className="relative w-full h-full">
                    {slides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-500 ${
                          index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        {/* Placeholder for screenshot - replace src with actual screenshots */}
                        <div className="w-full h-full bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
                          <img
                            src={slide.image}
                            alt={`${slide.title} screen`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback placeholder if image doesn't exist
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          {/* Placeholder shown if image fails to load */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-b from-orange-100 to-orange-50 flex-col items-center justify-center text-center p-8 hidden"
                            style={{ display: 'none' }}
                          >
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
                              <Smartphone className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">{slide.title}</p>
                            <p className="text-gray-400 text-xs mt-1">Screenshot coming soon</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reflection/Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-[4rem] blur-2xl -z-10"></div>
            </div>
          </div>

          {/* Slide Info */}
          <div className="text-center mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {slides[currentSlide].title}
            </h3>
            <p className="text-gray-600">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Dot Navigation */}
          <div className="flex justify-center gap-3 mt-6">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 h-3 bg-primary rounded-full'
                    : 'w-3 h-3 bg-gray-300 rounded-full hover:bg-gray-400'
                }`}
                aria-label={`Go to ${slide.title}`}
              />
            ))}
          </div>
        </div>

        {/* App Store Badge Placeholder */}
        <div className="flex justify-center mt-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-100 rounded-xl">
            <div className="text-2xl">🍎</div>
            <div className="text-left">
              <p className="text-xs text-gray-500 font-medium">Coming Soon on</p>
              <p className="text-lg font-bold text-gray-900">App Store</p>
            </div>
          </div>
        </div>
      </div>
    </section>
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