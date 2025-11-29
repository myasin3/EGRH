

/**
 * TYPE DEFINITIONS
 * This file contains all the shared Interfaces and Enums used across the application.
 * Centralizing types ensures consistency in data structures.
 */

// --- USER & ROLES ---
export enum UserRole {
  ADMIN = 'ADMIN',        // Full Access (CMD, Engineers, HR)
  SUPERVISOR = 'SUPERVISOR', // Partial Management (Safety, Foremen)
  TECHNICIAN = 'TECHNICIAN', // Technical Ops (IT, Electrical)
  WORKER = 'WORKER'       // Basic Ops
}

// Granular permissions for fine-tuning access control
export type Permission = 
  | 'VIEW_ANALYTICS' 
  | 'MANAGE_USERS' 
  | 'VIEW_INVENTORY'
  | 'MANAGE_INVENTORY' 
  | 'VIEW_FINANCE' 
  | 'VIEW_TASKS'
  | 'MANAGE_TASKS'
  | 'VIEW_LOGS'
  | 'MANAGE_LOGS' 
  | 'ACCESS_OPERATIONS_LOGS' // New: Specific access to Production tab
  | 'ACCESS_TECH_OPS_LOGS'   // New: Specific access to Tech Ops tab
  | 'EDIT_RECORDS'           // New: Ability to edit past data entries
  | 'VIEW_VISITORS'
  | 'MANAGE_VISITORS'
  | 'VIEW_LOGISTICS'
  | 'MANAGE_LOGISTICS'
  | 'VIEW_ATTENDANCE'
  | 'VIEW_WATER_LEVEL'
  | 'VIEW_MACHINES'
  | 'MANAGE_SYSTEM'; // Restricted to System Architect

// --- MATERIAL & ITEM CLASSIFICATIONS ---

// Standard Raw Materials extracted during dismantling
export enum MaterialType {
  // Raw Metals
  PCB = 'PCB',
  MOTHERBOARD = 'MOTHERBOARD',
  GOLD_PLATE_BOARD = 'GOLD_PLATE_BOARD',
  COPPER = 'COPPER',
  DIRTY_COPPER = 'DIRTY_COPPER',
  ALUMINUM = 'ALUMINUM',
  CAST_ALUMINUM = 'CAST_ALUMINUM',
  HARD_ALUMINUM = 'HARD_ALUMINUM',
  DIRTY_ALUMINUM = 'DIRTY_ALUMINUM',
  SOFT_ALUMINUM = 'SOFT_ALUMINUM',
  IRON = 'IRON',
  PLASTIC = 'PLASTIC',
  METAL = 'METAL',
  BRASS = 'BRASS',
  BATTERY = 'BATTERY',
  SCREEN = 'SCREEN',
  CABLE = 'CABLE',
  SIMPLE_CABLE = 'SIMPLE_CABLE',
  SIMPLE_SMALL_CABLE = 'SIMPLE_SMALL_CABLE',
  
  // High-Value Components
  MEDIUM_BOARD = 'MEDIUM_BOARD',
  HIGH_GRADE_BOARD = 'HIGH_GRADE_BOARD',
  HARD_DRIVE_BOARD = 'HARD_DRIVE_BOARD',
  SERVER_BOARD = 'SERVER_BOARD',
  NETWORK_BOARD = 'NETWORK_BOARD',
  BACK_PLAIN_BOARD = 'BACK_PLAIN_BOARD',
  POWER_SUPPLY_GREEN = 'POWER_SUPPLY_GREEN',
  POWER_SUPPLY_NOT_GREEN = 'POWER_SUPPLY_NOT_GREEN',
  DVR_BOARD = 'DVR_BOARD',
  FINGER_BOARD = 'FINGER_BOARD',
  
  // Specific Recovered Items
  LMS = 'LMS',
  HMS = 'HMS',
  MAGNETS = 'MAGNETS',
  FANS = 'FANS',
  RAM = 'RAM',
  PROCESSOR = 'PROCESSOR',
  HARD_DISK = 'HARD_DISK'
}

