import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ShiftType = "Ordinaria" | "Straordinaria" | "Festiva" | "Ferie" | "Permesso" | "Malattia" | "104";

export interface Report {
  id: string;
  date: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  pauseMinutes: number;
  ship: string;
  location: string;
  description: string;
  materials: string;
  workDone: string;
  technicians: ReportTechnician[];
  createdAt: number;
  updatedAt: number;
  userId?: string;
  syncedAt?: number;
  version?: number;
  deviceId?: string;
}

export interface ReportTechnician {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export function calculateHours(startTime: string, endTime: string, pauseMinutes: number): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const totalMinutes = endMinutes - startMinutes - pauseMinutes;
  return Math.max(0, totalMinutes / 60);
}

interface TimeSlot {
  start: number;
  end: number;
  reportId: string;
}

function timeToMinutes(time: string, crossesMidnight: boolean = false): number {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return crossesMidnight ? totalMinutes + (24 * 60) : totalMinutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function mergeTimeSlots(slots: TimeSlot[]): { totalMinutes: number; overlaps: string[] } {
  if (slots.length === 0) return { totalMinutes: 0, overlaps: [] };
  if (slots.length === 1) return { totalMinutes: slots[0].end - slots[0].start, overlaps: [] };

  const sorted = [...slots].sort((a, b) => a.start - b.start);
  const overlaps: string[] = [];
  const merged: { start: number; end: number }[] = [];

  let current = { start: sorted[0].start, end: sorted[0].end };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    if (next.start < current.end) {
      overlaps.push(
        `Accavallamento orari: ${minutesToTime(Math.max(next.start, current.start))} - ${minutesToTime(Math.min(next.end, current.end))}`
      );
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(current);
      current = { start: next.start, end: next.end };
    }
  }
  merged.push(current);

  const totalMinutes = merged.reduce((sum, slot) => sum + (slot.end - slot.start), 0);
  return { totalMinutes, overlaps };
}

export interface Technician {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  active: boolean;
  userId: string;
  category?: string;
}

export interface Ship {
  id: string;
  name: string;
  active: boolean;
}

export interface Location {
  id: string;
  name: string;
  active: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  timestamp: number;
  read?: boolean;
  priority: "low" | "normal" | "high";
  type: "info" | "warning" | "alert";
  recipients: string[];
  recipientCategories: string[];
  targetUsers?: string[];
  createdAt: string;
  createdBy?: string;
  sentAt?: string;
}

export interface TechnicianCategory {
  category: string;
  technicians: string[];
}

export interface MasterSettings {
  companyName: string;
  masterUserName: string;
  securityCode: string;
  syncEnabled: boolean;
  syncUrl: string;
  syncApiKey: string;
  autoSync: boolean;
  lastSyncAt?: string;
  dataStorage: 'device' | 'cloud';
  technicians: Technician[];
  ships: Ship[];
  locations: Location[];
  technicianCategories: string[];
  notifications: Notification[];
  appVersion: string;
  dataSchemaVersion: number;
  syncConflictResolution: 'master-wins' | 'technician-wins' | 'manual';
  masterUserId?: string;
}

const REPORTS_KEY = "@riso_master_reports";
const SETTINGS_KEY = "@riso_master_settings";

