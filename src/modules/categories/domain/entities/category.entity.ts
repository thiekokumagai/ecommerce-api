export interface Category {
  id: string;
  title: string;
  image: string | null;
  isVisible: boolean;
  order: number;
  deletedAt: Date | null;
}
