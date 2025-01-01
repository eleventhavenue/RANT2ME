// components/SettingsModal.tsx
"use client";
import { Moon, Sun, Volume2, Mic, Globe, Bell, Shield, RefreshCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

export interface SettingsState {
  isDark: boolean;
  volume: number;
  microphoneSensitivity: number;
  language: string;
  notifications: boolean;
  autoConnect: boolean;
  privacyMode: boolean;
}
export default function SettingsModal() {
  const [settings, setSettings] = useState<SettingsState>({
    isDark: false,
    volume: 100,
    microphoneSensitivity: 75,
    language: 'en',
    notifications: true,
    autoConnect: false,
    privacyMode: false,
  });
  
  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('rant2me-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setSettings(prev => ({ ...prev, isDark: true }));
    }
  }, []);

  const updateSettings = (updates: Partial<SettingsState>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem('rant2me-settings', JSON.stringify(newSettings));
      return newSettings;
    });

    // Apply settings
    if ('isDark' in updates) {
      document.documentElement.classList.toggle('dark', updates.isDark);
    }
  };

  const closeModal = () => {
    try {
      const dialog = document.querySelector<HTMLDialogElement>('#settings-modal');
      if (!dialog) {
        throw new Error("Settings modal not found");
      }
      dialog.classList.add('fade-out');
      setTimeout(() => {
        dialog.close();
        dialog.classList.remove('fade-out');
      }, 200);
    } catch (error) {
      console.error("Failed to close settings:", error);
      toast.error("Failed to close settings. Please try again.");
    }
  };

  const handleForgetMe = async () => {
    if (window.confirm('Are you sure you want RANT2ME to forget everything about you? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/user/forget', {
          method: 'POST',
        });
        
        if (response.ok) {
          toast.success('All your conversation history has been deleted');
          // Optionally refresh the page or clear local state
          window.location.reload();
        } else {
          throw new Error('Failed to delete data');
        }
      } catch (error) {
        console.error('Error deleting user data:', error);
        toast.error('Failed to delete data. Please try again.');
      }
    }
  };

  const handleResetConversation = async () => {
    if (window.confirm('Are you sure you want to reset your conversation? This will start a fresh conversation but keep your settings.')) {
      try {
        const response = await fetch('/api/conversation/reset', {
          method: 'POST',
        });
        
        if (response.ok) {
          toast.success('Conversation has been reset');
          window.location.reload();
        } else {
          throw new Error('Failed to reset conversation');
        }
      } catch (error) {
        console.error('Error resetting conversation:', error);
        toast.error('Failed to reset conversation. Please try again.');
      }
    }
  };

  return (
    <dialog
      id="settings-modal"
      className="modal backdrop:bg-black/50 rounded-2xl p-0 bg-white dark:bg-gray-800 shadow-xl border-0 w-full max-w-md mx-4 fade-in"
    >
      <div className="p-6">
        <h2 className="text-2xl font-serif text-gray-800 dark:text-white mb-6">Settings</h2>
        
        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-200">Theme</span>
            <button
              onClick={() => updateSettings({ isDark: !settings.isDark })}
              className="p-2 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-all duration-200"
            >
              {settings.isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-200">Assistant Volume</span>
              <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-200" />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
              className="w-full accent-purple-600 dark:accent-purple-400"
            />
          </div>

          {/* Microphone Sensitivity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-200">Microphone Sensitivity</span>
              <Mic className="w-5 h-5 text-purple-600 dark:text-purple-200" />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.microphoneSensitivity}
              onChange={(e) => updateSettings({ microphoneSensitivity: Number(e.target.value) })}
              className="w-full accent-purple-600 dark:accent-purple-400"
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-200">Language</span>
              <Globe className="w-5 h-5 text-purple-600 dark:text-purple-200" />
            </div>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="w-full p-2 rounded-lg border border-purple-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          {/* Toggle Settings */}
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notifications
              </span>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSettings({ notifications: e.target.checked })}
                className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-200">Auto-connect on start</span>
              <input
                type="checkbox"
                checked={settings.autoConnect}
                onChange={(e) => updateSettings({ autoConnect: e.target.checked })}
                className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Privacy Mode
              </span>
              <input
                type="checkbox"
                checked={settings.privacyMode}
                onChange={(e) => updateSettings({ privacyMode: e.target.checked })}
                className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
            </label>
          </div>
        </div>

        {/* Add Forget Me section at the bottom */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
          <button
            onClick={handleForgetMe}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>Forget everything about me</span>
          </button>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This will delete all your conversation history and preferences. RANT2ME will start fresh with you.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Conversation Control</h3>
        <button
          onClick={handleResetConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          <RefreshCcw className="w-5 h-5" />
          <span>Reset Conversation</span>
        </button>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This will start a fresh conversation while keeping your settings and preferences intact.
        </p>
      </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={closeModal}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}