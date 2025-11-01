import AsyncStorage from "@react-native-async-storage/async-storage";

const SYNC_STORAGE_KEY = "@riso_sync_storage";

interface SyncNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  timestamp: number;
  priority: "low" | "normal" | "high";
  type: "info" | "warning" | "alert";
  targetUsers: string[];
  createdBy: string;
}

interface TechnicianCategory {
  category: string;
  technicians: string[];
}

interface ShipsAndLocations {
  ships: string[];
  locations: string[];
}

interface UserInfo {
  userId: string;
  technicianName: string;
  companyName: string;
  lastSync?: string;
}

interface SyncStorage {
  reports: any[];
  users: UserInfo[];
  notifications: SyncNotification[];
  technicians: TechnicianCategory[];
  shipsAndLocations: ShipsAndLocations;
}

const getStorage = async (): Promise<SyncStorage> => {
  try {
    const data = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading sync storage:", error);
  }
  
  return {
    reports: [],
    users: [],
    notifications: [],
    technicians: [],
    shipsAndLocations: { ships: [], locations: [] },
  };
};

const setStorage = async (storage: SyncStorage): Promise<void> => {
  try {
    await AsyncStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Error writing sync storage:", error);
  }
};

export const mockSyncServer = {
  async addNotification(notification: SyncNotification): Promise<{ success: boolean; error?: string }> {
    try {
      const storage = await getStorage();
      const existingIndex = storage.notifications.findIndex((n) => n.id === notification.id);
      
      if (existingIndex >= 0) {
        storage.notifications[existingIndex] = notification;
      } else {
        storage.notifications.push(notification);
      }
      
      await setStorage(storage);
      console.log(`✅ Notifica "${notification.title}" salvata su storage condiviso`);
      return { success: true };
    } catch (error) {
      console.error("❌ Errore durante l'aggiunta della notifica:", error);
      return { success: false, error: String(error) };
    }
  },

  async getNotifications(userId?: string): Promise<{ success: boolean; data?: SyncNotification[]; error?: string }> {
    try {
      const storage = await getStorage();
      let notifications = storage.notifications;
      
      if (userId) {
        notifications = notifications.filter((n) => 
          n.targetUsers.includes("all") || n.targetUsers.includes(userId)
        );
      }
      
      return { success: true, data: notifications };
    } catch (error) {
      console.error("❌ Errore durante il recupero delle notifiche:", error);
      return { success: false, error: String(error) };
    }
  },

  async setTechnicians(technicians: TechnicianCategory[]): Promise<{ success: boolean; error?: string }> {
    try {
      const storage = await getStorage();
      storage.technicians = technicians;
      await setStorage(storage);
      console.log(`✅ ${technicians.length} categorie tecnici salvate su storage condiviso`);
      return { success: true };
    } catch (error) {
      console.error("❌ Errore durante il salvataggio dei tecnici:", error);
      return { success: false, error: String(error) };
    }
  },

  async getTechnicians(): Promise<{ success: boolean; data?: TechnicianCategory[]; error?: string }> {
    try {
      const storage = await getStorage();
      return { success: true, data: storage.technicians };
    } catch (error) {
      console.error("❌ Errore durante il recupero dei tecnici:", error);
      return { success: false, error: String(error) };
    }
  },

  async setShipsAndLocations(data: ShipsAndLocations): Promise<{ success: boolean; error?: string }> {
    try {
      const storage = await getStorage();
      storage.shipsAndLocations = data;
      await setStorage(storage);
      console.log(`✅ ${data.ships.length} navi e ${data.locations.length} luoghi salvati su storage condiviso`);
      return { success: true };
    } catch (error) {
      console.error("❌ Errore durante il salvataggio di navi e luoghi:", error);
      return { success: false, error: String(error) };
    }
  },

  async getShipsAndLocations(): Promise<{ success: boolean; data?: ShipsAndLocations; error?: string }> {
    try {
      const storage = await getStorage();
      return { success: true, data: storage.shipsAndLocations };
    } catch (error) {
      console.error("❌ Errore durante il recupero di navi e luoghi:", error);
      return { success: false, error: String(error) };
    }
  },

  async syncReport(report: any, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storage = await getStorage();
      const existingIndex = storage.reports.findIndex((r) => r.id === report.id);
      
      const reportWithUserId = { ...report, userId, syncedAt: Date.now() };
      
      if (existingIndex >= 0) {
        storage.reports[existingIndex] = reportWithUserId;
      } else {
        storage.reports.push(reportWithUserId);
      }
      
      const userIndex = storage.users.findIndex((u) => u.userId === userId);
      if (userIndex < 0) {
        storage.users.push({
          userId,
          technicianName: report.technicianName || "Unknown",
          companyName: report.companyName || "Unknown",
          lastSync: new Date().toISOString(),
        });
      } else {
        storage.users[userIndex].lastSync = new Date().toISOString();
      }
      
      await setStorage(storage);
      return { success: true };
    } catch (error) {
      console.error("❌ Errore durante la sincronizzazione del report:", error);
      return { success: false, error: String(error) };
    }
  },

  async getAllReports(userId?: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const storage = await getStorage();
      let reports = storage.reports;
      
      if (userId) {
        reports = reports.filter((r) => r.userId === userId);
      }
      
      return { success: true, data: reports };
    } catch (error) {
      console.error("❌ Errore durante il recupero dei report:", error);
      return { success: false, error: String(error) };
    }
  },

  async getAllUsers(): Promise<{ success: boolean; data?: UserInfo[]; error?: string }> {
    try {
      const storage = await getStorage();
      return { success: true, data: storage.users };
    } catch (error) {
      console.error("❌ Errore durante il recupero degli utenti:", error);
      return { success: false, error: String(error) };
    }
  },

  async clearAllData(): Promise<{ success: boolean; error?: string }> {
    try {
      await AsyncStorage.removeItem(SYNC_STORAGE_KEY);
      console.log("✅ Storage condiviso svuotato");
      return { success: true };
    } catch (error) {
      console.error("❌ Errore durante la pulizia dello storage:", error);
      return { success: false, error: String(error) };
    }
  },
};

export interface MockSyncServer {
  addNotification: typeof mockSyncServer.addNotification;
  getNotifications: typeof mockSyncServer.getNotifications;
  setTechnicians: typeof mockSyncServer.setTechnicians;
  getTechnicians: typeof mockSyncServer.getTechnicians;
  setShipsAndLocations: typeof mockSyncServer.setShipsAndLocations;
  getShipsAndLocations: typeof mockSyncServer.getShipsAndLocations;
  syncReport: typeof mockSyncServer.syncReport;
  getAllReports: typeof mockSyncServer.getAllReports;
  getAllUsers: typeof mockSyncServer.getAllUsers;
  clearAllData: typeof mockSyncServer.clearAllData;
}
