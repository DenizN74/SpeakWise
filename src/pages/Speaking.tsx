import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ScenarioList } from '../components/speaking/ScenarioList';
import { ScenarioPlayer } from '../components/speaking/ScenarioPlayer';

export const Speaking: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Speaking Practice</h1>
        <p className="mt-2 text-gray-600">
          Practice your English speaking skills with real-life scenarios
        </p>
      </div>

      <Routes>
        <Route index element={<ScenarioList />} />
        <Route path=":scenarioId" element={<ScenarioPlayer />} />
      </Routes>
    </div>
  );
};