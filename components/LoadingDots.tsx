// components/LoadingDots.tsx
export default function LoadingDots() {
    return (
      <div className="flex space-x-1.5 items-center">
        <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-[bounce_0.9s_infinite]"></div>
        <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-[bounce_0.9s_infinite_0.3s]"></div>
        <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-[bounce_0.9s_infinite_0.6s]"></div>
      </div>
    );
  }