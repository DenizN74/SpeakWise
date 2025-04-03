import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Mic, Square, Play, Loader2, Send } from 'lucide-react';

interface Dialogue {
  id: string;
  speaker: string;
  content: string;
  expected_responses: any;
  order_index: number;
}

export const ScenarioPlayer: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<any>(null);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    fetchScenarioData();
  }, [scenarioId]);

  const fetchScenarioData = async () => {
    try {
      // Fetch scenario details
      const { data: scenarioData, error: scenarioError } = await supabase
        .from('speaking_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

      if (scenarioError) throw scenarioError;
      setScenario(scenarioData);

      // Fetch dialogues
      const { data: dialogueData, error: dialogueError } = await supabase
        .from('scenario_dialogues')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('order_index', { ascending: true });

      if (dialogueError) throw dialogueError;
      setDialogues(dialogueData);
    } catch (error) {
      console.error('Error fetching scenario data:', error);
      toast.error('Failed to load scenario');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmitRecording = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      // Upload audio file
      const fileName = `${user!.id}/${scenarioId}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scenario-recordings')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const audioUrl = `${supabase.storageUrl}/scenario-recordings/${fileName}`;

      // Save recording and get AI analysis
      const { data: recordingData, error: recordingError } = await supabase
        .from('scenario_recordings')
        .insert({
          user_id: user!.id,
          scenario_id: scenarioId,
          dialogue_id: dialogues[currentDialogueIndex].id,
          audio_url: audioUrl
        })
        .select()
        .single();

      if (recordingError) throw recordingError;

      // Move to next dialogue or complete scenario
      if (currentDialogueIndex < dialogues.length - 1) {
        setCurrentDialogueIndex(currentDialogueIndex + 1);
      } else {
        // Complete scenario
        await supabase.from('user_scenario_progress').upsert({
          user_id: user!.id,
          scenario_id: scenarioId,
          completed: true,
          fluency_score: 0.85, // This would come from AI analysis
          grammar_score: 0.9,
          vocabulary_score: 0.8,
          completed_at: new Date().toISOString()
        });

        toast.success('Scenario completed!');
        navigate('/speaking');
      }

      setAudioBlob(null);
    } catch (error) {
      console.error('Error submitting recording:', error);
      toast.error('Failed to submit recording');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!scenario || dialogues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading scenario...</div>
      </div>
    );
  }

  const currentDialogue = dialogues[currentDialogueIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{scenario.title}</h2>
          <p className="mt-2 text-gray-600">{scenario.description}</p>
        </div>

        <div className="space-y-6">
          {/* Dialogue display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  {currentDialogue.speaker === 'system' ? (
                    <div className="w-4 h-4 rounded-full bg-indigo-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-green-600" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {currentDialogue.speaker === 'system' ? 'Assistant' : 'You'}
                </p>
                <p className="mt-1 text-gray-700">{currentDialogue.content}</p>
              </div>
            </div>
          </div>

          {/* Recording controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </button>
            )}

            {audioBlob && !isProcessing && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(audioBlob);
                    const audio = new Audio(url);
                    audio.play();
                  }}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Play
                </button>
                <button
                  onClick={handleSubmitRecording}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Submit
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>
                {currentDialogueIndex + 1} of {dialogues.length}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{
                  width: `${((currentDialogueIndex + 1) / dialogues.length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};