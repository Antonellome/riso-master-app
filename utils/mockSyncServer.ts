import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

interface SyncServerUser {
  id: string;
  name: string;
  company: string;
  apiKey: string;
  createdAt: number;
  lastSync?: number;
  active: boolean;
}

interface SyncServerReport {
  id: string;
  userId: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  pauseMinutes: number;
  ship: string;
  location: string;
  description: string;
  materials: string;
  workDone: string;
  technicians: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  }[];
  createdAt: number;
  updatedAt: number;
}

interface SyncServerNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  timestamp: number;
  priority: "low" | "normal" | "high";
  type: "info" | "warning" | "alert";
  targetUsers: string[];
  createdBy: string;
  read?: boolean;
}

interface SyncServerTechnicianCategory {
  category: string;
  technicians: string[];
}

interface SyncServerShipLocation {
  ships: string[];
  locations: string[];
}

interface SyncResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
}

class SharedStorage {
  private prefix = "@riso_sync_server_";

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.prefix + key;
      if (Platform.OS === "web") {
        const item = localStorage.getItem(fullKey);
        return item ? JSON.parse(item) : null;
      } else {
        const item = await AsyncStorage.getItem(fullKey);
        return item ? JSON.parse(item) : null;
      }
    } catch {
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = this.prefix + key;
      const stringValue = JSON.stringify(value);
      if (Platform.OS === "web") {
        localStorage.setItem(fullKey, stringValue);
      } else {
        await AsyncStorage.setItem(fullKey, stringValue);
      }
    } catch (error) {
      console.error("Error setting item:", error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const fullKey = this.prefix + key;
      if (Platform.OS === "web") {
        localStorage.removeItem(fullKey);
      } else {
        await AsyncStorage.removeItem(fullKey);
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  }
}

class MockSyncServer {
  private storage = new SharedStorage();
  private USERS_KEY = "users";
  private REPORTS_KEY = "reports";
  private NOTIFICATIONS_KEY = "notifications";
  private TECHNICIANS_KEY = "technicians";
  private SHIPS_LOCATIONS_KEY = "ships_locations";

  async authenticateUser(
    userId: string,
    apiKey: string
  ): Promise<boolean> {
    try {
      const users = await this.storage.getItem<SyncServerUser[]>(this.USERS_KEY) || [];
      const user = users.find((u) => u.id === userId && u.apiKey === apiKey && u.active);
      return !!user;
    } catch {
      return false;
    }
  }

  async addUser(user: SyncServerUser): Promise<SyncResponse> {
    try {
      const users = await this.storage.getItem<SyncServerUser[]>(this.USERS_KEY) || [];
      
      const existingUser = users.find((u) => u.id === user.id);
      if (existingUser) {
        return { success: false, message: "Utente già esistente" };
      }

      users.push(user);
      await this.storage.setItem(this.USERS_KEY, users);
      
      return { success: true, message: "Utente aggiunto con successo" };
    } catch {
      return { success: false, message: "Errore durante l'aggiunta dell'utente" };
    }
  }

  async updateUser(
    userId: string,
    updates: Partial<SyncServerUser>
  ): Promise<SyncResponse> {
    try {
      const users = await this.storage.getItem<SyncServerUser[]>(this.USERS_KEY) || [];
      const index = users.findIndex((u) => u.id === userId);
      
      if (index === -1) {
        return { success: false, message: "Utente non trovato" };
      }

      users[index] = { ...users[index], ...updates };
      await this.storage.setItem(this.USERS_KEY, users);
      
      return { success: true, message: "Utente aggiornato con successo" };
    } catch {
      return { success: false, message: "Errore durante l'aggiornamento dell'utente" };
    }
  }

  async deleteUser(userId: string): Promise<SyncResponse> {
    try {
      const users = await this.storage.getItem<SyncServerUser[]>(this.USERS_KEY) || [];
      const filteredUsers = users.filter((u) => u.id !== userId);
      await this.storage.setItem(this.USERS_KEY, filteredUsers);
      
      return { success: true, message: "Utente eliminato con successo" };
    } catch {
      return { success: false, message: "Errore durante l'eliminazione dell'utente" };
    }
  }

  async getAllUsers(): Promise<SyncResponse<SyncServerUser[]>> {
    try {
      const users = await this.storage.getItem<SyncServerUser[]>(this.USERS_KEY) || [];
      return { success: true, data: users, message: "Utenti recuperati con successo" };
    } catch {
      return { success: false, message: "Errore durante il recupero degli utenti" };
    }
  }

  async syncUserData(
    userId: string,
    apiKey: string,
    reports: SyncServerReport[]
  ): Promise<SyncResponse> {
    try {
      const isAuthenticated = await this.authenticateUser(userId, apiKey);
      if (!isAuthenticated) {
        return { success: false, message: "Autenticazione fallita" };
      }

      const allReports = await this.storage.getItem<SyncServerReport[]>(this.REPORTS_KEY) || [];
      const otherUserReports = allReports.filter((r) => r.userId !== userId);
      const updatedReports = [...otherUserReports, ...reports];
      await this.storage.setItem(this.REPORTS_KEY, updatedReports);

      await this.updateUser(userId, { lastSync: Date.now() });
      
      return { success: true, message: "Sincronizzazione completata" };
    } catch {
      return { success: false, message: "Errore durante la sincronizzazione" };
    }
  }

  async getUserData(
    userId: string,
    apiKey: string
  ): Promise<SyncResponse<SyncServerReport[]>> {
    try {
      const isAuthenticated = await this.authenticateUser(userId, apiKey);
      if (!isAuthenticated) {
        return { success: false, message: "Autenticazione fallita" };
      }

      const allReports = await this.storage.getItem<SyncServerReport[]>(this.REPORTS_KEY) || [];
      const userReports = allReports.filter((r) => r.userId === userId);
      
      return { success: true, data: userReports, message: "Dati recuperati con successo" };
    } catch {
      return { success: false, message: "Errore durante il recupero dei dati" };
    }
  }

  async getAllReports(): Promise<SyncResponse<SyncServerReport[]>> {
    try {
      const reports = await this.storage.getItem<SyncServerReport[]>(this.REPORTS_KEY) || [];
      return { success: true, data: reports, message: "Report recuperati con successo" };
    } catch {
      return { success: false, message: "Errore durante il recupero dei report" };
    }
  }

  async addNotification(
    notification: SyncServerNotification
  ): Promise<SyncResponse> {
    try {
      const notifications = await this.storage.getItem<SyncServerNotification[]>(this.NOTIFICATIONS_KEY) || [];
      notifications.push(notification);
      await this.storage.setItem(this.NOTIFICATIONS_KEY, notifications);
      
      return { success: true, message: "Notifica aggiunta con successo" };
    } catch {
      return { success: false, message: "Errore durante l'aggiunta della notifica" };
    }
  }

  async getUserNotifications(
    userId: string,
    apiKey: string
  ): Promise<SyncResponse<SyncServerNotification[]>> {
    try {
      const isAuthenticated = await this.authenticateUser(userId, apiKey);
      if (!isAuthenticated) {
        return { success: false, message: "Autenticazione fallita" };
      }

      const notifications = await this.storage.getItem<SyncServerNotification[]>(this.NOTIFICATIONS_KEY) || [];
      const userNotifications = notifications.filter(
        (n) => n.targetUsers.includes(userId) || n.targetUsers.includes("all")
      );
      
      return {
        success: true,
        data: userNotifications,
        message: "Notifiche recuperate con successo",
      };
    } catch {
      return { success: false, message: "Errore durante il recupero delle notifiche" };
    }
  }

  async getTechnicians(): Promise<SyncResponse<SyncServerTechnicianCategory[]>> {
    try {
      const technicians = await this.storage.getItem<SyncServerTechnicianCategory[]>(this.TECHNICIANS_KEY) || [];
      return { success: true, data: technicians, message: "Tecnici recuperati con successo" };
    } catch {
      return { success: false, message: "Errore durante il recupero dei tecnici" };
    }
  }

  async setTechnicians(
    technicians: SyncServerTechnicianCategory[]
  ): Promise<SyncResponse> {
    try {
      await this.storage.setItem(this.TECHNICIANS_KEY, technicians);
      return { success: true, message: "Tecnici aggiornati con successo" };
    } catch {
      return { success: false, message: "Errore durante l'aggiornamento dei tecnici" };
    }
  }

  async getShipsAndLocations(): Promise<SyncResponse<SyncServerShipLocation>> {
    try {
      const data = await this.storage.getItem<SyncServerShipLocation>(this.SHIPS_LOCATIONS_KEY) || {
        ships: [],
        locations: [],
      };
      return { success: true, data, message: "Navi e luoghi recuperati con successo" };
    } catch {
      return { success: false, message: "Errore durante il recupero di navi e luoghi" };
    }
  }

  async setShipsAndLocations(
    data: SyncServerShipLocation
  ): Promise<SyncResponse> {
    try {
      await this.storage.setItem(this.SHIPS_LOCATIONS_KEY, data);
      return { success: true, message: "Navi e luoghi aggiornati con successo" };
    } catch {
      return { success: false, message: "Errore durante l'aggiornamento di navi e luoghi" };
    }
  }

  async getAllNotifications(): Promise<SyncResponse<SyncServerNotification[]>> {
    try {
      const notifications = await this.storage.getItem<SyncServerNotification[]>(this.NOTIFICATIONS_KEY) || [];
      return { success: true, data: notifications, message: "Notifiche recuperate con successo" };
    } catch {
      return { success: false, message: "Errore durante il recupero delle notifiche" };
    }
  }
}

export const mockSyncServer = new MockSyncServer();

export type {
  SyncServerUser,
  SyncServerReport,
  SyncServerNotification,
  SyncServerTechnicianCategory,
  SyncServerShipLocation,
  SyncResponse,
};
