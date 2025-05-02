// contexts/VoiceContext/index.tsx - Fix all TypeScript errors
"use client";
import { ReactNode, useState, useEffect, useCallback } from 'react';
import { VoiceProvider as HumeVoiceProvider } from "@humeai/voice-react";
import { useSession } from "next-auth/react";
import toast from 'react-hot-toast';
import type { Conversation } from '@prisma/client';
// Fix the JSONMessage to JsonMessage
import type { ChatMetadata, JsonMessage } from "hume/api/resources/empathicVoice";

type VoiceContextProps = {
  accessToken: string;
  children: ReactNode;
}

// Define proper type instead of any
type VoiceClient = {
  sendSessionSettings: (settings: VoiceSettings) => void;
};

// Define VoiceSettings type to replace any
interface VoiceSettings {
  type: string;
  custom_session_id?: string;
  variables?: Record<string, unknown>;
}

export function VoiceContextProvider({ accessToken, children }: VoiceContextProps) {
  const { data: session } = useSession();
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [voiceClient, setVoiceClient] = useState<VoiceClient | null>(null);
  const [persistentChatId, setPersistentChatId] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('persistentChatId') : null;
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Update conversation with Hume group ID
  const updateConversationGroupId = useCallback(async (groupId: string) => {
    if (!session?.user?.id) {
      setConnectionError("User session not found");
      return;
    }

    try {
      // Store as persistent chat if none exists
      if (!localStorage.getItem('persistentChatId')) {
        localStorage.setItem('persistentChatId', groupId);
        setPersistentChatId(groupId);
      }

      // Update the existing conversation if we have one
      if (currentConversation?.id) {
        const response = await fetch(`/api/conversations/${currentConversation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ humeGroupId: groupId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || 'Failed to update conversation group ID');
        }
        
        const updatedConversation = await response.json();
        setCurrentConversation(updatedConversation);
        
        // Update user's last active conversation
        await fetch('/api/user/last-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: updatedConversation.id })
        });
      } else {
        // Create a new conversation with the group ID
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ humeGroupId: groupId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || 'Failed to create conversation');
        }
        
        const newConversation = await response.json();
        setCurrentConversation(newConversation);
        
        // Update user's last active conversation
        await fetch('/api/user/last-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: newConversation.id })
        });
      }
    } catch (error) {
      console.error('Failed to update/create conversation:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast.error('Failed to update conversation');
    }
  }, [currentConversation?.id, session?.user?.id]);

  // Fetch active conversation
  const fetchActiveConversation = useCallback(async () => {
    if (!session?.user?.id) return null;
    
    setIsConnecting(true);
    try {
      const response = await fetch('/api/conversation/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lastChatGroupId: persistentChatId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const conversation = await response.json();
      setCurrentConversation(conversation);

      if (voiceClient && conversation.humeGroupId) {
        voiceClient.sendSessionSettings({
          type: "session_settings",
          custom_session_id: conversation.id,
          variables: {
            conversation_id: conversation.id,
            user_id: session.user.id,
            user_name: session.user.name || 'User'
          }
        });
      }

      return conversation;
    } catch (error) {
      console.error('Failed to fetch active conversation:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast.error('Failed to load conversation');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [persistentChatId, session?.user?.id, session?.user?.name, voiceClient]);

  // Reset conversation
  const resetConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      localStorage.removeItem('persistentChatId');
      setPersistentChatId(null);
      
      const response = await fetch('/api/conversation/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to reset conversation');
      }
      
      const newConversation = await response.json();
      setCurrentConversation(newConversation);
      
      // Update user's last active conversation
      if (session?.user?.id) {
        await fetch('/api/user/last-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: newConversation.id })
        });
      }
      
      toast.success('Started a new conversation');
      setConnectionError(null);
    } catch (error) {
      console.error('Failed to reset conversation:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast.error('Failed to reset conversation');
    } finally {
      setIsConnecting(false);
    }
  }, [session?.user?.id]);

  // Handle messages from Hume
  const handleMessage = useCallback((message: JsonMessage) => {
    if (message.type === 'chat_metadata') {
      const metadataMsg = message as ChatMetadata & { receivedAt: Date };
      if (!currentConversation?.humeGroupId) {
        updateConversationGroupId(metadataMsg.chatGroupId);
      }
      return;
    }

    if (!session?.user?.id || !currentConversation) return;
    if (message.type !== 'assistant_message' && message.type !== 'user_message') return;

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: currentConversation.id,
        content: message.message?.content,
        role: message.type === 'assistant_message' ? 'ASSISTANT' : 'USER',
        emotions: message.type === 'user_message' ? message.models?.prosody?.scores : null,
      }),
    }).catch(error => {
      console.error('Failed to save message:', error);
      toast.error('Failed to save message');
    });

    // Update analytics
    fetch('/api/analytics/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: currentConversation.id,
        messageType: message.type === 'assistant_message' ? 'ASSISTANT' : 'USER',
        emotions: message.type === 'user_message' ? message.models?.prosody?.scores : null,
      }),
    }).catch(error => {
      console.error('Failed to update analytics:', error);
    });
  }, [currentConversation, session?.user?.id, updateConversationGroupId]);

  // Handle Hume errors
  const handleError = useCallback((error: Error) => {
    console.error('EVI error:', error);
    if ('type' in error && 
        error.type === 'socket_error' && 
        !error.message.includes('Expected "audio_input"') && 
        !error.message.includes('session_settings')) {
      setConnectionError(error.message || 'Connection error');
      toast.error('Connection error. Please try again.');
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (session?.user?.id && !currentConversation && !isConnecting) {
      fetchActiveConversation();
    }
  }, [session?.user?.id, fetchActiveConversation, currentConversation, isConnecting]);

  // Show error UI if there's a connection error
  if (connectionError) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 my-4">
        <h3 className="font-semibold mb-2">Connection Error</h3>
        <p className="mb-3">{connectionError}</p>
        <div className="flex space-x-2">
          <button 
            onClick={() => fetchActiveConversation()}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md text-red-800 transition-colors"
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Retry Connection'}
          </button>
          <button 
            onClick={() => resetConversation()}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 transition-colors"
            disabled={isConnecting}
          >
            {isConnecting ? 'Resetting...' : 'Reset Conversation'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <HumeVoiceProvider 
      auth={{ type: "accessToken", value: accessToken }}
      resumedChatGroupId={persistentChatId || undefined}
      configId={process.env.NEXT_PUBLIC_EVI_CONFIG_ID}
      onMessage={handleMessage}
      onError={handleError}
      ref={setVoiceClient}
      clearMessagesOnDisconnect={false}
      messageHistoryLimit={100}
      verbose_transcription={true}
    >
      {children}
    </HumeVoiceProvider>
  );
}

export default VoiceContextProvider;