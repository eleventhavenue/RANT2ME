// components/UserGreeting.tsx
'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const greetings = [
  "Welcome back",
  "Great to see you",
  "Hello",
  "Hi there",
  "Good to have you here"
];

export default function UserGreeting() {
  const { data: session } = useSession();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const currentHour = new Date().getHours();
    let timeBasedGreeting = "";

    if (currentHour < 12) {
      timeBasedGreeting = "Good morning";
    } else if (currentHour < 18) {
      timeBasedGreeting = "Good afternoon";
    } else {
      timeBasedGreeting = "Good evening";
    }

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    setGreeting(Math.random() > 0.5 ? timeBasedGreeting : randomGreeting);
  }, []);

  if (!session?.user?.name) return null;

  return (
    <div className="fixed top-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-purple-100 dark:border-purple-900 text-gray-700 dark:text-gray-200">
      <p className="text-sm">
        {greeting}, <span className="font-medium">{session.user.name}</span>!
      </p>
    </div>
  );
}