// components/LoadingIndicator.tsx
export const LoadingIndicator = () => (
    <div className="flex items-center justify-center space-x-2 animate-pulse">
      <div className="w-2 h-2 bg-purple-600 rounded-full" />
      <div className="w-2 h-2 bg-purple-600 rounded-full animation-delay-200" />
      <div className="w-2 h-2 bg-purple-600 rounded-full animation-delay-400" />
    </div>
  );