const DEFAULT_SETTINGS: MasterSettings = {
  companyName: "R.I.S.O. Master",
  masterUserName: "",
  securityCode: "",
  syncEnabled: false,
  syncUrl: "",
  syncApiKey: "",
  autoSync: false,
  dataStorage: "device",
  technicians: [
    { id: "tech1", name: "Marco Rossi", active: true, userId: "T001" },
    { id: "tech2", name: "Luca Bianchi", active: true, userId: "T002" },
    { id: "tech3", name: "Paolo Verdi", active: true, userId: "T003" },
    { id: "tech4", name: "Giuseppe Ferrari", active: true, userId: "T004" },
    { id: "tech5", name: "Andrea Colombo", active: true, userId: "T005" },
    { id: "tech6", name: "Fabio Romano", active: true, userId: "T006" },
    { id: "tech7", name: "Simone Ricci", active: true, userId: "T007" },
    { id: "tech8", name: "Matteo Greco", active: true, userId: "T008" },
    { id: "tech9", name: "Roberto Conti", active: true, userId: "T009" },
    { id: "tech10", name: "Stefano Bruno", active: true, userId: "T010" },
  ],
  ships: [
    { id: "ship1", name: "MSC Magnifica", active: true },
    { id: "ship2", name: "Costa Pacifica", active: true },
    { id: "ship3", name: "Carnival Dream", active: true },
  ],
  locations: [
    { id: "loc1", name: "Porto di Genova", active: true },
    { id: "loc2", name: "Porto di Civitavecchia", active: true },
    { id: "loc3", name: "Porto di Napoli", active: true },
  ],
  technicianCategories: ["Elettricista", "Meccanico", "Idraulico"],
  notifications: [],
  appVersion: "1.0.0",
  dataSchemaVersion: 1,
  syncConflictResolution: "master-wins",
};

