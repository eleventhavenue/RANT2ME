// components/MoodHistory.tsx
"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Mood } from "@/types/mood";

export default function MoodHistory() {
  const [moods, setMoods] = useState<Mood[]>([]);

  useEffect(() => {
    const savedMoods = JSON.parse(localStorage.getItem("moods") || "[]");
    setMoods(savedMoods);
  }, []);

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
          No mood data yet
        </div>
      )}
    </div>
  );
}