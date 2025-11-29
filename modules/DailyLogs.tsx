
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/mockDatabase';
import { WorkLog, WorkCategory, MaterialType, SourceItem, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { 
  Plus, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Search, 
  Pencil, 
  X,
  Lock,
  Unlock,
  Clock,
  Layers,
  ArrowRight,
  Scale,
  Users,
  ArrowLeft,
  Save,
  Table,
  Coffee,
  Check
} from 'lucide-react';

export const DailyLogs: React.FC = () => {
  const { user, hasPermission, notify } = useAuth();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'PRODUCTION' | 'TECH_OPS'>('PRODUCTION');
  
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit Mode State
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);

  // Multi-Worker Selection State
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');

  // Form State
  const [category, setCategory] = useState<WorkCategory>(WorkCategory.DISMANTLING);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Dismantling Specific State (Batch Mode)
  const [dismantlingMode, setDismantlingMode] = useState<'GROUP' | 'INDIVIDUAL'>('INDIVIDUAL');
  const [dismantlingSources, setDismantlingSources] = useState<Array<{userId: string, item: string, qty: string, remarks: string}>>([]);
  const [dismantlingOutputs, setDismantlingOutputs] = useState<Array<{material: string, weight: string, remarks: string}>>([]);
  
  // Preview State for Batch Distribution
  const [distributionPreview, setDistributionPreview] = useState<any[] | null>(null);

  // Time & Shift State
  // STANDARD: 8-5 (Fixed) | CUSTOM: User defined (View Only) | EDITING: User defined (Inputs visible)
  const [shiftState, setShiftState] = useState<'STANDARD' | 'CUSTOM' | 'EDITING'>('STANDARD');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakStartTime, setBreakStartTime] = useState('13:00');
  const [breakEndTime, setBreakEndTime] = useState('14:00');
  const [calculatedHours, setCalculatedHours] = useState(8);

  // Per-Worker Dynamic Inputs (Non-Dismantling)
  const [workerInputs, setWorkerInputs] = useState<Record<string, Partial<WorkLog>[]>>({});
  
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
      if (user) {
          setLogs(db.getLogs(user));
      }
  }, [user, showForm, editingLog]); 

  // Enforce Standard Times if Standard Mode selected
  useEffect(() => {
      if (shiftState === 'STANDARD') {
          setStartTime('08:00');
          setEndTime('17:00');
          setBreakStartTime('13:00');
          setBreakEndTime('14:00');
      }
  }, [shiftState]);

  // Auto-calculate Hours when times change
  useEffect(() => {
      const calculateDuration = () => {
          const start = new Date(`2000-01-01T${startTime}`);
          const end = new Date(`2000-01-01T${endTime}`);
          const breakStart = new Date(`2000-01-01T${breakStartTime}`);
          const breakEnd = new Date(`2000-01-01T${breakEndTime}`);

          if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

          let diffMs = end.getTime() - start.getTime();
          
          if (!isNaN(breakStart.getTime()) && !isNaN(breakEnd.getTime())) {
              const breakDiff = breakEnd.getTime() - breakStart.getTime();
              if (breakDiff > 0) diffMs -= breakDiff;
          }

          const hours = diffMs / (1000 * 60 * 60);
          return Math.max(0, parseFloat(hours.toFixed(2)));
      };
      
      setCalculatedHours(calculateDuration());
  }, [startTime, endTime, breakStartTime, breakEndTime]);

  // Update category options based on Tab
  useEffect(() => {
      if (activeTab === 'PRODUCTION') {
          setCategory(WorkCategory.DISMANTLING);
      } else {
          setCategory(WorkCategory.TESTING);
      }
  }, [activeTab]);

  // Initialize Dismantling Sources when workers change in batch mode
  useEffect(() => {
      if (category === WorkCategory.DISMANTLING && dismantlingSources.length === 0 && selectedWorkers.length > 0) {
          // Add initial empty row for each selected worker
          const initialRows = selectedWorkers.map(uid => ({
              userId: uid,
              item: '',
              qty: '',
              remarks: ''
          }));
          setDismantlingSources(initialRows);
      }
  }, [selectedWorkers, category]);

  // Permissions
  const canApprove = hasPermission('MANAGE_LOGS');
  const canEditRecords = hasPermission('EDIT_RECORDS');
  
  // Determine if user can access tabs
  const canAccessProduction = hasPermission('ACCESS_OPERATIONS_LOGS') || user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR;
  const canAccessTechOps = hasPermission('ACCESS_TECH_OPS_LOGS') || user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;

  // Computed lists for dropdowns
  const materials = db.getCombinedMaterialTypes();
  const sources = db.getCombinedSourceItems();
  const techItems = db.getCombinedTechItems();
  const allWorkers = db.getAllWorkers();
  
  // Tech Dropdown lists from config
  const config = db.getConfig();

  // Filter workers list based on search
  const filteredWorkerList = allWorkers.filter(w => 
      w.name.toLowerCase().includes(workerSearch.toLowerCase())
  );

  const toggleWorkerSelection = (workerId: string) => {
      if (selectedWorkers.includes(workerId)) {
          setSelectedWorkers(prev => prev.filter(id => id !== workerId));
          // Cleanup maps
          const newMap = {...workerInputs};
          delete newMap[workerId];
          setWorkerInputs(newMap);
          // Cleanup dismantling sources
          setDismantlingSources(prev => prev.filter(s => s.userId !== workerId));
      } else {
          setSelectedWorkers(prev => [...prev, workerId]);
          // Init empty items list for this worker
          setWorkerInputs(prev => ({
              ...prev,
              [workerId]: [{}] // Start with one empty row
          }));
          // Add dismantling row
          setDismantlingSources(prev => [...prev, { userId: workerId, item: '', qty: '', remarks: '' }]);
      }
  };

  const updateWorkerRow = (workerId: string, index: number, field: keyof WorkLog, value: any) => {
      setWorkerInputs(prev => {
          const rows = [...(prev[workerId] || [])];
          rows[index] = { ...rows[index], [field]: value };
          return { ...prev, [workerId]: rows };
      });
  };

  const addRowToWorker = (workerId: string) => {
      setWorkerInputs(prev => ({
          ...prev,
          [workerId]: [...(prev[workerId] || []), {}]
      }));
  };
  
  const removeRowFromWorker = (workerId: string, index: number) => {
      setWorkerInputs(prev => {
          const rows = [...(prev[workerId] || [])];
          if (rows.length > 1) {
              rows.splice(index, 1);
              return { ...prev, [workerId]: rows };
          }
          return prev;
      });
  };

  // --- DISMANTLING BATCH LOGIC ---
  const addDismantlingSource = (userId: string) => {
      setDismantlingSources(prev => [...prev, { userId, item: '', qty: '', remarks: '' }]);
  };

  const updateDismantlingSource = (index: number, field: string, value: string) => {
      const newSources = [...dismantlingSources];
      newSources[index] = { ...newSources[index], [field]: value };
      setDismantlingSources(newSources);
  };

  const removeDismantlingSource = (index: number) => {
      const newSources = [...dismantlingSources];
      newSources.splice(index, 1);
      setDismantlingSources(newSources);
  };

  const addDismantlingOutput = () => {
      setDismantlingOutputs(prev => [...prev, { material: '', weight: '', remarks: '' }]);
  };

  const updateDismantlingOutput = (index: number, field: string, value: string) => {
      const newOutputs = [...dismantlingOutputs];
      newOutputs[index] = { ...newOutputs[index], [field]: value };
      setDismantlingOutputs(newOutputs);
  };

  const removeDismantlingOutput = (index: number) => {
      const newOutputs = [...dismantlingOutputs];
      newOutputs.splice(index, 1);
      setDismantlingOutputs(newOutputs);
  };

  const generatePreview = () => {
      // 1. Calculate Total Source Units
      let totalUnits = 0;
      const userUnits: Record<string, number> = {};
      
      dismantlingSources.forEach(s => {
          const qty = parseFloat(s.qty) || 0;
          totalUnits += qty;
          userUnits[s.userId] = (userUnits[s.userId] || 0) + qty;
      });

      if (totalUnits === 0) {
          notify("Please add source quantities to calculate shares.");
          return;
      }

      // 2. Calculate Shares & Prepare Preview Data
      const preview: any[] = [];

      selectedWorkers.forEach(uid => {
          const myUnits = userUnits[uid] || 0;
          const share = myUnits / totalUnits;
          const uName = allWorkers.find(u => u.id === uid)?.name || 'Unknown';
          
          // Generate Summary String for Sources
          const sourceSummary = dismantlingSources
              .filter(s => s.userId === uid && s.item && s.qty)
              .map(s => `${s.qty} ${s.item}`)
              .join(', ');

          const allocatedMaterials = dismantlingOutputs.map(o => ({
              type: o.material,
              // Initial Auto-Calc
              weight: parseFloat(((parseFloat(o.weight) || 0) * share).toFixed(2))
          })).filter(a => a.type); // Filter out empty material types

          preview.push({
              userId: uid,
              userName: uName,
              sourceSummary,
              sharePct: (share * 100).toFixed(1),
              materials: allocatedMaterials
          });
      });

      setDistributionPreview(preview);
  };

  const handlePreviewWeightChange = (userIndex: number, materialIndex: number, newWeight: string) => {
      const newPreview = [...(distributionPreview || [])];
      newPreview[userIndex].materials[materialIndex].weight = parseFloat(newWeight) || 0;
      setDistributionPreview(newPreview);
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // If batch mode and not yet previewed, generate preview first
      if (category === WorkCategory.DISMANTLING && dismantlingMode === 'GROUP' && !distributionPreview) {
          generatePreview();
          return;
      }
      
      // If preview exists, we are confirming
      if (category === WorkCategory.DISMANTLING && dismantlingMode === 'GROUP' && distributionPreview) {
          const batchId = Math.random().toString(36).substr(2, 9);
          let count = 0;

          distributionPreview.forEach(p => {
              p.materials.forEach((mat: any) => {
                  db.addLog({
                      userId: p.userId,
                      userName: p.userName,
                      date: logDate,
                      category: WorkCategory.DISMANTLING,
                      hoursWorked: calculatedHours,
                      startTime,
                      endTime,
                      breakStartTime,
                      breakEndTime,
                      status: 'PENDING',
                      materialType: mat.type,
                      weightProcessedKg: mat.weight,
                      taskDescription: `Batch Dismantling: ${p.sourceSummary || 'Shared Task'}. (Share: ${p.sharePct}%)`,
                      sourceItem: 'Batch Mixed',
                      batchId
                  });
                  count++;
              });
          });
          
          notify(`Batch submitted: ${count} log entries created.`);
          closeForm();
          return;
      }

      // --- STANDARD SUBMIT LOGIC (Individual) ---
      if (selectedWorkers.length === 0) {
          notify("Please select workers.");
          return;
      }

      let count = 0;
      selectedWorkers.forEach(workerId => {
          const worker = allWorkers.find(u => u.id === workerId);
          if (!worker) return;

          const rows = workerInputs[workerId] || [];
          
          rows.forEach(row => {
              const newLog: any = {
                  userId: worker.id,
                  userName: worker.name,
                  date: logDate, 
                  category,
                  hoursWorked: calculatedHours,
                  startTime,
                  endTime,
                  breakStartTime,
                  breakEndTime,
                  status: 'PENDING',
                  ...row
              };
              
              if (row.weightProcessedKg) newLog.weightProcessedKg = parseFloat(row.weightProcessedKg as any);
              if (row.quantityProcessed) newLog.quantityProcessed = parseFloat(row.quantityProcessed as any);

              db.addLog(newLog);
              count++;
          });
      });

      notify(`Submitted ${count} logs.`);
      closeForm();
  };
  
  const closeForm = () => {
      setShowForm(false);
      resetForm();
      setLogs(db.getLogs(user!));
  };
  
  const handleUpdateLog = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingLog) return;
      
      const rowData = workerInputs[editingLog.userId]?.[0] || {};
      const updatedLog: WorkLog = {
          ...editingLog,
          date: logDate,
          category,
          hoursWorked: calculatedHours,
          startTime,
          endTime,
          breakStartTime,
          breakEndTime,
          ...rowData,
          weightProcessedKg: rowData.weightProcessedKg ? parseFloat(rowData.weightProcessedKg as any) : undefined,
          quantityProcessed: rowData.quantityProcessed ? parseFloat(rowData.quantityProcessed as any) : undefined
      };
      
      db.updateLog(updatedLog);
      notify("Log updated successfully");
      setEditingLog(null);
      resetForm();
  };

  const openEditModal = (log: WorkLog) => {
      setEditingLog(log);
      setLogDate(log.date);
      setCategory(log.category);
      
      setStartTime(log.startTime || '08:00');
      setEndTime(log.endTime || '17:00');
      setBreakStartTime(log.breakStartTime || '13:00');
      setBreakEndTime(log.breakEndTime || '14:00');
      setCalculatedHours(log.hoursWorked || 8);
      
      if (log.startTime === '08:00' && log.endTime === '17:00') setShiftState('STANDARD');
      else setShiftState('CUSTOM');

      setWorkerInputs({
          [log.userId]: [{ ...log }]
      });
      setSelectedWorkers([log.userId]);
  };

  const resetForm = () => {
      setCategory(activeTab === 'PRODUCTION' ? WorkCategory.DISMANTLING : WorkCategory.TESTING);
      setShiftState('STANDARD');
      setStartTime('08:00');
      setEndTime('17:00');
      setBreakStartTime('13:00');
      setBreakEndTime('14:00');
      setCalculatedHours(8);
      setSelectedWorkers([]);
      setWorkerInputs({});
      setDismantlingSources([]);
      setDismantlingOutputs([]);
      setDistributionPreview(null);
      setLogDate(new Date().toISOString().split('T')[0]);
      setEditingLog(null);
  };

  const handleStatusChange = (log: WorkLog, status: 'APPROVED' | 'REJECTED') => {
      if (!canApprove) return;
      db.updateLog({ ...log, status });
      notify(`Log marked as ${status}`);
      setLogs(db.getLogs(user!));
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) {
                  const res = db.importLogsFromCSV(text);
                  notify(`Imported ${res.createdCount} logs.`);
                  setLogs(db.getLogs(user!));
              }
          };
          reader.readAsText(file);
      }
  };

  // Helper to format 24h time to 12h for display
  const formatTime = (time: string) => {
      if (!time) return '';
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
  };

  // Filter Logic
  const filteredLogs = logs.filter(log => {
      const techCats = [WorkCategory.TESTING, WorkCategory.DATA_WIPING, WorkCategory.SOFTWARE, WorkCategory.TECH_SORTING, WorkCategory.REPAIR, WorkCategory.OTHER_TECH];
      const isTech = techCats.includes(log.category);
      if (activeTab === 'PRODUCTION' && isTech) return false;
      if (activeTab === 'TECH_OPS' && !isTech) return false;
      if (log.date !== filterDate) return false;
      const term = searchTerm.toLowerCase();
      return (
          log.userName.toLowerCase().includes(term) ||
          (log.taskDescription || '').toLowerCase().includes(term) ||
          (log.materialType || '').toLowerCase().includes(term)
      );
  });

  const renderInputsForCategory = (workerId: string, index: number, row: Partial<WorkLog>) => {
      // ... (Rest of input rendering logic remains same)
      switch (category) {
          case WorkCategory.DISMANTLING:
              return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                       <input 
                          list="source-items" 
                          placeholder="Source Item" 
                          className="p-1.5 text-xs border rounded"
                          value={row.sourceItem || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'sourceItem', e.target.value)}
                       />
                       <input 
                          type="number" 
                          placeholder="Source Qty" 
                          className="p-1.5 text-xs border rounded"
                          value={row.sourceQty || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'sourceQty', e.target.value)}
                       />
                       <input 
                          list="materials" 
                          placeholder="Extracted Material" 
                          className="p-1.5 text-xs border rounded"
                          value={row.materialType || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'materialType', e.target.value)}
                       />
                       <input 
                          type="number" 
                          placeholder="Weight (KG)" 
                          className="p-1.5 text-xs border rounded"
                          value={row.weightProcessedKg || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'weightProcessedKg', e.target.value)}
                       />
                  </div>
              );
          case WorkCategory.CLEANING:
              return (
                  <div className="grid grid-cols-2 gap-2">
                       <input 
                          placeholder="Warehouse Location" 
                          className="p-1.5 text-xs border rounded"
                          value={row.location || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'location', e.target.value)}
                       />
                       <input 
                          type="text" 
                          placeholder="Time / Duration Notes" 
                          className="p-1.5 text-xs border rounded"
                          value={row.taskDescription || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'taskDescription', e.target.value)}
                       />
                  </div>
              );
          case WorkCategory.SORTING:
              return (
                  <div className="grid grid-cols-3 gap-2">
                       <input 
                          list="materials" 
                          placeholder="Item Name" 
                          className="p-1.5 text-xs border rounded"
                          value={row.materialType || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'materialType', e.target.value)}
                       />
                       <input 
                          type="number" 
                          placeholder="Quantity" 
                          className="p-1.5 text-xs border rounded"
                          value={row.quantityProcessed || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'quantityProcessed', e.target.value)}
                       />
                       <input 
                          placeholder="Remarks" 
                          className="p-1.5 text-xs border rounded"
                          value={row.taskDescription || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'taskDescription', e.target.value)}
                       />
                  </div>
              );
          case WorkCategory.LOADING_UNLOADING:
               return (
                   <div className="grid grid-cols-3 gap-2">
                        <select 
                           className="p-1.5 text-xs border rounded"
                           value={row.loadingType || 'LOADING'}
                           onChange={e => updateWorkerRow(workerId, index, 'loadingType', e.target.value)}
                        >
                            <option value="LOADING">Loading</option>
                            <option value="UNLOADING">Unloading</option>
                        </select>
                        <input 
                           placeholder="Who / Vehicle / Context" 
                           className="p-1.5 text-xs border rounded col-span-2"
                           value={row.taskDescription || ''}
                           onChange={e => updateWorkerRow(workerId, index, 'taskDescription', e.target.value)}
                        />
                   </div>
               );
          case WorkCategory.SOFTWARE:
              return (
                   <div className="grid grid-cols-2 gap-2">
                       <input 
                          list="tech-items" 
                          placeholder="Item (Laptop, CPU)" 
                          className="p-1.5 text-xs border rounded"
                          value={row.deviceType || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'deviceType', e.target.value)}
                       />
                       <input 
                          type="number" 
                          placeholder="Quantity" 
                          className="p-1.5 text-xs border rounded"
                          value={row.quantityProcessed || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'quantityProcessed', e.target.value)}
                       />
                   </div>
              );
          case WorkCategory.TECH_SORTING:
              return (
                   <div className="grid grid-cols-2 gap-2">
                       <input 
                          list="tech-items" 
                          placeholder="Component (RAM, Processor)" 
                          className="p-1.5 text-xs border rounded"
                          value={row.materialType || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'materialType', e.target.value)}
                       />
                       <input 
                          type="number" 
                          placeholder="Quantity" 
                          className="p-1.5 text-xs border rounded"
                          value={row.quantityProcessed || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'quantityProcessed', e.target.value)}
                       />
                   </div>
              );
          case WorkCategory.TESTING:
               return (
                   <div className="space-y-2">
                       <div className="grid grid-cols-2 gap-2">
                           <input 
                              list="tech-items" 
                              placeholder="Device (Laptop, Phone)" 
                              className="p-1.5 text-xs border rounded"
                              value={row.deviceType || ''}
                              onChange={e => updateWorkerRow(workerId, index, 'deviceType', e.target.value)}
                           />
                           <select 
                              className="p-1.5 text-xs border rounded"
                              value={row.testType || 'BASIC'}
                              onChange={e => updateWorkerRow(workerId, index, 'testType', e.target.value)}
                           >
                               <option value="BASIC">Basic Check (Working/Not)</option>
                               <option value="DIAGNOSTIC">Full Diagnostics</option>
                               <option value="TROUBLESHOOTING">Troubleshooting</option>
                           </select>
                       </div>
                       
                       {row.testType === 'BASIC' && (
                           <div className="grid grid-cols-2 gap-2">
                               <select 
                                  className="p-1.5 text-xs border rounded"
                                  value={row.testOutcome || 'WORKING'}
                                  onChange={e => updateWorkerRow(workerId, index, 'testOutcome', e.target.value)}
                               >
                                   <option value="WORKING">Working</option>
                                   <option value="DAMAGED">Damaged</option>
                               </select>
                               <input 
                                  type="number" 
                                  placeholder="Qty" 
                                  className="p-1.5 text-xs border rounded"
                                  value={row.quantityProcessed || ''}
                                  onChange={e => updateWorkerRow(workerId, index, 'quantityProcessed', e.target.value)}
                               />
                           </div>
                       )}

                       {row.testType === 'DIAGNOSTIC' && (
                           <textarea 
                               placeholder="Diagnostic details (e.g. Camera OK, WiFi Failed...)"
                               className="w-full p-1.5 text-xs border rounded"
                               rows={2}
                               value={row.diagnosticsResult || ''}
                               onChange={e => updateWorkerRow(workerId, index, 'diagnosticsResult', e.target.value)}
                           />
                       )}

                       {row.testType === 'TROUBLESHOOTING' && (
                           <div className="grid grid-cols-1 gap-2">
                               <input 
                                  placeholder="Problem Description" 
                                  className="p-1.5 text-xs border rounded"
                                  value={row.problemDescription || ''}
                                  onChange={e => updateWorkerRow(workerId, index, 'problemDescription', e.target.value)}
                               />
                               <input 
                                  placeholder="Solution / Action Taken" 
                                  className="p-1.5 text-xs border rounded"
                                  value={row.solutionDescription || ''}
                                  onChange={e => updateWorkerRow(workerId, index, 'solutionDescription', e.target.value)}
                               />
                           </div>
                       )}
                   </div>
               );
          case WorkCategory.DATA_WIPING:
               return (
                   <div className="grid grid-cols-3 gap-2">
                       <input 
                          list="wiping-devices" 
                          placeholder="Storage Type (HDD, SSD)" 
                          className="p-1.5 text-xs border rounded"
                          value={row.storageType || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'storageType', e.target.value)}
                       />
                       <input 
                          placeholder="Size (e.g. 500GB)" 
                          className="p-1.5 text-xs border rounded"
                          value={row.storageSize || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'storageSize', e.target.value)}
                       />
                       <input 
                          placeholder="Software Used" 
                          className="p-1.5 text-xs border rounded"
                          value={row.softwareName || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'softwareName', e.target.value)}
                       />
                   </div>
               );
          case WorkCategory.REPAIR:
              return (
                   <div className="grid grid-cols-1 gap-2">
                       <input 
                          list="tech-items"
                          placeholder="Device Name" 
                          className="p-1.5 text-xs border rounded"
                          value={row.deviceType || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'deviceType', e.target.value)}
                       />
                       <div className="grid grid-cols-2 gap-2">
                           <input 
                              placeholder="Problem" 
                              className="p-1.5 text-xs border rounded"
                              value={row.problemDescription || ''}
                              onChange={e => updateWorkerRow(workerId, index, 'problemDescription', e.target.value)}
                           />
                           <input 
                              placeholder="Repair Action" 
                              className="p-1.5 text-xs border rounded"
                              value={row.solutionDescription || ''}
                              onChange={e => updateWorkerRow(workerId, index, 'solutionDescription', e.target.value)}
                           />
                       </div>
                   </div>
              );
          default:
               return (
                   <div className="grid grid-cols-2 gap-2">
                        <input 
                          placeholder="Type / Description" 
                          className="p-1.5 text-xs border rounded"
                          value={row.taskDescription || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'taskDescription', e.target.value)}
                       />
                       <input 
                          placeholder="Remarks" 
                          className="p-1.5 text-xs border rounded"
                          value={row.location || ''}
                          onChange={e => updateWorkerRow(workerId, index, 'location', e.target.value)}
                       />
                   </div>
               );
      }
  };

  const overtime = Math.max(0, parseFloat((calculatedHours - 8).toFixed(2)));

  return (
    <>
      <div className="space-y-6 animate-slide-up">
        {/* Main Header and Filter Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Work Logs</h1>
            <p className="text-gray-500 text-sm">Track team productivity and output</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <input 
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
            />
            {canApprove && (
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                   <Button variant="ghost" size="sm" onClick={() => db.exportLogsToCSV(logs)} title="Export Logs"><Download className="w-4 h-4"/></Button>
                   <Button variant="ghost" size="sm" onClick={() => csvInputRef.current?.click()} title="Import Logs"><Upload className="w-4 h-4"/></Button>
                   <input type="file" hidden ref={csvInputRef} onChange={handleCSVImport} accept=".csv"/>
                </div>
            )}
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
                New Entry <Plus className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
            {canAccessProduction && (
                <button 
                    onClick={() => setActiveTab('PRODUCTION')}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'PRODUCTION' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Production Logs
                </button>
            )}
            {canAccessTechOps && (
                <button 
                    onClick={() => setActiveTab('TECH_OPS')}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'TECH_OPS' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Tech Ops Logs
                </button>
            )}
        </div>

        {/* Logs Table */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {canEditRecords && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {log.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs break-words">
                          {log.category === WorkCategory.DISMANTLING && log.sourceItem && (
                              <span className="font-bold text-gray-700 block">{log.sourceItem} (x{log.sourceQty || 1})</span>
                          )}
                          {log.taskDescription}
                          {log.category === WorkCategory.TESTING && (
                              <div className="text-xs mt-1">
                                  {log.testType} - {log.testOutcome}
                                  {log.diagnosticsResult && <p className="text-gray-400 italic truncate">{log.diagnosticsResult}</p>}
                              </div>
                          )}
                           {log.category === WorkCategory.REPAIR && (
                              <div className="text-xs mt-1 text-red-400">
                                  {log.problemDescription} &rarr; {log.solutionDescription}
                              </div>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                          {log.weightProcessedKg ? (
                               <span className="font-bold text-gray-900">{log.weightProcessedKg} kg {log.materialType}</span>
                          ) : null}
                          {log.quantityProcessed ? (
                               <span>{log.quantityProcessed} Units</span>
                          ) : null}
                          {!log.weightProcessedKg && !log.quantityProcessed && <span className="text-gray-300">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.hoursWorked}
                      {(log.hoursWorked || 0) > 8 && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 ml-1 rounded">OT</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canApprove ? (
                          <select 
                              className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${
                                  log.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                  log.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}
                              value={log.status}
                              onChange={(e) => handleStatusChange(log, e.target.value as any)}
                          >
                              <option value="PENDING">Pending</option>
                              <option value="APPROVED">Approved</option>
                              <option value="REJECTED">Rejected</option>
                          </select>
                      ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                            log.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {log.status}
                          </span>
                      )}
                    </td>
                    {canEditRecords && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button onClick={() => openEditModal(log)} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded">
                                <Pencil className="w-4 h-4" />
                            </button>
                        </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NEW ENTRY / EDIT MODAL */}
      {(showForm || editingLog) && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start pt-4 sm:pt-10 justify-center bg-gray-900 bg-opacity-90 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl p-6 m-4 animate-scale-in relative mb-10 border border-gray-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    {distributionPreview ? <Table className="w-5 h-5 mr-2 text-blue-600"/> : null}
                    {distributionPreview ? 'Review & Edit Distribution' : (editingLog ? 'Edit Work Log' : 'New Daily Entry')}
                </h3>
                <button 
                    onClick={() => { setShowForm(false); setEditingLog(null); resetForm(); }} 
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                    <X className="w-6 h-6"/>
                </button>
            </div>
            
            <form onSubmit={editingLog ? handleUpdateLog : handleBatchSubmit} className="space-y-6">
                
                {/* PREVIEW MODE: TABLE VIEW */}
                {distributionPreview ? (
                    <div className="space-y-4 animate-fade-in">
                        {/* ... (Existing Preview Table Logic) ... */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>Distribution Preview:</strong> Total output weight has been distributed based on the number of source items processed by each worker. 
                                <br/>You can <strong>edit the weight values</strong> below if needed before saving.
                            </p>
                        </div>
                        
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Worker</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Source Items</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Share %</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Allocated Materials (Editable)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {distributionPreview.map((row, userIdx) => (
                                        <tr key={userIdx}>
                                            <td className="px-4 py-3 text-sm font-bold text-gray-900 align-top">{row.userName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 align-top">{row.sourceSummary}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 align-top">{row.sharePct}%</td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-2">
                                                    {row.materials.map((mat: any, matIdx: number) => (
                                                        <div key={matIdx} className="flex items-center space-x-2">
                                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 w-24 truncate" title={mat.type}>{mat.type}</span>
                                                            <div className="relative">
                                                                <input 
                                                                    type="number" 
                                                                    className="w-20 p-1 border rounded text-sm font-bold text-right pr-6"
                                                                    value={mat.weight}
                                                                    onChange={(e) => handlePreviewWeightChange(userIdx, matIdx, e.target.value)}
                                                                />
                                                                <span className="absolute right-1 top-1.5 text-xs text-gray-400">kg</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-gray-100">
                            <Button type="button" variant="secondary" onClick={() => setDistributionPreview(null)}>
                                <ArrowLeft className="w-4 h-4 mr-2"/> Back to Inputs
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                <Save className="w-4 h-4 mr-2"/> Confirm & Save Logs
                            </Button>
                        </div>
                    </div>
                ) : (
                    // NORMAL INPUT MODE
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Left Column: Workers & Basic Info */}
                            <div className="md:col-span-1 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                        value={logDate}
                                        onChange={(e) => setLogDate(e.target.value)}
                                    />
                                </div>

                                {!editingLog && (
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 h-[500px] flex flex-col">
                                        <label className="block text-xs font-bold text-gray-50 uppercase mb-2">Select Staff</label>
                                        <div className="relative mb-2">
                                            <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400"/>
                                            <input 
                                                type="text" 
                                                placeholder="Search name..."
                                                className="w-full pl-7 p-1 text-sm border rounded bg-white"
                                                value={workerSearch}
                                                onChange={e => setWorkerSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                            {filteredWorkerList.map(w => (
                                                <div 
                                                    key={w.id} 
                                                    onClick={() => toggleWorkerSelection(w.id)}
                                                    className={`p-2 rounded cursor-pointer text-sm flex items-center justify-between ${selectedWorkers.includes(w.id) ? 'bg-primary-100 text-primary-900 border border-primary-200' : 'hover:bg-white hover:shadow-sm'}`}
                                                >
                                                    <span>{w.name}</span>
                                                    {selectedWorkers.includes(w.id) && <CheckCircle className="w-4 h-4 text-primary-600"/>}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-right text-gray-400 mt-2">
                                            {selectedWorkers.length} selected
                                        </div>
                                    </div>
                                )}
                                
                                {editingLog && (
                                    <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                                        <span className="text-xs font-bold uppercase">Editing Log For:</span>
                                        <div className="font-bold text-lg">{editingLog.userName}</div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Work Details */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Category & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                                        <select 
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as WorkCategory)}
                                        >
                                            {activeTab === 'PRODUCTION' ? (
                                                <>
                                                    <option value={WorkCategory.DISMANTLING}>Dismantling (Batch)</option>
                                                    <option value={WorkCategory.CLEANING}>Cleaning</option>
                                                    <option value={WorkCategory.SORTING}>Sorting</option>
                                                    <option value={WorkCategory.LOADING_UNLOADING}>Loading/Unloading</option>
                                                    <option value={WorkCategory.OTHER_PROD}>Other</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value={WorkCategory.SOFTWARE}>Software</option>
                                                    <option value={WorkCategory.TECH_SORTING}>Sorting (Tech)</option>
                                                    <option value={WorkCategory.TESTING}>Testing</option>
                                                    <option value={WorkCategory.DATA_WIPING}>Data Wiping</option>
                                                    <option value={WorkCategory.REPAIR}>Repair</option>
                                                    <option value={WorkCategory.OTHER_TECH}>Other</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Shift Duration: <span className="font-bold">{calculatedHours}h</span>
                                            {overtime > 0 && (
                                                <span className="ml-2 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                    (8h Normal + {overtime}h OT)
                                                </span>
                                            )}
                                        </label>
                                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 relative min-h-[44px] flex items-center">
                                            
                                            {shiftState === 'STANDARD' && (
                                                <div className="flex-1 flex justify-between items-center text-sm px-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-700 font-medium">Standard Shift (8h)</span>
                                                        <span className="text-[10px] text-gray-400">08:00 AM - 05:00 PM</span>
                                                    </div>
                                                    <button type="button" onClick={() => setShiftState('EDITING')} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded" title="Edit Shift Times">
                                                        <Pencil className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            )}

                                            {shiftState === 'CUSTOM' && (
                                                <div className="flex-1 flex justify-between items-center text-sm px-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-800 font-bold">Custom Shift ({calculatedHours}h)</span>
                                                        <span className="text-[10px] text-blue-600 font-medium">{formatTime(startTime)} - {formatTime(endTime)}</span>
                                                    </div>
                                                    <button type="button" onClick={() => setShiftState('EDITING')} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded" title="Edit Shift Times">
                                                        <Pencil className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            )}

                                            {shiftState === 'EDITING' && (
                                                <div className="flex-1 relative pt-5 pb-1 px-1">
                                                    <div className="absolute top-[-4px] right-0 flex space-x-1">
                                                        {/* Confirm / Tick */}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setShiftState('CUSTOM')}
                                                            className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-50"
                                                            title="Confirm Times"
                                                        >
                                                            <Check className="w-4 h-4"/>
                                                        </button>
                                                        {/* Cancel / Cross (Revert to Standard) */}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setShiftState('STANDARD');
                                                                setStartTime('08:00');
                                                                setEndTime('17:00');
                                                                setBreakStartTime('13:00');
                                                                setBreakEndTime('14:00');
                                                            }} 
                                                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                                                            title="Revert to Standard"
                                                        >
                                                            <X className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] text-gray-500 font-bold uppercase flex items-center">
                                                                <Clock className="w-3 h-3 mr-1"/> Work Hours
                                                            </label>
                                                            <div className="flex items-center gap-1">
                                                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border rounded px-1 w-full text-xs h-7"/>
                                                                <span className="text-gray-400 text-xs">-</span>
                                                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border rounded px-1 w-full text-xs h-7"/>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] text-gray-500 font-bold uppercase flex items-center">
                                                                <Coffee className="w-3 h-3 mr-1"/> Break
                                                            </label>
                                                            <div className="flex items-center gap-1">
                                                                <input type="time" value={breakStartTime} onChange={e => setBreakStartTime(e.target.value)} className="border rounded px-1 w-full text-xs h-7"/>
                                                                <span className="text-gray-400 text-xs">-</span>
                                                                <input type="time" value={breakEndTime} onChange={e => setBreakEndTime(e.target.value)} className="border rounded px-1 w-full text-xs h-7"/>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* --- SPECIAL DISMANTLING BATCH UI --- */}
                                {category === WorkCategory.DISMANTLING && !editingLog ? (
                                    <div className="space-y-6">
                                        {/* 1. Source Items per Worker */}
                                        <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50/30">
                                            <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                                                <h4 className="font-bold text-blue-800 text-sm flex items-center">
                                                    <Layers className="w-4 h-4 mr-2"/> Phase 1: Source Input
                                                </h4>
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="secondary" onClick={() => setDismantlingMode('GROUP')}>Batch Group</Button>
                                                    <Button size="sm" variant="secondary" onClick={() => setDismantlingMode('INDIVIDUAL')}>Individual</Button>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                {selectedWorkers.length === 0 && <p className="text-sm text-gray-400 italic">Select workers on the left to add their sources.</p>}
                                                
                                                {dismantlingSources.map((ds, idx) => {
                                                    const wName = allWorkers.find(u => u.id === ds.userId)?.name;
                                                    return (
                                                        <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                                            <div className="w-24 text-xs font-bold text-gray-700 truncate" title={wName}>{wName}</div>
                                                            <input 
                                                                list="source-items"
                                                                placeholder="Source Item (e.g. Printer)"
                                                                className="flex-1 p-1.5 text-xs border rounded"
                                                                value={ds.item}
                                                                onChange={e => updateDismantlingSource(idx, 'item', e.target.value)}
                                                            />
                                                            <input 
                                                                type="number"
                                                                placeholder="Qty"
                                                                className="w-16 p-1.5 text-xs border rounded"
                                                                value={ds.qty}
                                                                onChange={e => updateDismantlingSource(idx, 'qty', e.target.value)}
                                                            />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => addDismantlingSource(ds.userId)} 
                                                                className="text-blue-500 hover:text-blue-700"
                                                                title="Add another source for this user"
                                                            >
                                                                <Plus className="w-4 h-4"/>
                                                            </button>
                                                            {dismantlingSources.filter(s => s.userId === ds.userId).length > 1 && (
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => removeDismantlingSource(idx)} 
                                                                    className="text-red-400 hover:text-red-600"
                                                                >
                                                                    <X className="w-4 h-4"/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <ArrowRight className="text-gray-300 w-6 h-6"/>
                                        </div>

                                        {/* 2. Total Extracted Materials */}
                                        <div className="border border-green-200 rounded-lg overflow-hidden bg-green-50/30">
                                            <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex justify-between items-center">
                                                <h4 className="font-bold text-green-800 text-sm flex items-center">
                                                    <Scale className="w-4 h-4 mr-2"/> Phase 2: Total Recovered Materials
                                                </h4>
                                                <button type="button" onClick={addDismantlingOutput} className="text-xs text-green-700 hover:underline flex items-center font-bold">
                                                    <Plus className="w-3 h-3 mr-1"/> Add Material
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                {dismantlingOutputs.length === 0 && <p className="text-sm text-gray-400 italic">Add the total output weight for this batch.</p>}
                                                {dismantlingOutputs.map((out, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center">
                                                        <input 
                                                            list="materials"
                                                            placeholder="Material Type"
                                                            className="flex-1 p-1.5 text-xs border rounded"
                                                            value={out.material}
                                                            onChange={e => updateDismantlingOutput(idx, 'material', e.target.value)}
                                                        />
                                                        <input 
                                                            type="number"
                                                            placeholder="Total Weight (KG)"
                                                            className="w-32 p-1.5 text-xs border rounded"
                                                            value={out.weight}
                                                            onChange={e => updateDismantlingOutput(idx, 'weight', e.target.value)}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeDismantlingOutput(idx)} 
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <XCircle className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Distribution Preview Info */}
                                        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
                                            <p className="font-bold mb-1">Workflow:</p>
                                            <p>1. Enter sources for each worker.</p>
                                            <p>2. Enter total extracted weight.</p>
                                            <p>3. Click <strong>Review Distribution</strong> to preview and edit shares before saving.</p>
                                        </div>
                                    </div>
                                ) : (
                                    // --- STANDARD INPUT TABLE (Non-Dismantling or Editing) ---
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                            <h4 className="font-bold text-gray-700 text-sm">Work Details</h4>
                                        </div>
                                        
                                        <div className="p-4 space-y-4 bg-white">
                                            {selectedWorkers.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Select workers to add details.</p>}
                                            
                                            {selectedWorkers.map(workerId => {
                                                const wName = allWorkers.find(u => u.id === workerId)?.name;
                                                const rows = workerInputs[workerId] || [];

                                                return (
                                                    <div key={workerId} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-bold text-gray-800">{wName}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => addRowToWorker(workerId)}
                                                                className="text-xs text-blue-600 hover:underline flex items-center"
                                                            >
                                                                <Plus className="w-3 h-3 mr-1"/> Add Row
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="space-y-3">
                                                            {rows.map((row, idx) => (
                                                                <div key={idx} className="flex gap-2 items-start group relative">
                                                                    <div className="flex-1">
                                                                        {renderInputsForCategory(workerId, idx, row)}
                                                                    </div>
                                                                    {rows.length > 1 && (
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => removeRowFromWorker(workerId, idx)}
                                                                            className="mt-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <X className="w-4 h-4"/>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Form Footer */}
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                    {distributionPreview ? null : ( // Hide footer if in preview mode (preview has its own footer)
                                        <>
                                            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingLog(null); resetForm(); }}>Cancel</Button>
                                            <Button type="submit">
                                                {category === WorkCategory.DISMANTLING && dismantlingMode === 'GROUP' ? 'Review Distribution' : 'Submit Log'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </form>
            
            {/* Datalists for Autocomplete */}
            <datalist id="source-items">
                {sources.map(s => <option key={s} value={s} />)}
            </datalist>
            <datalist id="materials">
                {materials.map(m => <option key={m} value={m} />)}
            </datalist>
            <datalist id="tech-items">
                {techItems.map(t => <option key={t} value={t} />)}
            </datalist>
            <datalist id="wiping-devices">
                {config.customWipingDevices?.map(d => <option key={d} value={d} />)}
            </datalist>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};