export const [ReportProvider, useReports] = createContextHook(() => {
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState<MasterSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (reports.length === 0 && !isLoading) {
      import("../utils/generateDemoData").then(({ generateDemoReports }) => {
        const demoReports = generateDemoReports();
        saveReports(demoReports);
      });
    }
  }, [reports.length, isLoading]);

  const loadData = async () => {
    try {
      const [reportsData, settingsData] = await Promise.all([
        AsyncStorage.getItem(REPORTS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);

      if (reportsData) {
        setReports(JSON.parse(reportsData));
      }
      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReports = async (newReports: Report[]) => {
    try {
      await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(newReports));
      setReports(newReports);
    } catch (error) {
      console.error("Error saving reports:", error);
    }
  };

  const saveSettings = async (newSettings: MasterSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const addReport = useCallback(
    (report: Omit<Report, "id" | "createdAt" | "updatedAt">) => {
      const timestamp = Date.now();
      
      const technician = report.userId 
        ? settings.technicians.find(t => t.userId === report.userId)
        : null;
      
      const userAsTechnician: ReportTechnician | null = technician ? {
        id: technician.id,
        name: technician.name,
        startTime: report.startTime,
        endTime: report.endTime,
      } : null;
      
      const techniciansList = userAsTechnician
        ? [userAsTechnician, ...report.technicians]
        : report.technicians;
      
      const newReport: Report = {
        ...report,
        technicians: techniciansList,
        id: timestamp.toString(),
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
      };
      const updatedReports = [newReport, ...reports];
      saveReports(updatedReports);
    },
    [reports, settings.technicians]
  );

  const importReports = useCallback(
    (newReports: Report[]) => {
      const existingReportsMap = new Map(reports.map(r => [r.id, r]));
      const mergedReports = [...reports];
      
      newReports.forEach(newReport => {
        const existing = existingReportsMap.get(newReport.id);
        
        if (!existing) {
          mergedReports.push(newReport);
        } else {
          const existingVersion = existing.version || 1;
          const newVersion = newReport.version || 1;
          const existingModified = existing.updatedAt || existing.createdAt;
          const newModified = newReport.updatedAt || newReport.createdAt;
          
          if (settings.syncConflictResolution === 'master-wins') {
            return;
          } else if (settings.syncConflictResolution === 'technician-wins') {
            const index = mergedReports.findIndex(r => r.id === newReport.id);
            if (index !== -1) {
              mergedReports[index] = { ...newReport, version: existingVersion + 1 };
            }
          } else {
            if (newVersion > existingVersion || (newVersion === existingVersion && newModified > existingModified)) {
              const index = mergedReports.findIndex(r => r.id === newReport.id);
              if (index !== -1) {
                mergedReports[index] = newReport;
              }
            }
          }
        }
      });
      
      saveReports(mergedReports);
    },
    [reports, settings]
  );

  const updateReport = useCallback(
    (id: string, updates: Partial<Report>) => {
      const updatedReports = reports.map((report) =>
        report.id === id 
          ? { 
              ...report, 
              ...updates, 
              version: (report.version || 1) + 1,
              updatedAt: Date.now(),
            } 
          : report
      );
      saveReports(updatedReports);
    },
    [reports]
  );

  const deleteReport = useCallback(
    (id: string) => {
      const updatedReports = reports.filter((report) => report.id !== id);
      saveReports(updatedReports);
    },
    [reports]
  );

  const getReportsByMonth = useCallback(
    (year: number, month: number, technicianId?: string | null) => {
      return reports.filter((report) => {
        const reportDate = new Date(report.date);
        const dateMatch = reportDate.getFullYear() === year && reportDate.getMonth() === month;
        
        if (!technicianId) {
          return dateMatch;
        }
        
        const technician = settings.technicians.find(t => t.id === technicianId);
        if (!technician) {
          return dateMatch;
        }
        
        const techMatch = report.userId === technician.userId || 
                         report.technicians.some(t => t.id === technicianId || t.name === technician.name);
        return dateMatch && techMatch;
      });
    },
    [reports, settings.technicians]
  );

  const getReportsByDate = useCallback(
    (date: string, technicianId?: string | null) => {
      return reports.filter((report) => {
        const dateMatch = report.date === date;
        
        if (!technicianId) {
          return dateMatch;
        }
        
        const technician = settings.technicians.find(t => t.id === technicianId);
        if (!technician) {
          return dateMatch;
        }
        
        const techMatch = report.userId === technician.userId || 
                         report.technicians.some(t => t.id === technicianId || t.name === technician.name);
        return dateMatch && techMatch;
      });
    },
    [reports, settings.technicians]
  );

  const getTodayReports = useCallback((technicianId?: string | null) => {
    const today = new Date().toISOString().split("T")[0];
    return reports.filter((report) => {
      const dateMatch = report.date === today;
      
      if (!technicianId) {
        return dateMatch;
      }
      
      const technician = settings.technicians.find(t => t.id === technicianId);
      if (!technician) {
        return dateMatch;
      }
      
      const techMatch = report.userId === technician.userId || 
                       report.technicians.some(t => t.id === technicianId || t.name === technician.name);
      return dateMatch && techMatch;
    });
  }, [reports, settings.technicians]);

  const calculateStats = useCallback((technicianId?: string | null) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const weekStart = startOfWeek.toISOString().split("T")[0];

    const filterByTech = (r: Report) => {
      if (!technicianId) {
        return true;
      }
      
      const technician = settings.technicians.find(t => t.id === technicianId);
      if (!technician) {
        return true;
      }
      
      return r.userId === technician.userId || 
             r.technicians.some(t => t.id === technicianId || t.name === technician.name);
    };

    const todayReports = reports.filter((r) => r.date === today && filterByTech(r));
    const weekReports = reports.filter((r) => r.date >= weekStart && filterByTech(r));
    const monthReportsData = reports.filter((report) => {
      const reportDate = new Date(report.date);
      return (
        reportDate.getFullYear() === currentYear &&
        reportDate.getMonth() === currentMonth &&
        filterByTech(report)
      );
    });

    const uniqueShips = new Set(monthReportsData.map(r => r.ship));
    const uniqueLocations = new Set(monthReportsData.map(r => r.location));
    
    const techniciansWithReportsToday = new Set(
      todayReports.flatMap(r => r.technicians.map(t => t.id))
    ).size;

    const calculateHours = (reports: Report[]) => {
      return reports.reduce((sum, r) => {
        const [startHour, startMin] = r.startTime.split(':').map(Number);
        const [endHour, endMin] = r.endTime.split(':').map(Number);
        
        let startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;
        
        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60;
        }
        
        const totalMinutes = endMinutes - startMinutes - r.pauseMinutes;
        const hours = Math.max(0, totalMinutes / 60);
        return sum + hours;
      }, 0);
    };

    return {
      reportsToday: todayReports.length,
      totalReports: reports.filter(filterByTech).length,
      hoursThisWeek: calculateHours(weekReports),
      hoursThisMonth: calculateHours(monthReportsData),
      shipsThisMonth: uniqueShips.size,
      locationsThisMonth: uniqueLocations.size,
      techniciansWithReportsToday,
    };
  }, [reports, settings.technicians]);

  const updateSettings = useCallback(
    (updates: Partial<MasterSettings>) => {
      const newSettings = { ...settings, ...updates };
      saveSettings(newSettings);
    },
    [settings]
  );

  const addTechnician = useCallback(
    (technician: Omit<Technician, "id">) => {
      const newTech: Technician = {
        ...technician,
        id: Date.now().toString(),
      };
      updateSettings({ technicians: [...settings.technicians, newTech] });
    },
    [settings, updateSettings]
  );

  const updateTechnician = useCallback(
    (id: string, updates: Partial<Technician>) => {
      const updatedTechnicians = settings.technicians.map((tech) =>
        tech.id === id ? { ...tech, ...updates } : tech
      );
      updateSettings({ technicians: updatedTechnicians });
    },
    [settings, updateSettings]
  );

  const deleteTechnician = useCallback(
    (id: string) => {
      const updatedTechnicians = settings.technicians.filter((tech) => tech.id !== id);
      updateSettings({ technicians: updatedTechnicians });
    },
    [settings, updateSettings]
  );

  const addShip = useCallback(
    (ship: Omit<Ship, "id">) => {
      const newShip: Ship = {
        ...ship,
        id: Date.now().toString(),
      };
      updateSettings({ ships: [...settings.ships, newShip] });
    },
    [settings, updateSettings]
  );

  const updateShip = useCallback(
    (id: string, updates: Partial<Ship>) => {
      const updatedShips = settings.ships.map((ship) =>
        ship.id === id ? { ...ship, ...updates } : ship
      );
      updateSettings({ ships: updatedShips });
    },
    [settings, updateSettings]
  );

  const deleteShip = useCallback(
    (id: string) => {
      const updatedShips = settings.ships.filter((ship) => ship.id !== id);
      updateSettings({ ships: updatedShips });
    },
    [settings, updateSettings]
  );

  const addLocation = useCallback(
    (location: Omit<Location, "id">) => {
      const newLocation: Location = {
        ...location,
        id: Date.now().toString(),
      };
      updateSettings({ locations: [...settings.locations, newLocation] });
    },
    [settings, updateSettings]
  );

  const updateLocation = useCallback(
    (id: string, updates: Partial<Location>) => {
      const updatedLocations = settings.locations.map((loc) =>
        loc.id === id ? { ...loc, ...updates } : loc
      );
      updateSettings({ locations: updatedLocations });
    },
    [settings, updateSettings]
  );

  const deleteLocation = useCallback(
    (id: string) => {
      const updatedLocations = settings.locations.filter((loc) => loc.id !== id);
      updateSettings({ locations: updatedLocations });
    },
    [settings, updateSettings]
  );

  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([REPORTS_KEY, SETTINGS_KEY]);
      setReports([]);
      setSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  }, []);

  const syncWithTechnicians = useCallback(async () => {
    try {
      console.log("📡 Iniziando sincronizzazione con app tecnici...");
      
      if (!settings.syncEnabled) {
        throw new Error("Sincronizzazione non abilitata");
      }

      const { mockSyncServer } = await import("../utils/mockSyncServer");

      const activeNotifications = settings.notifications.filter(n => !n.sentAt);
      console.log(`📤 Invio ${activeNotifications.length} notifiche...`);

      for (const notification of activeNotifications) {
        const targetUsers: string[] = [];
        
        if (notification.recipients.length > 0) {
          targetUsers.push(...notification.recipients);
        }
        
        if (notification.recipientCategories.length > 0) {
          notification.recipientCategories.forEach(category => {
            const techsInCategory = settings.technicians
              .filter(t => t.category === category && t.active)
              .map(t => t.userId);
            targetUsers.push(...techsInCategory);
          });
        }

        const uniqueTargets = Array.from(new Set(targetUsers));
        
        const syncNotification = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          date: notification.date,
          timestamp: notification.timestamp,
          priority: notification.priority,
          type: notification.type,
          targetUsers: uniqueTargets.length > 0 ? uniqueTargets : ["all"],
          createdBy: settings.masterUserId || "master",
        };

        await mockSyncServer.addNotification(syncNotification);
        console.log(`✅ Notifica "${notification.title}" inviata a ${uniqueTargets.length > 0 ? uniqueTargets.length : "tutti i"} tecnici`);
      }

      const technicianCategoriesForSync = settings.technicianCategories.map(category => {
        const techniciansInCategory = settings.technicians
          .filter(t => t.category === category && t.active)
          .map(t => t.name)
          .sort((a, b) => a.localeCompare(b, 'it'));
        
        return {
          category,
          technicians: techniciansInCategory,
        };
      });

      await mockSyncServer.setTechnicians(technicianCategoriesForSync);
      console.log(`✅ ${technicianCategoriesForSync.length} categorie tecnici sincronizzate`);

      const shipsForSync = settings.ships
        .filter(s => s.active)
        .map(s => s.name)
        .sort((a, b) => a.localeCompare(b, 'it'));
      
      const locationsForSync = settings.locations
        .filter(l => l.active)
        .map(l => l.name)
        .sort((a, b) => a.localeCompare(b, 'it'));

      await mockSyncServer.setShipsAndLocations({
        ships: shipsForSync,
        locations: locationsForSync,
      });
      console.log(`✅ ${shipsForSync.length} navi e ${locationsForSync.length} luoghi sincronizzati`);

      const updatedNotifications = settings.notifications.map(n => 
        !n.sentAt ? { ...n, sentAt: new Date().toISOString() } : n
      );
      updateSettings({ notifications: updatedNotifications, lastSyncAt: new Date().toISOString() });

      console.log("✅ Sincronizzazione completata con successo!");
      return true;
    } catch (error) {
      console.error("❌ Errore durante la sincronizzazione:", error);
      throw error;
    }
  }, [settings, updateSettings]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "createdAt" | "timestamp">) => {
      const timestamp = Date.now();
      const newNotification: Notification = {
        ...notification,
        id: timestamp.toString(),
        timestamp,
        createdAt: new Date().toISOString(),
        priority: notification.priority || "normal",
        type: notification.type || "info",
        read: false,
        createdBy: settings.masterUserId || "master",
      };
      const updatedNotifications = [newNotification, ...(settings.notifications || [])];
      updateSettings({ notifications: updatedNotifications });
    },
    [settings, updateSettings]
  );

  const updateNotification = useCallback(
    (id: string, updates: Partial<Notification>) => {
      const updatedNotifications = (settings.notifications || []).map((notif) =>
        notif.id === id ? { ...notif, ...updates } : notif
      );
      updateSettings({ notifications: updatedNotifications });
    },
    [settings, updateSettings]
  );

  const deleteNotification = useCallback(
    (id: string) => {
      const updatedNotifications = (settings.notifications || []).filter((notif) => notif.id !== id);
      updateSettings({ notifications: updatedNotifications });
    },
    [settings, updateSettings]
  );

  const calculateDailyHours = useCallback(
    (date: string) => {
      const dailyReports = reports.filter(r => r.date === date);
      const technicianHours = new Map<string, {
        technicianId: string;
        technicianName: string;
        totalHours: number;
        ordinaryHours: number;
        overtimeHours: number;
        shiftType: ShiftType | 'Assente';
        reports: Report[];
        warnings?: string[];
      }>();

      dailyReports.forEach(report => {
        const absenceTypes = ['Ferie', 'Permesso', 'Malattia', '104'];
        const isAbsence = absenceTypes.includes(report.shiftType);

        if (isAbsence && report.userId) {
          const technicianData = settings.technicians.find(t => t.userId === report.userId);
          if (technicianData) {
            if (!technicianHours.has(technicianData.id)) {
              technicianHours.set(technicianData.id, {
                technicianId: technicianData.id,
                technicianName: technicianData.name,
                totalHours: 0,
                ordinaryHours: 0,
                overtimeHours: 0,
                shiftType: report.shiftType,
                reports: [report],
              });
            }
          }
        } else {
          report.technicians.forEach(tech => {
            const existing = technicianHours.get(tech.id);
            if (existing) {
              existing.reports.push(report);
              if (report.shiftType === 'Straordinaria' || report.shiftType === 'Festiva') {
                existing.shiftType = report.shiftType;
              }
            } else {
              technicianHours.set(tech.id, {
                technicianId: tech.id,
                technicianName: tech.name,
                totalHours: 0,
                ordinaryHours: 0,
                overtimeHours: 0,
                shiftType: report.shiftType,
                reports: [report],
              });
            }
          });
        }
      });

      technicianHours.forEach((data, techId) => {
        if (data.reports.length === 0 || data.shiftType === 'Assente') {
          return;
        }

        const absenceTypes = ['Ferie', 'Permesso', 'Malattia', '104'];
        if (absenceTypes.includes(data.shiftType)) {
          return;
        }

        const timeSlots: TimeSlot[] = [];

        data.reports.forEach(report => {
          const techInReport = report.technicians.find(t => t.id === techId);
          if (techInReport) {
            const startMinutes = timeToMinutes(techInReport.startTime);
            let endMinutes = timeToMinutes(techInReport.endTime);
            
            if (endMinutes < startMinutes) {
              endMinutes += 24 * 60;
            }
            
            timeSlots.push({
              start: startMinutes,
              end: endMinutes,
              reportId: report.id,
            });
          }
        });

        const { totalMinutes, overlaps } = mergeTimeSlots(timeSlots);
        const totalHours = totalMinutes / 60;
        data.totalHours = totalHours;
        
        if (totalHours <= 8) {
          data.ordinaryHours = totalHours;
          data.overtimeHours = 0;
        } else {
          data.ordinaryHours = 8;
          data.overtimeHours = totalHours - 8;
        }
        
        if (overlaps.length > 0) {
          data.warnings = overlaps;
          console.warn(`⚠️ ${data.technicianName} - ${date}: ${overlaps.join(', ')}`);
        }
      });

      const activeTechnicians = settings.technicians.filter(t => t.active);
      activeTechnicians.forEach(tech => {
        if (!technicianHours.has(tech.id)) {
          technicianHours.set(tech.id, {
            technicianId: tech.id,
            technicianName: tech.name,
            totalHours: 0,
            ordinaryHours: 0,
            overtimeHours: 0,
            shiftType: 'Assente',
            reports: [],
          });
        }
      });

      return Array.from(technicianHours.values()).sort((a, b) => 
        a.technicianName.localeCompare(b.technicianName, 'it')
      );
    },
    [reports, settings.technicians]
  );

  const calculateMonthlyHours = useCallback(
    (year: number, month: number, technicianId?: string | null) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const technicianMonthlyData = new Map<string, {
        technicianId: string;
        technicianName: string;
        dailyHours: Map<string, number>;
        dailyOrdinaryHours: Map<string, number>;
        dailyOvertimeHours: Map<string, number>;
        dailyShiftTypes: Map<string, ShiftType | 'Assente'>;
        totalHours: number;
        totalOrdinaryHours: number;
        totalOvertimeHours: number;
        presenceDays: number;
        absenceDays: { [key: string]: number };
        warnings: string[];
      }>();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        const dailyHours = calculateDailyHours(dateString);

        dailyHours.forEach(dayData => {
          if (technicianId) {
            const selectedTech = settings.technicians.find(t => t.id === technicianId);
            if (selectedTech && dayData.technicianId !== selectedTech.id) {
              return;
            }
          }

          const existing = technicianMonthlyData.get(dayData.technicianId);
          if (existing) {
            existing.dailyHours.set(dateString, dayData.totalHours);
            existing.dailyOrdinaryHours.set(dateString, dayData.ordinaryHours);
            existing.dailyOvertimeHours.set(dateString, dayData.overtimeHours);
            existing.dailyShiftTypes.set(dateString, dayData.shiftType);
            existing.totalHours += dayData.totalHours;
            existing.totalOrdinaryHours += dayData.ordinaryHours;
            existing.totalOvertimeHours += dayData.overtimeHours;
            
            if (dayData.warnings && dayData.warnings.length > 0) {
              dayData.warnings.forEach(warning => {
                existing.warnings.push(`${dateString}: ${warning}`);
              });
            }
            
            if (dayData.totalHours > 0) {
              existing.presenceDays++;
            }
            
            const absenceTypes = ['Ferie', 'Permesso', 'Malattia', '104'];
            if (absenceTypes.includes(dayData.shiftType)) {
              existing.absenceDays[dayData.shiftType] = (existing.absenceDays[dayData.shiftType] || 0) + 1;
            } else if (dayData.shiftType === 'Assente') {
              existing.absenceDays['Assente'] = (existing.absenceDays['Assente'] || 0) + 1;
            }
          } else {
            const absenceDays: { [key: string]: number } = {};
            let presenceDays = 0;
            const warnings: string[] = [];
            
            if (dayData.warnings && dayData.warnings.length > 0) {
              dayData.warnings.forEach(warning => {
                warnings.push(`${dateString}: ${warning}`);
              });
            }
            
            if (dayData.totalHours > 0) {
              presenceDays = 1;
            }
            
            const absenceTypes = ['Ferie', 'Permesso', 'Malattia', '104'];
            if (absenceTypes.includes(dayData.shiftType)) {
              absenceDays[dayData.shiftType] = 1;
            } else if (dayData.shiftType === 'Assente') {
              absenceDays['Assente'] = 1;
            }

            technicianMonthlyData.set(dayData.technicianId, {
              technicianId: dayData.technicianId,
              technicianName: dayData.technicianName,
              dailyHours: new Map([[dateString, dayData.totalHours]]),
              dailyOrdinaryHours: new Map([[dateString, dayData.ordinaryHours]]),
              dailyOvertimeHours: new Map([[dateString, dayData.overtimeHours]]),
              dailyShiftTypes: new Map([[dateString, dayData.shiftType]]),
              totalHours: dayData.totalHours,
              totalOrdinaryHours: dayData.ordinaryHours,
              totalOvertimeHours: dayData.overtimeHours,
              presenceDays,
              absenceDays,
              warnings,
            });
          }
        });
      }

      return Array.from(technicianMonthlyData.values()).sort((a, b) => 
        a.technicianName.localeCompare(b.technicianName, 'it')
      );
    },
    [calculateDailyHours, settings.technicians]
  );

  const getOverlapWarnings = useCallback(
    (date: string) => {
      const dailyData = calculateDailyHours(date);
      const warnings: { technicianName: string; warning: string }[] = [];

      dailyData.forEach(data => {
        if (data.warnings && data.warnings.length > 0) {
          data.warnings.forEach(warning => {
            warnings.push({
              technicianName: data.technicianName,
              warning,
            });
          });
        }
      });

      return warnings;
    },
    [calculateDailyHours]
  );

  return useMemo(
    () => ({
      reports,
      settings,
      isLoading,
      selectedTechnicianId,
      setSelectedTechnicianId,
      addReport,
      importReports,
      updateReport,
      deleteReport,
      getReportsByMonth,
      getReportsByDate,
      getTodayReports,
      calculateStats,
      calculateDailyHours,
      calculateMonthlyHours,
      getOverlapWarnings,
      updateSettings,
      addTechnician,
      updateTechnician,
      deleteTechnician,
      addShip,
      updateShip,
      deleteShip,
      addLocation,
      updateLocation,
      deleteLocation,
      clearAllData,
      syncWithTechnicians,
      addNotification,
      updateNotification,
      deleteNotification,
    }),
    [
      reports,
      settings,
      isLoading,
      selectedTechnicianId,
      setSelectedTechnicianId,
      addReport,
      importReports,
      updateReport,
      deleteReport,
      getReportsByMonth,
      getReportsByDate,
      getTodayReports,
      calculateStats,
      calculateDailyHours,
      calculateMonthlyHours,
      getOverlapWarnings,
      updateSettings,
      addTechnician,
      updateTechnician,
      deleteTechnician,
      addShip,
      updateShip,
      deleteShip,
      addLocation,
      updateLocation,
      deleteLocation,
      clearAllData,
      syncWithTechnicians,
      addNotification,
      updateNotification,
      deleteNotification,
    ]
  );
});
