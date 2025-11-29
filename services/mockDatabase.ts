import { InventoryItem, Machine, MaterialType, Transaction, User, UserRole, WorkLog, MaintenanceTask, MaintenanceStatus, Visitor, AssignedTask, AppConfig, WorkCategory, Permission, SourceItem, MaintenanceFrequency, LogisticsEntry, TechItem, AttendanceRecord } from '../types';

/**
 * INITIAL DATA CONSTANTS
 * These serve as the default seeds when the application loads for the first time
 * or when LocalStorage is empty.
 */

const INITIAL_USERS: User[] = [
  // System Architect - Tech (Yasin)
  { 
    id: 'u1', 
    name: 'Yasin', 
    role: UserRole.ADMIN, 
    email: 'yasin@evergreen.com',
    password: '123',
    // Full Permissions including new granular ones
    permissions: ['VIEW_ANALYTICS', 'MANAGE_USERS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY', 'VIEW_FINANCE', 'MANAGE_TASKS', 'VIEW_LOGS', 'MANAGE_LOGS', 'ACCESS_OPERATIONS_LOGS', 'ACCESS_TECH_OPS_LOGS', 'VIEW_LOGISTICS', 'MANAGE_LOGISTICS', 'VIEW_VISITORS', 'MANAGE_VISITORS', 'MANAGE_SYSTEM', 'VIEW_ATTENDANCE', 'VIEW_WATER_LEVEL', 'VIEW_MACHINES', 'VIEW_TASKS', 'EDIT_RECORDS'],
    department: 'Secure Vault',
    jobTitle: 'Mechatronics Engineer / System Architect'
  },
  // CMD
  { 
    id: 'u2', 
    name: 'Jisha', 
    role: UserRole.ADMIN, 
    email: 'jisha@evergreen.com',
    password: '123',
    permissions: ['VIEW_ANALYTICS', 'MANAGE_USERS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY', 'VIEW_FINANCE', 'MANAGE_TASKS', 'VIEW_LOGS', 'ACCESS_OPERATIONS_LOGS', 'ACCESS_TECH_OPS_LOGS', 'VIEW_LOGISTICS', 'MANAGE_LOGISTICS', 'VIEW_VISITORS', 'MANAGE_VISITORS', 'VIEW_ATTENDANCE', 'VIEW_WATER_LEVEL', 'VIEW_MACHINES', 'VIEW_TASKS', 'EDIT_RECORDS'],
    department: 'Management',
    jobTitle: 'CMD'
  },
  // Plant Engineers
  { 
    id: 'u3', 
    name: 'Akshay', 
    role: UserRole.ADMIN, 
    email: 'akshay@evergreen.com',
    password: '123',
    permissions: ['VIEW_ANALYTICS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY', 'MANAGE_TASKS', 'VIEW_LOGS', 'ACCESS_OPERATIONS_LOGS', 'ACCESS_TECH_OPS_LOGS', 'VIEW_LOGISTICS', 'MANAGE_LOGISTICS', 'VIEW_WATER_LEVEL', 'VIEW_ATTENDANCE', 'VIEW_MACHINES', 'VIEW_TASKS', 'EDIT_RECORDS'],
    department: 'Engineering',
    jobTitle: 'Plant Engineer'
  },
  // Safety
  { 
    id: 'u4', 
    name: 'Hassan', 
    role: UserRole.SUPERVISOR, 
    email: 'hassan@evergreen.com',
    password: '123',
    permissions: ['VIEW_LOGS', 'MANAGE_TASKS', 'VIEW_ANALYTICS', 'VIEW_WATER_LEVEL', 'VIEW_ATTENDANCE', 'VIEW_MACHINES', 'VIEW_TASKS'],
    department: 'Safety',
    jobTitle: 'Safety Officer'
  },
  // Tech - Secure Vault Team
  { 
    id: 'u5', 
    name: 'Abdullah', 
    role: UserRole.TECHNICIAN, 
    email: 'abdullah@evergreen.com',
    password: '123',
    permissions: ['VIEW_LOGS', 'MANAGE_LOGS', 'ACCESS_TECH_OPS_LOGS', 'VIEW_ATTENDANCE', 'VIEW_MACHINES', 'VIEW_TASKS'],
    department: 'Secure Vault',
    jobTitle: 'IT Technician'
  },
  { 
    id: 'u6', 
    name: 'Muhammed', 
    role: UserRole.TECHNICIAN, 
    email: 'muhammed@evergreen.com', 
    password: '123',
    permissions: ['VIEW_LOGS', 'MANAGE_LOGS', 'ACCESS_TECH_OPS_LOGS', 'VIEW_ATTENDANCE', 'VIEW_MACHINES', 'VIEW_TASKS'],
    department: 'Secure Vault',
    jobTitle: 'Electrical Engineer'
  },
  // Finance & HR
  { 
    id: 'u7', 
    name: 'Ammar', 
    role: UserRole.ADMIN, 
    email: 'ammar@evergreen.com',
    password: '123',
    permissions: ['VIEW_ANALYTICS', 'VIEW_FINANCE', 'MANAGE_USERS', 'VIEW_LOGS', 'VIEW_ATTENDANCE'],
    department: 'Finance/HR',
    jobTitle: 'Senior Finance & HR'
  },
  { 
    id: 'u8', 
    name: 'Fathima', 
    role: UserRole.ADMIN, 
    email: 'fathima@evergreen.com',
    password: '123',
    permissions: ['VIEW_FINANCE', 'VIEW_LOGS', 'VIEW_ATTENDANCE'],
    department: 'Finance',
    jobTitle: 'Junior Finance'
  },
  // Supervisors
  { 
    id: 'u9', 
    name: 'KING', 
    role: UserRole.SUPERVISOR, 
    email: 'king@evergreen.com',
    password: '123',
    permissions: ['MANAGE_TASKS', 'VIEW_LOGS', 'MANAGE_LOGS', 'ACCESS_OPERATIONS_LOGS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY', 'VIEW_LOGISTICS', 'MANAGE_LOGISTICS', 'VIEW_ANALYTICS', 'VIEW_ATTENDANCE', 'VIEW_WATER_LEVEL', 'VIEW_MACHINES', 'VIEW_TASKS', 'EDIT_RECORDS'],
    department: 'Operations',
    jobTitle: 'Supervisor'
  },
  // Security - Akthar (Specific Access)
  { 
    id: 'w6', 
    name: 'Akthar', 
    role: UserRole.SUPERVISOR, 
    email: 'akthar@evergreen.com', 
    password: '123',
    permissions: ['VIEW_VISITORS', 'MANAGE_VISITORS', 'VIEW_LOGS', 'VIEW_ATTENDANCE'], 
    department: 'Security',
    jobTitle: 'Security Officer'
  },
  // Workers - Manual
  { id: 'w1', name: 'Safther', role: UserRole.WORKER, email: 'safther@evergreen.com', password: '123', permissions: ['VIEW_ANALYTICS', 'VIEW_TASKS'], department: 'Ops' },
  { id: 'w2', name: 'Shafeeq', role: UserRole.WORKER, email: 'shafeeq@evergreen.com', password: '123', permissions: ['VIEW_ANALYTICS', 'VIEW_TASKS'], department: 'Ops' },
  { id: 'w3', name: 'Thamveer', role: UserRole.WORKER, email: 'thamveer@evergreen.com', password: '123', permissions: ['VIEW_ANALYTICS', 'VIEW_TASKS'], department: 'Ops' },
  { id: 'w4', name: 'Humphrey', role: UserRole.WORKER, email: 'humphrey@evergreen.com', password: '123', permissions: ['VIEW_ANALYTICS', 'VIEW_TASKS'], department: 'Ops' },
  { id: 'w5', name: 'Rashid', role: UserRole.WORKER, email: 'rashid@evergreen.com', password: '123', permissions: ['VIEW_ANALYTICS', 'VIEW_TASKS'], department: 'Ops' },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'i1', type: MaterialType.MOTHERBOARD, category: 'OPERATIONS', status: 'CURRENT', quantityKg: 1250, location: 'Warehouse A', lastUpdated: new Date().toISOString(), customName: 'Dell Motherboards' },
  { id: 'i2', type: MaterialType.PLASTIC, category: 'OPERATIONS', status: 'CURRENT', quantityKg: 5000, location: 'Yard B', lastUpdated: new Date().toISOString() },
  { id: 'i3', type: MaterialType.BATTERY, category: 'OPERATIONS', status: 'FOR_SALE', quantityKg: 300, location: 'Hazmat Zone', lastUpdated: new Date().toISOString(), salesDetails: { grossWeight: 310, tareWeight: 10, netWeight: 300, packagingType: 'BOX'} },
  { id: 'i4', type: MaterialType.COPPER, category: 'OPERATIONS', status: 'CURRENT', quantityKg: 450, location: 'Secure Cage', lastUpdated: new Date().toISOString() },
  { id: 'i5', type: MaterialType.GOLD_PLATE_BOARD, category: 'OPERATIONS', status: 'CURRENT', quantityKg: 120, location: 'Secure Cage', lastUpdated: new Date().toISOString() },
  { id: 'i6', type: MaterialType.RAM, category: 'TECH_OPS', status: 'CURRENT', quantityKg: 0, quantityUnits: 150, location: 'Tech Lab', lastUpdated: new Date().toISOString(), customName: 'Mixed RAM Stick' },
];

