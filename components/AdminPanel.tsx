import React, { useState } from 'react';
import { Shift, ShiftStatus, JobRole, User } from '../types';
import UserManagement from './UserManagement';

interface AdminPanelProps {
  shifts: Shift[];
  users: User[];
  onAddShift?: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
  onOpenModal: () => void;
  onApprove?: (shiftId: string, userId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ shifts, users, onDeleteShift, onOpenModal, onApprove }) => {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [activeTab, setActiveTab] = useState<'shifts' | 'users'>('shifts');

  // Calculations for dashboard
  const openShifts = shifts.filter(s => s.status === ShiftStatus.OPEN).length;
  const filledShifts = shifts.filter(s => s.status === ShiftStatus.FILLED).length;

  const handleApprove = (userId: string) => {
    if (selectedShift && onApprove) {
        onApprove(selectedShift.id, userId);
        setSelectedShift(null);
    }
  };

  // Helper to calculate hours between two times (HH:MM)
  const calculateHours = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    
    // Handle midnight crossing (e.g. 19:00 to 02:00) or 24:00
    if (endMin < startMin) endMin += 24 * 60;
    if (end === '00:00' && sh > 12) endMin += 24 * 60;

    return (endMin - startMin) / 60;
  };

  const handleExportCSV = () => {
    // Header
    const headers = ['シフトID', '日付', '部署', '業務名', '職種', '担当者ID', '担当者名', '開始時間', '終了時間', '実働時間', '手当単価', '手当合計', 'ステータス'];
    
    // Rows
    const rows = shifts.map(shift => {
      const user = users.find(u => u.id === shift.assignedUserId);
      const hours = calculateHours(shift.startTime, shift.endTime);
      const totalAllowance = hours * shift.hourlyRateBoost;
      
      return [
        shift.id,
        shift.date,
        shift.department,
        shift.title,
        shift.jobRole,
        shift.assignedUserId || '',
        user ? user.name : '',
        shift.startTime,
        shift.endTime,
        hours.toFixed(2),
        shift.hourlyRateBoost,
        totalAllowance,
        shift.status === ShiftStatus.FILLED ? '承認済' : '未完了'
      ];
    });

    // Create CSV Content (with BOM for Excel Japanese support)
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tasukeai_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-8 flex gap-8">
                <button 
                    onClick={() => setActiveTab('shifts')}
                    className={`py-4 px-2 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === 'shifts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    シフト管理
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`py-4 px-2 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    職員管理 (130名)
                </button>
            </div>
        </div>

      {activeTab === 'users' ? (
          <UserManagement users={users} />
      ) : (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                <h2 className="text-2xl font-bold text-slate-800">シフト管理ダッシュボード</h2>
                <p className="text-slate-500 text-sm mt-1">病棟ごとの欠員状況(勤務表)から募集を作成・管理します。</p>
                </div>
                <div className="flex gap-3">
                    <button
                    onClick={handleExportCSV}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2 text-sm"
                    >
                    <span>📥</span> 給与連携CSV出力
                    </button>
                    <button
                    onClick={onOpenModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                    >
                    <span>＋</span> 新規募集を作成
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">募集中シフト数</h3>
                <p className="text-3xl font-bold text-blue-600">{openShifts}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">マッチング成立数</h3>
                <p className="text-3xl font-bold text-emerald-600">{filledShifts}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">平均時給上乗せ額</h3>
                <p className="text-3xl font-bold text-slate-700">¥450</p>
                </div>
            </div>

            {/* Shift List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-700 flex justify-between items-center">
                <span>募集案件一覧</span>
                <span className="text-xs font-normal text-slate-400">応募者数欄をクリックして承認を行ってください</span>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th className="px-6 py-3">業務名</th>
                        <th className="px-6 py-3">部署・職種</th>
                        <th className="px-6 py-3">日時</th>
                        <th className="px-6 py-3">手当</th>
                        <th className="px-6 py-3">ステータス</th>
                        <th className="px-6 py-3">応募者確認</th>
                        <th className="px-6 py-3">操作</th>
                    </tr>
                    </thead>
                    <tbody>
                    {shifts.map((shift) => (
                        <tr key={shift.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{shift.title}</td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs">{shift.department}</span>
                                <span className={`px-2 py-1 rounded text-xs text-white ${shift.jobRole === JobRole.NURSE ? 'bg-indigo-500' : 'bg-teal-500'}`}>{shift.jobRole}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                            <div className="font-bold">{shift.date}</div>
                            <div>{shift.startTime}-{shift.endTime}</div>
                        </td>
                        <td className="px-6 py-4 text-blue-600 font-bold">+{shift.hourlyRateBoost}円</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            shift.status === ShiftStatus.OPEN 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                            {shift.status === ShiftStatus.OPEN ? '募集中' : '決定済'}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <button 
                                onClick={() => setSelectedShift(shift)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-xs font-bold ${
                                    shift.applicantIds.length > 0
                                    ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
                                    : 'text-slate-400 cursor-default'
                                }`}
                                disabled={shift.applicantIds.length === 0}
                            >
                                <span>👤 {shift.applicantIds.length}名</span>
                                {shift.applicantIds.length > 0 && <span className="bg-white px-1 rounded-sm shadow-sm">確認</span>}
                            </button>
                        </td>
                        <td className="px-6 py-4">
                            <button onClick={() => onDeleteShift(shift.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">削除</button>
                        </td>
                        </tr>
                    ))}
                    {shifts.length === 0 && (
                        <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">現在募集中のシフトはありません</td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
      )}

      {/* Applicant Selection Modal */}
      {selectedShift && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedShift(null)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">応募者一覧</h3>
                    <p className="text-xs text-slate-500 mt-1">{selectedShift.title} ({selectedShift.date})</p>
                </div>
                <button onClick={() => setSelectedShift(null)} className="text-slate-400 hover:text-slate-600 p-2">
                    ✕
                </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
                {selectedShift.applicantIds.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">応募者はまだいません。</p>
                ) : (
                    <div className="space-y-3">
                        {selectedShift.applicantIds.map(userId => {
                            const user = users.find(u => u.id === userId);
                            const isAssigned = selectedShift.assignedUserId === userId;
                            
                            return (
                                <div key={userId} className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                                    isAssigned 
                                        ? 'bg-green-50 border-green-200 ring-1 ring-green-200' 
                                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                            isAssigned ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {user?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{user?.name || '不明なユーザー'}</p>
                                            <p className="text-xs text-slate-500 flex gap-2">
                                                <span>{user?.department}</span>
                                                <span>•</span>
                                                <span>{user?.role === 'HR_ADMIN' ? '管理者' : '職員'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        {isAssigned ? (
                                            <span className="flex items-center gap-1 text-green-600 font-bold text-sm">
                                                <span>✓</span> 承認済
                                            </span>
                                        ) : (
                                            selectedShift.status === ShiftStatus.OPEN && (
                                                <button
                                                    onClick={() => handleApprove(userId)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                                                >
                                                    承認する
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-slate-50 text-xs text-slate-400 text-center border-t border-slate-100">
                承認すると自動的に他の応募者には通知され、募集が締め切られます。
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;