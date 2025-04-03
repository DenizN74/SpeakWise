import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { Book, CheckCircle, Lock } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ContentRenderer } from '../components/lesson/ContentRenderer';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type LessonModule = Database['public']['Tables']['lesson_modules']['Row'];
type ModuleContent = Database['public']['Tables']['module_contents']['Row'];
type UserProgress = Database['public']['Tables']['user_progress']['Row'];
type QuizResponse = Database['public']['Tables']['quiz_responses']['Row'];
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export const Lessons: React.FC = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile to get language preference
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profileData);

        // Fetch lessons with translations
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select(`
            *,
            translations:lesson_translations(*)
          `)
          .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;

        // Process lessons with translations
        const processedLessons = lessonsData.map((lesson: any) => {
          const translation = lesson.translations?.find(
            (t: any) => t.language_code === profileData.preferred_language
          );

          return {
            ...lesson,
            title: translation?.title || lesson.title,
            description: translation?.description || lesson.description
          };
        });

        setLessons(processedLessons);

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user?.id);

        if (progressError) throw progressError;
        setProgress(progressData);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading lessons...</div>
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

  if (location.pathname === '/lessons') {
    return <LessonsList lessons={lessons} progress={progress} />;
  }

  return (
    <Routes>
      <Route index element={<LessonsList lessons={lessons} progress={progress} />} />
      <Route path=":lessonId" element={<LessonContent userLanguage={userProfile?.preferred_language} />} />
    </Routes>
  );
};

interface LessonsListProps {
  lessons: Lesson[];
  progress: UserProgress[];
}