// Tech items specifically for Category B operations
export enum TechItem {
  RAM_DESKTOP = 'RAM_DESKTOP',
  RAM_SERVER = 'RAM_SERVER',
  RAM_LAPTOP = 'RAM_LAPTOP',
  PROCESSOR_DESKTOP = 'PROCESSOR_DESKTOP',
  PROCESSOR_SERVER = 'PROCESSOR_SERVER',
  CPU = 'CPU',
  LAPTOP = 'LAPTOP',
  HDD = 'HDD',
  SSD = 'SSD',
  MONITOR = 'MONITOR',
  KEYBOARD = 'KEYBOARD',
  MOUSE = 'MOUSE',
  EARPHONES = 'EARPHONES',
  CHARGER = 'CHARGER',
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  SERVER_UNIT = 'SERVER_UNIT',
  SERVER_CHASSIS = 'SERVER_CHASSIS',
  NETWORK_SWITCH = 'NETWORK_SWITCH'
}

// Actions performed in the Secure Vault / Tech area
export enum TechActivityType {
  DATA_WIPING = 'DATA_WIPING',
  QA_TESTING = 'QA_TESTING',
  SORTING = 'SORTING',
  OTHER_TECH = 'OTHER_TECH'
}

export type TechContext = 'Laptop' | 'Desktop' | 'Server';

// Origin items (what is being dismantled)
export enum SourceItem {
  POS_MACHINE = 'POS_MACHINE',
  HDD = 'HDD',
  ODU_DEVICE = 'ODU_DEVICE',
  NETWORK_EQUIPMENT = 'NETWORK_EQUIPMENT',
  SERVER = 'SERVER',
  TV_LCD = 'TV_LCD',
  UPS = 'UPS',
  PRINTER = 'PRINTER',
  OTHER = 'OTHER'
}

// Categories for general timesheets and daily logs
export enum WorkCategory {
  // Production
  DISMANTLING = 'DISMANTLING',
  CLEANING = 'CLEANING',
  SORTING = 'SORTING',
  LOADING_UNLOADING = 'LOADING_UNLOADING',
  OTHER_PROD = 'OTHER_PROD',

  // Tech Ops
  SOFTWARE = 'SOFTWARE',
  TECH_SORTING = 'TECH_SORTING',
  TESTING = 'TESTING',
  DATA_WIPING = 'DATA_WIPING',
  REPAIR = 'REPAIR',
  OTHER_TECH = 'OTHER_TECH',

  // General / Admin
  LEAVE = 'LEAVE',
  ADMINISTRATION = 'ADMINISTRATION',
  MAINTENANCE_WORK = 'MAINTENANCE_WORK'
}

// --- DATA INTERFACES ---

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  permissions: Permission[];
  department?: string;
  jobTitle?: string;
  photoUrl?: string; // Base64 encoded image string
  workerCategory?: string; // Optional category
}

export interface InventoryItem {
  id: string;
  type: MaterialType | string; // Supports custom types
  category: 'OPERATIONS' | 'TECH_OPS'; // New Category Split
  status: 'CURRENT' | 'FOR_SALE' | 'SOLD'; // New Status
  customName?: string;
  quantityKg: number; // Used for Operations (Net Weight)
  quantityUnits?: number; // Used for Tech Ops
  location: string;
  lastUpdated: string; // ISO Date String
  imageUrl?: string; // Legacy field
  images?: string[]; // Array of base64 strings
  
  // Sales Specific Data (Jumbo Bags etc)
  salesDetails?: {
      grossWeight?: number;
      tareWeight?: number;
      netWeight?: number;
      packagingType?: 'JUMBO_BAG' | 'PALLET' | 'BOX' | 'LOOSE';
  };
}

// Logistics breakdown structure
export interface LogisticsItemBreakdown {
  name: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  photoUrl?: string;
}

