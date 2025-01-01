"use client";
import { useVoice } from "@humeai/voice-react";
import { useEffect, useRef, useState } from "react";
import { ChatMetadata, UserMessage } from "hume/api/resources/empathicVoice";
import LoadingDots from "./LoadingDots";
import type { Message, Conversation } from "@prisma/client";
import toast from 'react-hot-toast';

interface MessagesProps {
  conversation?: Conversation | null;
}

export default function Messages({ conversation }: MessagesProps) {
  const { messages: liveMessages } = useVoice();
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle message updates and scrolling
  useEffect(() => {
    if (liveMessages.length > 0) {
      // Handle chat metadata
      const metadataMsg = liveMessages[0];
      if (metadataMsg.type === 'chat_metadata') {
        const chatMetadata = metadataMsg as ChatMetadata;
        if (chatMetadata.chatGroupId && conversation?.id) {
          // Update the conversation in the database with new group ID if needed
          fetch(
            // FIXED: correct route for updating conversation
            `/api/conversations/${conversation.id}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ humeGroupId: chatMetadata.chatGroupId })
            }
          ).catch(error => {
            console.error('Failed to update conversation group ID:', error);
          });
        }
      }

      // Scroll to bottom whenever new messages arrive
      scrollToBottom();
    }
  }, [liveMessages, conversation?.id]);

  // Load historical messages when conversation changes
  useEffect(() => {
    const loadHistoricalMessages = async () => {
      if (!conversation?.id) return;

      setIsLoading(true);
      try {
        // CHANGED: use backticks & correct route
        const response = await fetch(`/api/conversations/${conversation.id}/messages`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        setHistoricalMessages(data.messages);
        // Scroll to bottom after loading historical messages
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load conversation history');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoricalMessages();
  }, [conversation?.id]);

  // Handle chat metadata and scroll on new messages
  useEffect(() => {
    if (liveMessages.length > 0) {
      const metadataMsg = liveMessages[0];
      if (metadataMsg.type === 'chat_metadata') {
        const chatMetadata = metadataMsg as ChatMetadata;
        if (chatMetadata.chatGroupId) {
          localStorage.setItem('lastChatGroupId', chatMetadata.chatGroupId);
        }
      }
      // Always scroll to bottom for new messages
      scrollToBottom();
    }
  }, [liveMessages]);

  const isTyping =
    liveMessages[liveMessages.length - 1]?.type === 'user_message';

  const renderMessage = (content: string, role: string, emotions?: any, timestamp?: Date) => (
    <div
      className={`p-4 rounded-xl border ${
        role === 'USER'
          ? "bg-purple-50 ml-12 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800"
          : "bg-blue-50 mr-12 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800"
      } transition-all duration-300 animate-[slideIn_0.3s_ease-out]`}
    >
      <div className="font-medium text-gray-700 dark:text-gray-200 mb-2">
        {role === 'USER' ? "You" : "Support Assistant"}
      </div>
      <div className="text-gray-600 dark:text-gray-300">{content}</div>
      {emotions && (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Detected emotions: {
            Object.entries(emotions)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([emotion, score]) =>
                `${emotion} (${(score as number * 100).toFixed(0)}%)`
              )
              .join(", ")
          }
        </div>
      )}
      {timestamp && (
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 overflow-y-auto max-h-[600px] px-4">
      {isLoading ? (
        <div className="flex justify-center p-4">
          <LoadingDots />
        </div>
      ) : (
        <>
          {/* Historical Messages */}
          {historicalMessages.map((msg) => (
            <div key={msg.id}>
              {renderMessage(
                msg.content,
                msg.role,
                msg.emotions,
                msg.createdAt
              )}
            </div>
          ))}

          {/* Live Messages */}
          {liveMessages.map((msg, index) => {
            if (msg.type === "user_message" || msg.type === "assistant_message") {
              const isUserMessage = msg.type === "user_message";
              const emotionScores = isUserMessage 
                ? (msg as UserMessage & { receivedAt: Date })?.models?.prosody?.scores 
                : null;

              return (
                <div key={msg.type + index}>
                  {renderMessage(
                    msg.message.content,
                    isUserMessage ? 'USER' : 'ASSISTANT',
                    emotionScores
                  )}
                </div>
              );
            }
            return null;
          })}
          
          {isTyping && (
            <div className="bg-purple-50 dark:bg-purple-900/20 ml-12 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
              <LoadingDots />
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
