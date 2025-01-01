//components/MoodTracker

"use client";
import { useState } from "react";
import { Mood } from "@/types/mood";

export default function MoodTracker({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState(3);
  const [note, setNote] = useState("");

  const saveMood = () => {
    const mood: Mood = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      rating,
      note
    };
    
    const moods = JSON.parse(localStorage.getItem("moods") || "[]");
    moods.push(mood);
    localStorage.setItem("moods", JSON.stringify(moods));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold mb-4">How are you feeling?</h2>
        
        <div className="flex justify-between mb-6">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRating(value)}
              className={`p-4 rounded-full ${
                rating === value ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {["😢", "😕", "😐", "🙂", "😊"][value - 1]}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about how you're feeling... (optional)"
          className="w-full h-32 p-3 border rounded-lg mb-4 bg-input text-foreground"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:bg-secondary rounded"
          >
            Cancel
          </button>
          <button
            onClick={saveMood}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

