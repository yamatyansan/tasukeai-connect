import React, { useState } from 'react';
import { User, Department, UserRole } from '../types';
import { updateUserInFirestore, deleteUserFromFirestore } from '../services/firebase';

interface UserManagementProps {
  users: User[];
}

const UserManagement: React.FC<UserManagementProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.includes(searchTerm) || 
    u.id.includes(searchTerm) || 
    u.department.includes(searchTerm)
  );

  const handleUpdate = async () => {
    if (!editingUser) return;
    
    const updatedData = { ...editingUser };
    if (newPassword) {
        updatedData.password = newPassword;
    }

    try {
        await updateUserInFirestore(updatedData);
        setEditingUser(null);
        setNewPassword('');
        alert('ユーザー情報を更新しました。');
    } catch (error) {
        alert('更新に失敗しました。');
        console.error(error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">職員管理マスター</h2>
          <p className="text-slate-500 text-sm mt-1">登録職員数: {users.length}名</p>
        </div>
        
        <div className="w-full md:w-auto relative">
            <input 
                type="text" 
                placeholder="ID、名前、病棟で検索..." 
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3">職員ID</th>
                        <th className="px-6 py-3">氏名</th>
                        <th className="px-6 py-3">所属部署</th>
                        <th className="px-6 py-3">権限</th>
                        <th className="px-6 py-3">パスワード</th>
                        <th className="px-6 py-3">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4 font-mono font-medium text-slate-900">{user.id}</td>
                            <td className="px-6 py-4 font-bold">{user.name}</td>
                            <td className="px-6 py-4">
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs">{user.department}</span>
                            </td>
                            <td className="px-6 py-4">
                                {user.role === UserRole.HR_ADMIN ? (
                                    <span className="text-purple-600 font-bold text-xs">管理者</span>
                                ) : (
                                    <span className="text-slate-500 text-xs">一般</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">
                                {user.password ? '********' : '未設定'}
                            </td>
                            <td className="px-6 py-4">
                                <button 
                                    onClick={() => { setEditingUser(user); setNewPassword(''); }}
                                    className="text-blue-600 hover:underline mr-3"
                                >
                                    編集
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                該当する職員が見つかりません
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-slate-800 mb-4">職員情報の編集: {editingUser.name}</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">氏名</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded p-2"
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属</label>
                        <select 
                            className="w-full border border-slate-300 rounded p-2"
                            value={editingUser.department}
                            onChange={(e) => setEditingUser({...editingUser, department: e.target.value as Department})}
                        >
                            {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">パスワード変更（変更する場合のみ入力）</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded p-2 bg-yellow-50"
                            placeholder="新しいパスワード"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button 
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded text-sm"
                    >
                        キャンセル
                    </button>
                    <button 
                        onClick={handleUpdate}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
                    >
                        保存する
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;