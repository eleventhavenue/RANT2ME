// components/MoodHistory.tsx - Fix 'any' types
"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Mood } from "@/types/mood";
import toast from "react-hot-toast";

// Define type for database mood entries
interface DbMoodEntry {
  id: string;
  userId: string;
  rating: number;
  note: string | null;
  createdAt: string;
}

export default function MoodHistory() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMoods = async () => {
      try {
        // Try to get moods from the database first
        const response = await fetch('/api/moods');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const dbMoods = await response.json() as DbMoodEntry[];
        
        // Transform the database moods to match the Mood type
        const transformedDbMoods = dbMoods.map((mood: DbMoodEntry) => ({
          id: mood.id,
          timestamp: new Date(mood.createdAt).getTime(),
          rating: mood.rating,
          note: mood.note || ""
        }));
        
        // Merge with localStorage moods (for any that haven't synced yet)
        const localMoods: Mood[] = JSON.parse(localStorage.getItem("moods") || "[]");
        
        // Combine both sets, removing duplicates (prefer DB versions)
        const combinedMoods = [...transformedDbMoods];
        
        // Add local moods that don't exist in DB (based on timestamp)
        const dbTimestamps = new Set(transformedDbMoods.map(m => m.timestamp));
        for (const localMood of localMoods) {
          if (!dbTimestamps.has(localMood.timestamp)) {
            combinedMoods.push(localMood);
          }
        }
        
        // Sort by timestamp, newest first
        combinedMoods.sort((a, b) => b.timestamp - a.timestamp);
        
        setMoods(combinedMoods);
      } catch (err) {
        console.error("Error fetching moods:", err);
        setError("Failed to load mood history");
        
        // Fallback to localStorage if API fails
        const localMoods = JSON.parse(localStorage.getItem("moods") || "[]");
        setMoods(localMoods);
        
        if (localMoods.length > 0) {
          toast.error("Could not sync with server. Showing local mood data only.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMoods();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur shadow-lg border-0 rounded-2xl p-6">
        <h3 className="text-xl font-serif text-gray-800 mb-4">Mood History</h3>
        <div className="h-48 flex items-center justify-center">
          <p>Loading mood history...</p>
        </div>
      </div>
    );
  }

  if (error && moods.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur shadow-lg border-0 rounded-2xl p-6">
        <h3 className="text-xl font-serif text-gray-800 mb-4">Mood History</h3>
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur shadow-lg border-0 rounded-2xl p-6">
      <h3 className="text-xl font-serif text-gray-800 mb-4">Mood History</h3>
      {moods.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moods}>
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
              />
              <YAxis domain={[1, 5]} />
              <Tooltip
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                formatter={(value) => [`Mood: ${value}`, ""]}
              />
              <Line 
                type="monotone" 
                dataKey="rating" 
                stroke="#6366f1" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
          <p>No mood data yet</p>
        </div>
      )}
    </div>
  );
}