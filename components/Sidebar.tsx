"use client";
import { useState, useEffect } from "react";
import { Mood } from "@/types/mood";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Sidebar() {
  const [moods, setMoods] = useState<Mood[]>([]);

  useEffect(() => {
    const savedMoods = JSON.parse(localStorage.getItem("moods") || "[]");
    setMoods(savedMoods);
  }, []);

  return (
    <div className="bg-background p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Mood History</h2>
      <div className="h-64 mb-6">
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
              stroke="rgb(var(--primary))" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-4">
        {moods.slice().reverse().map((mood) => (
          <div key={mood.id} className="p-3 bg-secondary rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl">
                {["😢", "😕", "😐", "🙂", "😊"][mood.rating - 1]}
              </span>
              <span className="text-sm text-muted-foreground">
                {new Date(mood.timestamp).toLocaleString()}
              </span>
            </div>
            {mood.note && <p className="text-sm text-muted-foreground">{mood.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

