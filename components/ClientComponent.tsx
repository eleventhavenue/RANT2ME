// components/ClientComponent.tsx
"use client";
import { useState } from "react";
import { VoiceContextProvider } from '@/contexts/VoiceContext';
import Layout from "./Layout";
import Messages from "./Messages";
import Controls from "./Controls";
import MoodTracker from "./MoodTracker";
import { useSession } from "next-auth/react";

const MOOD_TRACK_EVENT = 'show-mood-tracker';

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

  return (
    <Layout>
      <VoiceContextProvider accessToken={accessToken}>
        <div className="max-w-3xl mx-auto px-4">
          {/* Header Greeting */}
          <h1 className="text-4xl font-serif mb-12 flex items-center gap-3">
            
            {`${getGreeting()}, ${session?.user?.name?.split(' ')[0] || 'there'}`}
          </h1>

          {/* Main Chat Area */}
          <div className="bg-white/80 backdrop-blur shadow-xl rounded-2xl p-8 mb-8 dark:bg-gray-800/80">
            <h2 className="text-2xl font-serif text-gray-700 dark:text-gray-200 mb-4">
              How are you feeling today?
            </h2>
            <div className="space-y-6">
              <Messages />
              <Controls onMoodTrack={MOOD_TRACK_EVENT} />
            </div>
          </div>
        </div>
        
        {showMoodTracker && (
          <MoodTracker onClose={() => setShowMoodTracker(false)} />
        )}
      </VoiceContextProvider>
    </Layout>
  );
}