// Simple in-memory database for class registrations
// In production, replace with a proper database (PostgreSQL, MongoDB, etc.)

export interface ClassRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentId: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  classDate: string;
  createdAt: Date;
}

// In-memory storage (replace with actual database in production)
const registrations: Map<string, ClassRegistration> = new Map();

export const db = {
  async createRegistration(registration: Omit<ClassRegistration, 'id' | 'createdAt'>): Promise<ClassRegistration> {
    const id = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRegistration: ClassRegistration = {
      id,
      ...registration,
      createdAt: new Date(),
    };
    registrations.set(id, newRegistration);
    return newRegistration;
  },

  async updateRegistration(id: string, updates: Partial<ClassRegistration>): Promise<ClassRegistration | null> {
    const registration = registrations.get(id);
    if (!registration) return null;

    const updated = { ...registration, ...updates };
    registrations.set(id, updated);
    return updated;
  },

  async getRegistration(id: string): Promise<ClassRegistration | null> {
    return registrations.get(id) || null;
  },

  async getRegistrationByOrderId(orderId: string): Promise<ClassRegistration | null> {
    for (const registration of registrations.values()) {
      if (registration.orderId === orderId) {
        return registration;
      }
    }
    return null;
  },

  async getRegistrationByEmail(email: string): Promise<ClassRegistration[]> {
    const results: ClassRegistration[] = [];
    for (const registration of registrations.values()) {
      if (registration.email === email) {
        results.push(registration);
      }
    }
    return results;
  },

  async getAllRegistrations(): Promise<ClassRegistration[]> {
    return Array.from(registrations.values());
  },
};
