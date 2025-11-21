import React, { useState, useEffect } from 'react';
import { Department, JobRole, Shift, ShiftStatus } from '../types';

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (shift: Shift) => void;
  defaultDate?: string;
  defaultDepartment?: Department;
}

const ShiftFormModal: React.FC<ShiftFormModalProps> = ({ isOpen, onClose, onSubmit, defaultDate, defaultDepartment }) => {
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    department: Department.WARD_2A,
    jobRole: JobRole.NURSE,
    hourlyRateBoost: 500,
    date: '',
  });

  useEffect(() => {
    if (isOpen) {
        setNewShift(prev => ({
            ...prev,
            department: defaultDepartment || Department.WARD_2A,
            date: defaultDate || '',
            jobRole: JobRole.NURSE,
            hourlyRateBoost: 500,
            startTime: '',
            endTime: '',
            title: '',
            description: '',
            requirements: ''
        }));
    }
  }, [isOpen, defaultDate, defaultDepartment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shift: Shift = {
      id: Date.now().toString(),
      title: newShift.title || '未設定の業務',
      department: newShift.department || Department.WARD_2A,
      jobRole: newShift.jobRole || JobRole.NURSE,
      date: newShift.date || '',
      startTime: newShift.startTime || '',
      endTime: newShift.endTime || '',
      hourlyRateBoost: newShift.hourlyRateBoost || 0,
      description: newShift.description || '',
      requirements: newShift.requirements || '',
      status: ShiftStatus.OPEN,
      applicantIds: [],
    };
    onSubmit(shift);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-6">新規人材募集の作成</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">業務タイトル</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="例: 2A病棟 入浴リーダー業務"
              value={newShift.title || ''}
              onChange={e => setNewShift({...newShift, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">部署</label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"
                value={newShift.department}
                onChange={e => setNewShift({...newShift, department: e.target.value as Department})}
              >
                {Object.values(Department).filter(d => d !== Department.OTHER).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">職種</label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"
                value={newShift.jobRole}
                onChange={e => setNewShift({...newShift, jobRole: e.target.value as JobRole})}
              >
                  {Object.values(JobRole).filter(r => r !== JobRole.OTHER).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">日付</label>
                <input required type="date" className="w-full px-4 py-2 border rounded-lg outline-none" value={newShift.date || ''} onChange={e => setNewShift({...newShift, date: e.target.value})} />
            </div>
              <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">開始時間</label>
              <input required type="time" className="w-full px-4 py-2 border rounded-lg outline-none" value={newShift.startTime || ''} onChange={e => setNewShift({...newShift, startTime: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">終了時間</label>
              <input required type="time" className="w-full px-4 py-2 border rounded-lg outline-none" value={newShift.endTime || ''} onChange={e => setNewShift({...newShift, endTime: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">時給上乗せ額 (円)</label>
            <input
              type="number"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"
              value={newShift.hourlyRateBoost}
              onChange={e => setNewShift({...newShift, hourlyRateBoost: parseInt(e.target.value)})}
            />
            <p className="text-xs text-slate-500 mt-1">※通常の時給に加算される手当です</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">業務詳細</label>
            <textarea
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none h-24"
              placeholder="具体的な業務内容（病室受け持ち、入浴介助など）、服装、集合場所などを記載してください。"
              value={newShift.description || ''}
              onChange={e => setNewShift({...newShift, description: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md"
            >
              募集を開始する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftFormModal;