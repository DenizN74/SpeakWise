import React from 'react';
import { Database } from '../../types/supabase';

type ModuleContent = Database['public']['Tables']['module_contents']['Row'];

interface ContentRendererProps {
  content: ModuleContent;
  onQuizSubmit?: (answers: any) => Promise<void>;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ content, onQuizSubmit }) => {
  const renderContent = () => {
    switch (content.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            {(content.content as { text: string }).text}
          </div>
        );

      case 'image':
        return (
          <div className="my-4">
            <img
              src={(content.content as { url: string }).url}
              alt={(content.content as { caption: string }).caption}
              className="rounded-lg max-w-full h-auto"
            />
            {(content.content as { caption: string }).caption && (
              <p className="mt-2 text-sm text-gray-500">
                {(content.content as { caption: string }).caption}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="my-4 aspect-w-16 aspect-h-9">
            <iframe
              src={(content.content as { url: string }).url}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        );

      case 'audio':
        return (
          <div className="my-4">
            <audio
              controls
              className="w-full"
              src={(content.content as { url: string }).url}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        );

      case 'quiz':
        return (
          <QuizRenderer
            quiz={content.content as Quiz}
            onSubmit={onQuizSubmit}
          />
        );

      default:
        return <div>Unsupported content type</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {renderContent()}
    </div>
  );
};

interface Quiz {
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

interface QuizRendererProps {
  quiz: Quiz;
  onSubmit?: (answers: any) => Promise<void>;
}

const QuizRenderer: React.FC<QuizRendererProps> = ({ quiz, onSubmit }) => {
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(answers);
      setSubmitted(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {quiz.questions.map((question, index) => (
        <div key={question.id} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            {index + 1}. {question.question}
          </h3>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={optionIndex}
                  onChange={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: optionIndex,
                    }))
                  }
                  disabled={submitted}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {!submitted && (
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit Quiz
        </button>
      )}
    </form>
  );
};