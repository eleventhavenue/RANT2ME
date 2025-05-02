// components/MoodTracker.tsx - Fix UUID and serializable props issues
"use client";
import { useState } from "react";
// Add the missing type for uuid
import { v4 as uuidv4 } from 'uuid';

// Fix the serializable props warning by using a different pattern
type MoodProps = { 
  onClose: () => void;
  onSave: (mood: { rating: number, note: string }) => void;
};

export default function MoodTracker({ onClose, onSave }: MoodProps) {
  const [rating, setRating] = useState(3);
  const [note, setNote] = useState("");

  const saveMood = () => {
    // Save to local and database
    const mood = {
      id: uuidv4(),
      timestamp: Date.now(),
      rating,
      note
    };
    
    // Save to localStorage for immediate display in UI
    const moods = JSON.parse(localStorage.getItem("moods") || "[]");
    moods.push(mood);
    localStorage.setItem("moods", JSON.stringify(moods));
    
    // Save to database via API
    onSave({ rating, note });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">How are you feeling?</h2>
        
        <div className="flex justify-between mb-6">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRating(value)}
              className={`p-4 rounded-full ${
                rating === value 
                  ? "bg-purple-500 text-white" 
                  : "bg-purple-100 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200"
              } transition-colors`}
            >
              {["😢", "😕", "😐", "🙂", "😊"][value - 1]}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about how you're feeling... (optional)"
          className="w-full h-32 p-3 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveMood}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}