const INITIAL_MACHINES: Machine[] = [
    { id: 'm1', name: 'Shredder X2000', status: 'OPERATIONAL', lastServiceDate: '2023-10-01', temperature: 65, rpm: 1200, powerUsage: 45, isManualControl: false },
    { id: 'm2', name: 'Conveyor Belt A', status: 'MAINTENANCE', lastServiceDate: '2023-10-15', temperature: 25, rpm: 0, powerUsage: 0, isManualControl: false },
    { id: 'm3', name: 'Hydraulic Press', status: 'OPERATIONAL', lastServiceDate: '2023-09-20', temperature: 40, rpm: 0, powerUsage: 12, isManualControl: false },
    { id: 'm4', name: 'Forklift 1', status: 'OPERATIONAL', lastServiceDate: '2023-10-05', temperature: 75, rpm: 2400, powerUsage: 8, isManualControl: false },
];

const INITIAL_WATER_LEVELS = {
    fire: 85,
    normal: 60,
    drinking: 40,
    overhead1: 90,
    overhead2: 55
};

const INITIAL_CONFIG: AppConfig = {
    adminRemark: 'Keep safety gear on at all times.',
    lastUpdated: new Date().toISOString(),
    cloudBackupUrl: '',
    customSourceItems: [],
    customMaterialTypes: [],
    customTechItems: [],
    // Initial Tech Lists for Dropdowns
    customRamGenerations: ['PC2', 'PC3', 'PC4', 'PC5'],
    customRamSizes: ['1GB', '2GB', '4GB', '8GB', '16GB', '32GB', '64GB'],
    customProcessorTypes: ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'Intel Xeon', 'AMD Ryzen', 'AMD EPYC'],
    customProcessorGenerations: ['1st Gen', '2nd Gen', '3rd Gen', '4th Gen', '5th Gen', '6th Gen', '7th Gen', '8th Gen', '9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen'],
    customWipingDevices: ['HDD', 'SSD', 'NVMe', 'Laptop', 'Desktop CPU', 'Phone', 'Tablet'],
    systemOverrides: {}
};

