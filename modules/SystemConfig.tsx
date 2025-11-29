import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDatabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Trash2, Settings, List, Plus, Lock, Pencil, Check, X, Database, Download, Upload, Server, Monitor, HardDrive, Wrench, UserPlus, Cloud, Cpu, Layers, Disc, AlertTriangle } from 'lucide-react';
import { MaterialType, SourceItem, Machine, UserRole, TechItem, AppConfig } from '../types';

export const SystemConfig: React.FC = () => {
  const { user, notify } = useAuth();
  const [config, setConfig] = useState(db.getConfig());
  const backupInputRef = useRef<HTMLInputElement>(null);
  
  // Lists
  const [allSources, setAllSources] = useState<string[]>([]);
  const [allMaterials, setAllMaterials] = useState<string[]>([]);
  const [allTechItems, setAllTechItems] = useState<string[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  
  // Inputs
  const [newSource, setNewSource] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newTechItem, setNewTechItem] = useState('');
  const [newMachineName, setNewMachineName] = useState('');

  // Tech Inputs
  const [newRamGen, setNewRamGen] = useState('');
  const [newRamSize, setNewRamSize] = useState('');
  const [newProcessorType, setNewProcessorType] = useState('');
  const [newProcessorGen, setNewProcessorGen] = useState(''); // New state
  const [newWipingDevice, setNewWipingDevice] = useState('');

  // Technician Quick Add
  const [newTechName, setNewTechName] = useState('');
  const [newTechEmail, setNewTechEmail] = useState('');

  // Editing State
  const [editingItem, setEditingItem] = useState<{type: 'SOURCE' | 'MATERIAL' | 'TECH', oldName: string} | null>(null);
  const [editValue, setEditValue] = useState('');

  // Cloud Config
  const [driveLink, setDriveLink] = useState(config.cloudBackupUrl || '');

  useEffect(() => {
      refreshLists();
  }, [config]);

  const refreshLists = () => {
      setAllSources(db.getCombinedSourceItems());
      setAllMaterials(db.getCombinedMaterialTypes());
      setAllTechItems(db.getCombinedTechItems());
      setMachines(db.getMachines());
  };

  // Strict Access Check
  if (user?.id !== 'u1' && !user?.permissions.includes('MANAGE_SYSTEM')) {
      return (
          <div className="p-10 text-center bg-red-50 text-red-600 rounded-xl border border-red-200">
              <h2 className="text-xl font-bold mb-2">Restricted Area</h2>
              <p>This module is reserved for the System Architect.</p>
          </div>
      );
  }

  // Updated to use the new robust database check
  const checkIsSystemItem = (name: string, type: 'SOURCE' | 'MATERIAL' | 'TECH') => {
      return !db.isCustomItem(name, type);
  };

  const handleRemove = (type: 'SOURCE' | 'MATERIAL' | 'TECH', name: string) => {
      if(confirm(`Remove "${name}"?`)) {
          db.removeCustomItem(type, name);
          setConfig(db.getConfig());
          notify(`${name} removed from list`);
      }
  };

  const handleAdd = (type: 'SOURCE' | 'MATERIAL' | 'TECH') => {
      let val = '';
      if (type === 'SOURCE') val = newSource.trim();
      else if (type === 'MATERIAL') val = newMaterial.trim();
      else val = newTechItem.trim();

      if(val) {
          if (type === 'SOURCE') {
              db.addCustomSourceItem(val);
              setNewSource('');
          } else if (type === 'MATERIAL') {
              db.addCustomMaterialType(val);
              setNewMaterial('');
          } else {
              db.addCustomTechItem(val);
              setNewTechItem('');
          }
          setConfig(db.getConfig());
          notify(`${val} added successfully`);
      }
  };

  const handleAddListOption = (key: keyof AppConfig, value: string, setter: any) => {
      if (!value.trim()) return;
      db.addCustomListOption(key, value.trim());
      setConfig(db.getConfig());
      setter('');
      notify("Option added");
  };

  const handleRemoveListOption = (key: keyof AppConfig, value: string) => {
      if(confirm(`Remove "${value}"?`)) {
          db.removeCustomListOption(key, value);
          setConfig(db.getConfig());
          notify("Option removed");
      }
  };

  const handleAddMachine = () => {
      if (!newMachineName.trim()) return;
      db.addMachine({
          name: newMachineName,
          status: 'OPERATIONAL',
          lastServiceDate: new Date().toISOString().split('T')[0]
      });
      setNewMachineName('');
      refreshLists();
      notify(`Machine ${newMachineName} registered`);
  };

  const handleDeleteMachine = (id: string) => {
      if(confirm("Remove this machine from registry?")) {
          db.deleteMachine(id);
          refreshLists();
          notify("Machine removed");
      }
  };

  const handleAddTechnician = () => {
      if (!newTechName || !newTechEmail) return;
      db.addUser({
          name: newTechName,
          email: newTechEmail,
          role: UserRole.TECHNICIAN,
          permissions: ['VIEW_LOGS'],
          department: 'Maintenance',
          jobTitle: 'Maintenance Technician',
          workerCategory: 'TECH' // Auto-assign to Tech category
      });
      setNewTechName('');
      setNewTechEmail('');
      notify(`Technician ${newTechName} added`);
  };

  const startEdit = (type: 'SOURCE' | 'MATERIAL' | 'TECH', name: string) => {
      setEditingItem({ type, oldName: name });
      setEditValue(name);
  };

  const cancelEdit = () => {
      setEditingItem(null);
      setEditValue('');
  };

  const saveEdit = () => {
      if (!editingItem || !editValue.trim()) return;
      if (editValue.trim() !== editingItem.oldName) {
          db.renameCustomItem(editingItem.type, editingItem.oldName, editValue.trim());
          setConfig(db.getConfig());
          notify(`Renamed to ${editValue.trim()}`);
      }
      cancelEdit();
  };

  const handleSaveDriveLink = () => {
      db.updateCloudBackupUrl(driveLink);
      setConfig(db.getConfig());
      notify("Google Drive Link saved");
  };

  const handleBackup = () => {
      // 1. Download Local
      const json = db.createFullBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evergreen_full_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 2. Open Drive if configured
      if (config.cloudBackupUrl) {
          setTimeout(() => {
             const opened = window.open(config.cloudBackupUrl, '_blank');
             notify("Backup downloaded. Upload to Drive opened in new tab.");
             if (!opened) {
                 alert("Backup downloaded. Please upload it to your Google Drive (Popup was blocked).");
             }
          }, 1000);
      } else {
          notify("Backup downloaded locally");
      }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              if (confirm("WARNING: This will OVERWRITE all data. Are you sure?")) {
                  const success = db.restoreFullBackup(content);
                  if (success) {
                      notify("System restored successfully");
                      setTimeout(() => window.location.reload(), 1000);
                  } else {
                      alert("Restore failed.");
                  }
              }
          }
      };
      reader.readAsText(file);
  };

  const handleFactoryReset = () => {
      if (confirm("DANGER: Are you sure you want to delete ALL data? This cannot be undone.")) {
          if (confirm("Double Check: This will wipe Users, Inventory, Logs, Everything. Proceed?")) {
              db.resetDatabase();
          }
      }
  };

  const ItemList = ({ title, type, items, newItemValue, setNewItemValue, color = 'blue' }: any) => {
      const iconColor = color === 'blue' ? 'text-blue-500' : color === 'green' ? 'text-green-500' : 'text-cyan-500';
      const borderColor = color === 'blue' ? 'border-blue-100' : color === 'green' ? 'border-green-100' : 'border-cyan-100';
      
      return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <List className={`w-5 h-5 mr-2 ${iconColor}`}/> 
              {title}
          </h3>
          
          <div className="flex gap-2 mb-4">
              <input 
                className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white text-gray-900" 
                placeholder={`New Item Name`}
                value={newItemValue}
                onChange={(e: any) => setNewItemValue(e.target.value)}
              />
              <Button size="sm" onClick={() => handleAdd(type)}><Plus className="w-4 h-4"/></Button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
              {items.map((item: string) => {
                  const isSystem = checkIsSystemItem(item, type);
                  const isEditing = editingItem?.type === type && editingItem?.oldName === item;

                  return (
                      <div key={item} className={`flex justify-between items-center p-3 rounded border ${isSystem ? 'bg-gray-50 border-gray-200' : `bg-white ${borderColor}`}`}>
                          {isEditing ? (
                              <div className="flex-1 flex items-center gap-2">
                                  <input 
                                      className="flex-1 p-1 border border-blue-300 rounded text-sm font-bold bg-white text-gray-900"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      autoFocus
                                  />
                                  <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check className="w-4 h-4"/></button>
                                  <button onClick={cancelEdit} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4"/></button>
                              </div>
                          ) : (
                              <>
                                  <div className="flex items-center">
                                      <span className={`font-medium text-gray-900`}>{item.replace(/_/g, ' ')}</span>
                                      {isSystem && <span className="ml-2 text-[10px] text-gray-400 border border-gray-300 px-1 rounded bg-gray-50">System</span>}
                                  </div>
                                  
                                  <div className="flex space-x-1">
                                      <button 
                                          onClick={() => startEdit(type, item)} 
                                          className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                          title="Rename"
                                      >
                                          <Pencil className="w-3 h-3"/>
                                      </button>
                                      {!isSystem && (
                                        <button 
                                            onClick={() => handleRemove(type, item)} 
                                            className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3"/>
                                        </button>
                                      )}
                                  </div>
                              </>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>
      );
  };
  
  const SimpleList = ({ title, items, newValue, setValue, onAdd, onRemove }: any) => (
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-sm font-bold text-gray-700 mb-3">{title}</h3>
          <div className="flex gap-2 mb-3">
              <input 
                className="flex-1 p-1.5 border border-gray-300 rounded text-sm bg-white text-gray-900" 
                placeholder="New Option"
                value={newValue}
                onChange={(e: any) => setValue(e.target.value)}
              />
              <Button size="sm" onClick={onAdd}><Plus className="w-3 h-3"/></Button>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[150px] pr-1 custom-scrollbar">
              {items.map((item: string) => (
                  <div key={item} className="flex justify-between items-center p-2 rounded bg-gray-50 text-sm">
                      <span>{item}</span>
                      <button onClick={() => onRemove(item)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                  </div>
              ))}
          </div>
       </div>
  );

  return (
      <div className="space-y-8 animate-fade-in h-[calc(100vh-100px)] flex flex-col pb-10 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                      <Settings className="w-6 h-6 mr-2 text-gray-600"/> System Configuration
                  </h1>
              </div>
          </div>

          {/* Cloud & Backup Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 flex flex-col gap-6 shrink-0">
              <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white rounded-lg text-indigo-600 shadow-sm">
                      <Cloud className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-lg font-bold text-indigo-900">Cloud & Data Management</h3>
                      <p className="text-sm text-indigo-700 mb-4">
                          Configure auto-upload destinations and manage system backups.
                      </p>
                      
                      <div className="flex gap-2 max-w-xl">
                          <input 
                              type="text" 
                              className="flex-1 p-2 border border-indigo-300 rounded text-sm"
                              placeholder="Paste Google Drive Folder Link here..."
                              value={driveLink}
                              onChange={e => setDriveLink(e.target.value)}
                          />
                          <Button size="sm" onClick={handleSaveDriveLink}>Save Link</Button>
                      </div>
                      <p className="text-xs text-indigo-500 mt-1">
                          When you click "Backup", the system will download the file and open this link for you to upload it.
                      </p>
                  </div>
              </div>
              
              <div className="flex justify-end space-x-3 border-t border-indigo-200 pt-4">
                  <Button onClick={handleBackup} className="bg-indigo-600 hover:bg-indigo-700 border-transparent shadow-md">
                      <Download className="w-4 h-4 mr-2" /> Backup Data
                  </Button>
                  <Button variant="secondary" onClick={() => backupInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" /> Restore From File
                  </Button>
                  <input type="file" hidden ref={backupInputRef} accept=".json" onChange={handleRestore} />
              </div>
          </div>

          {/* CATEGORY A: Manual / Dismantling */}
          <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <Layers className="w-5 h-5 text-blue-600"/>
                  <h2 className="text-xl font-bold text-gray-800">Category A: Manual & Dismantling Ops</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ItemList 
                    title="Sources (Devices/Items)" 
                    type="SOURCE" 
                    items={allSources} 
                    newItemValue={newSource} 
                    setNewItemValue={setNewSource} 
                    color="blue"
                />
                <ItemList 
                    title="Extracted Materials" 
                    type="MATERIAL" 
                    items={allMaterials} 
                    newItemValue={newMaterial} 
                    setNewItemValue={setNewMaterial} 
                    color="green"
                />
              </div>
          </div>

          {/* CATEGORY B: Technical */}
          <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <Cpu className="w-5 h-5 text-cyan-600"/>
                  <h2 className="text-xl font-bold text-gray-800">Category B: Technical & Testing Ops</h2>
              </div>
              
              {/* Tech Configuration Lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                   <SimpleList 
                        title="RAM Generations"
                        items={config.customRamGenerations || []}
                        newValue={newRamGen}
                        setValue={setNewRamGen}
                        onAdd={() => handleAddListOption('customRamGenerations', newRamGen, setNewRamGen)}
                        onRemove={(val: string) => handleRemoveListOption('customRamGenerations', val)}
                   />
                   <SimpleList 
                        title="RAM Sizes"
                        items={config.customRamSizes || []}
                        newValue={newRamSize}
                        setValue={setNewRamSize}
                        onAdd={() => handleAddListOption('customRamSizes', newRamSize, setNewRamSize)}
                        onRemove={(val: string) => handleRemoveListOption('customRamSizes', val)}
                   />
                   <SimpleList 
                        title="Processor Families"
                        items={config.customProcessorTypes || []}
                        newValue={newProcessorType}
                        setValue={setNewProcessorType}
                        onAdd={() => handleAddListOption('customProcessorTypes', newProcessorType, setNewProcessorType)}
                        onRemove={(val: string) => handleRemoveListOption('customProcessorTypes', val)}
                   />
                   <SimpleList 
                        title="Processor Generations"
                        items={config.customProcessorGenerations || []}
                        newValue={newProcessorGen}
                        setValue={setNewProcessorGen}
                        onAdd={() => handleAddListOption('customProcessorGenerations', newProcessorGen, setNewProcessorGen)}
                        onRemove={(val: string) => handleRemoveListOption('customProcessorGenerations', val)}
                   />
                   <SimpleList 
                        title="Wiping Devices"
                        items={config.customWipingDevices || []}
                        newValue={newWipingDevice}
                        setValue={setNewWipingDevice}
                        onAdd={() => handleAddListOption('customWipingDevices', newWipingDevice, setNewWipingDevice)}
                        onRemove={(val: string) => handleRemoveListOption('customWipingDevices', val)}
                   />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ItemList 
                    title="All Tech Items & Components" 
                    type="TECH" 
                    items={allTechItems} 
                    newItemValue={newTechItem} 
                    setNewItemValue={setNewTechItem} 
                    color="cyan"
                />
                 {/* Machine Registry */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <HardDrive className="w-5 h-5 mr-2 text-orange-500"/> 
                        Machine Registry
                    </h3>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white text-gray-900" 
                            placeholder="Machine Name"
                            value={newMachineName}
                            onChange={(e) => setNewMachineName(e.target.value)}
                        />
                        <Button size="sm" onClick={handleAddMachine}><Plus className="w-4 h-4"/></Button>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                        {machines.map((m) => (
                            <div key={m.id} className="flex justify-between items-center p-3 rounded border bg-white border-orange-100">
                                <span className="font-medium text-gray-900">{m.name}</span>
                                <button 
                                    onClick={() => handleDeleteMachine(m.id)} 
                                    className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-3 h-3"/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
          </div>

           {/* Quick Add Technician */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col mt-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-teal-500"/> 
                  Add Maintenance Staff
              </h3>
              <div className="space-y-3">
                  <div>
                      <label className="text-xs text-gray-500 uppercase font-bold">Name</label>
                      <input 
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900" 
                        placeholder="Technician Name"
                        value={newTechName}
                        onChange={(e) => setNewTechName(e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 uppercase font-bold">Email</label>
                      <input 
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900" 
                        placeholder="Email Address"
                        value={newTechEmail}
                        onChange={(e) => setNewTechEmail(e.target.value)}
                      />
                  </div>
                  <Button onClick={handleAddTechnician} className="w-full mt-2">
                      <UserPlus className="w-4 h-4 mr-2"/> Add Technician
                  </Button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                      Technicians added here are available for task assignment in the Maintenance module.
                  </p>
              </div>
          </div>

          {/* DANGER ZONE - Factory Reset */}
          <div className="mt-8 border-t border-red-200 pt-6">
              <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2"/> Danger Zone
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center justify-between">
                  <div>
                      <h4 className="font-bold text-red-900">Factory Reset</h4>
                      <p className="text-sm text-red-700">Irreversible action. Wipes all local data and restores default seeds.</p>
                  </div>
                  <Button variant="danger" onClick={handleFactoryReset}>Reset System</Button>
              </div>
          </div>
      </div>
  );
};