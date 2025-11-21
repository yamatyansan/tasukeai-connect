
import React from 'react';
import { Shift, Department, JobRole, UserRole } from '../types';

interface VacancyTimetableProps {
  shifts: Shift[];
  currentDate: string;
  userRole?: UserRole;
  onAddShiftClick?: (dept: Department) => void;
}

// Helper to parse "HH:MM" to decimal hours
const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
};

// Helper to calculate position and width for the timeline bar
// Timeline is now 08:00 to 32:00 (8:00 AM next day)
const getPosition = (startTime: string, endTime: string) => {
  let start = parseTime(startTime);
  let end = parseTime(endTime);

  // Adjust times relative to an 8:00 AM start
  // If time is < 8 (e.g., 00:00 - 07:59), it belongs to the "next day" part of the cycle (24 - 31.99)
  if (start < 8) start += 24;
  
  // If end time is less than start (crossing midnight or next morning boundary), add 24
  if (end < start) end += 24;
  
  // Special case: exact 8:00 end time on a night shift (start >= 12) should be treated as 32:00
  if (end === 8 && start > 12) end = 32;

  const minHour = 8;  // Chart starts at 8:00
  const maxHour = 32; // Chart ends at 32:00 (8:00 next day)
  const totalHours = maxHour - minHour;
  
  const left = ((start - minHour) / totalHours) * 100;
  const width = ((end - start) / totalHours) * 100;
  
  return { left: `${Math.max(0, left)}%`, width: `${Math.min(100, width)}%` };
};

