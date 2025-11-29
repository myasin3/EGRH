


import React, { useState, useRef, useEffect } from 'react';
import { db } from '../services/mockDatabase';
import { Search, Pencil, Plus, X, Camera, Image as ImageIcon, Download, Upload, ChevronLeft, ChevronRight, ShoppingBag, Package, Layers, Cpu, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { InventoryItem, MaterialType } from '../types';
import { Button } from '../components/ui/Button';

export const Inventory: React.FC = () => {
  const { user, hasPermission, notify } = useAuth();
  const [items, setItems] = useState(db.getInventory());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'FOR_SALE'>('CURRENT');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'OPERATIONS' | 'TECH_OPS'>('ALL');

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Move to Sale Modal
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleItem, setSaleItem] = useState<InventoryItem | null>(null);
  const [saleMode, setSaleMode] = useState<'JUMBO_BAG' | 'LOOSE'>('JUMBO_BAG');
  const [moveQty, setMoveQty] = useState('');
  const [moveUnits, setMoveUnits] = useState('');
  const [saleGW, setSaleGW] = useState('');
  const [saleTW, setSaleTW] = useState('');

  // Gallery Modal State
  const [galleryItem, setGalleryItem] = useState<InventoryItem | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Form State
  const [formType, setFormType] = useState<string>(MaterialType.PCB);
  const [formCategory, setFormCategory] = useState<'OPERATIONS' | 'TECH_OPS'>('OPERATIONS');
  const [formCustomName, setFormCustomName] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formUnits, setFormUnits] = useState('');
  const [formLoc, setFormLoc] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]); // Handles multiple base64 images

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const canEdit = hasPermission('MANAGE_INVENTORY') || user?.id === 'u1';

  // Filter items based on search term and active tab
  const filteredItems = items.filter(item => {
    const matchesSearch = item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.customName && item.customName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = item.status === activeTab;
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    return matchesSearch && matchesTab && matchesCategory;
  });

  // Prepares the modal for adding a new item
  const openAddModal = () => {
      setEditingItem(null);
      setFormType(MaterialType.PCB);
      setFormCategory('OPERATIONS');
      setFormCustomName('');
      setFormQty('');
      setFormUnits('');
      setFormLoc('');
      setFormImages([]);
      setIsModalOpen(true);
  };

  // Prepares the modal for editing existing item
  const openEditModal = (item: InventoryItem) => {
      setEditingItem(item);
      setFormType(item.type);
      setFormCategory(item.category);
      setFormCustomName(item.customName || '');
      setFormQty(item.quantityKg.toString());
      setFormUnits(item.quantityUnits ? item.quantityUnits.toString() : '');
      setFormLoc(item.location);
      // Fallback to imageUrl if images array is empty (backward compatibility)
      setFormImages(item.images && item.images.length > 0 ? item.images : (item.imageUrl ? [item.imageUrl] : []));
      setIsModalOpen(true);
  };

  const openMoveToSaleModal = (item: InventoryItem) => {
      setSaleItem(item);
      setSaleMode('JUMBO_BAG');
      setMoveQty(''); // Weight
      setMoveUnits(''); // Units
      setSaleGW('');
      setSaleTW('');
      setIsSaleModalOpen(true);
  };

  // Opens the photo gallery lightbox
  const openGallery = (item: InventoryItem) => {
      if (!item.images || item.images.length === 0) {
          if (item.imageUrl) {
              setGalleryItem({ ...item, images: [item.imageUrl] });
              setGalleryIndex(0);
          }
          return;
      }
      setGalleryItem(item);
      setGalleryIndex(0);
  };

  // Handles File Input change to convert to Base64
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          Array.from(files).forEach((file: File) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  setFormImages(prev => [...prev, reader.result as string]);
              };
              reader.readAsDataURL(file);
          });
      }
  };

  const removeImage = (index: number) => {
      setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      const qty = parseFloat(formQty) || 0;
      const units = parseFloat(formUnits) || 0;

      const itemData = {
          type: formType,
          category: formCategory,
          customName: formCustomName,
          quantityKg: qty,
          quantityUnits: units,
          location: formLoc,
          images: formImages,
          imageUrl: formImages[0] || '' // Legacy support
      };

      if (editingItem) {
          // Update Existing
          db.updateInventoryItem({
              ...editingItem,
              ...itemData,
              lastUpdated: new Date().toISOString()
          });
          notify("Item stock updated");
      } else {
          // Create New
          db.addInventoryItem({
              ...itemData,
              status: 'CURRENT'
          });
          notify("New item added to inventory");
      }
      setItems(db.getInventory());
      setIsModalOpen(false);
  };

  const handleMoveToSale = (e: React.FormEvent) => {
      e.preventDefault();
      if (!saleItem) return;

      const weightToMove = parseFloat(moveQty) || 0;
      const unitsToMove = parseFloat(moveUnits) || 0;
      
      let salesDetails = undefined;

      if (saleMode === 'JUMBO_BAG') {
          const gw = parseFloat(saleGW) || 0;
          const tw = parseFloat(saleTW) || 0;
          const nw = gw - tw;
          
          if (nw <= 0) {
              notify("Net Weight must be greater than 0");
              return;
          }
          salesDetails = { gw, tw, nw, pkg: 'JUMBO_BAG' as const };
      } else {
          // Loose
           salesDetails = { gw: weightToMove, tw: 0, nw: weightToMove, pkg: 'LOOSE' as const };
      }

      db.moveStockToSales(saleItem, weightToMove || salesDetails.nw, unitsToMove, salesDetails);
      notify(`${saleItem.type} moved to sales.`);
      setItems(db.getInventory());
      setIsSaleModalOpen(false);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) {
                  const res = db.importInventoryFromCSV(text);
                  notify(`Imported ${res.created} new items, updated ${res.updated} items.`);
                  setItems(db.getInventory());
              }
          };
          reader.readAsText(file);
      }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm">Real-time stock levels across all zones</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {canEdit && (
              <div className="flex bg-gray-100 rounded-lg p-0.5 mr-2">
                 <Button variant="ghost" size="sm" onClick={() => db.exportInventoryToCSV()} title="Export Inventory"><Download className="w-4 h-4"/></Button>
                 <Button variant="ghost" size="sm" onClick={() => csvInputRef.current?.click()} title="Import Inventory"><Upload className="w-4 h-4"/></Button>
                 <input type="file" hidden ref={csvInputRef} onChange={handleCSVImport} accept=".csv"/>
              </div>
          )}
          
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 shadow-sm"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canEdit && (
              <Button onClick={openAddModal}>
                  Add Item <Plus className="ml-2 w-4 h-4"/>
              </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
          <button 
             onClick={() => setActiveTab('CURRENT')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all ${activeTab === 'CURRENT' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
              <Package className="w-4 h-4 mr-2"/> Current Stock
          </button>
          <button 
             onClick={() => setActiveTab('FOR_SALE')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all ${activeTab === 'FOR_SALE' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
              <ShoppingBag className="w-4 h-4 mr-2"/> Ready For Sale
          </button>
      </div>

      {/* Sub Filter */}
      <div className="flex space-x-4 border-b border-gray-200 pb-2">
          <button onClick={() => setCategoryFilter('ALL')} className={`text-sm pb-2 border-b-2 ${categoryFilter === 'ALL' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}>All Categories</button>
          <button onClick={() => setCategoryFilter('OPERATIONS')} className={`text-sm pb-2 border-b-2 ${categoryFilter === 'OPERATIONS' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}>Operations (Materials)</button>
          <button onClick={() => setCategoryFilter('TECH_OPS')} className={`text-sm pb-2 border-b-2 ${categoryFilter === 'TECH_OPS' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}>Tech Ops (Components)</button>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4 animate-fade-in max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">
                          {editingItem ? 'Edit Inventory Item' : 'Add New Item'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5"/>
                      </button>
                  </div>
                  <form onSubmit={handleSave} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select 
                             className="block w-full border-gray-300 rounded-md shadow-sm p-2 border bg-white"
                             value={formCategory}
                             onChange={(e) => setFormCategory(e.target.value as any)}
                          >
                              <option value="OPERATIONS">Operations (Raw Material)</option>
                              <option value="TECH_OPS">Tech Ops (Devices/Parts)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                          <input 
                              list="material-types"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                              value={formType}
                              onChange={e => setFormType(e.target.value)}
                              placeholder="Select or type..."
                          />
                          <datalist id="material-types">
                             {db.getCombinedMaterialTypes().concat(db.getCombinedTechItems()).map(t => (
                                 <option key={t} value={t}>{t}</option>
                             ))}
                          </datalist>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Name / Description (Optional)</label>
                          <input 
                              type="text"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                              value={formCustomName}
                              onChange={e => setFormCustomName(e.target.value)}
                              placeholder="e.g. Dell Motherboards Batch #5"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (KG)</label>
                            <input 
                                type="number"
                                step="0.1"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                                value={formQty}
                                onChange={e => setFormQty(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Units (Count)</label>
                            <input 
                                type="number"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                                value={formUnits}
                                onChange={e => setFormUnits(e.target.value)}
                            />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Warehouse A"
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 border bg-white text-gray-900"
                            value={formLoc}
                            onChange={e => setFormLoc(e.target.value)}
                          />
                      </div>
                      
                      {/* Image Upload Area */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reference Photos</label>
                          <div className="grid grid-cols-4 gap-2 mb-2">
                              {formImages.map((img, idx) => (
                                  <div key={idx} className="relative aspect-square">
                                      <img src={img} alt="Preview" className="w-full h-full object-cover rounded-md border border-gray-200"/>
                                      <button 
                                        type="button" 
                                        onClick={() => removeImage(idx)} 
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                                      >
                                          <X className="w-3 h-3"/>
                                      </button>
                                  </div>
                              ))}
                              <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:text-primary-500 hover:border-primary-500 hover:bg-gray-50 transition-colors"
                              >
                                  <Camera className="w-6 h-6 mb-1"/>
                                  <span className="text-xs">Add</span>
                              </button>
                          </div>
                          <input 
                              type="file" 
                              multiple
                              accept="image/*"
                              className="hidden" 
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                          />
                      </div>

                      <div className="flex justify-end pt-4">
                          <Button type="submit">{editingItem ? 'Update Stock' : 'Add to Inventory'}</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
      {/* --- MOVE TO SALE MODAL --- */}
      {isSaleModalOpen && saleItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4 animate-fade-in">
                   <h3 className="text-xl font-bold text-gray-900 mb-2">Move to Sales</h3>
                   <p className="text-sm text-gray-500 mb-4">Moving: <span className="font-bold">{saleItem.customName || saleItem.type}</span></p>
                   
                   <form onSubmit={handleMoveToSale} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <button 
                             type="button"
                             onClick={() => setSaleMode('JUMBO_BAG')} 
                             className={`p-3 border rounded-lg text-sm text-center font-bold ${saleMode === 'JUMBO_BAG' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}
                           >
                               Jumbo Bag / Packed
                           </button>
                           <button 
                             type="button"
                             onClick={() => setSaleMode('LOOSE')} 
                             className={`p-3 border rounded-lg text-sm text-center font-bold ${saleMode === 'LOOSE' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}
                           >
                               Loose Items
                           </button>
                       </div>

                       {saleMode === 'JUMBO_BAG' ? (
                           <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                               <p className="text-xs font-bold text-gray-500 uppercase">Weight Calculation</p>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-xs text-gray-600 mb-1">Gross Weight (GW)</label>
                                       <input type="number" step="0.1" className="w-full p-2 border rounded" value={saleGW} onChange={e => setSaleGW(e.target.value)} />
                                   </div>
                                   <div>
                                       <label className="block text-xs text-gray-600 mb-1">Tare Weight (TW)</label>
                                       <input type="number" step="0.1" className="w-full p-2 border rounded" value={saleTW} onChange={e => setSaleTW(e.target.value)} />
                                   </div>
                               </div>
                               <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                   <span className="text-sm font-bold">Net Weight:</span>
                                   <span className="text-lg font-bold text-green-700">
                                       {(parseFloat(saleGW || '0') - parseFloat(saleTW || '0')).toFixed(2)} KG
                                   </span>
                               </div>
                           </div>
                       ) : (
                           <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">Weight to Move (KG)</label>
                               <input type="number" step="0.1" className="w-full p-2 border rounded" value={moveQty} onChange={e => setMoveQty(e.target.value)} />
                           </div>
                       )}
                       
                       {saleItem.category === 'TECH_OPS' && (
                           <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">Units (Count)</label>
                               <input type="number" className="w-full p-2 border rounded" value={moveUnits} onChange={e => setMoveUnits(e.target.value)} />
                           </div>
                       )}

                       <div className="flex justify-end space-x-3 pt-4">
                           <Button variant="secondary" onClick={() => setIsSaleModalOpen(false)}>Cancel</Button>
                           <Button type="submit">Confirm Move</Button>
                       </div>
                   </form>
              </div>
          </div>
      )}

      {/* --- GALLERY LIGHTBOX MODAL --- */}
      {galleryItem && galleryItem.images && galleryItem.images.length > 0 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm animate-fade-in">
              <button 
                  onClick={() => setGalleryItem(null)} 
                  className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-50"
              >
                  <X className="w-8 h-8"/>
              </button>
              
              <div className="relative w-full max-w-4xl max-h-screen p-4 flex flex-col items-center">
                  <img 
                      src={galleryItem.images[galleryIndex]} 
                      alt="Gallery" 
                      className="max-h-[80vh] w-auto object-contain rounded shadow-2xl"
                  />
                  
                  <div className="mt-4 text-white text-center">
                      <h3 className="text-xl font-bold">{galleryItem.customName || galleryItem.type}</h3>
                      <p className="text-gray-400 text-sm">Image {galleryIndex + 1} of {galleryItem.images.length}</p>
                  </div>

                  {/* Navigation Arrows */}
                  {galleryItem.images.length > 1 && (
                      <>
                          <button 
                              onClick={() => setGalleryIndex(i => (i === 0 ? galleryItem.images!.length - 1 : i - 1))}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-md transition-colors"
                          >
                              <ChevronLeft className="w-8 h-8"/>
                          </button>
                          <button 
                              onClick={() => setGalleryIndex(i => (i === galleryItem.images!.length - 1 ? 0 : i + 1))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-md transition-colors"
                          >
                              <ChevronRight className="w-8 h-8"/>
                          </button>
                      </>
                  )}
              </div>
          </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                {activeTab === 'FOR_SALE' && (
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                      {item.images && item.images.length > 0 ? (
                          <div className="relative group cursor-pointer" onClick={() => openGallery(item)}>
                              <img src={item.images[0]} alt={item.type} className="w-12 h-12 rounded object-cover border border-gray-200"/>
                              {item.images.length > 1 && (
                                  <div className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold px-1.5 rounded-full border border-white">
                                      +{item.images.length - 1}
                                  </div>
                              )}
                          </div>
                      ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-6 h-6"/>
                          </div>
                      )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{item.customName || item.type}</span>
                        {item.customName && <span className="text-xs text-gray-500">{item.type}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      {item.category === 'TECH_OPS' ? (
                          <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-1 rounded-full flex w-fit items-center"><Cpu className="w-3 h-3 mr-1"/> Tech Ops</span>
                      ) : (
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full flex w-fit items-center"><Layers className="w-3 h-3 mr-1"/> Operations</span>
                      )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     <div className="font-bold">{item.quantityKg > 0 ? `${item.quantityKg.toLocaleString()} KG` : '-'}</div>
                     {item.quantityUnits && item.quantityUnits > 0 && (
                         <div className="text-xs text-gray-500">{item.quantityUnits} Units</div>
                     )}
                  </td>
                  {activeTab === 'FOR_SALE' && (
                     <td className="px-6 py-4 text-xs text-gray-600">
                         {item.salesDetails ? (
                             <div>
                                 <span className="font-bold">{item.salesDetails.packagingType?.replace('_', ' ')}</span>
                                 <div className="text-[10px] text-gray-400">GW: {item.salesDetails.grossWeight} | TW: {item.salesDetails.tareWeight}</div>
                             </div>
                         ) : 'Loose'}
                     </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </td>
                  {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                             {activeTab === 'CURRENT' && (
                                 <button 
                                    onClick={() => openMoveToSaleModal(item)}
                                    className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors" 
                                    title="Move to Sale"
                                 >
                                     <ArrowRightLeft className="w-4 h-4"/>
                                 </button>
                             )}
                             <button onClick={() => openEditModal(item)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Edit">
                                  <Pencil className="w-4 h-4" />
                             </button>
                          </div>
                      </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
