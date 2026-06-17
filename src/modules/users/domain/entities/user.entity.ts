export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  expoPushToken?: string | null;
  createdAt: Date;
}
