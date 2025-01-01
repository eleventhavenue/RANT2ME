// components/Controls.tsx
"use client";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { Mic, Settings2, Heart, Send, MicOff } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';

export type ControlsProps = {
  onMoodTrack: string;
}

export default function Controls({ onMoodTrack }: ControlsProps) {
  const { connect, readyState, sendUserInput, mute, unmute } = useVoice();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isInitialConnecting, setIsInitialConnecting] = useState(false);

  // Establish initial connection without activating microphone
  const ensureConnection = useCallback(async () => {
    if (readyState !== VoiceReadyState.OPEN && !isInitialConnecting) {
      setIsInitialConnecting(true);
      try {
        await connect();
        await new Promise(resolve => setTimeout(resolve, 1000));
        mute();
        return true;
      } catch (error) {
        console.error("Connection failed:", error);
        toast.error("Could not establish connection. Please try again.");
        return false;
      } finally {
        setIsInitialConnecting(false);
      }
    }
    return true;
  }, [connect, mute, readyState, isInitialConnecting]);

  // Initialize connection on mount
  useEffect(() => {
    ensureConnection();
  }, [ensureConnection]);

  // Handle text message sending
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!message.trim()) return;

    try {
      setIsSending(true);
      
      const isConnected = await ensureConnection();
      if (!isConnected) return;

      await sendUserInput(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle voice mode toggle
  const toggleVoiceMode = async () => {
    try {
      if (voiceModeActive) {
        mute();
        setVoiceModeActive(false);
      } else {
        const isConnected = await ensureConnection();
        if (!isConnected) return;
        
        unmute();
        setVoiceModeActive(true);
      }
    } catch (error) {
      console.error("Voice mode toggle failed:", error);
      toast.error("Failed to toggle voice mode. Please try again.");
      setVoiceModeActive(false);
    }
  };

  // Handle settings dialog
  const handleOpenSettings = useCallback(() => {
    try {
      const dialog = document.querySelector<HTMLDialogElement>('#settings-modal');
      if (!dialog) throw new Error("Settings modal not found");
      dialog.showModal();
    } catch (error) {
      console.error("Failed to open settings:", error);
      toast.error(`Failed to open settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Handle connection state changes
  useEffect(() => {
    if (readyState === VoiceReadyState.CLOSED) {
      setVoiceModeActive(false);
    }
    if (readyState === VoiceReadyState.OPEN && !voiceModeActive) {
      mute();
    }
  }, [readyState, mute, voiceModeActive]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSend} className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isInitialConnecting ? "Connecting..." : "Type your message..."}
          disabled={isSending || isInitialConnecting}
          className="w-full p-4 pr-12 rounded-xl border border-purple-200 focus:border-purple-300 focus:ring focus:ring-purple-100 focus:ring-opacity-50 resize-none bg-white/80 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors duration-200 disabled:opacity-50"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isSending && !isInitialConnecting) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button 
          type="submit"
          disabled={isSending || !message.trim() || isInitialConnecting}
          className="absolute right-2 bottom-2 p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 transition-all duration-200 dark:bg-purple-900 dark:text-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className={`w-5 h-5 ${isSending ? 'opacity-50' : ''}`} />
        </button>
      </form>

      <div className="flex items-center justify-center gap-6 pt-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent(onMoodTrack))}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-purple-100 hover:bg-purple-200 text-purple-600 transition-all duration-200 dark:bg-purple-900 dark:text-purple-200 hover:scale-105"
        >
          <Heart className="w-6 h-6" />
        </button>
        
        <button
          onClick={toggleVoiceMode}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            voiceModeActive 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-purple-600 hover:bg-purple-700"
          } transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 dark:shadow-purple-900/50`}
        >
          {voiceModeActive ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>

        <button 
          onClick={handleOpenSettings}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-purple-100 hover:bg-purple-200 text-purple-600 transition-all duration-200 dark:bg-purple-900 dark:text-purple-200 hover:scale-105"
        >
          <Settings2 className="w-6 h-6" />
        </button>
      </div>

      {isSending && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Sending message...
        </div>
      )}
    </div>
  );
}