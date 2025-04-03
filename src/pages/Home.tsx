import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Languages, Users, Brain, Trophy } from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Languages className="w-12 h-12 text-indigo-600" />,
      title: 'Interactive Learning',
      description: 'Learn through engaging content with audio, video, and interactive exercises',
    },
    {
      icon: <Users className="w-12 h-12 text-indigo-600" />,
      title: 'Community Support',
      description: 'Practice with native speakers and get feedback from the community',
    },
    {
      icon: <Brain className="w-12 h-12 text-indigo-600" />,
      title: 'AI-Powered',
      description: 'Get personalized feedback and practice with our AI language assistant',
    },
    {
      icon: <Trophy className="w-12 h-12 text-indigo-600" />,
      title: 'Achievement System',
      description: 'Track your progress with levels, points, and daily streaks',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Master English with LangLearn</h1>
            <p className="text-xl mb-8">
              Interactive lessons, community support, and AI-powered learning to help you become fluent in English
            </p>
            {!user && (
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose LangLearn?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Learning?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of learners already improving their English with LangLearn
            </p>
            <button
              onClick={() => navigate('/register')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};