const LessonsList: React.FC<LessonsListProps> = ({ lessons, progress }) => {
  const navigate = useNavigate();

  const getLessonStatus = (lessonId: string) => {
    const lessonProgress = progress.find(p => p.lesson_id === lessonId);
    return lessonProgress?.completed || false;
  };

  const isLessonAvailable = (index: number) => {
    if (index === 0) return true;
    const previousLesson = lessons[index - 1];
    return previousLesson && getLessonStatus(previousLesson.id);
  };

  const lessonsByLevel = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.level]) {
      acc[lesson.level] = [];
    }
    acc[lesson.level].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
        <p className="mt-2 text-gray-600">
          Start your learning journey with our structured lessons
        </p>
      </div>

      {Object.entries(lessonsByLevel).map(([level, levelLessons]) => (
        <div key={level} className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 capitalize">
            {level} Level
          </h2>
          <div className="space-y-4">
            {levelLessons.map((lesson, index) => {
              const isCompleted = getLessonStatus(lesson.id);
              const isAvailable = isLessonAvailable(index);

              return (
                <div
                  key={lesson.id}
                  className={`bg-white rounded-lg shadow-sm border ${
                    isAvailable
                      ? 'hover:shadow-md cursor-pointer'
                      : 'opacity-75 cursor-not-allowed'
                  }`}
                  onClick={() => isAvailable && navigate(`/lessons/${lesson.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-3 rounded-full ${
                            isCompleted
                              ? 'bg-green-50'
                              : isAvailable
                              ? 'bg-blue-50'
                              : 'bg-gray-50'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          ) : isAvailable ? (
                            <Book className="h-6 w-6 text-blue-500" />
                          ) : (
                            <Lock className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {lesson.title}
                          </h3>
                          <p className="text-sm text-gray-500">{lesson.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

interface LessonContentProps {
  userLanguage?: string;
}

const LessonContent: React.FC<LessonContentProps> = ({ userLanguage = 'en' }) => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [contents, setContents] = useState<ModuleContent[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLessonContent = async () => {
      try {
        // Fetch lesson with translation
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select(`
            *,
            translations:lesson_translations(*)
          `)
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;

        // Apply translation if available
        const translation = lessonData.translations?.find(
          (t: any) => t.language_code === userLanguage
        );
        
        setLesson({
          ...lessonData,
          title: translation?.title || lessonData.title,
          description: translation?.description || lessonData.description
        });

        // Fetch modules with translations
        const { data: modulesData, error: modulesError } = await supabase
          .from('lesson_modules')
          .select(`
            *,
            translations:module_translations(*)
          `)
          .eq('lesson_id', lessonId)
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        // Process modules with translations
        const processedModules = modulesData.map((module: any) => {
          const translation = module.translations?.find(
            (t: any) => t.language_code === userLanguage
          );

          return {
            ...module,
            title: translation?.title || module.title,
            description: translation?.description || module.description
          };
        });

        setModules(processedModules);

        if (modulesData.length > 0) {
          // Fetch contents with translations
          const { data: contentsData, error: contentsError } = await supabase
            .from('module_contents')
            .select(`
              *,
              translations:content_translations(*)
            `)
            .eq('module_id', modulesData[0].id)
            .order('order_index', { ascending: true });

          if (contentsError) throw contentsError;

          // Process contents with translations
          const processedContents = contentsData.map((content: any) => {
            const translation = content.translations?.find(
              (t: any) => t.language_code === userLanguage
            );

            return {
              ...content,
              content: translation?.content || content.content
            };
          });

          setContents(processedContents);
        }
      } catch (err) {
        console.error('Error fetching lesson content:', err);
        setError('Failed to load lesson content');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchLessonContent();
    }
  }, [lessonId, userLanguage]);

  const handleQuizSubmit = async (answers: any) => {
    if (!user || !contents[currentContentIndex]) return;

    try {
      const content = contents[currentContentIndex];
      const quiz = content.content as {
        questions: { id: string; correctAnswer: number }[];
      };

      // Calculate score
      let score = 0;
      quiz.questions.forEach((question) => {
        if (answers[question.id] === question.correctAnswer) {
          score++;
        }
      });

      // Save quiz response
      const { error: responseError } = await supabase.from('quiz_responses').insert({
        user_id: user.id,
        content_id: content.id,
        answers,
        score,
      });

      if (responseError) throw responseError;

      // If this is the last content in the last module, mark the lesson as completed
      if (
        currentModuleIndex === modules.length - 1 &&
        currentContentIndex === contents.length - 1
      ) {
        const { error: progressError } = await supabase.from('user_progress').upsert({
          user_id: user.id,
          lesson_id: lessonId!,
          completed: true,
          score,
        });

        if (progressError) throw progressError;
        navigate('/lessons');
      } else {
        // Move to next content
        handleNext();
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz');
    }
  };

  const handleNext = async () => {
    if (currentContentIndex < contents.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    } else if (currentModuleIndex < modules.length - 1) {
      // Load next module's contents
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentContentIndex(0);
      try {
        const { data, error } = await supabase
          .from('module_contents')
          .select(`
            *,
            translations:content_translations(*)
          `)
          .eq('module_id', modules[currentModuleIndex + 1].id)
          .order('order_index', { ascending: true });

        if (error) throw error;

        // Process contents with translations
        const processedContents = data.map((content: any) => {
          const translation = content.translations?.find(
            (t: any) => t.language_code === userLanguage
          );

          return {
            ...content,
            content: translation?.content || content.content
          };
        });

        setContents(processedContents);
      } catch (err) {
        console.error('Error loading next module:', err);
        setError('Failed to load next module');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading lesson content...</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error || 'Lesson not found'}</div>
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];
  const currentContent = contents[currentContentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/lessons')}
          className="text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Lessons
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
        <p className="mt-2 text-gray-600">{lesson.description}</p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentModule?.title}
          </h2>
          <span className="text-sm text-gray-500">
            Module {currentModuleIndex + 1} of {modules.length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all"
            style={{
              width: `${
                ((currentModuleIndex * contents.length + currentContentIndex + 1) /
                  (modules.length * contents.length)) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Content renderer */}
      {currentContent && (
        <ContentRenderer
          content={currentContent}
          onQuizSubmit={currentContent.type === 'quiz' ? handleQuizSubmit : undefined}
        />
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => {
            if (currentContentIndex > 0) {
              setCurrentContentIndex(currentContentIndex - 1);
            } else if (currentModuleIndex > 0) {
              setCurrentModuleIndex(currentModuleIndex - 1);
              setCurrentContentIndex(contents.length - 1);
            }
          }}
          disabled={currentModuleIndex === 0 && currentContentIndex === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Previous
        </button>
        {currentContent?.type !== 'quiz' && (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};