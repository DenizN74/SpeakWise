import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Trophy,
  Zap,
  Calendar,
  BookOpen,
  Star,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Database } from '../types/supabase';

type Tables = Database['public']['Tables'];
type UserProfile = Tables['user_profiles']['Row'];
type UserProgress = Tables['user_progress']['Row'] & {
  lessons: Tables['lessons']['Row'] | null;
};
type QuizResponse = Tables['quiz_responses']['Row'];
type PronunciationData = {
  date: string;
  score: number;
};

interface Recommendation {
  id: string;
  reason: {
    title: string;
    description: string;
  };
  confidence_score: number;
}

interface LevelProgress {
  total: number;
  completed: number;
}

interface ProgressByLevel {
  [key: string]: LevelProgress;
}

interface ChartDataPoint {
  level: string;
  completed: number;
  remaining: number;
}

interface QuizPerformanceData {
  name: string;
  value: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);
  const [pronunciationData, setPronunciationData] = useState<PronunciationData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*, lessons(*)')
          .eq('user_id', user.id);

        if (progressError) throw progressError;
        setProgress(progressData);

        // Fetch quiz responses
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (quizError) throw quizError;
        setQuizResponses(quizData || []);

        // Fetch pronunciation assessments
        const { data: pronunciationAssessments, error: pronunciationError } = await supabase
          .from('pronunciation_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (pronunciationError) throw pronunciationError;
        
        const formattedPronunciationData = (pronunciationAssessments || []).map(assessment => ({
          date: new Date(assessment.created_at).toLocaleDateString(),
          score: (assessment.score || 0) * 100
        }));
        setPronunciationData(formattedPronunciationData);

        // Fetch AI recommendations
        try {
          const { data: recommendationsData } = await supabase
            .from('content_recommendations')
            .select('*')
            .eq('user_id', user.id)
            .order('confidence_score', { ascending: false })
            .limit(6);

          setRecommendations(recommendationsData || []);
        } catch (recError) {
          console.error('Error fetching recommendations:', recError);
          setRecommendations([]);
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const completedLessons = progress.filter(p => p.completed).length;
  
  const averageQuizScore = quizResponses.length > 0
    ? quizResponses.reduce((sum, q) => sum + (q.score || 0), 0) / quizResponses.length
    : 0;

  const progressByLevel = progress.reduce<ProgressByLevel>((acc, p) => {
    const level = p.lessons?.level || 'unknown';
    if (!acc[level]) {
      acc[level] = { total: 0, completed: 0 };
    }
    acc[level].total++;
    if (p.completed) {
      acc[level].completed++;
    }
    return acc;
  }, {});

  const progressChartData: ChartDataPoint[] = Object.entries(progressByLevel).map(([level, data]) => ({
    level: level.charAt(0).toUpperCase() + level.slice(1),
    completed: data.completed,
    remaining: data.total - data.completed,
  }));

  const quizPerformanceData: QuizPerformanceData[] = [
    { name: 'Correct', value: Math.round(averageQuizScore * 100) },
    { name: 'Incorrect', value: Math.round((1 - averageQuizScore) * 100) },
  ];

  const COLORS = ['#4F46E5', '#E5E7EB'] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.username}!
            </h1>
            <p className="mt-1 text-gray-600">
              Keep up the great work on your language learning journey
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
              Level: {profile?.level}
            </div>
            <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
              {profile?.xp_points} XP
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={<Trophy className="h-6 w-6 text-yellow-500" />}
          title="Current Level"
          value={profile?.level || 'Beginner'}
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={<Zap className="h-6 w-6 text-purple-500" />}
          title="XP Points"
          value={profile?.xp_points?.toString() || '0'}
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6 text-green-500" />}
          title="Streak Days"
          value={profile?.streak_days?.toString() || '0'}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<BookOpen className="h-6 w-6 text-blue-500" />}
          title="Lessons Completed"
          value={completedLessons.toString()}
          bgColor="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Progress Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Learning Progress
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" stackId="a" fill="#4F46E5" name="Completed" />
                <Bar dataKey="remaining" stackId="a" fill="#E5E7EB" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quiz Performance
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={quizPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {quizPerformanceData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2" />
                <span className="text-sm text-gray-600">Correct ({quizPerformanceData[0].value}%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded-full mr-2" />
                <span className="text-sm text-gray-600">Incorrect ({quizPerformanceData[1].value}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pronunciation Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pronunciation Progress
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pronunciationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recommended for You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {recommendation.reason.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {recommendation.reason.description}
                  </p>
                  <div className="mt-2 flex items-center">
                    <Star
                      className="h-4 w-4 text-yellow-400 mr-1"
                      fill="currentColor"
                    />
                    <span className="text-sm text-gray-600">
                      {Math.round(recommendation.confidence_score * 100)}% match
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, bgColor }) => (
  <div className={`${bgColor} rounded-lg shadow p-5`}>
    <div className="flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-5">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  </div>
);