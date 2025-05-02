// components/ClientComponent.tsx
"use client";
import { useState, useEffect } from "react";
import { VoiceContextProvider } from '@/contexts/VoiceContext';
import Layout from "./Layout";
import Messages from "./Messages";
import Controls from "./Controls";
import MoodTracker from "./MoodTracker";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function ClientComponent({
  accessToken,
}: {
  accessToken: string;
}) {
  const { data: session } = useSession();
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  
  // Listen for the mood tracker event
  useEffect(() => {
    const handleMoodTrack = () => setShowMoodTracker(true);
    window.addEventListener('show-mood-tracker', handleMoodTrack);
    return () => window.removeEventListener('show-mood-tracker', handleMoodTrack);
  }, []);

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
        <div className="max-w-md mx-auto mt-8 p-6 bg-white/80 backdrop-blur shadow-lg rounded-2xl border border-red-200">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">Failed to fetch access token. Please check your environment variables and try again.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
        <div className="max-w-md mx-auto mt-8 p-6 bg-white/80 backdrop-blur shadow-lg rounded-2xl">
          <p className="text-center">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <VoiceContextProvider accessToken={accessToken}>
        <div className="max-w-3xl mx-auto px-4">
          {/* Header Greeting */}
          <h1 className="text-4xl font-serif mb-12 flex items-center gap-3">
            {`${getGreeting()}, ${session.user?.name?.split(' ')[0] || 'there'}`}
          </h1>

          {/* Main Chat Area */}
          <div className="bg-white/80 backdrop-blur shadow-xl rounded-2xl p-8 mb-8 dark:bg-gray-800/80">
            <h2 className="text-2xl font-serif text-gray-700 dark:text-gray-200 mb-4">
              How are you feeling today?
            </h2>
            <div className="space-y-6">
              <Messages />
              <Controls onMoodTrack="show-mood-tracker" />
            </div>
          </div>
        </div>
        
        {showMoodTracker && (
          <MoodTracker 
            onClose={() => setShowMoodTracker(false)}
            onSave={(mood) => {
              fetch('/api/moods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mood)
              })
              .then(response => {
                if (!response.ok) throw new Error('Failed to save mood');
                return response.json();
              })
              .then(() => {
                toast.success('Mood saved successfully');
                setShowMoodTracker(false);
              })
              .catch(error => {
                console.error('Error saving mood:', error);
                toast.error('Failed to save your mood');
              });
            }}
          />
        )}
      </VoiceContextProvider>
    </Layout>
  );
}