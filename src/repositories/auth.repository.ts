import { getDatabase, saveDatabase } from '../shared/database/connection';
import { User } from '../entities/User.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';
import { IAuthRepository } from '../interfaces/repositories/IAuthRepository';
import { UserMapper } from '../mappers/user.mapper';

/**
 * Implementação do Repository de Autenticação
 * Usa sql.js
 */
export class AuthRepository implements IAuthRepository {
  // ==================== USERS ====================

  findUserByEmail(email: string): User | undefined {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        id,
        name,
        email,
        password_hash as passwordHash,
        role,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users
      WHERE email = ?
    `);
    stmt.bind([email]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return UserMapper.toEntity(row);
    }
    stmt.free();
    return undefined;
  }

  findUserById(id: number): User | undefined {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        id,
        name,
        email,
        password_hash as passwordHash,
        role,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users
      WHERE id = ?
    `);
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return UserMapper.toEntity(row);
    }
    stmt.free();
    return undefined;
  }

  createUser(name: string, email: string, passwordHash: string, role: string): User {
    const db = getDatabase();
    db.run(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [name, email, passwordHash, role]);

    saveDatabase();

    // Pegar o último ID inserido
    const result = db.exec('SELECT last_insert_rowid() as id');
    const lastId = result[0].values[0][0] as number;

    const user = this.findUserById(lastId);
    if (!user) {
      throw new Error('Falha ao criar usuário');
    }

    return user;
  }

  // ==================== REFRESH TOKENS ====================

  saveRefreshToken(token: string, userId: number, expiresAt: Date): RefreshToken {
    const db = getDatabase();
    db.run(`
      INSERT INTO refresh_tokens (token, user_id, expires_at)
      VALUES (?, ?, ?)
    `, [token, userId, expiresAt.toISOString()]);

    saveDatabase();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const lastId = result[0].values[0][0] as number;

    return new RefreshToken(
      lastId,
      token,
      userId,
      expiresAt.toISOString(),
      0,
      new Date().toISOString()
    );
  }

  findRefreshToken(token: string): RefreshToken | undefined {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        id,
        token,
        user_id as userId,
        expires_at as expiresAt,
        revoked,
        created_at as createdAt
      FROM refresh_tokens
      WHERE token = ?
    `);
    stmt.bind([token]);

    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      stmt.free();
      return new RefreshToken(
        row.id,
        row.token,
        row.userId,
        row.expiresAt,
        row.revoked,
        row.createdAt
      );
    }
    stmt.free();
    return undefined;
  }

  revokeRefreshToken(token: string): void {
    const db = getDatabase();
    db.run(`
      UPDATE refresh_tokens
      SET revoked = 1
      WHERE token = ?
    `, [token]);
    saveDatabase();
  }

  revokeAllUserRefreshTokens(userId: number): void {
    const db = getDatabase();
    db.run(`
      UPDATE refresh_tokens
      SET revoked = 1
      WHERE user_id = ?
    `, [userId]);
    saveDatabase();
  }

  deleteExpiredRefreshTokens(): void {
    const db = getDatabase();
    db.run(`
      DELETE FROM refresh_tokens
      WHERE expires_at < datetime('now')
    `);
    saveDatabase();
  }
}