/**
 * Helper to generate random logs for visual testing on first load
 */
function generateFakeHistory(): WorkLog[] {
    const logs: WorkLog[] = [];
    const workers = INITIAL_USERS.filter(u => u.role === UserRole.WORKER);
    const today = new Date();
    
    for(let i=0; i<30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        if (date.getDay() === 5) continue; // Skip Friday (Weekend)
        const dateStr = date.toISOString().split('T')[0];
        
        workers.forEach(w => {
            if(Math.random() > 0.3) { 
                 logs.push({
                     id: Math.random().toString(36).substr(2,9),
                     userId: w.id,
                     userName: w.name,
                     date: dateStr,
                     category: WorkCategory.DISMANTLING,
                     taskDescription: 'Routine dismantling',
                     materialType: MaterialType.COPPER,
                     weightProcessedKg: Math.floor(Math.random() * 50) + 10,
                     status: 'APPROVED',
                     hoursWorked: 8,
                     startTime: '08:00',
                     endTime: '17:00',
                     breakStartTime: '13:00',
                     breakEndTime: '14:00'
                 });
            }
        });
    }
    return logs;
}

/**
 * CSV HELPER CLASS
 * Handles converting JSON data to CSV format for downloads,
 * and parsing CSV strings back to JSON for uploads.
 */
class CSVHelper {
  static exportData<T>(data: T[], headers: string[], filename: string) {
    if (!data.length) { alert("No data to export"); return; }
    
    // Create header row
    const csvRows = [headers.join(',')];
    
    // Map data to rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = (row as any)[header] !== undefined ? (row as any)[header] : '';
            // Escape quotes for CSV format
            if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            const stringVal = String(val).replace(/"/g, '""');
            return `"${stringVal}"`;
        });
        csvRows.push(values.join(','));
    }
    
    // Trigger download via Blob
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static parseCSV(csvText: string): any[] {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const results = [];
      
      for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          // Regex to split by comma but ignore commas inside quotes
          const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
          
          const obj: any = {};
          headers.forEach((h, idx) => {
              obj[h] = cleanValues[idx];
          });
          results.push(obj);
      }
      return results;
  }
}

/**
 * LOCAL STORAGE DATABASE
 * Simulates a backend database using the browser's LocalStorage.
 * Handles CRUD operations for Users, Logs, Inventory, Config, etc.
 */
class LocalStorageDatabase {
  
  // Generic Load
  private load<T>(key: string, initial: T): T {
    const saved = localStorage.getItem(key);
    if (!saved) {
        // Special case: Generate fake logs if empty on first load
        if (key === 'logs' && Array.isArray(initial) && initial.length === 0) {
           const fakeLogs = generateFakeHistory();
           this.save('logs', fakeLogs);
           return fakeLogs as unknown as T;
        }
        return initial;
    }
    return JSON.parse(saved);
  }

