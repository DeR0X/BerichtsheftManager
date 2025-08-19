export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'azubi' | 'ausbilder';
  company?: string;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  week_year: number;
  week_number: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  report_id: string;
  day_of_week: number;
  date: string;
  activity_text: string;
  created_at: string;
  updated_at: string;
}

export interface DayHours {
  id: string;
  report_id: string;
  day_of_week: number;
  date: string;
  hours: number;
  minutes: number;
  created_at: string;
  updated_at: string;
}

export interface PredefinedActivity {
  id: string;
  name: string;
  description: string | null;
  category: string;
  created_at: string;
}

class LocalStorageDB {
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // Users
  getUsers(): User[] {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }

  saveUsers(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  createUser(userData: Omit<User, 'id' | 'created_at'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: this.generateId(),
      created_at: this.getCurrentTimestamp(),
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.email === email) || null;
  }

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  // Reports
  getReports(): Report[] {
    const reports = localStorage.getItem('reports');
    return reports ? JSON.parse(reports) : [];
  }

  saveReports(reports: Report[]): void {
    localStorage.setItem('reports', JSON.stringify(reports));
  }

  createReport(reportData: Omit<Report, 'id' | 'created_at' | 'updated_at'>): Report {
    const reports = this.getReports();
    const newReport: Report = {
      ...reportData,
      id: this.generateId(),
      created_at: this.getCurrentTimestamp(),
      updated_at: this.getCurrentTimestamp(),
    };
    reports.push(newReport);
    this.saveReports(reports);
    return newReport;
  }

  updateReport(id: string, updates: Partial<Report>): Report | null {
    const reports = this.getReports();
    const index = reports.findIndex(report => report.id === id);
    if (index === -1) return null;

    reports[index] = {
      ...reports[index],
      ...updates,
      updated_at: this.getCurrentTimestamp(),
    };
    this.saveReports(reports);
    return reports[index];
  }

  getReportsByUserId(userId: string): Report[] {
    const reports = this.getReports();
    return reports.filter(report => report.user_id === userId);
  }

  getReportByWeek(userId: string, weekYear: number, weekNumber: number): Report | null {
    const reports = this.getReports();
    return reports.find(report => 
      report.user_id === userId && 
      report.week_year === weekYear && 
      report.week_number === weekNumber
    ) || null;
  }

  // Activities
  getActivities(): Activity[] {
    const activities = localStorage.getItem('activities');
    return activities ? JSON.parse(activities) : [];
  }

  saveActivities(activities: Activity[]): void {
    localStorage.setItem('activities', JSON.stringify(activities));
  }

  createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Activity {
    const activities = this.getActivities();
    const newActivity: Activity = {
      ...activityData,
      id: this.generateId(),
      created_at: this.getCurrentTimestamp(),
      updated_at: this.getCurrentTimestamp(),
    };
    activities.push(newActivity);
    this.saveActivities(activities);
    return newActivity;
  }

  getActivitiesByReportId(reportId: string): Activity[] {
    const activities = this.getActivities();
    return activities.filter(activity => activity.report_id === reportId);
  }

  deleteActivitiesByReportId(reportId: string): void {
    const activities = this.getActivities();
    const filteredActivities = activities.filter(activity => activity.report_id !== reportId);
    this.saveActivities(filteredActivities);
  }

  // Day Hours
  getDayHours(): DayHours[] {
    const dayHours = localStorage.getItem('day_hours');
    return dayHours ? JSON.parse(dayHours) : [];
  }

  saveDayHours(dayHours: DayHours[]): void {
    localStorage.setItem('day_hours', JSON.stringify(dayHours));
  }

  createDayHours(dayHoursData: Omit<DayHours, 'id' | 'created_at' | 'updated_at'>): DayHours {
    const dayHours = this.getDayHours();
    const newDayHours: DayHours = {
      ...dayHoursData,
      id: this.generateId(),
      created_at: this.getCurrentTimestamp(),
      updated_at: this.getCurrentTimestamp(),
    };
    dayHours.push(newDayHours);
    this.saveDayHours(dayHours);
    return newDayHours;
  }

  updateDayHours(id: string, updates: Partial<DayHours>): DayHours | null {
    const dayHours = this.getDayHours();
    const index = dayHours.findIndex(dh => dh.id === id);
    if (index === -1) return null;

    dayHours[index] = {
      ...dayHours[index],
      ...updates,
      updated_at: this.getCurrentTimestamp(),
    };
    this.saveDayHours(dayHours);
    return dayHours[index];
  }

  getDayHoursByReportId(reportId: string): DayHours[] {
    const dayHours = this.getDayHours();
    return dayHours.filter(dh => dh.report_id === reportId);
  }

