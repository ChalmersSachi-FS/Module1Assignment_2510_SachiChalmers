// services/db.ts
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { Task } from "../types";

const DB_NAME = "tasks.db";
const STORAGE_KEY = "tasks_web_v1";
let db: SQLite.SQLiteDatabase | null = null;

/** 📦 Open SQLite DB (native only) */
async function openDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === "web") return null;
  if (db) return db;

  // ✅ Modern async API (Expo SDK 51+)
  const database = await SQLite.openDatabaseAsync(DB_NAME);
  db = database;
  return database;
}

/** 🏁 Initialize DB (create table if not exists) */
export async function initDB(): Promise<void> {
  if (Platform.OS === "web") return;

  const database = await openDatabase();
  await database?.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT,
      completed INTEGER,
      category TEXT,
      createdAt INTEGER
    );
  `);
}

/** ➕ Add a new task */
export async function addTask(task: Task): Promise<void> {
  if (Platform.OS === "web") {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const tasks: Task[] = stored ? JSON.parse(stored) : [];
    const newTask = { ...task, id: Date.now() };
    tasks.push(newTask);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return;
  }

  const database = await openDatabase();
  await database?.runAsync(
    "INSERT INTO tasks (title, description, priority, completed, category, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [
      task.title,
      task.description ?? "",
      task.priority,
      task.completed ? 1 : 0,
      task.category,
      task.createdAt,
    ]
  );
}

/** 📋 Get all tasks with optional filters */
export async function getTasks(filters?: {
  category?: string;
  completed?: "all" | boolean;
}): Promise<Task[]> {
  if (Platform.OS === "web") {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    let tasks: Task[] = stored ? JSON.parse(stored) : [];

    if (filters?.category && filters.category !== "All") {
      tasks = tasks.filter((t) => t.category === filters.category);
    }

    if (filters?.completed !== undefined && filters.completed !== "all") {
      tasks = tasks.filter((t) => t.completed === filters.completed);
    }

    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  }

  const database = await openDatabase();
  let query = "SELECT * FROM tasks";
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.category && filters.category !== "All") {
    conditions.push("category = ?");
    params.push(filters.category);
  }

  if (filters?.completed !== undefined && filters.completed !== "all") {
    conditions.push("completed = ?");
    params.push(filters.completed ? 1 : 0);
  }

  if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY createdAt DESC";

  const rows = await database?.getAllAsync<Task>(query, params);
  return rows?.map((r) => ({ ...r, completed: !!r.completed })) ?? [];
}

/** ✅ Toggle task completion */
export async function toggleComplete(
  id: number,
  completed: boolean
): Promise<void> {
  if (Platform.OS === "web") {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const tasks: Task[] = JSON.parse(stored);
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed } : t));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return;
  }

  const database = await openDatabase();
  await database?.runAsync("UPDATE tasks SET completed = ? WHERE id = ?", [
    completed ? 1 : 0,
    id,
  ]);
}

/** 🗑️ Delete a task */
export async function deleteTask(id: number): Promise<void> {
  if (Platform.OS === "web") {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const tasks: Task[] = JSON.parse(stored);
    const filtered = tasks.filter((t) => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return;
  }

  const database = await openDatabase();
  await database?.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
}

/** 📊 Get stats (total, completed) */
export async function getStats(): Promise<{
  total: number;
  completed: number;
}> {
  if (Platform.OS === "web") {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const tasks: Task[] = stored ? JSON.parse(stored) : [];
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }

  const database = await openDatabase();
  const totalRow = await database?.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM tasks"
  );
  const completedRow = await database?.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM tasks WHERE completed = 1"
  );

  return {
    total: totalRow?.count ?? 0,
    completed: completedRow?.count ?? 0,
  };
}

/** 🧹 Clear all tasks (for testing or reset) */
export async function clearAll(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }

  const database = await openDatabase();
  await database?.runAsync("DELETE FROM tasks");
}
