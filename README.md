# 🔐 Auth-first Kanban API

Sistema Kanban com foco em **autenticação e autorização**, desenvolvido como projeto de portfólio para demonstrar domínio em segurança e arquitetura backend.

## 🛠️ Stack

- **Node.js** + **Express** + **TypeScript**
- **SQLite** (better-sqlite3)
- **JWT** (Access + Refresh Token com rotação)
- **bcrypt** (hash de senhas)
- **Zod** (validação)

## 📁 Arquitetura

```
src/
├── controllers/      # Handlers HTTP
├── services/         # Lógica de negócio
├── repositories/     # Acesso ao banco
├── routes/           # Definição de rotas
├── entities/         # Entidades de domínio
├── dtos/             # Data Transfer Objects
├── interfaces/       # Contratos (SOLID)
├── mappers/          # Transformadores Entity ↔ DTO
├── constants/        # Constantes centralizadas
├── exceptions/       # Exceções customizadas
├── validations/      # Schemas Zod
├── utils/            # Utilitários (JWT, Hash)
└── shared/           # Middlewares, config, database
```

## 👥 Roles e Permissões

| Ação | ADMIN | MEMBER |
|------|:-----:|:------:|
| Criar tasks | ✅ | ❌ |
| Editar tasks | ✅ | ❌ |
| Deletar tasks | ✅ | ❌ |
| Ver todas as tasks | ✅ | ❌ |
| Ver tasks atribuídas | ✅ | ✅ |
| Mover tasks (próprias) | ✅ | ✅ |
| Aprovar tasks (REVIEW → DONE) | ✅ | ❌ |
| Gerenciar usuários | ✅ | ❌ |

## 📋 Fluxo Kanban

```
BACKLOG → IN_PROGRESS → REVIEW → DONE
```

**Regras:**
- Tasks sempre começam em `BACKLOG`
- MEMBER pode mover: `BACKLOG → IN_PROGRESS`, `IN_PROGRESS → REVIEW`
- ADMIN pode mover: `REVIEW → DONE`, `REVIEW → IN_PROGRESS` (rejeição)
- MEMBER só pode mover tasks atribuídas a ele

## 🚀 Instalação

```bash
# Clonar repositório
git clone https://github.com/takezo-code/projetooo.git
cd projetooo

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Rodar migrations
npm run migrate

# Iniciar servidor
npm run dev
```

### ⚠️ Windows

Se tiver problemas com `better-sqlite3`, use WSL:

```bash
wsl --install
# No terminal WSL:
cd /mnt/c/caminho/do/projeto
npm install
npm run dev
```

## 🔑 Variáveis de Ambiente

```env
PORT=3000
JWT_SECRET=sua-chave-secreta
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## 📡 Endpoints da API

### 🔐 Autenticação

#### POST `/api/auth/register`
Registrar novo usuário.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "role": "MEMBER" // opcional, padrão: MEMBER
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": { "id": 1, "name": "João Silva", "email": "joao@email.com", "role": "MEMBER" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### POST `/api/auth/login`
Fazer login.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response:** Mesmo formato do register.

#### POST `/api/auth/refresh`
Renovar access token usando refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "novo_token...",
    "refreshToken": "novo_refresh_token..."
  }
}
```

#### POST `/api/auth/logout`
Revogar refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

---

### 📋 Tasks

Todas as rotas de tasks requerem autenticação (`Authorization: Bearer <token>`).

#### GET `/api/tasks`
Listar tasks. ADMIN vê todas, MEMBER vê apenas as atribuídas a ele.

#### GET `/api/tasks/:id`
Buscar task por ID.

#### POST `/api/tasks` (ADMIN only)
Criar nova task.

**Body:**
```json
{
  "title": "Implementar feature X",
  "description": "Descrição da task",
  "assignedTo": 2 // opcional
}
```

#### PUT `/api/tasks/:id` (ADMIN only)
Atualizar task.

**Body:**
```json
{
  "title": "Novo título",
  "description": "Nova descrição",
  "assignedTo": 3
}
```

#### PATCH `/api/tasks/:id/move`
Mover task entre status. Respeita regras de transição.

**Body:**
```json
{
  "newStatus": "IN_PROGRESS"
}
```

#### DELETE `/api/tasks/:id` (ADMIN only)
Deletar task.

---

### 👥 Users

Todas as rotas de users requerem autenticação.

#### GET `/api/users` (ADMIN only)
Listar todos os usuários.

#### GET `/api/users/:id`
Buscar usuário por ID. ADMIN pode ver qualquer um, MEMBER só o próprio.

#### PUT `/api/users/:id` (ADMIN only)
Atualizar usuário.

**Body:**
```json
{
  "name": "Novo Nome",
  "email": "novo@email.com",
  "role": "ADMIN"
}
```

#### DELETE `/api/users/:id` (ADMIN only)
Deletar usuário. Não pode deletar a si mesmo nem o último admin.

## 🔒 Autenticação

Todas as rotas protegidas requerem header:

```
Authorization: Bearer <access_token>
```

### Refresh Token Rotation

Quando o access token expira, use o refresh token para obter novos tokens. O refresh token antigo é revogado automaticamente (rotação).

## 🎯 Padrões Implementados

- **Layered Architecture** - Separação em camadas
- **Repository Pattern** - Abstração de dados
- **DTO Pattern** - Separação API ↔ Domínio
- **Mapper Pattern** - Transformação entre camadas
- **Dependency Inversion** - Interfaces e contratos
- **Custom Exceptions** - Erros semânticos

## 📄 Licença

MIT
