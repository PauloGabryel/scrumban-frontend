-- =============================================
-- SCRIPT SQL — SCRUMBAN MANAGER (versão API)
-- Execute no SQL Editor do painel Supabase
-- =============================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de projetos (com campo data JSONB para backlog, sprints, etc.)
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  creator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data        JSONB DEFAULT '{}'::jsonb,   -- armazena backlog, sprints, roles, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de membros do projeto
CREATE TABLE IF NOT EXISTS project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Tabela de convites
CREATE TABLE IF NOT EXISTS invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted    BOOLEAN DEFAULT FALSE,
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_members_user    ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_invites_token           ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email           ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_project         ON invites(project_id);