  // Generic Save
  private save(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  // RESET DATABASE
  resetDatabase() {
      localStorage.clear();
      window.location.reload();
  }
  
  // --- SYSTEM BACKUP / RESTORE ---
  createFullBackup(): string {
      const backupData = {
          users: this.getUsers(),
          inventory: this.getInventory(),
          logs: this.load('logs', []),
          config: this.getConfig(),
          logistics: this.getLogisticsEntries(),
          visitors: this.getVisitors(),
          maintenance: this.load('maintenance', []),
          assignedTasks: this.load('assignedTasks', []),
          machines: this.getMachines(),
          attendance: this.getAllAttendance(),
          waterLevels: this.getWaterLevels(),
          timestamp: new Date().toISOString(),
          version: '2.8.0'
      };
      return JSON.stringify(backupData, null, 2);
  }

  restoreFullBackup(jsonString: string): boolean {
      try {
          const data = JSON.parse(jsonString);
          if (data.users) this.save('users', data.users);
          if (data.inventory) this.save('inventory', data.inventory);
          if (data.logs) this.save('logs', data.logs);
          if (data.config) this.save('config', data.config);
          if (data.logistics) this.save('logistics', data.logistics);
          if (data.visitors) this.save('visitors', data.visitors);
          if (data.maintenance) this.save('maintenance', data.maintenance);
          if (data.assignedTasks) this.save('assignedTasks', data.assignedTasks);
          if (data.machines) this.save('machines', data.machines);
          if (data.attendance) this.save('attendance', data.attendance);
          if (data.waterLevels) this.save('waterLevels', data.waterLevels);
          return true;
      } catch (e) {
          console.error("Restore failed", e);
          return false;
      }
  }

  // --- USER MANAGEMENT ---
  getUsers(): User[] { return this.load('users', INITIAL_USERS); }

  // Filter workers
  getAllWorkers(): User[] {
    const managementIds = ['u2', 'u3', 'u7', 'u8']; 
    let workers = this.getUsers().filter(u => 
        (u.role === UserRole.WORKER || u.role === UserRole.TECHNICIAN || u.role === UserRole.SUPERVISOR || u.id === 'u1') && 
        !managementIds.includes(u.id)
    );
    return workers;
  }
  
  addUser(user: Omit<User, 'id'>) {
    const users = this.getUsers();
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9), password: '123' };
    users.push(newUser);
    this.save('users', users);
    return newUser;
  }
  
  updateUser(updatedUser: User) {
      const users = this.getUsers();
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
          users[index] = updatedUser;
          this.save('users', users);
      }
  }

  updateUserPhoto(id: string, photoUrl: string) {
      const users = this.getUsers();
      const user = users.find(u => u.id === id);
      if (user) {
          user.photoUrl = photoUrl;
          this.save('users', users);
      }
  }

  updateUserPermissions(id: string, permissions: Permission[]) {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      user.permissions = permissions;
      this.save('users', users);
    }
  }

  resetUserPassword(id: string) {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (user) {
        user.password = '123456';
        this.save('users', users);
    }
    return true;
  }
  
  adminSetUserPassword(id: string, newPass: string) {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (user) {
        user.password = newPass;
        this.save('users', users);
    }
    return true;
  }
  
  changeUserPassword(id: string, oldPass: string, newPass: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (user) {
        if (user.password === oldPass) {
            user.password = newPass;
            this.save('users', users);
            return true;
        }
    }
    return false;
  }

  deleteUser(id: string) {
    const users = this.getUsers().filter(u => u.id !== id);
    this.save('users', users);
  }

  getUserById(id: string) { return this.getUsers().find(u => u.id === id); }

  // --- WORK LOGS ---
  getLogs(user: User): WorkLog[] {
    const allLogs = this.load<WorkLog[]>('logs', []);
    return allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addLog(log: Omit<WorkLog, 'id'>) {
    const logs = this.load<WorkLog[]>('logs', []);
    const newLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    logs.push(newLog);
    this.save('logs', logs);
    
    // Auto-Update Inventory if material log
    if (newLog.materialType && newLog.weightProcessedKg) {
        const techCategories = [
          WorkCategory.TECH_SORTING,
          WorkCategory.TESTING,
          WorkCategory.DATA_WIPING,
          WorkCategory.SOFTWARE,
          WorkCategory.REPAIR,
          WorkCategory.OTHER_TECH
        ];
        this.incrementInventory(
            newLog.materialType, 
            newLog.weightProcessedKg, 
            techCategories.includes(newLog.category) ? 'TECH_OPS' : 'OPERATIONS'
        );
    }
  }

  updateLog(updatedLog: WorkLog) {
      const logs = this.load<WorkLog[]>('logs', []);
      const index = logs.findIndex(l => l.id === updatedLog.id);
      if (index !== -1) {
          logs[index] = updatedLog;
          this.save('logs', logs);
      }
  }

  importLogsFromCSV(csvText: string): { createdCount: number } {
      const data = CSVHelper.parseCSV(csvText);
      const logs = this.load<WorkLog[]>('logs', []);
      let count = 0;
      
      data.forEach(row => {
          if (row.id) {
             const idx = logs.findIndex(l => l.id === row.id);
             if (idx !== -1) {
                 logs[idx] = { ...logs[idx], ...row }; // Update
                 return;
             }
          }
          // Create New
          logs.push({
              id: row.id || Math.random().toString(36).substr(2, 9),
              userId: row.userId || 'unknown',
              userName: row.userName || 'Unknown',
              date: row.date || new Date().toISOString().split('T')[0],
              category: row.category || WorkCategory.OTHER_PROD,
              taskDescription: row.taskDescription || '',
              weightProcessedKg: parseFloat(row.weightProcessedKg) || 0,
              hoursWorked: parseFloat(row.hoursWorked) || 0,
              status: 'APPROVED',
              materialType: row.materialType,
              testType: row.testType,
              testOutcome: row.testOutcome,
              diagnosticsResult: row.diagnosticsResult,
              problemDescription: row.problemDescription,
              solutionDescription: row.solutionDescription,
              softwareName: row.softwareName,
              storageType: row.storageType,
              storageSize: row.storageSize,
              deviceType: row.deviceType,
              startTime: row.startTime,
              endTime: row.endTime,
              breakStartTime: row.breakStartTime,
              breakEndTime: row.breakEndTime
          });
          count++;
      });
      
      this.save('logs', logs);
      return { createdCount: count };
  }
  
  exportLogsToCSV(logs: WorkLog[]) {
      CSVHelper.exportData(logs, ['id', 'date', 'userName', 'category', 'taskDescription', 'materialType', 'weightProcessedKg', 'quantityProcessed', 'hoursWorked', 'startTime', 'endTime', 'breakStartTime', 'breakEndTime', 'status', 'testType', 'testOutcome', 'diagnosticsResult', 'problemDescription', 'solutionDescription', 'softwareName', 'storageType', 'storageSize', 'deviceType'], 'WorkLogs');
  }

  getYesterdayPerformance() {
      const logs = this.load<WorkLog[]>('logs', []);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      
      const yLogs = logs.filter(l => l.date === yStr);
      const totalWeight = yLogs.reduce((acc, l) => acc + (l.weightProcessedKg || 0), 0);
      
      const userTotals: Record<string, {name: string, weight: number}> = {};
      yLogs.forEach(l => {
          if (!userTotals[l.userId]) userTotals[l.userId] = { name: l.userName, weight: 0 };
          userTotals[l.userId].weight += (l.weightProcessedKg || 0);
      });
      
      let topPerformer = { name: 'N/A', weight: 0 };
      Object.values(userTotals).forEach(u => {
          if (u.weight > topPerformer.weight) topPerformer = u;
      });
      
      return {
          date: yStr,
          totalWeight,
          topPerformer
      };
  }

  // --- INVENTORY ---
  getInventory(): InventoryItem[] { return this.load('inventory', INITIAL_INVENTORY); }
  
  addInventoryItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>) {
      const inv = this.getInventory();
      inv.push({ ...item, id: Math.random().toString(36).substr(2, 9), lastUpdated: new Date().toISOString() });
      this.save('inventory', inv);
  }

  updateInventoryItem(item: InventoryItem) {
      const inv = this.getInventory();
      const idx = inv.findIndex(i => i.id === item.id);
      if (idx !== -1) {
          inv[idx] = item;
          this.save('inventory', inv);
      }
  }

  incrementInventory(type: string, amount: number, category: 'OPERATIONS' | 'TECH_OPS') {
      const inv = this.getInventory();
      const item = inv.find(i => i.type === type && i.status === 'CURRENT');
      if (item) {
          item.quantityKg += amount;
          item.lastUpdated = new Date().toISOString();
          this.save('inventory', inv);
      } else {
          // Create new if not exists
          this.addInventoryItem({
              type,
              category,
              quantityKg: amount,
              quantityUnits: 0,
              location: 'General Storage',
              status: 'CURRENT'
          });
      }
  }

  moveStockToSales(item: InventoryItem, weight: number, units: number, salesDetails: any) {
      const inv = this.getInventory();
      const currentItem = inv.find(i => i.id === item.id);
      
      if (currentItem) {
          // Decrement current stock
          currentItem.quantityKg -= weight;
          if (currentItem.quantityUnits) currentItem.quantityUnits -= units;
          if (currentItem.quantityKg < 0) currentItem.quantityKg = 0;
          if (currentItem.quantityUnits && currentItem.quantityUnits < 0) currentItem.quantityUnits = 0;
          
          // Create new Sales Item
          const newItem: InventoryItem = {
              ...currentItem,
              id: Math.random().toString(36).substr(2, 9),
              status: 'FOR_SALE',
              quantityKg: weight,
              quantityUnits: units,
              salesDetails,
              lastUpdated: new Date().toISOString()
          };
          inv.push(newItem);
          this.save('inventory', inv);
      }
  }

  exportInventoryToCSV() {
      CSVHelper.exportData(this.getInventory(), ['id', 'type', 'customName', 'category', 'status', 'quantityKg', 'quantityUnits', 'location', 'lastUpdated'], 'Inventory');
  }

  importInventoryFromCSV(csvText: string) {
      const data = CSVHelper.parseCSV(csvText);
      const inv = this.getInventory();
      let created = 0;
      let updated = 0;
      
      data.forEach(row => {
          const existing = inv.find(i => i.id === row.id);
          if (existing) {
              Object.assign(existing, row);
              updated++;
          } else {
              inv.push({
                  id: row.id || Math.random().toString(36).substr(2, 9),
                  ...row,
                  quantityKg: parseFloat(row.quantityKg) || 0,
                  quantityUnits: parseFloat(row.quantityUnits) || 0
              });
              created++;
          }
      });
      this.save('inventory', inv);
      return { created, updated };
  }

  // --- LOGISTICS ---
  getLogisticsEntries(): LogisticsEntry[] {
      return this.load('logistics', []);
  }

  addLogisticsEntry(entry: Omit<LogisticsEntry, 'id'>) {
      const entries = this.getLogisticsEntries();
      entries.unshift({ ...entry, id: Math.random().toString(36).substr(2, 9) });
      this.save('logistics', entries);
  }

  updateLogisticsEntry(entry: LogisticsEntry) {
      const entries = this.getLogisticsEntries();
      const idx = entries.findIndex(e => e.id === entry.id);
      if (idx !== -1) {
          entries[idx] = entry;
          this.save('logistics', entries);
      }
  }

  exportLogisticsToCSV() {
      CSVHelper.exportData(this.getLogisticsEntries(), ['id', 'date', 'customerName', 'vehicleNo', 'itemsDescription', 'totalNetWeight', 'recordedBy'], 'Logistics');
  }

  importLogisticsFromCSV(text: string) {
      const data = CSVHelper.parseCSV(text);
      const current = this.getLogisticsEntries();
      let added = 0;
      data.forEach(row => {
           if (!current.find(c => c.id === row.id)) {
               current.push({ ...row, totalNetWeight: parseFloat(row.totalNetWeight) });
               added++;
           } else {
               const idx = current.findIndex(c => c.id === row.id);
               if (idx !== -1) current[idx] = { ...current[idx], ...row, totalNetWeight: parseFloat(row.totalNetWeight) };
           }
      });
      this.save('logistics', current);
      return added;
  }

  // --- VISITORS ---
  getVisitors(): Visitor[] { return this.load('visitors', []); }
  
  addVisitor(v: Omit<Visitor, 'id'>) {
      const list = this.getVisitors();
      list.unshift({ ...v, id: Math.random().toString(36).substr(2, 9) });
      this.save('visitors', list);
  }

  updateVisitor(v: Visitor) {
      const list = this.getVisitors();
      const idx = list.findIndex(i => i.id === v.id);
      if (idx !== -1) {
          list[idx] = v;
          this.save('visitors', list);
      }
  }

  checkoutVisitor(id: string) {
      const list = this.getVisitors();
      const v = list.find(i => i.id === id);
      if (v) {
          v.outTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          this.save('visitors', list);
      }
  }

  exportVisitorsToCSV() {
      CSVHelper.exportData(this.getVisitors(), ['id', 'date', 'name', 'contact', 'purpose', 'hostName', 'inTime', 'outTime'], 'VisitorLog');
  }
  
  importVisitorsFromCSV(text: string) {
      const data = CSVHelper.parseCSV(text);
      const current = this.getVisitors();
      let added = 0;
      data.forEach(row => {
           if (!current.find(c => c.id === row.id)) {
               current.push(row);
               added++;
           } else {
               const idx = current.findIndex(c => c.id === row.id);
               if (idx !== -1) current[idx] = { ...current[idx], ...row };
           }
      });
      this.save('visitors', current);
      return added;
  }

  // --- MAINTENANCE ---
  getMaintenanceTasks(user: User): MaintenanceTask[] {
      const tasks = this.load<MaintenanceTask[]>('maintenance', []);
      if (user.role === UserRole.TECHNICIAN) {
          return tasks.filter(t => t.technicianId === user.id);
      }
      return tasks;
  }
  
  addMaintenanceTask(task: Omit<MaintenanceTask, 'id' | 'status'>) {
      const tasks = this.load<MaintenanceTask[]>('maintenance', []);
      tasks.push({ ...task, id: Math.random().toString(36).substr(2, 9), status: 'SCHEDULED' });
      this.save('maintenance', tasks);
  }

  updateMaintenanceStatus(id: string, status: MaintenanceStatus) {
      const tasks = this.load<MaintenanceTask[]>('maintenance', []);
      const t = tasks.find(x => x.id === id);
      if (t) {
          t.status = status;
          this.save('maintenance', tasks);
      }
  }
  
  getUpcomingMaintenance(): MaintenanceTask[] {
      const tasks = this.load<MaintenanceTask[]>('maintenance', []);
      const today = new Date();
      return tasks.filter(t => t.status !== 'COMPLETED' && new Date(t.scheduledDate) <= new Date(today.setDate(today.getDate() + 7)));
  }

  exportMaintenanceToCSV() {
      CSVHelper.exportData(this.load('maintenance', []), ['id', 'machineName', 'technicianName', 'scheduledDate', 'status', 'notes', 'frequency'], 'MaintenanceTasks');
  }

  importMaintenanceFromCSV(text: string) {
      const data = CSVHelper.parseCSV(text);
      const current = this.load<MaintenanceTask[]>('maintenance', []);
      let added = 0;
      data.forEach(row => {
          if (!current.find(c => c.id === row.id)) {
              current.push(row);
              added++;
          } else {
               const idx = current.findIndex(c => c.id === row.id);
               if (idx !== -1) current[idx] = { ...current[idx], ...row };
          }
      });
      this.save('maintenance', current);
      return added;
  }
  
  // --- ASSIGNED TASKS ---
  getAssignedTasks(user: User): AssignedTask[] {
      const tasks = this.load<AssignedTask[]>('assignedTasks', []);
      
      // Managers (MANAGE_TASKS permission) or Admin can see everything
      if (user.permissions.includes('MANAGE_TASKS') || user.id === 'u1') {
          return tasks;
      }
      
      // Others see only tasks assigned TO them
      return tasks.filter(t => t.assignedToId === user.id);
  }

  createAssignedTask(task: Omit<AssignedTask, 'id' | 'status'>) {
      const tasks = this.load<AssignedTask[]>('assignedTasks', []);
      tasks.push({ ...task, id: Math.random().toString(36).substr(2, 9), status: 'TODO' });
      this.save('assignedTasks', tasks);
  }

  updateAssignedTaskStatus(id: string, status: 'TODO' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DONE', feedback?: string) {
      const tasks = this.load<AssignedTask[]>('assignedTasks', []);
      const t = tasks.find(x => x.id === id);
      if (t) {
          t.status = status;
          if (feedback) t.managerFeedback = feedback;
          this.save('assignedTasks', tasks);
      }
  }

  exportTasksToCSV() {
       CSVHelper.exportData(this.load('assignedTasks', []), ['id', 'title', 'description', 'assignedToName', 'dueDate', 'status', 'priority'], 'Tasks');
  }

  // --- ATTENDANCE ---
  getAllAttendance(): AttendanceRecord[] {
      return this.load('attendance', []);
  }

  getAttendanceByDate(date: string): AttendanceRecord[] {
      return this.getAllAttendance().filter(r => r.date === date);
  }

  saveAttendance(records: AttendanceRecord[]) {
      const all = this.getAllAttendance();
      // Remove existing for same date/user to prevent dupes from sync
      const filtered = all.filter(r => !records.some(newR => newR.date === r.date && newR.userId === r.userId));
      this.save('attendance', [...filtered, ...records]);
  }
  
  addSingleAttendance(record: AttendanceRecord) {
      const all = this.getAllAttendance();
      // Check update or insert
      const idx = all.findIndex(r => r.userId === record.userId && r.date === record.date);
      if (idx !== -1) {
          all[idx] = { ...all[idx], ...record };
      } else {
          all.push({ ...record, id: Math.random().toString(36).substr(2, 9) });
      }
      this.save('attendance', all);
  }
  
  importAttendanceFromCSV(text: string) {
      const data = CSVHelper.parseCSV(text);
      const all = this.getAllAttendance();
      let added = 0;
      data.forEach(row => {
           const idx = all.findIndex(r => r.id === row.id);
           if (idx !== -1) {
               all[idx] = { ...all[idx], ...row };
           } else {
               all.push(row);
               added++;
           }
      });
      this.save('attendance', all);
      return added;
  }
  
  exportAttendanceToCSV() {
      CSVHelper.exportData(this.getAllAttendance(), ['id', 'date', 'userName', 'inTime', 'outTime', 'status', 'source'], 'Attendance');
  }

  // --- WATER LEVEL ---
  getWaterLevels() {
      return this.load('waterLevels', INITIAL_WATER_LEVELS);
  }

  updateWaterLevels(levels: typeof INITIAL_WATER_LEVELS) {
      this.save('waterLevels', levels);
  }

  // --- SYSTEM CONFIG ---
  getConfig(): AppConfig { return this.load('config', INITIAL_CONFIG); }
  
  updateAdminRemark(remark: string) {
      const config = this.getConfig();
      config.adminRemark = remark;
      config.lastUpdated = new Date().toISOString();
      this.save('config', config);
  }

  updateCloudBackupUrl(url: string) {
      const config = this.getConfig();
      config.cloudBackupUrl = url;
      this.save('config', config);
  }
  
  // Custom List Management
  getCombinedSourceItems(): string[] {
      const config = this.getConfig();
      // Merge system defaults + custom items
      const defaults = Object.values(SourceItem);
      const customs = config.customSourceItems || [];
      return Array.from(new Set([...defaults, ...customs])).sort();
  }
  
  addCustomSourceItem(item: string) {
      const config = this.getConfig();
      config.customSourceItems = [...(config.customSourceItems || []), item];
      this.save('config', config);
  }

  getCombinedMaterialTypes(): string[] {
      const config = this.getConfig();
      const defaults = Object.values(MaterialType);
      const customs = config.customMaterialTypes || [];
      return Array.from(new Set([...defaults, ...customs])).sort();
  }
  
  addCustomMaterialType(item: string) {
      const config = this.getConfig();
      config.customMaterialTypes = [...(config.customMaterialTypes || []), item];
      this.save('config', config);
  }

  getCombinedTechItems(): string[] {
      const config = this.getConfig();
      const defaults = Object.values(TechItem);
      const customs = config.customTechItems || [];
      return Array.from(new Set([...defaults, ...customs])).sort();
  }

  addCustomTechItem(item: string) {
      const config = this.getConfig();
      config.customTechItems = [...(config.customTechItems || []), item];
      this.save('config', config);
  }

  isCustomItem(name: string, type: 'SOURCE' | 'MATERIAL' | 'TECH'): boolean {
      const config = this.getConfig();
      if (type === 'SOURCE') return (config.customSourceItems || []).includes(name);
      if (type === 'MATERIAL') return (config.customMaterialTypes || []).includes(name);
      return (config.customTechItems || []).includes(name);
  }

  removeCustomItem(type: 'SOURCE' | 'MATERIAL' | 'TECH', name: string) {
      const config = this.getConfig();
      if (type === 'SOURCE') config.customSourceItems = (config.customSourceItems || []).filter(i => i !== name);
      else if (type === 'MATERIAL') config.customMaterialTypes = (config.customMaterialTypes || []).filter(i => i !== name);
      else config.customTechItems = (config.customTechItems || []).filter(i => i !== name);
      this.save('config', config);
  }

  renameCustomItem(type: 'SOURCE' | 'MATERIAL' | 'TECH', oldName: string, newName: string) {
      this.removeCustomItem(type, oldName);
      if (type === 'SOURCE') this.addCustomSourceItem(newName);
      else if (type === 'MATERIAL') this.addCustomMaterialType(newName);
      else this.addCustomTechItem(newName);
  }
  
  // Generic List Adder
  addCustomListOption(key: keyof AppConfig, value: string) {
      const config = this.getConfig();
      const list = (config[key] as string[]) || [];
      if (!list.includes(value)) {
          (config[key] as string[]) = [...list, value];
          this.save('config', config);
      }
  }
  
  removeCustomListOption(key: keyof AppConfig, value: string) {
      const config = this.getConfig();
      const list = (config[key] as string[]) || [];
      (config[key] as string[]) = list.filter(v => v !== value);
      this.save('config', config);
  }

  // --- MACHINES ---
  getMachines(): Machine[] { return this.load('machines', INITIAL_MACHINES); }
  
  addMachine(m: Omit<Machine, 'id'>) {
      const list = this.getMachines();
      list.push({ ...m, id: Math.random().toString(36).substr(2, 9) });
      this.save('machines', list);
  }
  
  deleteMachine(id: string) {
      const list = this.getMachines().filter(m => m.id !== id);
      this.save('machines', list);
  }

  updateMachineStatus(id: string, updates: Partial<Machine>) {
      const list = this.getMachines();
      const idx = list.findIndex(m => m.id === id);
      if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          this.save('machines', list);
      }
  }
}

export const db = new LocalStorageDatabase();