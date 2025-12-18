import { getDatabase, saveDatabase } from '../shared/database/connection';
import { UserDTO } from '../dtos/user/UserDTO';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';

/**
 * Implementação do Repository de Usuários
 * Usa sql.js
 */
export class UserRepository implements IUserRepository {
  findAll(): UserDTO[] {
    const db = getDatabase();
    const results = db.exec(`
      SELECT 
        id,
        name,
        email,
        role,
        created_at as createdAt
      FROM users
      ORDER BY created_at DESC
    `);

    if (!results.length) return [];

    const columns = results[0].columns;
    return results[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj as UserDTO;
    });
  }

  findById(id: number): UserDTO | undefined {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        id,
        name,
        email,
        role,
        created_at as createdAt
      FROM users
      WHERE id = ?
    `);
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as unknown as UserDTO;
    }
    stmt.free();
    return undefined;
  }

  update(id: number, name: string, email: string, role: string): void {
    const db = getDatabase();
    db.run(`
      UPDATE users
      SET name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, email, role, id]);
    saveDatabase();
  }

  delete(id: number): void {
    const db = getDatabase();
    db.run(`DELETE FROM users WHERE id = ?`, [id]);
    saveDatabase();
  }

  emailExists(email: string, excludeId?: number): boolean {
    const db = getDatabase();
    let stmt;
    
    if (excludeId) {
      stmt = db.prepare(`SELECT id FROM users WHERE email = ? AND id != ?`);
      stmt.bind([email, excludeId]);
    } else {
      stmt = db.prepare(`SELECT id FROM users WHERE email = ?`);
      stmt.bind([email]);
    }

    const exists = stmt.step();
    stmt.free();
    return exists;
  }

  countAdmins(): number {
    const db = getDatabase();
    const results = db.exec(`SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'`);
    
    if (!results.length) return 0;
    return results[0].values[0][0] as number;
  }
}
