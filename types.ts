
// --- Enums & Constants ---

export enum EvidenceStatus {
  WAITING = 'ממתין לטיפול',       // 1. Default
  EXTRACTION = 'בהפקה',           // 2
  DUMP_READY = 'Dump בתיקייה',    // 3
  PARSING = 'בפרסור',             // 4
  REPORT_GEN = 'בהפקת דו"ח',      // 5
  REPORT_READY = 'דו"ח בתיקייה',  // 6
  REVIEW = 'בעיון',               // 7
  FINISHED = 'סיום טיפול',        // 8. Work Done (Waiting for Pickup)
  ARCHIVED = 'נמסר / ארכיון',     // 9. Released/Physical Storage (History)
}

export type ExtractionStatus = 'הופק בהצלחה' | 'לא התממשק / נכשל';

export enum HandlingBase {
  OTHER = 'אחר',
  BEER_SHEVA = 'באר שבע',
  GALIL = 'גליל',
  DAN = 'דן',
  HOF = 'חוף',
  YALAM = 'יאל"מ',
  YOAV = 'יואב',
  YAKHAP = 'יחק"פ',
  YAMAR_SOUTH = 'ימ"ר דרום',
  YAMAR_NORTH = 'ימ"ר צפון',
  YAMLAM = 'ימל"מ',
  JERUSALEM = 'ירושלים',
  ARAVA = 'ערבה',
  POLICE = 'משטרת ישראל',
}

export enum ExhibitType {
  PHONE = 'טלפון',
  COMPUTER = 'מחשב',
  TABLET = 'טאבלט',
  MEMORY_CARD = 'כרטיס זיכרון',
  SIM_CARD = 'כרטיס סים',
  CAMERA = 'מצלמה',
  DISK = 'דיסק',
  HARD_DRIVE = 'כונן קשיח',
  DRONE = 'רחפן',
  USB_DRIVE = 'דיסק און קי',
}

export enum Priority {
  URGENT = 'דחוף',
  NORMAL = 'רגיל',
}

// --- User Management Types ---

export const RANK_OPTIONS = [
 'טוראי', 'רבט', 'סמל', 'סמר',
 'רסל', 'רסר', 'רסם', 'רסב', 'רנמ', 'רנ',
 'סגמ', 'סגן', 'סרן', 'רסן', 'סאל', 'אלם', 'תאל', 'אלוף', 'ראלו'
] as const;

export type Rank = typeof RANK_OPTIONS[number];

export const USER_ROLES = [
  'חוקר מיומן עבירות מחשב',
  'חוקר סייבר',
  'שוטר צבאי טכנולוגי'
] as const;

export type UserRole = typeof USER_ROLES[number];

export interface SystemUser {
  id: string;
  rank: Rank;
  fullName: string;
  role: UserRole;
}

// --- Case Entity ---

export interface CaseDetails {
  // Step 1: Chain of Custody
  deliveredBy: string; // שם המוסר
  receivedBy: string;  // שם הקולט

  // Step 2: Case Details
  suspectName: string;
  suspectID: string;
  handlingBase: string; 
  caseNumber: string;
  investigatorName: string; // חוקר מטפל
  orderNumber: string; // מספר צו
  restrictions: string; // הגבלות
  offenses: string;
}

// --- Exhibit Interfaces (Dynamic) ---

export interface ReleaseDetails {
  releasedBy: string; // Releasing Officer (System User)
  receivedBy: string; // Recipient Name (Free Text)
}

// Fields common to ALL exhibits
export interface BaseExhibit {
  id: string; // UUID
  internal_barcode: string; // Generated System ID
  status: EvidenceStatus;
  created_at: number; // Intake Time
  updated_at: number;
  
  // Release Fields (Step 9)
  released_at?: number; // Release Time
  releaseDetails?: ReleaseDetails;
  location?: string; // Legacy / General location info
  
  // Completion Protocol Fields (Step 8)
  lab_investigator?: string;
  extraction_status?: ExtractionStatus;

  // Linking back to case
  caseDetails: CaseDetails; 
  
  // Intake Fields
  type: ExhibitType;
  model: string;
  marking: string;
  date: number; // Timestamp
  priority: Priority;
}

// 1. Phone
export interface PhoneExhibit extends BaseExhibit {
  type: ExhibitType.PHONE;
  case_color: string;
  device_color: string;
  memory_card_type: 'Micro SD' | 'ללא';
  memory_size?: string; // Mandatory if memory_card_type != 'ללא'
  password_type: 'טקסט' | 'תבנית' | 'ללא';
  password_value?: string; // Mandatory if password_type != 'ללא'
  sim_type: 'SIM' | 'eSIM' | 'ללא';
  is_sim_glued?: boolean; // Visible ONLY if sim_type === 'SIM'
  removable_battery: boolean;
  turns_on: boolean;
}

// 2. Computer
export interface ComputerExhibit extends BaseExhibit {
  type: ExhibitType.COMPUTER;
  device_color: string;
  password_type: 'טקסט' | 'תבנית' | 'ללא';
  password_value?: string;
}

// 3. Tablet
export interface TabletExhibit extends BaseExhibit {
  type: ExhibitType.TABLET;
  case_color: string;
  device_color: string;
  memory_card_type: 'Micro SD' | 'ללא';
  memory_size?: string;
  password_type: 'טקסט' | 'תבנית' | 'ללא';
  password_value?: string;
  sim_type: 'SIM' | 'eSIM' | 'ללא';
  is_sim_glued?: boolean;
  turns_on: boolean;
}

// 4. Memory Card
export interface MemoryCardExhibit extends BaseExhibit {
  type: ExhibitType.MEMORY_CARD;
  device_color: string;
  capacity: string;
}

// 5. Sim Card
export interface SimCardExhibit extends BaseExhibit {
  type: ExhibitType.SIM_CARD;
  device_color: string;
  capacity: string;
}

// 6. Camera
export interface CameraExhibit extends BaseExhibit {
  type: ExhibitType.CAMERA;
  device_color: string;
  memory_card: string;
  capacity: string;
}

// 7. Disk
export interface DiskExhibit extends BaseExhibit {
  type: ExhibitType.DISK;
  device_color: string;
  capacity: string; 
}

// 8. Hard Drive
export interface HardDriveExhibit extends BaseExhibit {
  type: ExhibitType.HARD_DRIVE;
  device_color: string;
  capacity: string;
}

// 9. Drone
export interface DroneExhibit extends BaseExhibit {
  type: ExhibitType.DRONE;
  device_color: string;
  memory_card: string;
  capacity: string;
}

// 10. USB Drive
export interface UsbDriveExhibit extends BaseExhibit {
  type: ExhibitType.USB_DRIVE;
  device_color: string;
  capacity: string;
}

// --- Discriminated Union ---
export type Evidence = 
  | PhoneExhibit
  | ComputerExhibit
  | TabletExhibit
  | MemoryCardExhibit
  | SimCardExhibit
  | CameraExhibit
  | DiskExhibit
  | HardDriveExhibit
  | DroneExhibit
  | UsbDriveExhibit;

// --- App State Types ---

export type PageView = 'intake' | 'work_arrangement' | 'handled' | 'archive' | 'statistics' | 'settings';

export interface StatMetric {
  name: string;
  value: number;
  color: string;
}