const VacancyTimetable: React.FC<VacancyTimetableProps> = ({ shifts, currentDate, userRole, onAddShiftClick }) => {
  // Specific ward order
  const departments = [Department.WARD_2A, Department.WARD_3A, Department.WARD_3B, Department.WARD_4A];
  
  // Filter shifts strictly for this date string
  const dayShifts = shifts.filter(s => s.date === currentDate);

  // Date processing for visual distinction
  const dateObj = new Date(currentDate);
  const dayIndex = dateObj.getDay(); // 0 = Sun, 6 = Sat
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const dayLabel = days[dayIndex] || '';
  
  const isSaturday = dayIndex === 6;
  const isSunday = dayIndex === 0;
  const isWeekend = isSaturday || isSunday;

  // Dynamic styling based on day type
  let dateBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
  let containerClass = "bg-white";
  
  if (isSaturday) {
    dateBadgeClass = "bg-blue-100 text-blue-800 border-blue-200";
    containerClass = "bg-blue-50/30"; // Subtle blue tint for Saturday
  } else if (isSunday) {
    dateBadgeClass = "bg-red-100 text-red-800 border-red-200";
    containerClass = "bg-red-50/30"; // Subtle red tint for Sunday
  }

  return (
    <div className={`p-6 rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden transition-colors duration-500 ${containerClass}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">📊</span>
            病棟別 勤務募集タイムライン (08:00 - 翌08:00)
          </h3>
          {isWeekend && (
             <p className="text-xs text-amber-600 font-medium mt-1 flex items-center">
                <span className="mr-1">⚠️</span> 
                週末体制 (配置人数が通常と異なります)
             </p>
          )}
        </div>
        
        <div className={`px-4 py-2 rounded-lg border flex flex-col items-center shadow-sm ${dateBadgeClass}`}>
          <span className="text-xs font-bold opacity-70">表示日</span>
          <span className="text-lg font-bold leading-none">
            {currentDate.replace('-', '年').replace('-', '月')}日 ({dayLabel})
          </span>
        </div>
      </div>

      <div className="relative min-w-[1000px] overflow-x-auto pb-4">
        {/* Time Header */}
        <div className="flex border-b border-slate-200 pb-2 mb-2 pl-28 text-[10px] text-slate-400 font-mono relative">
          {Array.from({ length: 25 }).map((_, i) => {
            const hourOffset = i; // 0 to 24
            const actualHour = 8 + hourOffset; // 8, 9, ... 32
            const displayHour = actualHour >= 24 ? actualHour - 24 : actualHour;
            
            const isMajor = hourOffset % 3 === 0; 
            const isMidnight = actualHour === 24;

            return (
              <div key={i} className={`flex-1 text-left border-l border-slate-100 h-4 pl-1 relative ${isMajor || isMidnight ? 'text-slate-600 font-bold' : 'text-transparent'}`}>
                {displayHour}:00
              </div>
            );
          })}
        </div>

        {/* Department Rows */}
        <div className="space-y-4">
          {departments.map(dept => {
            const deptShifts = dayShifts.filter(s => s.department === dept);
            
            return (
              <div key={dept} className="flex items-center h-14 relative group">
                {/* Dept Label & Add Button */}
                <div className="w-28 flex-shrink-0 pr-4 border-r border-slate-100 flex flex-col justify-center h-full z-10 bg-inherit relative">
                  <span className="font-bold text-slate-700 text-sm">{dept}</span>
                  <span className="text-xs text-slate-400 mb-1">
                    {deptShifts.length > 0 ? `${deptShifts.length}件` : '-'}
                  </span>
                  
                  {/* Add Button for Admin */}
                  {userRole === UserRole.HR_ADMIN && onAddShiftClick && (
                    <button 
                      onClick={() => onAddShiftClick(dept)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-blue-200"
                      title={`${dept}に募集を追加`}
                    >
                      +
                    </button>
                  )}
                </div>
                
                {/* Timeline Track */}
                <div className="flex-1 h-10 bg-slate-50 rounded-lg relative border border-slate-100 ml-2 overflow-hidden">
                  {/* Background Grid Lines */}
                   {Array.from({ length: 24 }).map((_, i) => {
                      const currentHour = 8 + i;
                      const isDeepNight = currentHour >= 24;
                      const isSemiNight = currentHour >= 18 && currentHour < 24;
                      let bgClass = '';
                      if (isDeepNight) bgClass = 'bg-indigo-50/60';
                      else if (isSemiNight) bgClass = 'bg-purple-50/60';
                      
                      return (
                        <div 
                            key={i} 
                            className={`absolute top-0 bottom-0 border-r border-slate-100 box-border pointer-events-none ${bgClass}`} 
                            style={{ left: `${(i / 24) * 100}%`, width: `${100/24}%` }}
                        >
                          {currentHour === 8 && <span className="absolute top-1 left-1 text-[9px] text-slate-300">日勤</span>}
                          {currentHour === 18 && <span className="absolute top-1 left-1 text-[9px] text-purple-300">準夜</span>}
                          {currentHour === 24 && <span className="absolute top-1 left-1 text-[9px] text-indigo-300">深夜</span>}
                        </div>
                      )
                    })}

                  {/* Shift Bars */}
                  {deptShifts.map(shift => {
                    const style = getPosition(shift.startTime, shift.endTime);
                    const isNurse = shift.jobRole === JobRole.NURSE;
                    
                    return (
                      <div
                        key={shift.id}
                        className={`absolute top-1 bottom-1 rounded px-2 flex flex-col justify-center text-[10px] leading-tight font-bold text-white shadow-sm overflow-hidden whitespace-nowrap transition-all hover:z-20 hover:scale-105 cursor-pointer hover:shadow-md
                          ${isNurse 
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 border border-indigo-400' 
                            : 'bg-gradient-to-r from-teal-600 to-teal-500 border border-teal-400'}
                        `}
                        style={{ ...style }}
                        title={`${shift.title} (${shift.startTime}-${shift.endTime})`}
                      >
                        <div className="flex justify-between opacity-90 items-center">
                           <span>{isNurse ? 'Ns' : 'As'}</span>
                        </div>
                        <div className="truncate">{shift.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex gap-6 text-xs text-slate-600 justify-end border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-white border border-slate-200 rounded"></span>
                <span className="font-medium">日勤帯 (8-18時)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-purple-50/60 border border-slate-200 rounded"></span>
                <span className="font-medium">準夜帯 (18-24時)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-indigo-50/60 border border-slate-200 rounded"></span>
                <span className="font-medium">深夜帯 (0-8時)</span>
            </div>
            <div className="border-l border-slate-300 h-4 mx-2"></div>
             {userRole === UserRole.HR_ADMIN && (
               <div className="flex items-center gap-2 text-blue-600">
                 <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px]">+</span>
                 <span className="font-medium">募集追加</span>
               </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default VacancyTimetable;import React from 'react';
import { Shift, Department, JobRole, UserRole } from '../types';

interface VacancyTimetableProps {
  shifts: Shift[];
  currentDate: string;
  userRole?: UserRole;
  onAddShiftClick?: (dept: Department) => void;
}

// Helper to parse "HH:MM" to decimal hours
const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
};

// Helper to calculate position and width for the timeline bar
// Timeline is now 08:00 to 32:00 (8:00 AM next day)
const getPosition = (startTime: string, endTime: string) => {
  let start = parseTime(startTime);
  let end = parseTime(endTime);

  // Adjust times relative to an 8:00 AM start
  // If time is < 8 (e.g., 00:00 - 07:59), it belongs to the "next day" part of the cycle (24 - 31.99)
  if (start < 8) start += 24;
  
  // If end time is less than start (crossing midnight or next morning boundary), add 24
  if (end < start) end += 24;
  
  // Special case: exact 8:00 end time on a night shift (start >= 12) should be treated as 32:00
  if (end === 8 && start > 12) end = 32;

  const minHour = 8;  // Chart starts at 8:00
  const maxHour = 32; // Chart ends at 32:00 (8:00 next day)
  const totalHours = maxHour - minHour;
  
  const left = ((start - minHour) / totalHours) * 100;
  const width = ((end - start) / totalHours) * 100;
  
  return { left: `${Math.max(0, left)}%`, width: `${Math.min(100, width)}%` };
};

const VacancyTimetable: React.FC<VacancyTimetableProps> = ({ shifts, currentDate, userRole, onAddShiftClick }) => {
  // Specific ward order
  const departments = [Department.WARD_2A, Department.WARD_3A, Department.WARD_3B, Department.WARD_4A];
  
  // Filter shifts strictly for this date string
  const dayShifts = shifts.filter(s => s.date === currentDate);

  // Date processing for visual distinction
  const dateObj = new Date(currentDate);
  const dayIndex = dateObj.getDay(); // 0 = Sun, 6 = Sat
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const dayLabel = days[dayIndex] || '';
  
  const isSaturday = dayIndex === 6;
  const isSunday = dayIndex === 0;
  const isWeekend = isSaturday || isSunday;

  // Dynamic styling based on day type
  let dateBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
  let containerClass = "bg-white";
  
  if (isSaturday) {
    dateBadgeClass = "bg-blue-100 text-blue-800 border-blue-200";
    containerClass = "bg-blue-50/30"; // Subtle blue tint for Saturday
  } else if (isSunday) {
    dateBadgeClass = "bg-red-100 text-red-800 border-red-200";
    containerClass = "bg-red-50/30"; // Subtle red tint for Sunday
  }

  return (
    <div className={`p-6 rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden transition-colors duration-500 ${containerClass}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">📊</span>
            病棟別 勤務募集タイムライン (08:00 - 翌08:00)
          </h3>
          {isWeekend && (
             <p className="text-xs text-amber-600 font-medium mt-1 flex items-center">
                <span className="mr-1">⚠️</span> 
                週末体制 (配置人数が通常と異なります)
             </p>
          )}
        </div>
        
        <div className={`px-4 py-2 rounded-lg border flex flex-col items-center shadow-sm ${dateBadgeClass}`}>
          <span className="text-xs font-bold opacity-70">表示日</span>
          <span className="text-lg font-bold leading-none">
            {currentDate.replace('-', '年').replace('-', '月')}日 ({dayLabel})
          </span>
        </div>
      </div>

      <div className="relative min-w-[1000px] overflow-x-auto pb-4">
        {/* Time Header */}
        <div className="flex border-b border-slate-200 pb-2 mb-2 pl-28 text-[10px] text-slate-400 font-mono relative">
          {Array.from({ length: 25 }).map((_, i) => {
            const hourOffset = i; // 0 to 24
            const actualHour = 8 + hourOffset; // 8, 9, ... 32
            const displayHour = actualHour >= 24 ? actualHour - 24 : actualHour;
            
            const isMajor = hourOffset % 3 === 0; 
            const isMidnight = actualHour === 24;

            return (
              <div key={i} className={`flex-1 text-left border-l border-slate-100 h-4 pl-1 relative ${isMajor || isMidnight ? 'text-slate-600 font-bold' : 'text-transparent'}`}>
                {displayHour}:00
              </div>
            );
          })}
        </div>

        {/* Department Rows */}
        <div className="space-y-4">
          {departments.map(dept => {
            const deptShifts = dayShifts.filter(s => s.department === dept);
            
            return (
              <div key={dept} className="flex items-center h-14 relative group">
                {/* Dept Label & Add Button */}
                <div className="w-28 flex-shrink-0 pr-4 border-r border-slate-100 flex flex-col justify-center h-full z-10 bg-inherit relative">
                  <span className="font-bold text-slate-700 text-sm">{dept}</span>
                  <span className="text-xs text-slate-400 mb-1">
                    {deptShifts.length > 0 ? `${deptShifts.length}件` : '-'}
                  </span>
                  
                  {/* Add Button for Admin */}
                  {userRole === UserRole.HR_ADMIN && onAddShiftClick && (
                    <button 
                      onClick={() => onAddShiftClick(dept)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-blue-200"
                      title={`${dept}に募集を追加`}
                    >
                      +
                    </button>
                  )}
                </div>
                
                {/* Timeline Track */}
                <div className="flex-1 h-10 bg-slate-50 rounded-lg relative border border-slate-100 ml-2 overflow-hidden">
                  {/* Background Grid Lines */}
                   {Array.from({ length: 24 }).map((_, i) => {
                      const currentHour = 8 + i;
                      const isDeepNight = currentHour >= 24;
                      const isSemiNight = currentHour >= 18 && currentHour < 24;
                      let bgClass = '';
                      if (isDeepNight) bgClass = 'bg-indigo-50/60';
                      else if (isSemiNight) bgClass = 'bg-purple-50/60';
                      
                      return (
                        <div 
                            key={i} 
                            className={`absolute top-0 bottom-0 border-r border-slate-100 box-border pointer-events-none ${bgClass}`} 
                            style={{ left: `${(i / 24) * 100}%`, width: `${100/24}%` }}
                        >
                          {currentHour === 8 && <span className="absolute top-1 left-1 text-[9px] text-slate-300">日勤</span>}
                          {currentHour === 18 && <span className="absolute top-1 left-1 text-[9px] text-purple-300">準夜</span>}
                          {currentHour === 24 && <span className="absolute top-1 left-1 text-[9px] text-indigo-300">深夜</span>}
                        </div>
                      )
                    })}

                  {/* Shift Bars */}
                  {deptShifts.map(shift => {
                    const style = getPosition(shift.startTime, shift.endTime);
                    const isNurse = shift.jobRole === JobRole.NURSE;
                    
                    return (
                      <div
                        key={shift.id}
                        className={`absolute top-1 bottom-1 rounded px-2 flex flex-col justify-center text-[10px] leading-tight font-bold text-white shadow-sm overflow-hidden whitespace-nowrap transition-all hover:z-20 hover:scale-105 cursor-pointer hover:shadow-md
                          ${isNurse 
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 border border-indigo-400' 
                            : 'bg-gradient-to-r from-teal-600 to-teal-500 border border-teal-400'}
                        `}
                        style={{ ...style }}
                        title={`${shift.title} (${shift.startTime}-${shift.endTime})`}
                      >
                        <div className="flex justify-between opacity-90 items-center">
                           <span>{isNurse ? 'Ns' : 'As'}</span>
                        </div>
                        <div className="truncate">{shift.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex gap-6 text-xs text-slate-600 justify-end border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-white border border-slate-200 rounded"></span>
                <span className="font-medium">日勤帯 (8-18時)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-purple-50/60 border border-slate-200 rounded"></span>
                <span className="font-medium">準夜帯 (18-24時)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-indigo-50/60 border border-slate-200 rounded"></span>
                <span className="font-medium">深夜帯 (0-8時)</span>
            </div>
            <div className="border-l border-slate-300 h-4 mx-2"></div>
             {userRole === UserRole.HR_ADMIN && (
               <div className="flex items-center gap-2 text-blue-600">
                 <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px]">+</span>
                 <span className="font-medium">募集追加</span>
               </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default VacancyTimetable;