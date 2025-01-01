// components/ConversationHistory.tsx
"use client";
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import type { Conversation } from '@prisma/client';

interface ConversationHistoryProps {
  onSelect: (conversation: Conversation) => void;
}

export default function ConversationHistory({ onSelect }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/conversations?status=ACTIVE');
        const data = await res.json();
        setConversations(data.conversations);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (loading) {
    return <div className="col-span-full text-gray-500">Loading conversations...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="col-span-full bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
        <button 
          onClick={() => onSelect(null)}
          className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300"
        >
          <MessageSquare className="w-5 h-5" />
          (New chat)
        </button>
      </div>
    );
  }

  return (
    <>
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation)}
          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
        >
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            @ RANT2ME
          </div>
          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {conversation.title || '(New chat)'}
          </div>
        </button>
      ))}
    </>
  );
}