// src/components/layout/Topbar.jsx
'use client';

const Topbar = () => {
  return (
    <header className="min-h-16 min-w-screen bg-primary z-10 flex items-center px-6 justify-between top-0">
      <h1 className="text-lg font-medium text-primary-text hover:bg-actionHover">Welcome Raj 👑</h1>
      <div className="flex items-center gap-4">
        {/* Notification icon, user avatar, etc */}
        <span>🔔</span>
        <span>👤</span>
      </div>
    </header>
  );
};

export default Topbar;