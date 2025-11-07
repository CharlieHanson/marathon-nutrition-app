// src/components/onboarding/WelcomeStep.js
import React from 'react';
import { Utensils, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';

export const WelcomeStep = ({ onNext }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="text-center mb-8">
          <img src="/alimenta_logo.png" alt="Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Alimenta!
          </h1>
          <p className="text-gray-600">
            Let's personalize your nutrition experience in just 3 quick steps
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Utensils className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                AI-Powered Meal Plans
              </h3>
              <p className="text-gray-600 text-sm">
                Get personalized weekly meal plans tailored to your training and preferences
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Training-Adaptive Nutrition
              </h3>
              <p className="text-gray-600 text-sm">
                Meals that adapt to your workout intensity and training schedule
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Track Your Progress
              </h3>
              <p className="text-gray-600 text-sm">
                Rate meals and let our AI learn what you love
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onNext} className="w-full" size="lg">
          Get Started
        </Button>
      </Card>
    </div>
  );
};