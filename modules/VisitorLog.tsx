






import React, { useState, useRef } from 'react';
import { db } from '../services/mockDatabase';
import { Visitor } from '../types';
import { Button } from '../components/ui/Button';
import { UserPlus, LogOut, Clock, Search, Download, Upload, Pencil, CalendarDays, Hourglass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const VisitorLog: React.FC = () => {
  const { hasPermission, notify } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>(db.getVisitors());
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // CSV Import Ref
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [purpose, setPurpose] = useState('');
  const [host, setHost] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitInTime, setVisitInTime] = useState('');
  const [visitOutTime, setVisitOutTime] = useState('');
  
  const canManage = hasPermission('MANAGE_VISITORS');
  const canEditRecords = hasPermission('EDIT_RECORDS');

  // Helper: Calculate Duration
  const calculateDuration = (inTime: string, outTime?: string) => {
    if (!inTime || !outTime) return '-';
    
    // Robust parser for "HH:MM AM/PM" or "HH:MM" produced by browsers
    const parse = (t: string) => {
       const d = new Date();
       const normalized = t.replace(/\u202f/g, ' ').trim(); // Handle narrow non-breaking space
       // Match HH:MM and optional AM/PM
       const parts = normalized.match(/(\d+):(\d+)\s*(AM|PM)?/i);
       
       if (parts) {
           let h = parseInt(parts[1], 10);
           const m = parseInt(parts[2], 10);
           const ampm = parts[3];
           
           if (ampm) {
               if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
               if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
           }
           d.setHours(h, m, 0, 0);
           return d;
       }
       return null;
    };

    const start = parse(inTime);
    const end = parse(outTime);

    if (start && end) {
        let diff = end.getTime() - start.getTime();
        // Handle negative diff (crossing midnight, though rare for single day logs)
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        
        if (hrs === 0 && mins === 0) return '< 1m';
        return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m`;
    }
    return '-';
  };

  // Helper: Convert time string to HH:MM for input
  const toInputTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const d = new Date(`2000/01/01 ${timeStr}`);
    if (isNaN(d.getTime())) return timeStr; // fallback
    return d.toTimeString().slice(0, 5);
  };

  // Helper: Format HH:MM from input back to localized string
  const formatTimeDisplay = (time24: string) => {
      if (!time24) return '';
      const [h, m] = time24.split(':');
      const date = new Date();
      date.setHours(parseInt(h), parseInt(m));
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    
    // Process Times
    const formattedInTime = visitInTime ? formatTimeDisplay(visitInTime) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedOutTime = visitOutTime ? formatTimeDisplay(visitOutTime) : undefined;
    const finalDate = visitDate || new Date().toISOString().split('T')[0];

    if (editingId) {
        // Edit Mode
        const v = visitors.find(x => x.id === editingId);
        if (v) {
            db.updateVisitor({
                ...v,
                name,
                contact,
                purpose,
                hostName: host,
                date: finalDate,
                inTime: formattedInTime,
                outTime: formattedOutTime
            });
            notify("Visitor record updated");
        }
        setEditingId(null);
    } else {
        // Create Mode
        db.addVisitor({
            name,
            contact,
            purpose,
            hostName: host,
            date: finalDate,
            inTime: formattedInTime,
            outTime: formattedOutTime
        });
        notify(`Visitor ${name} checked in`);
    }
    
    setVisitors(db.getVisitors());
    setShowForm(false);
    resetForm();
  };
  
  const resetForm = () => {
      setName('');
      setContact('');
      setPurpose('');
      setHost('');
      setVisitDate('');
      setVisitInTime('');
      setVisitOutTime('');
  };

  const handleEdit = (v: Visitor) => {
      setEditingId(v.id);
      setName(v.name);
      setContact(v.contact);
      setPurpose(v.purpose);
      setHost(v.hostName || '');
      setVisitDate(v.date);
      setVisitInTime(toInputTime(v.inTime));
      setVisitOutTime(v.outTime ? toInputTime(v.outTime) : '');
      setShowForm(true);
  };

  const handleCheckOut = (id: string) => {
    if (!canManage) return;
    db.checkoutVisitor(id);
    notify("Visitor checked out");
    setVisitors(db.getVisitors());
  };
  
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) {
                  const added = db.importVisitorsFromCSV(text);
                  notify(`Imported ${added} visitor records.`);
                  setVisitors(db.getVisitors());
              }
          };
          reader.readAsText(file);
      }
  };

  const activeVisitors = visitors.filter(v => !v.outTime);
  const historyVisitors = visitors.filter(v => v.outTime);

  const filteredHistory = historyVisitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Log</h1>
          <p className="text-gray-500 text-sm">Manage plant entry, exit, and visit duration.</p>
        </div>
        <div className="flex gap-2">
            {canManage && (
                <>
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                         <Button variant="ghost" size="sm" onClick={() => db.exportVisitorsToCSV()} title="Export CSV"><Download className="w-4 h-4"/></Button>
                         <Button variant="ghost" size="sm" onClick={() => csvInputRef.current?.click()} title="Import CSV"><Upload className="w-4 h-4"/></Button>
                         <input type="file" hidden ref={csvInputRef} onChange={handleCSVImport} accept=".csv"/>
                    </div>
                    <Button onClick={() => { 
                        setShowForm(!showForm); 
                        if(!showForm) {
                            setEditingId(null); 
                            resetForm();
                        }
                    }}>
                    {showForm ? 'Cancel' : 'Check In Visitor'}
                    {!showForm && <UserPlus className="w-4 h-4 ml-2" />}
                    </Button>
                </>
            )}
            {!canManage && (
                 <Button variant="ghost" onClick={() => db.exportVisitorsToCSV()}><Download className="w-4 h-4 mr-2"/> Export Data</Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Active Visitors & Form */}
        <div className="lg:col-span-1 space-y-6">
           {showForm && canManage && (
             <div className="bg-white p-6 rounded-xl shadow-lg border border-primary-100 animate-fade-in">
               <h3 className="text-lg font-bold text-gray-900 mb-4">{editingId ? 'Edit Visitor Record' : 'New Visitor Check-in'}</h3>
               <form onSubmit={handleCheckIn} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Visitor Name</label>
                   <input required type="text" className="w-full mt-1 p-2 border rounded-md" value={name} onChange={e => setName(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Contact / ID</label>
                   <input required type="text" className="w-full mt-1 p-2 border rounded-md" value={contact} onChange={e => setContact(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Purpose</label>
                   <input required type="text" className="w-full mt-1 p-2 border rounded-md" value={purpose} onChange={e => setPurpose(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Meeting With (Host)</label>
                   <input type="text" className="w-full mt-1 p-2 border rounded-md" value={host} onChange={e => setHost(e.target.value)} />
                 </div>
                 
                 <div className="pt-2 border-t border-gray-100">
                     <p className="text-xs font-bold text-gray-500 uppercase mb-2">Time Details</p>
                     <div>
                       <label className="block text-xs text-gray-600">Date</label>
                       <input type="date" className="w-full mt-1 p-2 border rounded-md text-sm" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
                     </div>
                     <div className="grid grid-cols-2 gap-2 mt-2">
                         <div>
                            <label className="block text-xs text-gray-600">In Time</label>
                            <input type="time" className="w-full mt-1 p-2 border rounded-md text-sm" value={visitInTime} onChange={e => setVisitInTime(e.target.value)} />
                         </div>
                         <div>
                            <label className="block text-xs text-gray-600">Out Time</label>
                            <input type="time" className="w-full mt-1 p-2 border rounded-md text-sm" value={visitOutTime} onChange={e => setVisitOutTime(e.target.value)} />
                         </div>
                     </div>
                 </div>

                 <Button type="submit" className="w-full">{editingId ? 'Save Changes' : 'Confirm Check In'}</Button>
               </form>
             </div>
           )}

           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-green-50 flex justify-between items-center">
                <h3 className="font-bold text-green-800">Currently On Site</h3>
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">{activeVisitors.length}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {activeVisitors.length === 0 && <p className="p-4 text-center text-gray-500 text-sm">No visitors on site.</p>}
                {activeVisitors.map(v => (
                  <div key={v.id} className="p-4 hover:bg-gray-50 group">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <p className="font-bold text-gray-900">{v.name}</p>
                         <p className="text-xs text-gray-500">{v.contact}</p>
                       </div>
                       <div className="flex flex-col items-end space-y-1">
                           <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 flex items-center">
                               <Clock className="w-3 h-3 mr-1 text-gray-400"/> {v.inTime}
                           </span>
                           {/* Show Date if not today to highlight stale entries */}
                           {v.date !== new Date().toISOString().split('T')[0] && (
                               <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded border border-red-100">
                                   {new Date(v.date).toLocaleDateString()}
                               </span>
                           )}
                       </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">{v.purpose} {v.hostName ? `(w/ ${v.hostName})` : ''}</p>
                        {canEditRecords && (
                           <button onClick={() => handleEdit(v)} className="text-gray-400 hover:text-blue-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Edit details">
                               <Pencil className="w-3 h-3" />
                           </button>
                        )}
                    </div>
                    {canManage && (
                        <Button size="sm" variant="secondary" onClick={() => handleCheckOut(v.id)} className="w-full mt-3 border-red-200 text-red-600 hover:bg-red-50">
                          <LogOut className="w-4 h-4 mr-2"/> Check Out
                        </Button>
                    )}
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Right Col: History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-900">Visit History</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search name, purpose..." 
                  className="pl-9 pr-4 py-2 border rounded-md text-sm w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                    {canEditRecords && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Edit</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                   {filteredHistory.map(v => (
                     <tr key={v.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-medium text-gray-900">{v.name}</div>
                         <div className="text-xs text-gray-500">{v.contact}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           <div className="flex items-center">
                               <CalendarDays className="w-3 h-3 mr-1.5 text-gray-400"/>
                               {v.date}
                           </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <span className="flex items-center font-mono text-xs">
                            <Clock className="w-3 h-3 mr-1.5 text-gray-400"/>
                            {v.inTime} - {v.outTime}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                           <span className="flex items-center font-bold">
                               <Hourglass className="w-3 h-3 mr-1.5 text-blue-500"/>
                               {calculateDuration(v.inTime, v.outTime)}
                           </span>
                       </td>
                       <td className="px-6 py-4 text-sm text-gray-500">
                           {v.purpose}
                           {v.hostName && <div className="text-xs text-gray-400">Host: {v.hostName}</div>}
                       </td>
                       {canEditRecords && (
                           <td className="px-6 py-4 text-right">
                               <button onClick={() => handleEdit(v)} className="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50">
                                   <Pencil className="w-4 h-4"/>
                               </button>
                           </td>
                       )}
                     </tr>
                   ))}
                   {filteredHistory.length === 0 && (
                     <tr><td colSpan={canEditRecords ? 6 : 5} className="p-8 text-center text-gray-500">No history records found matching filter.</td></tr>
                   )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};