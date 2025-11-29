
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/mockDatabase';
import { UserRole, MaintenanceTask, MaintenanceStatus, MaintenanceFrequency } from '../types';
import { Button } from '../components/ui/Button';
import { Wrench, Calendar, User as UserIcon, CircleCheck, Clock, TriangleAlert, Repeat, Download, Upload, ExternalLink } from 'lucide-react';

export const Maintenance: React.FC = () => {
  const { user, notify } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>(user ? db.getMaintenanceTasks(user) : []);
  
  // Dynamic Lists (pulled from DB each render to stay in sync with system config)
  const [machines, setMachines] = useState(db.getMachines());
  const [technicians, setTechnicians] = useState(db.getUsers().filter(u => u.role === UserRole.TECHNICIAN));
  
  const [showForm, setShowForm] = useState(false);
  const [reminders, setReminders] = useState<MaintenanceTask[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState<MaintenanceFrequency>('NONE');

  useEffect(() => {
      // Refresh dynamic lists whenever component mounts or tasks update
      setMachines(db.getMachines());
      setTechnicians(db.getUsers().filter(u => u.role === UserRole.TECHNICIAN));
      setReminders(db.getUpcomingMaintenance());
  }, [tasks]);

  const refreshTasks = () => {
    if (user) setTasks(db.getMaintenanceTasks(user));
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const machine = machines.find(m => m.id === selectedMachine);
    const tech = technicians.find(t => t.id === selectedTech);

    if (machine && tech) {
      db.addMaintenanceTask({
        machineId: machine.id,
        machineName: machine.name,
        technicianId: tech.id,
        technicianName: tech.name,
        scheduledDate: scheduleDate,
        notes: notes,
        frequency: frequency
      });
      notify(`Maintenance scheduled for ${machine.name}`);
      setShowForm(false);
      
      // Reset form
      setSelectedMachine('');
      setSelectedTech('');
      setScheduleDate('');
      setNotes('');
      setFrequency('NONE');
      refreshTasks();
    }
  };

  const handleStatusUpdate = (taskId: string, newStatus: MaintenanceStatus) => {
    db.updateMaintenanceStatus(taskId, newStatus);
    notify(`Task status updated to ${newStatus}`);
    refreshTasks();
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) {
                  const added = db.importMaintenanceFromCSV(text);
                  notify(`Imported ${added} maintenance tasks.`);
                  refreshTasks();
              }
          };
          reader.readAsText(file);
      }
  };

  const StatusBadge = ({ status }: { status: MaintenanceStatus }) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1"/> Scheduled</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Wrench className="w-3 h-3 mr-1"/> In Progress</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CircleCheck className="w-3 h-3 mr-1"/> Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machine Maintenance</h1>
          <p className="text-gray-500 text-sm">
            {user?.role === UserRole.ADMIN ? "Schedule and manage facility maintenance" : "Your assigned maintenance tasks"}
          </p>
        </div>
        <div className="flex gap-2">
            {user?.role === UserRole.ADMIN && (
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                 <Button variant="ghost" size="sm" onClick={() => db.exportMaintenanceToCSV()} title="Export Tasks"><Download className="w-4 h-4"/></Button>
                 <Button variant="ghost" size="sm" onClick={() => csvInputRef.current?.click()} title="Import Tasks"><Upload className="w-4 h-4"/></Button>
                 <input type="file" hidden ref={csvInputRef} onChange={handleCSVImport} accept=".csv"/>
              </div>
            )}
            {user?.role === UserRole.ADMIN && (
              <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : 'Schedule Maintenance'}
              </Button>
            )}
        </div>
      </div>

      {/* Reminder Banner for Overdue/Upcoming Tasks */}
      {reminders.length > 0 && user?.role === UserRole.ADMIN && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
              <TriangleAlert className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                  <h3 className="text-sm font-bold text-amber-900">Upcoming Maintenance Alerts</h3>
                  <ul className="mt-1 text-sm text-amber-800 space-y-1">
                      {reminders.map(r => (
                          <li key={r.id}>
                              {r.machineName} - due {r.scheduledDate} ({r.technicianName})
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      )}

      {showForm && user?.role === UserRole.ADMIN && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Task</h3>
          <form onSubmit={handleSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Machine</label>
              <select
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                value={selectedMachine}
                onChange={e => setSelectedMachine(e.target.value)}
              >
                <option value="">-- Select Machine --</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.status})</option>
                ))}
              </select>
              {user.id === 'u1' && (
                  <a href="#/admin/system" className="text-xs text-blue-500 hover:underline flex items-center mt-1">
                      <ExternalLink className="w-3 h-3 mr-1"/> Manage Machines in System Config
                  </a>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technician</label>
              <select
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                value={selectedTech}
                onChange={e => setSelectedTech(e.target.value)}
              >
                <option value="">-- Select Technician --</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {user.id === 'u1' && (
                  <a href="#/admin/system" className="text-xs text-blue-500 hover:underline flex items-center mt-1">
                      <ExternalLink className="w-3 h-3 mr-1"/> Add Technician in System Config
                  </a>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence (Auto-Schedule)</label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                value={frequency}
                onChange={e => setFrequency(e.target.value as MaintenanceFrequency)}
              >
                  <option value="NONE">One-time Only</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Select recurrence for annual checks.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                placeholder="Details about the issue..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Confirm Schedule</Button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="grid grid-cols-1 gap-4">
        {tasks.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
            <CircleCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No maintenance tasks found.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{task.machineName}</h3>
                  <StatusBadge status={task.status} />
                  {task.frequency !== 'NONE' && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100 flex items-center">
                          <Repeat className="w-3 h-3 mr-1" />
                          {task.frequency}
                      </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    {task.scheduledDate}
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-1.5" />
                    {task.technicianName}
                  </div>
                </div>
                {task.notes && (
                   <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-100 inline-block">
                     <span className="font-semibold">Note:</span> {task.notes}
                   </p>
                )}
              </div>

              {/* Technician Actions */}
              {user?.role === UserRole.TECHNICIAN && (
                <div className="flex space-x-2">
                  {task.status === 'SCHEDULED' && (
                    <Button size="sm" onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}>
                      Start Maintenance
                    </Button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(task.id, 'COMPLETED')}>
                      Complete Task
                    </Button>
                  )}
                  {task.status === 'COMPLETED' && (
                     <span className="text-sm text-green-600 font-medium flex items-center">
                       <CircleCheck className="w-4 h-4 mr-1" /> Done
                     </span>
                  )}
                </div>
              )}
              
              {/* Admin Pending Flag */}
              {user?.role === UserRole.ADMIN && task.status !== 'COMPLETED' && (
                  <div className="flex items-center text-yellow-600 text-sm">
                      <TriangleAlert className="w-4 h-4 mr-1" />
                      Pending Action
                  </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
