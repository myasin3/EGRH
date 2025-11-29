




import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/mockDatabase';
import { Button } from '../components/ui/Button';
import { Fingerprint, Clock, UserCheck, UserX, RefreshCw, Upload, Download, Calendar as CalendarIcon, FileSpreadsheet, Plus, X } from 'lucide-react';
import { AttendanceRecord } from '../types';

export const Attendance: React.FC = () => {
  const { user, hasPermission, notify } = useAuth();
  const [users] = useState(db.getUsers());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [simulating, setSimulating] = useState(false);
  
  // View Modes
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');

  // Manual Entry State
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [manualStatus, setManualStatus] = useState<'PRESENT'|'ABSENT'|'LATE'|'LEAVE'>('PRESENT');
  const [manualTime, setManualTime] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
  }, [selectedDate]);

  const refreshData = () => {
      setAttendance(db.getAttendanceByDate(selectedDate));
  };

  if (!hasPermission('VIEW_ATTENDANCE')) {
      return <div className="p-10 text-center text-gray-500">Access Denied</div>;
  }

  const simulateBioMetricSync = () => {
      setSimulating(true);
      setTimeout(() => {
          // Mock logic: randomly mark 80% of users as present for the selected date
          const newRecords: AttendanceRecord[] = users.map(u => {
              const isPresent = Math.random() > 0.1;
              const isLate = Math.random() > 0.8;
              const randomHour = 8 + Math.floor(Math.random() * 2);
              const randomMin = Math.floor(Math.random() * 60);
              const timeString = `${randomHour.toString().padStart(2, '0')}:${randomMin.toString().padStart(2, '0')}`;

              return {
                  id: Math.random().toString(36).substr(2, 9),
                  userId: u.id,
                  userName: u.name,
                  date: selectedDate,
                  inTime: isPresent ? timeString : null,
                  status: isPresent ? (isLate ? 'LATE' : 'PRESENT') : 'ABSENT',
                  source: 'BIOMETRIC'
              };
          });
          db.saveAttendance(newRecords);
          refreshData();
          setSimulating(false);
          notify(`Synced ${newRecords.length} records for ${selectedDate}`);
      }, 1500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const u = users.find(x => x.id === manualUserId);
      if(!u) return;

      db.addSingleAttendance({
          id: '', // generated in DB
          userId: u.id,
          userName: u.name,
          date: selectedDate,
          inTime: manualTime || null,
          status: manualStatus,
          source: 'MANUAL',
          remarks: 'Manual Adjustment'
      });
      notify("Attendance record updated");
      refreshData();
      setShowManualForm(false);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) {
                  const added = db.importAttendanceFromCSV(text);
                  notify(`Imported ${added} attendance records.`);
                  refreshData();
              }
          };
          reader.readAsText(file);
      }
  };

  // --- CALENDAR LOGIC ---
  const renderCalendar = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const allRecords = db.getAllAttendance(); // Get full history for heat map
      
      const days = [];
      for(let i=1; i<=daysInMonth; i++) {
          const dStr = `${currentYear}-${(currentMonth+1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
          const dayRecords = allRecords.filter(r => r.date === dStr);
          const presentCount = dayRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
          const totalStaff = users.length;
          const percentage = totalStaff > 0 ? (presentCount / totalStaff) : 0;
          
          let colorClass = "bg-gray-50";
          if (dayRecords.length > 0) {
              if (percentage > 0.8) colorClass = "bg-green-100 border-green-200 text-green-800";
              else if (percentage > 0.5) colorClass = "bg-yellow-100 border-yellow-200 text-yellow-800";
              else colorClass = "bg-red-50 border-red-100 text-red-800";
          }

          days.push(
              <div 
                key={i} 
                onClick={() => { setSelectedDate(dStr); setViewMode('LIST'); }}
                className={`h-24 border rounded-lg p-2 cursor-pointer transition-all hover:scale-105 ${colorClass} ${selectedDate === dStr ? 'ring-2 ring-indigo-500' : ''}`}
              >
                  <div className="font-bold mb-1">{i}</div>
                  {dayRecords.length > 0 ? (
                      <div className="text-xs space-y-1">
                          <div className="flex items-center"><UserCheck className="w-3 h-3 mr-1"/> {presentCount}</div>
                          <div className="flex items-center text-red-500 opacity-70"><UserX className="w-3 h-3 mr-1"/> {dayRecords.length - presentCount}</div>
                      </div>
                  ) : (
                      <div className="text-[10px] text-gray-400 mt-2">No Data</div>
                  )}
              </div>
          );
      }

      return (
          <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase py-2">{d}</div>
              ))}
              {days}
          </div>
      );
  };

  return (
      <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Fingerprint className="w-6 h-6 mr-2 text-indigo-600"/> Attendance Monitor
              </h1>
              <p className="text-gray-500 text-sm">
                Manage staff presence, shifts, and biometric logs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
                <div className="bg-gray-100 p-0.5 rounded-lg flex items-center">
                     <Button variant="ghost" size="sm" onClick={() => setViewMode('LIST')} className={viewMode === 'LIST' ? 'bg-white shadow-sm text-indigo-600' : ''}>
                         List View
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => setViewMode('CALENDAR')} className={viewMode === 'CALENDAR' ? 'bg-white shadow-sm text-indigo-600' : ''}>
                         Calendar
                     </Button>
                </div>
                
                <input 
                    type="date" 
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />

                <Button variant="ghost" onClick={() => db.exportAttendanceToCSV()} title="Export CSV">
                    <Download className="w-4 h-4"/>
                </Button>
                <Button variant="ghost" onClick={() => fileInputRef.current?.click()} title="Import CSV">
                    <Upload className="w-4 h-4"/>
                </Button>
                <input type="file" hidden ref={fileInputRef} onChange={handleCSVImport} accept=".csv"/>

                <Button onClick={() => setShowManualForm(true)}>
                    <Plus className="w-4 h-4 mr-2"/> Manual Entry
                </Button>

                <Button onClick={simulateBioMetricSync} isLoading={simulating} className="bg-indigo-600 hover:bg-indigo-700">
                    <RefreshCw className={`w-4 h-4 mr-2 ${simulating ? 'animate-spin' : ''}`}/> 
                    Sync
                </Button>
            </div>
          </div>

          {/* Stats Cards (Based on Selected Date) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-xs font-bold text-green-600 uppercase">Present</p>
                  <p className="text-2xl font-bold text-green-700">
                      {attendance.filter(a => a.status === 'PRESENT').length}
                  </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-xs font-bold text-yellow-600 uppercase">Late</p>
                  <p className="text-2xl font-bold text-yellow-700">
                      {attendance.filter(a => a.status === 'LATE').length}
                  </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-xs font-bold text-red-500 uppercase">Absent/Leave</p>
                  <p className="text-2xl font-bold text-red-700">
                      {attendance.length > 0 ? attendance.filter(a => a.status === 'ABSENT' || a.status === 'LEAVE').length : users.length}
                  </p>
              </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden p-6">
              {viewMode === 'CALENDAR' ? (
                  <div>
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                          <CalendarIcon className="w-5 h-5 mr-2 text-indigo-500"/> Monthly Overview
                      </h3>
                      {renderCalendar()}
                  </div>
              ) : (
                  <div>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-gray-700">Attendance Log - {selectedDate}</h3>
                          {attendance.length === 0 && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">No Data Synced</span>
                          )}
                      </div>

                      {attendance.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                            <FileSpreadsheet className="w-12 h-12 mb-3 opacity-20"/>
                            <p>No records for this date.</p>
                            <p className="text-sm">Click "Sync" to fetch from scanner or "Manual Entry" to add records.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                  <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                  </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                  {attendance.map((record) => (
                                      <tr key={record.id} className="hover:bg-gray-50">
                                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{record.userName}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                              {record.inTime ? (
                                                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-gray-400"/> {record.inTime}</span>
                                              ) : '-'}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                              {record.status === 'PRESENT' && <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">Present</span>}
                                              {record.status === 'LATE' && <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">Late</span>}
                                              {record.status === 'ABSENT' && <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">Absent</span>}
                                              {record.status === 'LEAVE' && <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Leave</span>}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 uppercase">
                                              {record.source}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 italic">
                                              {record.remarks || '-'}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                        </div>
                      )}
                  </div>
              )}
          </div>

          {/* Manual Entry Modal */}
          {showManualForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4 animate-fade-in">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Manual Attendance Entry</h3>
                          <button onClick={() => setShowManualForm(false)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-5 h-5"/>
                          </button>
                      </div>
                      <form onSubmit={handleManualSubmit} className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                              <select 
                                required
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
                                value={manualUserId}
                                onChange={e => setManualUserId(e.target.value)}
                              >
                                  <option value="">-- Choose Staff --</option>
                                  {users.map(u => (
                                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select 
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
                                value={manualStatus}
                                onChange={e => setManualStatus(e.target.value as any)}
                              >
                                  <option value="PRESENT">Present</option>
                                  <option value="LATE">Late</option>
                                  <option value="ABSENT">Absent</option>
                                  <option value="LEAVE">On Leave</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                              <input 
                                type="time"
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
                                value={manualTime}
                                onChange={e => setManualTime(e.target.value)}
                              />
                          </div>
                          <Button type="submit" className="w-full">Save Record</Button>
                      </form>
                  </div>
              </div>
          )}
      </div>
  );
};