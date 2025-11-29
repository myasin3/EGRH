import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/mockDatabase';
import { UserRole, AssignedTask } from '../types';
import { Button } from '../components/ui/Button';
import { CircleCheck, Clock, Plus, User, Download, Play, Send, CheckSquare, MessageSquare, X, AlertCircle } from 'lucide-react';

export const TaskBoard: React.FC = () => {
  const { user, notify, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<AssignedTask[]>(user ? db.getAssignedTasks(user) : []);
  const [users] = useState(db.getUsers());
  const [showForm, setShowForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<AssignedTask | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  
  // Review Modal State
  const [managerRemark, setManagerRemark] = useState('');

  const refreshTasks = () => {
    if (user) setTasks(db.getAssignedTasks(user));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const assignee = users.find(u => u.id === assigneeId);
    if (!assignee) return;

    db.createAssignedTask({
      title,
      description: desc,
      assignedToId: assignee.id,
      assignedToName: assignee.name,
      assignedById: user.id,
      assignedByName: user.name,
      dueDate,
      priority
    });
    
    notify(`Task assigned to ${assignee.name}`);

    setTitle('');
    setDesc('');
    setAssigneeId('');
    setShowForm(false);
    refreshTasks();
  };

  // --- WORKER ACTIONS ---

  const handleAcceptTask = (taskId: string) => {
      db.updateAssignedTaskStatus(taskId, 'IN_PROGRESS');
      notify("Task Accepted. Status: In Progress");
      refreshTasks();
  };

  const handleSubmitForReview = (taskId: string) => {
      db.updateAssignedTaskStatus(taskId, 'UNDER_REVIEW');
      notify("Task Submitted. Sent for Manager Review.");
      refreshTasks();
  };

  // --- MANAGER ACTIONS ---

  const handleApproveTask = () => {
      if (!showReviewModal) return;
      db.updateAssignedTaskStatus(showReviewModal.id, 'DONE', managerRemark);
      notify("Task Approved and Closed.");
      setShowReviewModal(null);
      setManagerRemark('');
      refreshTasks();
  };

  const handleRejectTask = () => {
      if (!showReviewModal) return;
      db.updateAssignedTaskStatus(showReviewModal.id, 'IN_PROGRESS', managerRemark);
      notify("Task Rejected. Sent back to In Progress.");
      setShowReviewModal(null);
      setManagerRemark('');
      refreshTasks();
  };

  const canManage = hasPermission('MANAGE_TASKS');

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
          <p className="text-gray-500 text-sm">
            {canManage ? "Assign and review team tasks" : "Track and complete your assigned work"}
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="ghost" onClick={() => db.exportTasksToCSV()} title="Export Tasks"><Download className="w-4 h-4"/></Button>
            {canManage && (
              <Button onClick={() => setShowForm(!showForm)} className="shadow-md hover:shadow-lg">
                {showForm ? 'Cancel' : 'Assign New Task'}
                {!showForm && <Plus className="w-4 h-4 ml-2" />}
              </Button>
            )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-scale-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Task</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input 
                  type="text" 
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                >
                  <option value="">Select Worker...</option>
                  {users.filter(u => u.role === UserRole.WORKER || u.role === UserRole.TECHNICIAN).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input 
                  type="date" 
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                rows={3}
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Assign Task</Button>
            </div>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4 animate-scale-in">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Review Task: {showReviewModal.title}</h3>
                      <button onClick={() => setShowReviewModal(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5"/>
                      </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                      Completed by <span className="font-bold">{showReviewModal.assignedToName}</span>. Review the work and approve or reject.
                  </p>
                  
                  <textarea 
                      className="w-full p-2 border border-gray-300 rounded mb-4 text-sm"
                      placeholder="Enter remarks/feedback..."
                      rows={3}
                      value={managerRemark}
                      onChange={e => setManagerRemark(e.target.value)}
                  />
                  
                  <div className="flex justify-end space-x-2">
                      <Button variant="danger" onClick={handleRejectTask}>Reject (Redo)</Button>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveTask}>Approve & Close</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
        
        {/* COLUMN 1: NEW TASKS (TODO) */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[400px] flex flex-col min-w-[280px]">
             <h3 className="font-bold text-gray-700 mb-4 flex items-center justify-between uppercase text-xs tracking-wider">
               New Tasks
               <span className="bg-white border border-gray-200 text-gray-600 py-0.5 px-2 rounded-full font-mono">
                 {tasks.filter(t => t.status === 'TODO').length}
               </span>
             </h3>
             <div className="space-y-3 flex-1">
               {tasks.filter(t => t.status === 'TODO').map(task => (
                 <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover-lift group relative">
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                         {task.priority}
                       </span>
                       <span className="text-xs text-gray-400">{task.dueDate}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{task.title}</h4>
                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                    
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <User className="w-3 h-3 mr-1"/> {task.assignedToName}
                        </div>
                        
                        {/* Worker Action: Accept Task */}
                        {(user?.id === task.assignedToId) && (
                            <Button size="sm" onClick={() => handleAcceptTask(task.id)} className="text-xs h-7 px-2">
                                Accept <Play className="w-3 h-3 ml-1"/>
                            </Button>
                        )}
                    </div>
                 </div>
               ))}
             </div>
        </div>

        {/* COLUMN 2: IN PROGRESS */}
        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 min-h-[400px] flex flex-col min-w-[280px]">
             <h3 className="font-bold text-blue-800 mb-4 flex items-center justify-between uppercase text-xs tracking-wider">
               In Progress
               <span className="bg-white border border-blue-200 text-blue-600 py-0.5 px-2 rounded-full font-mono">
                 {tasks.filter(t => t.status === 'IN_PROGRESS').length}
               </span>
             </h3>
             <div className="space-y-3 flex-1">
               {tasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
                 <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 hover-lift relative">
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                         {task.priority}
                       </span>
                       <span className="text-xs text-gray-400">{task.dueDate}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{task.title}</h4>
                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                    
                    {task.managerFeedback && (
                        <div className="mb-3 bg-red-50 text-red-700 text-xs p-2 rounded border border-red-100 italic">
                            Manager Note: "{task.managerFeedback}"
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1 text-blue-500"/> Working...
                        </div>
                        
                        {/* Worker Action: Submit for Review */}
                        {(user?.id === task.assignedToId) && (
                            <Button size="sm" onClick={() => handleSubmitForReview(task.id)} className="text-xs h-7 px-2 bg-blue-600 hover:bg-blue-700">
                                Submit <Send className="w-3 h-3 ml-1"/>
                            </Button>
                        )}
                    </div>
                 </div>
               ))}
             </div>
        </div>

        {/* COLUMN 3: UNDER REVIEW (Manager View) */}
        <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 min-h-[400px] flex flex-col min-w-[280px]">
             <h3 className="font-bold text-amber-800 mb-4 flex items-center justify-between uppercase text-xs tracking-wider">
               Under Review
               <span className="bg-white border border-amber-200 text-amber-600 py-0.5 px-2 rounded-full font-mono">
                 {tasks.filter(t => t.status === 'UNDER_REVIEW').length}
               </span>
             </h3>
             <div className="space-y-3 flex-1">
               {tasks.filter(t => t.status === 'UNDER_REVIEW').map(task => (
                 <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-amber-200 hover-lift relative">
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                         {task.priority}
                       </span>
                       <span className="text-xs text-amber-600 font-bold flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Reviewing</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{task.title}</h4>
                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                    
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <User className="w-3 h-3 mr-1"/> {task.assignedToName}
                        </div>
                        
                        {/* Manager Action: Review Modal */}
                        {canManage ? (
                            <Button size="sm" onClick={() => setShowReviewModal(task)} className="text-xs h-7 px-2 bg-amber-600 hover:bg-amber-700">
                                Review <CheckSquare className="w-3 h-3 ml-1"/>
                            </Button>
                        ) : (
                            <span className="text-xs text-gray-400 italic">Waiting for approval</span>
                        )}
                    </div>
                 </div>
               ))}
             </div>
        </div>

        {/* COLUMN 4: COMPLETED */}
        <div className="bg-green-50/50 rounded-xl p-4 border border-green-100 min-h-[400px] flex flex-col min-w-[280px]">
             <h3 className="font-bold text-green-800 mb-4 flex items-center justify-between uppercase text-xs tracking-wider">
               Completed
               <span className="bg-white border border-green-200 text-green-600 py-0.5 px-2 rounded-full font-mono">
                 {tasks.filter(t => t.status === 'DONE').length}
               </span>
             </h3>
             <div className="space-y-3 flex-1">
               {tasks.filter(t => t.status === 'DONE').map(task => (
                 <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-green-200 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
                         DONE
                       </span>
                       <span className="text-xs text-gray-400">{task.dueDate}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1 line-through text-gray-500">{task.title}</h4>
                    
                    {task.managerFeedback && (
                        <div className="mt-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-100 flex items-start">
                             <MessageSquare className="w-3 h-3 mr-1 mt-0.5 shrink-0"/>
                             <span className="italic">"{task.managerFeedback}"</span>
                        </div>
                    )}
                 </div>
               ))}
             </div>
        </div>

      </div>
    </div>
  );
 };