import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Mic, Star, BarChart2, Lock } from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  xp_reward: number;
}

interface UserProgress {
  completed: boolean;
  fluency_score: number;
  grammar_score: number;
  vocabulary_score: number;
}

export const ScenarioList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      // Fetch scenarios
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('speaking_scenarios')
        .select('*')
        .order('created_at', { ascending: true });

      if (scenariosError) throw scenariosError;

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_scenario_progress')
        .select('*')
        .eq('user_id', user!.id);

      if (progressError) throw progressError;

      setScenarios(scenariosData);
      setProgress(
        progressData.reduce((acc, curr) => {
          acc[curr.scenario_id] = curr;
          return acc;
        }, {} as Record<string, UserProgress>)
      );
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isScenarioAvailable = (index: number) => {
    if (index === 0) return true;
    const previousScenario = scenarios[index - 1];
    return previousScenario && progress[previousScenario.id]?.completed;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading scenarios...</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((scenario, index) => {
        const isAvailable = isScenarioAvailable(index);
        const userProgress = progress[scenario.id];

        return (
          <div
            key={scenario.id}
            className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
              isAvailable
                ? 'cursor-pointer hover:shadow-md transition-shadow'
                : 'opacity-75'
            }`}
            onClick={() => isAvailable && navigate(`/speaking/${scenario.id}`)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {scenario.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {scenario.description}
                  </p>
                </div>
                {!isAvailable && (
                  <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center space-x-4 mt-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                    scenario.difficulty_level
                  )}`}
                >
                  {scenario.difficulty_level}
                </span>
                <span className="flex items-center text-yellow-600 text-sm">
                  <Star className="h-4 w-4 mr-1" />
                  {scenario.xp_reward} XP
                </span>
              </div>

              {userProgress && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-indigo-600">
                      <Mic className="h-4 w-4 mr-1" />
                      <span>
                        {Math.round(userProgress.fluency_score * 100)}% Fluency
                      </span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <BarChart2 className="h-4 w-4 mr-1" />
                      <span>
                        {Math.round(
                          ((userProgress.grammar_score +
                            userProgress.vocabulary_score) /
                            2) *
                            100
                        )}
                        % Accuracy
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};