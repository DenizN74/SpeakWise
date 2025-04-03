import React from 'react';
import { BarChart, Users, BookOpen, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    totalLessons: 0,
    activeUsers: 0,
    completionRate: 0
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users
        const { count: userCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact' });

        // Fetch total lessons
        const { count: lessonCount } = await supabase
          .from('lessons')
          .select('*', { count: 'exact' });

        // Fetch active users (users who logged in within last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: activeCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact' })
          .gte('last_login', sevenDaysAgo.toISOString());

        // Calculate completion rate
        const { data: progress } = await supabase
          .from('user_progress')
          .select('*');

        const totalAttempts = progress?.length || 0;
        const completedLessons = progress?.filter(p => p.completed)?.length || 0;
        const completionRate = totalAttempts > 0
          ? (completedLessons / totalAttempts) * 100
          : 0;

        setStats({
          totalUsers: userCount || 0,
          totalLessons: lessonCount || 0,
          activeUsers: activeCount || 0,
          completionRate: Math.round(completionRate)
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          description="Total registered users"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Lessons"
          value={stats.totalLessons}
          icon={<BookOpen className="h-6 w-6 text-green-600" />}
          description="Available lessons"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={<BarChart className="h-6 w-6 text-purple-600" />}
          description="Active in last 7 days"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={<Award className="h-6 w-6 text-yellow-600" />}
          description="Average lesson completion"
          bgColor="bg-yellow-50"
        />
      </div>

      {/* Additional sections can be added here */}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  bgColor
}) => (
  <div className={`${bgColor} rounded-lg p-6`}>
    <div className="flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-5">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="mt-1">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  </div>
);