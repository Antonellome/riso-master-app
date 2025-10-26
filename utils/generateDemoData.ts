import { Report, ShiftType, ReportTechnician } from "@/contexts/ReportContext";

export function generateDemoReports(): Report[] {
  const technicians = [
    { id: "tech1", name: "Marco Rossi", userId: "T001" },
    { id: "tech2", name: "Luca Bianchi", userId: "T002" },
    { id: "tech3", name: "Paolo Verdi", userId: "T003" },
    { id: "tech4", name: "Giuseppe Ferrari", userId: "T004" },
    { id: "tech5", name: "Andrea Colombo", userId: "T005" },
    { id: "tech6", name: "Fabio Romano", userId: "T006" },
    { id: "tech7", name: "Simone Ricci", userId: "T007" },
    { id: "tech8", name: "Matteo Greco", userId: "T008" },
    { id: "tech9", name: "Roberto Conti", userId: "T009" },
    { id: "tech10", name: "Stefano Bruno", userId: "T010" },
  ];

  const ships = ["MSC Magnifica", "Costa Pacifica"];
  const locations = ["Porto di Genova", "Porto di Civitavecchia"];

  const workShiftTypes: ShiftType[] = ["Ordinaria", "Straordinaria", "Festiva"];
  const absenceTypes: ShiftType[] = ["Ferie", "Permesso", "Malattia", "104"];

  const workDescriptions = [
    "Manutenzione sistema elettrico",
    "Controllo impianto HVAC",
    "Riparazione cabina passeggeri",
    "Ispezione motori ausiliari",
    "Sostituzione componenti idraulici",
    "Verifica sistemi di sicurezza",
    "Manutenzione ordinaria sala macchine",
  ];

  const materials = [
    "Cavi elettrici, connettori, nastro isolante",
    "Filtri aria, guarnizioni, refrigerante",
    "Bulloneria, lamiere, vernici",
    "Olio lubrificante, filtri, guarnizioni",
    "Tubi idraulici, raccordi, sigillanti",
    "Estintori, rilevatori fumo, batterie",
  ];

  const reports: Report[] = [];
  const today = new Date(2025, 9, 17);

  for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateString = date.toISOString().split("T")[0];

    const techsWorkingToday = new Set<string>();
    const techsAbsentToday = new Set<string>();

    const numWorkingTechs = 6 + Math.floor(Math.random() * 2);
    const numAbsentTechs = 1 + Math.floor(Math.random() * 2);

    const availableTechs = [...technicians];
    const selectedWorkingTechs = [];
    for (let i = 0; i < numWorkingTechs && availableTechs.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableTechs.length);
      const tech = availableTechs.splice(randomIndex, 1)[0];
      selectedWorkingTechs.push(tech);
      techsWorkingToday.add(tech.userId);
    }

    const selectedAbsentTechs = [];
    for (let i = 0; i < numAbsentTechs && availableTechs.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableTechs.length);
      const tech = availableTechs.splice(randomIndex, 1)[0];
      selectedAbsentTechs.push(tech);
      techsAbsentToday.add(tech.userId);
    }

    let timestampBase = date.getTime() - (dayOffset * 86400000);

    selectedAbsentTechs.forEach((tech, idx) => {
      const absenceType = absenceTypes[Math.floor(Math.random() * absenceTypes.length)];
      const timestamp = timestampBase + (idx * 10000);
      reports.push({
        id: timestamp.toString(),
        date: dateString,
        shiftType: absenceType,
        ship: "-",
        location: "-",
        startTime: "00:00",
        endTime: "00:00",
        pauseMinutes: 0,
        description: `${absenceType} - Assenza giustificata`,
        materials: "-",
        workDone: "-",
        technicians: [],
        userId: tech.userId,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
      });
    });

    const numWorkReports = 2 + Math.floor(Math.random() * 2);
    
    for (let reportIdx = 0; reportIdx < numWorkReports; reportIdx++) {
      const ship = ships[Math.floor(Math.random() * ships.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const shiftType = workShiftTypes[Math.floor(Math.random() * workShiftTypes.length)];
      const startHour = 7 + Math.floor(Math.random() * 2);
      const endHour = 16 + Math.floor(Math.random() * 3);
      const pauseMinutes = 30 + Math.floor(Math.random() * 60);

      const numTechsInReport = 2 + Math.floor(Math.random() * 3);
      const techsInReport: typeof technicians = [];
      const techsAvailable = [...selectedWorkingTechs].filter(t => 
        !techsInReport.some(existing => existing.userId === t.userId)
      );

      for (let i = 0; i < numTechsInReport && techsAvailable.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * techsAvailable.length);
        techsInReport.push(techsAvailable.splice(randomIndex, 1)[0]);
      }

      if (techsInReport.length === 0) continue;

      const userTech = techsInReport[0];
      const otherTechs = techsInReport.slice(1);

      const techStartHour = startHour + Math.floor(Math.random() * 2);
      const techEndHour = endHour - Math.floor(Math.random() * 2);

      const reportTechnicians: ReportTechnician[] = [
        {
          id: userTech.id,
          name: userTech.name,
          startTime: `${techStartHour.toString().padStart(2, '0')}:00`,
          endTime: `${techEndHour.toString().padStart(2, '0')}:00`,
        },
        ...otherTechs.map((t) => {
          const techStart = startHour + Math.floor(Math.random() * 2);
          const techEnd = endHour - Math.floor(Math.random() * 2);
          return {
            id: t.id,
            name: t.name,
            startTime: `${techStart.toString().padStart(2, '0')}:00`,
            endTime: `${techEnd.toString().padStart(2, '0')}:00`,
          };
        }),
      ];

      const timestamp = timestampBase + ((reportIdx + selectedAbsentTechs.length) * 10000);
      reports.push({
        id: timestamp.toString(),
        date: dateString,
        shiftType,
        ship,
        location,
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        pauseMinutes,
        description: workDescriptions[Math.floor(Math.random() * workDescriptions.length)],
        materials: materials[Math.floor(Math.random() * materials.length)],
        workDone: `Intervento completato con successo. ${shiftType === "Straordinaria" ? "Lavoro urgente richiesto dalla compagnia." : "Operazioni standard eseguite."} Nessuna anomalia rilevata.`,
        technicians: reportTechnicians,
        userId: userTech.userId,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
      });
    }
  }

  return reports.sort((a, b) => b.createdAt - a.createdAt);
}
