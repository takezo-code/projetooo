import { getDatabase, saveDatabase } from '../shared/database/connection';
import { Task } from '../entities/Task.entity';
import { TaskDTO } from '../dtos/task/TaskDTO';
import { ITaskRepository } from '../interfaces/repositories/ITaskRepository';
import { TaskMapper } from '../mappers/task.mapper';

/**
 * Implementação do Repository de Tasks
 * Usa sql.js
 */
export class TaskRepository implements ITaskRepository {
  findAll(): TaskDTO[] {
    const db = getDatabase();
    const results = db.exec(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.assigned_to as assignedTo,
        t.created_by as createdBy,
        t.created_at as createdAt,
        t.updated_at as updatedAt,
        assigned.name as assignedToName,
        creator.name as createdByName
      FROM tasks t
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      LEFT JOIN users creator ON t.created_by = creator.id
      ORDER BY t.created_at DESC
    `);

    if (!results.length) return [];

    const columns = results[0].columns;
    return results[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return TaskMapper.toDTO(obj);
    });
  }

  findById(id: number): TaskDTO | undefined {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.assigned_to as assignedTo,
        t.created_by as createdBy,
        t.created_at as createdAt,
        t.updated_at as updatedAt,
        assigned.name as assignedToName,
        creator.name as createdByName
      FROM tasks t
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = ?
    `);
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return TaskMapper.toDTO(row);
    }
    stmt.free();
    return undefined;
  }

  findByAssignedTo(userId: number): TaskDTO[] {
    const db = getDatabase();
    const results = db.exec(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.assigned_to as assignedTo,
        t.created_by as createdBy,
        t.created_at as createdAt,
        t.updated_at as updatedAt,
        assigned.name as assignedToName,
        creator.name as createdByName
      FROM tasks t
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.assigned_to = ${userId}
      ORDER BY t.created_at DESC
    `);

    if (!results.length) return [];

    const columns = results[0].columns;
    return results[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return TaskMapper.toDTO(obj);
    });
  }

  create(title: string, description: string | null, createdBy: number, assignedTo: number | null): Task {
    const db = getDatabase();
    db.run(`
      INSERT INTO tasks (title, description, created_by, assigned_to, status)
      VALUES (?, ?, ?, ?, 'BACKLOG')
    `, [title, description, createdBy, assignedTo]);

    saveDatabase();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const lastId = result[0].values[0][0] as number;

    const taskDTO = this.findById(lastId);
    if (!taskDTO) {
      throw new Error('Falha ao criar task');
    }

    return TaskMapper.toEntity(taskDTO);
  }

  update(id: number, title: string, description: string | null, assignedTo: number | null): void {
    const db = getDatabase();
    db.run(`
      UPDATE tasks
      SET title = ?, description = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, description, assignedTo, id]);
    saveDatabase();
  }

  updateStatus(id: number, status: string): void {
    const db = getDatabase();
    db.run(`
      UPDATE tasks
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);
    saveDatabase();
  }

  delete(id: number): void {
    const db = getDatabase();
    db.run(`DELETE FROM tasks WHERE id = ?`, [id]);
    saveDatabase();
  }

  userExists(userId: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT id FROM users WHERE id = ?`);
    stmt.bind([userId]);
    const exists = stmt.step();
    stmt.free();
    return exists;
  }
}
