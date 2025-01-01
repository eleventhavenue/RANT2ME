// components/Layout.tsx
"use client"
import { useEffect, useState } from 'react'
import { useSession, signOut } from "next-auth/react"
import SettingsModal from './SettingsModal'
import ProPlanModal from './ProPlanModal'
import ConversationHistory from './ConversationHistory'
import { User2, LogOut, Menu, X } from 'lucide-react'
import type { Conversation } from '@prisma/client'
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
  onConversationSelect?: (conversation: Conversation) => void;
}

export default function Layout({ children, onConversationSelect }: LayoutProps) {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const openProPlanModal = () => {
    const dialog = document.querySelector<HTMLDialogElement>('#pro-plan-modal')
    dialog?.showModal()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <header className="border-b border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
  <div className="relative w-8 h-8">
    <Image 
      src="/rant.svg"
      alt="RANT2ME Logo"
      width={32}
      height={32}
      className="w-8 h-8 animate-logo bg-gradient-to-r from-purple-600 via-orange-500 to-purple-600 [mask-image:url(/rant.svg)] [mask-size:contain]"
      style={{
        filter: 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.5))'
      }}
    />
  </div>
  <div>
              <h1 className="text-2xl font-serif bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                RANT2ME
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your Empathetic AI Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={openProPlanModal}
              className="px-6 py-2 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-all duration-200 hover:scale-105"
            >
              Professional Plan
            </button>

            {session?.user && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const dialog = document.querySelector<HTMLDialogElement>('#settings-modal')
                    dialog?.showModal()
                  }}
                  className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Profile"}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
                
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
      
      <SettingsModal />
      <ProPlanModal />
    </div>
  )
}