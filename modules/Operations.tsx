




import React, { useState, useRef } from 'react';
import { db } from '../services/mockDatabase';
import { LogisticsEntry, LogisticsItemBreakdown } from '../types';
import { Button } from '../components/ui/Button';
import { Truck, Scale, Plus, Trash2, Camera, Image as ImageIcon, Download, Upload, Pencil, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PREDEFINED_CUSTOMERS = ['ROP', 'Bank Muscat', 'Oman Arab Bank', 'Ministry of Education', 'PDO', 'Private Entity'];
const COMMON_LOGISTICS_ITEMS = [
    'Mixed E-Waste', 'Printers', 'CPUs / Towers', 'Laptops', 'Servers', 
    'Monitors (CRT)', 'Monitors (LCD)', 'Cables', 'UPS', 'POS Machines', 
    'Network Equipment', 'Batteries', 'AC Units'
];

export const Operations: React.FC = () => {
  const { user, hasPermission, notify } = useAuth();
  const [entries, setEntries] = useState<LogisticsEntry[]>(db.getLogisticsEntries());
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerMode, setCustomerMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [selectedCustomer, setSelectedCustomer] = useState(PREDEFINED_CUSTOMERS[0]);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  
  // Date/Time State
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrivalTime, setArrivalTime] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));

  // Breakdown list for individual item weights
  const [breakdown, setBreakdown] = useState<any[]>([
      { name: 'Mixed E-Waste', gross: '', tare: '', photo: null }
  ]);

  const activeFileRow = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const canManage = hasPermission('MANAGE_LOGISTICS') || hasPermission('MANAGE_INVENTORY');
  const canEditRecords = hasPermission('EDIT_RECORDS');

  // Breakdown Table Management
  const handleAddRow = () => {
      setBreakdown([...breakdown, { name: '', gross: '', tare: '', photo: null }]);
  };

  const handleRemoveRow = (index: number) => {
      const newB = [...breakdown];
      newB.splice(index, 1);
      setBreakdown(newB);
  };

  const handleRowChange = (index: number, field: string, value: string) => {
      const newB = [...breakdown];
      newB[index] = { ...newB[index], [field]: value };
      setBreakdown(newB);
  };

  // Logic to handle photo upload for specific row
  const triggerPhotoUpload = (index: number) => {
      activeFileRow.current = index;
      fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeFileRow.current !== null) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const newB = [...breakdown];
              newB[activeFileRow.current!] = { ...newB[activeFileRow.current!], photo: reader.result as string };
              setBreakdown(newB);
              activeFileRow.current = null;
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) {
                  const added = db.importLogisticsFromCSV(text);
                  notify(`Imported ${added} logistics entries.`);
                  setEntries(db.getLogisticsEntries());
              }
          };
          reader.readAsText(file);
      }
  };
  
  const handleEdit = (entry: LogisticsEntry) => {
      setEditingId(entry.id);
      setVehicleNo(entry.vehicleNo || '');
      
      // Parse Date and Time
      const d = new Date(entry.date);
      setArrivalDate(d.toISOString().split('T')[0]);
      setArrivalTime(d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));

      // Setup Customer
      if (PREDEFINED_CUSTOMERS.includes(entry.customerName)) {
          setCustomerMode('SELECT');
          setSelectedCustomer(entry.customerName);
      } else {
          setCustomerMode('NEW');
          setNewCustomerName(entry.customerName);
      }

      // Restore Breakdown
      if (entry.breakdown && entry.breakdown.length > 0) {
          setBreakdown(entry.breakdown.map(b => ({
              name: b.name,
              gross: b.grossWeight.toString(),
              tare: b.tareWeight.toString(),
              photo: b.photoUrl
          })));
      } else {
          // Legacy format fallback
          setBreakdown([{ name: entry.itemsDescription, gross: entry.totalNetWeight.toString(), tare: '0', photo: null }]);
      }
      
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const cancelEdit = () => {
      setEditingId(null);
      setVehicleNo('');
      setBreakdown([{ name: 'Mixed E-Waste', gross: '', tare: '', photo: null }]);
      setCustomerMode('SELECT');
      setNewCustomerName('');
      setSelectedCustomer(PREDEFINED_CUSTOMERS[0]);
      setArrivalDate(new Date().toISOString().split('T')[0]);
      setArrivalTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));
  };

  // Real-time Calculation: Net = Gross - Tare
  const processedBreakdown = breakdown.map(item => {
      const g = parseFloat(item.gross) || 0;
      const t = parseFloat(item.tare) || 0;
      return {
          ...item,
          net: Math.max(0, g - t)
      };
  });

  const totalNetWeight = processedBreakdown.reduce((acc, item) => acc + item.net, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const finalCustomer = customerMode === 'NEW' ? newCustomerName.trim() : selectedCustomer;
    if (!finalCustomer) {
        notify("Please specify a customer.");
        return;
    }

    // Filter valid rows
    const validBreakdown: LogisticsItemBreakdown[] = processedBreakdown
        .filter(b => b.name && b.net >= 0)
        .map(b => ({
            name: b.name,
            grossWeight: parseFloat(b.gross) || 0,
            tareWeight: parseFloat(b.tare) || 0,
            netWeight: b.net,
            photoUrl: b.photo
        }));

    if (validBreakdown.length === 0) {
        notify("Please add at least one item with valid weight.");
        return;
    }

    const itemsSummary = validBreakdown.map(b => `${b.name} (${b.netWeight}kg)`).join(', ');
    
    // Combine Date and Time into ISO string
    const finalDateTime = new Date(`${arrivalDate}T${arrivalTime}`).toISOString();

    if (editingId) {
        // Update existing
        const oldEntry = entries.find(e => e.id === editingId);
        if (oldEntry) {
            db.updateLogisticsEntry({
                ...oldEntry,
                customerName: finalCustomer,
                vehicleNo,
                totalNetWeight,
                itemsDescription: itemsSummary,
                breakdown: validBreakdown,
                date: finalDateTime
            });
            notify("Transaction updated");
            setEditingId(null);
        }
    } else {
        // Create New
        db.addLogisticsEntry({
            customerName: finalCustomer,
            vehicleNo,
            date: finalDateTime,
            totalNetWeight: totalNetWeight,
            itemsDescription: itemsSummary,
            breakdown: validBreakdown,
            recordedBy: user.name
        });
        notify("Logistics transaction recorded");
    }

    // Reset Form
    cancelEdit();
    setEntries(db.getLogisticsEntries());
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logistics & Weighbridge</h1>
            <p className="text-gray-500 text-sm">Manage inbound customer loads with per-item weight breakdown.</p>
          </div>
          {canManage && (
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                 <Button variant="ghost" size="sm" onClick={() => db.exportLogisticsToCSV()} title="Export Logistics"><Download className="w-4 h-4"/></Button>
                 <Button variant="ghost" size="sm" onClick={() => csvInputRef.current?.click()} title="Import Logistics"><Upload className="w-4 h-4"/></Button>
                 <input type="file" hidden ref={csvInputRef} onChange={handleCSVImport} accept=".csv"/>
              </div>
          )}
       </div>

      {/* Hidden File Input for Rows */}
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileSelect}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form Section */}
        {canManage ? (
            <div className="lg:col-span-1">
            <div className={`p-6 rounded-xl shadow-sm border ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6 text-gray-800">
                    <div className="flex items-center">
                        <Scale className="w-5 h-5 mr-2 text-primary-600"/>
                        <h3 className="text-lg font-bold">{editingId ? 'Edit Transaction' : 'New Load Entry'}</h3>
                    </div>
                    {editingId && (
                        <button onClick={cancelEdit} className="text-xs text-red-500 underline">Cancel Edit</button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Customer Selection */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                        <label className="block text-sm font-bold text-gray-700">Customer & Vehicle</label>
                        {customerMode === 'SELECT' ? (
                            <div>
                                <select 
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm p-2 border bg-white text-gray-900"
                                    value={selectedCustomer}
                                    onChange={(e) => {
                                        if(e.target.value === 'NEW') {
                                            setCustomerMode('NEW');
                                        } else {
                                            setSelectedCustomer(e.target.value);
                                        }
                                    }}
                                >
                                    {PREDEFINED_CUSTOMERS.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="NEW">+ Add New Customer...</option>
                                </select>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm p-2 border bg-white text-gray-900"
                                    placeholder="Enter Customer Name"
                                    value={newCustomerName}
                                    onChange={e => setNewCustomerName(e.target.value)}
                                    autoFocus
                                />
                                <button 
                                    type="button"
                                    className="px-2 text-xs text-blue-600 underline"
                                    onClick={() => setCustomerMode('SELECT')}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        <input 
                            type="text" 
                            required
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm p-2 border bg-white text-gray-900"
                            placeholder="Vehicle Number"
                            value={vehicleNo}
                            onChange={(e) => setVehicleNo(e.target.value)}
                        />
                    </div>
                    
                    {/* Date and Time Selection */}
                     <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                        <label className="block text-sm font-bold text-gray-700">Arrival Details</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 flex items-center mb-1"><Calendar className="w-3 h-3 mr-1"/> Date</label>
                                <input 
                                    type="date"
                                    required
                                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm p-2 border bg-white"
                                    value={arrivalDate}
                                    onChange={(e) => setArrivalDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 flex items-center mb-1"><Clock className="w-3 h-3 mr-1"/> Time</label>
                                <input 
                                    type="time"
                                    required
                                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm p-2 border bg-white"
                                    value={arrivalTime}
                                    onChange={(e) => setArrivalTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="block text-sm font-bold text-gray-700">Item Weight Breakdown</label>
                        </div>
                        
                        <div className="space-y-3">
                            {processedBreakdown.map((row, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg border border-gray-300 shadow-sm">
                                    <div className="flex justify-between mb-2">
                                        <input 
                                            list="logistics-items"
                                            className="w-full border-gray-300 rounded-md text-sm p-2 border bg-white text-gray-900 font-medium"
                                            placeholder="Item Name (e.g. Printers)"
                                            value={row.name}
                                            onChange={e => handleRowChange(idx, 'name', e.target.value)}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveRow(idx)}
                                            className="ml-2 text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-bold">Gross (KG)</label>
                                            <input 
                                                type="number"
                                                className="w-full border-gray-300 rounded-md text-sm p-1 border bg-white text-gray-900"
                                                placeholder="0"
                                                value={row.gross}
                                                onChange={e => handleRowChange(idx, 'gross', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-bold">Tare (KG)</label>
                                            <input 
                                                type="number"
                                                className="w-full border-gray-300 rounded-md text-sm p-1 border bg-white text-gray-900"
                                                placeholder="0"
                                                value={row.tare}
                                                onChange={e => handleRowChange(idx, 'tare', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-green-600 uppercase font-bold">Net (KG)</label>
                                            <div className="w-full p-1 text-sm font-bold text-green-700 bg-green-50 rounded border border-green-100 text-center">
                                                {row.net.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        {row.photo ? (
                                            <div className="flex items-center space-x-2">
                                                <img src={row.photo} alt="item" className="w-8 h-8 rounded border object-cover"/>
                                                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                                    <ImageIcon className="w-3 h-3 mr-1 inline"/> Attached
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={() => triggerPhotoUpload(idx)}
                                                className="flex items-center text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors bg-white border border-blue-200"
                                            >
                                                <Camera className="w-3 h-3 mr-1"/> Add Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <datalist id="logistics-items">
                            {COMMON_LOGISTICS_ITEMS.map(item => <option key={item} value={item}/>)}
                        </datalist>

                        <button 
                            type="button" 
                            onClick={handleAddRow}
                            className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 font-medium flex items-center justify-center hover:border-primary-500 hover:text-primary-600 bg-white"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Another Item
                        </button>
                    </div>

                    <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-primary-900">Total Net Weight</span>
                        <span className="text-xl font-bold text-primary-700">{totalNetWeight.toLocaleString()} <span className="text-sm font-normal">KG</span></span>
                    </div>

                    <Button type="submit" className="w-full text-lg py-3 shadow-md">
                        {editingId ? 'Update Transaction' : 'Record Transaction'}
                    </Button>
                </form>
            </div>
            </div>
        ) : (
            <div className="lg:col-span-1">
                 <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                     <p>You do not have permission to add logistics entries.</p>
                 </div>
            </div>
        )}

        {/* History List */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
               <h3 className="text-sm font-semibold text-gray-900">Recent Loads</h3>
               <Truck className="w-4 h-4 text-gray-400" />
             </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items Breakdown</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Net</th>
                            {canEditRecords && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Edit</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                    <div className="font-bold text-gray-900">{new Date(entry.date).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-400 flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap align-top">
                                    <div className="text-sm font-bold text-gray-900">{entry.customerName}</div>
                                    <div className="text-xs text-gray-500">{entry.vehicleNo}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 align-top">
                                    {entry.breakdown ? (
                                        <div className="space-y-2">
                                            {entry.breakdown.map((item, i) => (
                                                <div key={i} className="flex flex-col border-b border-gray-100 last:border-0 pb-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">{item.name}</span>
                                                        {item.photoUrl && <ImageIcon className="w-3 h-3 text-blue-400"/>}
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>GW: {item.grossWeight} | TW: {item.tareWeight}</span>
                                                        <span className="font-mono font-bold text-gray-800">Net: {item.netWeight} kg</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">{entry.itemsDescription}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                                    <span className="text-sm font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                        {entry.totalNetWeight.toLocaleString()} kg
                                    </span>
                                </td>
                                {canEditRecords && (
                                    <td className="px-6 py-4 text-right align-top">
                                        <button 
                                            onClick={() => handleEdit(entry)}
                                            className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded"
                                            title="Edit Record"
                                        >
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
      </div>
    </div>
  );
};