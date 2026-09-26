import React from "react";

export const Loader = ({ fullScreen = false, text = "جاري التحميل..." }) => {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Outer spinning ring */}
        <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
        {/* Center pulse dot */}
        <div className="absolute w-3 h-3 bg-[var(--primary)] rounded-full animate-ping" />
      </div>
      {text && (
        <p className="text-sm font-medium text-[var(--muted-foreground)] animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return <div className="py-2 flex justify-center">{loaderContent}</div>;
};

export default Loader;
