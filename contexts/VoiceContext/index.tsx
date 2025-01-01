// contexts/VoiceContext/index.tsx
"use client";
import { ReactNode, useState, useEffect, useCallback } from 'react';
import { VoiceProvider as HumeVoiceProvider } from "@humeai/voice-react";
import { useSession } from "next-auth/react";
import toast from 'react-hot-toast';
import type { Conversation } from '@prisma/client';
import type { ChatMetadata, JSONMessage } from "hume/api/resources/empathicVoice";

type VoiceContextProps = {
  accessToken: string;
  children: ReactNode;
}

type VoiceClient = {
  sendSessionSettings: (settings: any) => void;
};

export function VoiceContextProvider({ accessToken, children }: VoiceContextProps) {
  const { data: session } = useSession();
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [voiceClient, setVoiceClient] = useState<VoiceClient | null>(null);

  const updateConversationGroupId = useCallback(async (groupId: string) => {
    if (!currentConversation?.id || !session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/conversations/${currentConversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ humeGroupId: groupId })
      });
      
      if (!response.ok) throw new Error('Failed to update conversation group ID');
      const updatedConversation = await response.json();
      setCurrentConversation(updatedConversation);
      localStorage.setItem('lastChatGroupId', groupId);
    } catch (error) {
      console.error('Failed to update conversation group ID:', error);
    }
  }, [currentConversation?.id, session?.user?.id]);

  const fetchActiveConversation = useCallback(async () => {
    if (!session?.user?.id) return null;
    
    try {
      const lastChatGroupId = localStorage.getItem('lastChatGroupId');
      
      const response = await fetch('/api/conversation/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastChatGroupId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const conversation = await response.json();
      setCurrentConversation(conversation);

      if (voiceClient && conversation.humeGroupId) {
        voiceClient.sendSessionSettings({
          type: "session_settings",
          custom_session_id: conversation.humeGroupId,
          variables: {
            conversation_id: conversation.id,
            user_id: session.user.id
          }
        });
      }

      return conversation;
    } catch (error) {
      console.error('Failed to fetch active conversation:', error);
      toast.error('Failed to load conversation');
      return null;
    }
  }, [session?.user?.id, voiceClient]);

  const handleMessage = useCallback((message: JSONMessage) => {
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
  }, [currentConversation, session?.user?.id, updateConversationGroupId]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchActiveConversation();
    }
  }, [session?.user?.id, fetchActiveConversation]);

  useEffect(() => {
    if (currentConversation?.humeGroupId && voiceClient) {
      const settings = {
        type: "session_settings",
        custom_session_id: currentConversation.humeGroupId,
        variables: {
          conversation_id: currentConversation.id,
          user_id: session?.user?.id
        }
      };

      try {
        voiceClient.sendSessionSettings(settings);
      } catch (error) {
        console.error('Failed to send session settings:', error);
        toast.error('Failed to update conversation settings');
      }
    }
  }, [currentConversation?.humeGroupId, currentConversation?.id, session?.user?.id, voiceClient]);

  return (
    <HumeVoiceProvider 
      auth={{ type: "accessToken", value: accessToken }}
      resumedChatGroupId={currentConversation?.humeGroupId}
      configId={process.env.NEXT_PUBLIC_EVI_CONFIG_ID}
      onMessage={handleMessage}
      onError={(error) => {
        console.error('EVI error:', error);
        if (error.type === 'socket_error' && 
            !error.message.includes('Expected "audio_input"') && 
            !error.message.includes('session_settings')) {
          toast.error('Connection error. Please try again.');
        }
      }}
      ref={setVoiceClient}
      clearMessagesOnDisconnect={false}
      messageHistoryLimit={100}
    >
      {children}
    </HumeVoiceProvider>
  );
}