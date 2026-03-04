import React from "react";

const LoadingMessages = () => {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      {/* Incoming message skeleton */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-700" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 bg-gray-700 rounded-md" />
          <div className="h-3 w-48 bg-gray-700 rounded-md" />
        </div>
      </div>

      {/* Outgoing message skeleton */}
      <div className="flex items-start justify-end gap-3">
        <div className="flex flex-col items-end gap-2">
          <div className="h-3 w-28 bg-purple-500/40 rounded-md" />
          <div className="h-3 w-40 bg-purple-500/40 rounded-md" />
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-500/40" />
      </div>

      {/* Incoming again */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-700" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-36 bg-gray-700 rounded-md" />
          <div className="h-3 w-52 bg-gray-700 rounded-md" />
        </div>
      </div>

      {/* Outgoing message skeleton */}
      <div className="flex items-start justify-end gap-3">
        <div className="flex flex-col items-end gap-2">
          <div className="h-3 w-28 bg-purple-500/40 rounded-md" />
          <div className="h-3 w-40 bg-purple-500/40 rounded-md" />
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-500/40" />
      </div>

      {/* Incoming again */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-700" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-36 bg-gray-700 rounded-md" />
          <div className="h-3 w-52 bg-gray-700 rounded-md" />
        </div>
      </div>

      {/* Outgoing message skeleton */}
      <div className="flex items-start justify-end gap-3">
        <div className="flex flex-col items-end gap-2">
          <div className="h-3 w-28 bg-purple-500/40 rounded-md" />
          <div className="h-3 w-40 bg-purple-500/40 rounded-md" />
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-500/40" />
      </div>
    </div>
  );
};

export default LoadingMessages;