  getDayHoursByReportAndDay(reportId: string, dayOfWeek: number): DayHours | null {
    const dayHours = this.getDayHours();
    return dayHours.find(dh => dh.report_id === reportId && dh.day_of_week === dayOfWeek) || null;
  }

  deleteDayHoursByReportId(reportId: string): void {
    const dayHours = this.getDayHours();
    const filteredDayHours = dayHours.filter(dh => dh.report_id !== reportId);
    this.saveDayHours(filteredDayHours);
  }

  // Predefined Activities
  getPredefinedActivities(): PredefinedActivity[] {
    const activities = localStorage.getItem('predefined_activities');
    if (!activities) {
      // Initialize with default activities
      const defaultActivities: PredefinedActivity[] = [
        { id: this.generateId(), name: 'Kundenberatung', description: 'Beratung von Kunden zu Produkten und Dienstleistungen', category: 'Verkauf', created_at: this.getCurrentTimestamp() },
        { id: this.generateId(), name: 'Wareneingangsprüfung', description: 'Kontrolle und Prüfung eingehender Waren', category: 'Lager', created_at: this.getCurrentTimestamp() },
        { id: this.generateId(), name: 'Buchhaltung', description: 'Erfassung und Bearbeitung von Geschäftsvorfällen', category: 'Verwaltung', created_at: this.getCurrentTimestamp() },
        { id: this.generateId(), name: 'Projektplanung', description: 'Planung und Organisation von Projekten', category: 'Management', created_at: this.getCurrentTimestamp() },
        { id: this.generateId(), name: 'Dokumentation', description: 'Erstellung und Pflege von Dokumentationen', category: 'Verwaltung', created_at: this.getCurrentTimestamp() },
        { id: this.generateId(), name: 'Schulung/Weiterbildung', description: 'Teilnahme an Schulungen und Weiterbildungsmaßnahmen', category: 'Bildung', created_at: this.getCurrentTimestamp() },
        { id: this.generateId(), name: 'Qualitätskontrolle', description: 'Prüfung und Sicherstellung der Produktqualität', category: 'Qualität', created_at: this.getCurrentTimestamp() },
        { id: this.generateId(), name: 'Teammeeting', description: 'Teilnahme an Teambesprechungen und Meetings', category: 'Kommunikation', created_at: this.getCurrentTimestamp() },
        { id: this.generateId(), name: 'Kundentermin', description: 'Termine und Gespräche mit Kunden', category: 'Verkauf', created_at: this.getCurrentTimestamp() },
        { id: this.generateId(), name: 'Datenanalyse', description: 'Auswertung und Analyse von Geschäftsdaten', category: 'Analyse', created_at: this.getCurrentTimestamp() },
      ];
      this.savePredefinedActivities(defaultActivities);
      return defaultActivities;
    }
    return JSON.parse(activities);
  }

  savePredefinedActivities(activities: PredefinedActivity[]): void {
    localStorage.setItem('predefined_activities', JSON.stringify(activities));
  }

  // Authentication
  getCurrentUser(): User | null {
    const currentUser = localStorage.getItem('current_user');
    return currentUser ? JSON.parse(currentUser) : null;
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('current_user');
    }
  }

  // Initialize example accounts
  initializeExampleAccounts(): void {
    const users = this.getUsers();
    if (users.length === 0) {
      // Create example Azubi account
      this.createUser({
        email: 'azubi@example.com',
        full_name: 'Max Mustermann',
        role: 'azubi',
        company: 'Musterfirma GmbH',
      });

      // Create example Ausbilder account
      this.createUser({
        email: 'ausbilder@example.com',
        full_name: 'Anna Schmidt',
        role: 'ausbilder',
        company: 'Musterfirma GmbH',
      });
    }
  }

  login(email: string, password: string): { user: User | null; error: string | null } {
    // Simple password check - in real app, use proper hashing
    const users = this.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { user: null, error: 'Benutzer nicht gefunden' };
    }

    // For demo purposes, accept any password
    // In production, implement proper password hashing
    this.setCurrentUser(user);
    return { user, error: null };
  }

  register(email: string, password: string, fullName: string, role: 'azubi' | 'ausbilder'): { user: User | null; error: string | null } {
    const existingUser = this.getUserByEmail(email);
    if (existingUser) {
      return { user: null, error: 'E-Mail bereits registriert' };
    }

    const newUser = this.createUser({
      email,
      full_name: fullName,
      role,
    });

    this.setCurrentUser(newUser);
    return { user: newUser, error: null };
  }

  logout(): void {
    this.setCurrentUser(null);
  }
}

export const db = new LocalStorageDB();