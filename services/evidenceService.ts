
import { Evidence, EvidenceStatus, ExhibitType, Priority, HandlingBase, SystemUser } from '../types';

const STORAGE_KEY = 'lems_evidence_db_v2';
const USERS_STORAGE_KEY = 'lems_users_db';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const evidenceService = {
  // --- Evidence Methods ---

  getAll: async (): Promise<Evidence[]> => {
    await delay(300);
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  addEvidence: async (evidence: Evidence): Promise<Evidence> => {
    await delay(300);
    const all = await evidenceService.getAll();
    
    // Ensure system fields are set
    const newEvidence = {
      ...evidence,
      id: crypto.randomUUID(),
      internal_barcode: `EVD-${generateId()}`,
      status: EvidenceStatus.WAITING, // Default status
      created_at: Date.now(), // INTAKE TIME
      updated_at: Date.now(),
    };

    all.push(newEvidence);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return newEvidence;
  },

  updateEvidence: async (id: string, updates: Partial<Evidence>): Promise<Evidence> => {
    await delay(300);
    const all = await evidenceService.getAll();
    const index = all.findIndex(e => e.id === id);

    if (index === -1) throw new Error('המוצג לא נמצא');

    const existing = all[index];

    // Merge updates while protecting immutable fields
    const updatedItem = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable
      internal_barcode: existing.internal_barcode, // Immutable
      created_at: existing.created_at, // Immutable
      updated_at: Date.now() // Update timestamp
    } as Evidence;

    all[index] = updatedItem;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return updatedItem;
  },

  updateStatus: async (
    id: string, 
    status: EvidenceStatus, 
    location?: string,
    additionalDetails?: { 
      lab_investigator?: string; 
      extraction_status?: any;
      releaseDetails?: { releasedBy: string; receivedBy: string; }
    }
  ): Promise<Evidence> => {
    await delay(200);
    const all = await evidenceService.getAll();
    const index = all.findIndex(e => e.id === id);
    
    if (index === -1) throw new Error('המוצג לא נמצא');

    const item = all[index];
    
    // Determine timestamps
    const now = Date.now();
    let releasedAt = item.released_at;

    // If moving to ARCHIVED, set release time
    if (status === EvidenceStatus.ARCHIVED && !item.released_at) {
      releasedAt = now;
    }

    const updatedItem = {
      ...item,
      status,
      updated_at: now,
      released_at: releasedAt,
      ...(location ? { location } : {}),
      ...(additionalDetails || {}) // Spread additional fields (Lab Results or Release Info)
    } as Evidence;

    all[index] = updatedItem;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return updatedItem;
  },

  deleteEvidence: async (id: string): Promise<void> => {
    await delay(300);
    const all = await evidenceService.getAll();
    const filtered = all.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // --- User Management Methods ---

  getUsers: async (): Promise<SystemUser[]> => {
    await delay(100);
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  addUser: async (user: Omit<SystemUser, 'id'>): Promise<SystemUser> => {
    await delay(300);
    const users = await evidenceService.getUsers();
    const newUser: SystemUser = { ...user, id: crypto.randomUUID() };
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return newUser;
  },

  deleteUser: async (id: string): Promise<void> => {
    await delay(300);
    const users = await evidenceService.getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
  },

  getAuthorizedUsers: async (): Promise<string[]> => {
    // This is used by the Reception dropdown.
    // It should return the Full Names of active users.
    const users = await evidenceService.getUsers();
    return users.map(u => `${u.rank} ${u.fullName}`);
  },

  seedDatabase: async () => {
    // Seed Evidence
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      // Create a mock Phone evidence
      const demoData: Evidence[] = [
        {
          id: crypto.randomUUID(),
          internal_barcode: 'EVD-DEMO01',
          status: EvidenceStatus.WAITING,
          created_at: Date.now() - 10000000,
          updated_at: Date.now() - 10000000,
          caseDetails: {
            deliveredBy: 'השוטר אזולאי',
            receivedBy: 'רס"ב משה כהן',
            suspectName: 'ישראל ישראלי',
            suspectID: '123456789',
            handlingBase: HandlingBase.POLICE,
            caseNumber: 'תיק-2023-500',
            investigatorName: 'משה כהן',
            orderNumber: 'צו-1234',
            restrictions: 'חיפוש במכשיר בלבד',
            offenses: 'מרמה והונאה'
          },
          type: ExhibitType.PHONE,
          model: 'Samsung Galaxy S22',
          marking: 'מוצג-א',
          date: Date.now(),
          priority: Priority.NORMAL,
          case_color: 'שחור',
          device_color: 'כחול',
          memory_card_type: 'Micro SD',
          memory_size: '64GB',
          password_type: 'תבנית',
          sim_type: 'SIM',
          is_sim_glued: false,
          removable_battery: false,
          turns_on: true
        }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
    }

    // Seed Users
    const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!existingUsers) {
      const demoUsers: SystemUser[] = [
        { id: '1', rank: 'רסב', fullName: 'משה כהן', role: 'חוקר סייבר' },
        { id: '2', rank: 'רסר', fullName: 'ישראל ישראלי', role: 'חוקר מיומן עבירות מחשב' },
        { id: '3', rank: 'סמל', fullName: 'דני דין', role: 'שוטר צבאי טכנולוגי' }
      ];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(demoUsers));
    }
  }
};
