import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ShiftCard from './components/ShiftCard';
import AdminPanel from './components/AdminPanel';
import PolicyAdvisor from './components/PolicyAdvisor';
import VacancyTimetable from './components/VacancyTimetable';
import WeeklyCalendar from './components/WeeklyCalendar';
import ShiftFormModal from './components/ShiftFormModal';
import Login from './components/Login';
import { Shift, ShiftStatus, UserRole, Department, JobRole, User } from './types';
import { 
  subscribeToShifts, 
  addShiftToFirestore, 
  updateShiftInFirestore, 
  deleteShiftFromFirestore,
  subscribeToUsers,
  checkAndInitializeUsers
} from './services/firebase';

// Utility to manipulate dates
const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];
const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return getFormattedDate(d);
};

const TODAY = getFormattedDate(new Date());

type ViewRange = 'day' | 'week' | '2weeks';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [loginError, setLoginError] = useState('');

  // Data from Firebase
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Dashboard View State
  const [viewRange, setViewRange] = useState<ViewRange>('day');
  const [displayDate, setDisplayDate] = useState(TODAY);
  
  // Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [modalDefaults, setModalDefaults] = useState<{date?: string, dept?: Department}>({});

  // 1. Initialize Firebase Subscriptions
  useEffect(() => {
    const unsubscribeShifts = subscribeToShifts((data) => {
      setShifts(data);
    });
    
    const unsubscribeUsers = subscribeToUsers((data) => {
      setUsers(data);
      // If user list is empty, initialize the 133 demo users
      if (data.length === 0) {
         checkAndInitializeUsers(3, 70, 60);
      }
    });

    return () => {
      unsubscribeShifts();
      unsubscribeUsers();
    };
  }, []);

  const handleLogin = (userId: string, password: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      if (user.password === password) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        setCurrentView(user.role === UserRole.HR_ADMIN ? 'admin_dashboard' : 'dashboard');
        setLoginError('');
      } else {
        setLoginError('パスワードが間違っています');
      }
    } else {
      setLoginError('IDが見つかりません');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleSwitchRole = () => {
    if (!currentUser) return;
    // Only for demo purposes - in real app, re-login is better
    const newRole = currentUser.role === UserRole.HR_ADMIN ? UserRole.EMPLOYEE : UserRole.HR_ADMIN;
    // We don't save this to DB, just local session state
    setCurrentUser({ ...currentUser, role: newRole });
    setCurrentView(newRole === UserRole.HR_ADMIN ? 'admin_dashboard' : 'dashboard');
  };
  
  // We don't allow full reset from client anymore for safety, 
  // but we could implement a sophisticated admin function if needed.
  const handleResetData = () => {
    alert('クラウド運用中はデータリセット機能は無効化されています（管理画面から操作してください）');
  }

  // --- Handlers that talk to Firebase ---

  const handleAddShift = async (newShift: Shift) => {
    await addShiftToFirestore(newShift);
  };

  const handleDeleteShift = async (id: string) => {
    if (window.confirm('本当にこの募集を削除しますか？')) {
        await deleteShiftFromFirestore(id);
    }
  };

  const handleApply = async (id: string) => {
    const shift = shifts.find(s => s.id === id);
    if (!shift || !currentUser) return;
    
    if (shift.applicantIds.includes(currentUser.id)) return;

    const updatedShift = {
        ...shift,
        applicantIds: [...shift.applicantIds, currentUser.id]
    };
    
    await updateShiftInFirestore(updatedShift);
    alert('応募が完了しました！管理者の承認をお待ちください。');
  };

  const handleApproveShift = async (shiftId: string, userId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;

    const updatedShift = {
        ...shift,
        status: ShiftStatus.FILLED,
        assignedUserId: userId
    };

    await updateShiftInFirestore(updatedShift);
  };
  
  const openShiftModal = (dept?: Department, date?: string) => {
      setModalDefaults({
          date: date || displayDate,
          dept: dept
      });
      setIsShiftModalOpen(true);
  };

  // Date Navigation
  const moveDate = (days: number) => {
    setDisplayDate(prev => addDays(prev, days));
  };
  
  const handleDateSelectFromCalendar = (date: string) => {
      setDisplayDate(date);
      setViewRange('day');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} loginError={loginError} />;
  }

  const renderDashboardContent = () => {
    // 1. Determine visible shifts based on View Range and Display Date
    let visibleShifts = shifts;
    let endDate = displayDate;

    if (viewRange === 'day') {
        visibleShifts = shifts.filter(s => s.date === displayDate);
    } else {
        const daysToAdd = viewRange === 'week' ? 7 : 14;
        endDate = addDays(displayDate, daysToAdd - 1);
        visibleShifts = shifts.filter(s => s.date >= displayDate && s.date <= endDate);
        visibleShifts.sort((a, b) => a.date.localeCompare(b.date));
    }

    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {currentView === 'dashboard' ? '病棟業務 募集一覧' : 'マイ・スケジュール'}
            </h2>
            <p className="text-slate-500 mt-1">
               {currentView === 'dashboard' ? '必要なシフトを見つけて応募しましょう。' : 'あなたの予定一覧です。'}
            </p>
          </div>

          {/* View Controls (Only on Dashboard) */}
          {currentView === 'dashboard' && (
             <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                 <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                     <button 
                        onClick={() => setViewRange('day')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewRange === 'day' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                     >
                        1日
                     </button>
                     <button 
                        onClick={() => setViewRange('week')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewRange === 'week' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                     >
                        1週間
                     </button>
                     <button 
                        onClick={() => setViewRange('2weeks')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewRange === '2weeks' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                     >
                        2週間
                     </button>
                 </div>

                 <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => moveDate(viewRange === 'day' ? -1 : -7)} className="p-2 hover:bg-slate-100 rounded-md text-slate-500">
                        ←
                    </button>
                    <input 
                        type="date" 
                        value={displayDate} 
                        onChange={(e) => setDisplayDate(e.target.value)}
                        className="border-none outline-none text-slate-700 font-bold text-sm cursor-pointer bg-transparent"
                    />
                    {viewRange !== 'day' && (
                        <span className="text-xs text-slate-400">〜 {endDate.slice(5)}</span>
                    )}
                    <button onClick={() => moveDate(viewRange === 'day' ? 1 : 7)} className="p-2 hover:bg-slate-100 rounded-md text-slate-500">
                        →
                    </button>
                    <button onClick={() => setDisplayDate(TODAY)} className="ml-2 text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-600">
                        今日
                    </button>
                 </div>
             </div>
          )}
        </div>

        {/* Visualizations */}
        {currentView === 'dashboard' && (
            <>
                {viewRange === 'day' ? (
                    <VacancyTimetable 
                        shifts={shifts} 
                        currentDate={displayDate} 
                        userRole={currentUser?.role}
                        onAddShiftClick={(dept) => openShiftModal(dept)}
                    />
                ) : (
                    <WeeklyCalendar 
                        shifts={shifts}
                        startDate={displayDate}
                        daysToShow={viewRange === 'week' ? 7 : 14}
                        onDateSelect={handleDateSelectFromCalendar}
                        onAddShift={(date, dept) => openShiftModal(dept, date)}
                        userRole={currentUser?.role || UserRole.EMPLOYEE}
                    />
                )}
            </>
        )}

        {/* Shift Cards List */}
        {visibleShifts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">
                該当する期間の募集はありません
            </p>
            {currentUser?.role === UserRole.HR_ADMIN && (
                <button onClick={() => openShiftModal()} className="mt-4 text-blue-600 font-bold hover:underline">
                    新規募集を作成する
                </button>
            )}
          </div>
        ) : (
            <div className="space-y-8">
                {viewRange === 'day' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleShifts.map(shift => (
                            <ShiftCard
                            key={shift.id}
                            shift={shift}
                            userRole={currentUser?.role || UserRole.EMPLOYEE}
                            onApply={handleApply}
                            onDelete={handleDeleteShift}
                            />
                        ))}
                    </div>
                ) : (
                    Array.from(new Set(visibleShifts.map(s => s.date))).map(date => {
                        const dayShifts = visibleShifts.filter(s => s.date === date);
                        return (
                            <div key={date}>
                                <h3 className="text-lg font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                                    <span className="text-blue-600">📅</span> {date}
                                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full ml-2">{dayShifts.length}件</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {dayShifts.map(shift => (
                                        <ShiftCard
                                        key={shift.id}
                                        shift={shift}
                                        userRole={currentUser?.role || UserRole.EMPLOYEE}
                                        onApply={handleApply}
                                        onDelete={handleDeleteShift}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUserRole={currentUser?.role || UserRole.EMPLOYEE}
        switchRole={handleSwitchRole}
        onResetData={handleResetData}
        onLogout={handleLogout}
      />
      <main className="flex-1 ml-0 md:ml-64 transition-all duration-300 ease-in-out pt-16 md:pt-0">
        {/* Mobile Header Spacer or actual header handled inside Sidebar for mobile overlay */}
        
        {currentView === 'policy_advisor' && <PolicyAdvisor />}
        {currentView === 'admin_dashboard' && (
            <AdminPanel 
                shifts={shifts} 
                users={users}
                onDeleteShift={handleDeleteShift} 
                onOpenModal={() => openShiftModal()} 
                onApprove={handleApproveShift}
            />
        )}
        {(currentView === 'dashboard' || currentView === 'myshifts') && renderDashboardContent()}
      </main>
      
      <ShiftFormModal 
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onSubmit={handleAddShift}
        defaultDate={modalDefaults.date}
        defaultDepartment={modalDefaults.dept}
      />
    </div>
  );
};

export default App;