export interface LogisticsEntry {
  id: string;
  customerName: string;
  vehicleNo?: string;
  date: string; // ISO Date String (includes time)
  totalNetWeight: number;
  itemsDescription: string;
  breakdown?: LogisticsItemBreakdown[]; // Detailed item list
  recordedBy: string;
}

export interface Transaction {
  id: string;
  type: 'INBOUND' | 'OUTBOUND';
  materialType: MaterialType;
  quantityKg: number;
  date: string;
  handledBy: string;
  notes?: string;
}

// Core Daily Log Record
export interface WorkLog {
  id: string;
  userId: string;
  userName: string;
  date: string;
  category: WorkCategory;
  taskDescription: string;
  batchId?: string; // New: To link multiple entries (e.g. source items + materials) to a single batch operation
  
  // Time Tracking
  hoursWorked?: number; // Derived
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  breakStartTime?: string; // HH:MM
  breakEndTime?: string; // HH:MM
  
  // Common Output
  weightProcessedKg?: number; // For manual extraction
  quantityProcessed?: number; // For tech units
  sourceItem?: SourceItem | string;
  sourceQty?: number; // For dismantling source count
  materialType?: MaterialType | string;
  
  // Specific Fields
  location?: string; // Warehouse location
  loadingType?: 'LOADING' | 'UNLOADING';
  deviceType?: string; // For testing/repair/wiping
  testType?: 'DIAGNOSTIC' | 'TROUBLESHOOTING' | 'BASIC';
  testOutcome?: string; // Working/Damage/Specifics
  problemDescription?: string; // Troubleshooting/Repair problem
  solutionDescription?: string; // Troubleshooting/Repair solution
  diagnosticsResult?: string; // Full diagnostics details
  softwareName?: string; // Wiping/Software
  storageType?: string; // Wiping
  storageSize?: string; // Wiping
  
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Machine {
  id: string;
  name: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE';
  lastServiceDate: string;
  // Live monitoring fields
  temperature?: number;
  rpm?: number;
  powerUsage?: number; // kW
  activeHours?: number;
  isManualControl?: boolean; // If true, sensor sync won't override
}

export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
export type MaintenanceFrequency = 'NONE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface MaintenanceTask {
  id: string;
  machineId: string;
  machineName: string;
  technicianId: string;
  technicianName: string;
  scheduledDate: string;
  status: MaintenanceStatus;
  notes?: string;
  frequency: MaintenanceFrequency;
  parentTaskId?: string; // If created by recurrence
}

export interface Visitor {
  id: string;
  name: string;
  contact: string;
  purpose: string;
  inTime: string;
  outTime?: string;
  date: string;
  hostName?: string;
}

export interface AssignedTask {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  assignedById: string;
  assignedByName: string;
  dueDate: string;
  status: 'TODO' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  managerFeedback?: string; // Remark added by manager upon approval
}

export interface AttendanceRecord {
    id: string;
    userId: string;
    userName: string;
    date: string; // YYYY-MM-DD
    inTime: string | null; // HH:MM
    outTime?: string | null; // HH:MM
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
    source: 'MANUAL' | 'BIOMETRIC';
    remarks?: string;
}

// Global System Configuration
export interface AppConfig {
  adminRemark: string; // Dashboard message
  lastUpdated: string;
  serverUrl?: string;
  cloudBackupUrl?: string; // Link to external storage (Google Drive)
  
  // Dynamic Lists managed in SystemConfig
  customSourceItems?: string[];
  customMaterialTypes?: string[];
  customTechItems?: string[]; 
  
  // Tech Ops Dropdown Lists
  customRamGenerations?: string[];
  customRamSizes?: string[];
  customProcessorTypes?: string[]; // Processor Families (e.g. i3, i5)
  customProcessorGenerations?: string[]; // Processor Generations (e.g. 10th Gen)
  customWipingDevices?: string[];
  
  // Renaming/Aliasing system items
  systemOverrides?: Record<string, string>; 
}