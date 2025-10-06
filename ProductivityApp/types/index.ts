export type Priority = "High" | "Medium" | "Low";
export type Category = "Work" | "Personal" | "Other";

export interface Task {
  id?: number;
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
  category: Category;
  createdAt: number;
}
