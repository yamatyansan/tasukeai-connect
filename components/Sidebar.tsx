import React from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUserRole: UserRole;
  switchRole: () => void;
  onResetData?: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentUserRole, switchRole, onResetData, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: '募集中シフト一覧', icon: '📋', role: UserRole.EMPLOYEE },
    { id: 'myshifts', label: 'マイスケジュール', icon: '📅', role: UserRole.EMPLOYEE },
    { id: 'admin_dashboard', label: '【管理者】シフト管理', icon: '⚙️', role: UserRole.HR_ADMIN },
    { id: 'policy_advisor', label: '【管理者】規約作成AI', icon: '🤖', role: UserRole.HR_ADMIN },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-10">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
          <span className="text-blue-400">Tasukeai</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">社内人材活用システム</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
           // Show admin items only if user is admin
           if (item.role === UserRole.HR_ADMIN && currentUserRole !== UserRole.HR_ADMIN) return null;
           
           return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="bg-slate-800 rounded-lg p-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400 mb-1">ログイン中:</p>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-400"></span>
               {currentUserRole === UserRole.HR_ADMIN ? '管理者 (人事)' : '職員 (鈴木)'}
            </p>
          </div>
          <button 
            onClick={onLogout}
            className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-slate-700 rounded-md transition-colors"
            title="ログアウト"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>
        
        <div className="pt-2 border-t border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-2 text-center uppercase tracking-wider">Demo Controls</p>
            <button
            onClick={switchRole}
            className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 rounded border border-slate-600 transition-colors mb-2"
            >
            役割切替 (Admin/User)
            </button>
            {onResetData && (
                <button
                onClick={onResetData}
                className="w-full py-2 px-4 bg-red-900/30 hover:bg-red-900/50 text-xs text-red-300 rounded border border-red-900/30 transition-colors"
                >
                データ初期化
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;