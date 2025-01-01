// components/ProPlanModal.tsx
"use client";
import { Check } from 'lucide-react';

export default function ProPlanModal() {
  const features = [
    "Unlimited conversations",
    "Priority support",
    "Advanced emotion analytics",
    "Conversation history export",
    "Custom voice settings",
    "API access"
  ];

  const handleClose = () => {
    const dialog = document.querySelector<HTMLDialogElement>('#pro-plan-modal');
    dialog?.close();
  };

  return (
    <dialog
      id="pro-plan-modal"
      className="modal backdrop:bg-black/50 rounded-2xl p-0 bg-white dark:bg-gray-800 shadow-xl border-0 w-full max-w-md mx-4"
    >
      <div className="p-6">
        <h2 className="text-2xl font-serif text-gray-800 dark:text-white mb-2">Professional Plan</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Unlock the full potential of Rant2Me</p>

        <div className="space-y-4 mb-8">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Check className="w-3 h-3 text-purple-600 dark:text-purple-200" />
              </div>
              <span className="text-gray-700 dark:text-gray-200">{feature}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            $9.99<span className="text-lg font-normal text-gray-600 dark:text-gray-300">/month</span>
          </div>
          <button className="w-full py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200">
            Upgrade Now
          </button>
        </div>

        <button
          onClick={handleClose}
          className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
        >
          Maybe Later
        </button>
      </div>
    </dialog>
  );
}