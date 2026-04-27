// ========================================
// STORAGE — 100% API (sem localStorage)
// Todas as operações vão para o backend
// ========================================
const Storage = {

    // ---- Helper de fetch autenticado ----
    async _fetch(path, options = {}) {
        try {
            const res = await fetch(`${API_URL}${path}`, {
                ...options,
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`,
                    ...(options.headers || {}),
                },
            });
            if (res.status === 401 || res.status === 403) {
                console.warn(`[Storage] Erro ${res.status} em ${path} — sem redirecionar`);
                return null;
            }
            return res;
        } catch(e) {
            console.error(`[Storage._fetch] Falha em ${path}:`, e.message);
            return null;
        }
    },

    // ---- Projetos ----
    async getProjects() {
        try {
            const res = await this._fetch('/projects');
            if (!res) {
                console.warn('[Storage.getProjects] Sem resposta do servidor — backend offline?');
                return [];
            }
            if (!res.ok) {
                console.warn('[Storage.getProjects] Resposta não-OK:', res.status, res.statusText);
                return [];
            }
            const projects = await res.json();
            console.log(`[Storage.getProjects] ${projects.length} projeto(s) carregado(s)`);
            return projects.map(p => this._normalizeProject(p));
        } catch(e) {
            console.error('[Storage.getProjects] Erro:', e);
            return [];
        }
    },

    async getProject(projectId) {
        try {
            const res = await this._fetch(`/projects/${projectId}`);
            if (!res || !res.ok) return null;
            const p = await res.json();
            return this._normalizeProject(p);
        } catch(e) {
            console.error('getProject:', e);
            return null;
        }
    },

    // Retorna { ok, project?, message }
    async saveProject(project) {
        try {
            if (!project.id || project.id === project._tmpId) {
                const res = await this._fetch('/projects', {
                    method: 'POST',
                    body: JSON.stringify({
                        name:        project.name,
                        description: project.description || '',
                        data:        project,
                    }),
                });
                if (!res) return { ok: false, message: 'Sem resposta do servidor. Verifique se o backend está rodando.' };
                const data = await res.json();
                if (!res.ok) {
                    console.error('[saveProject] Erro:', data);
                    return { ok: false, message: data.message || 'Erro ao criar projeto' };
                }
                return { ok: true, project: this._normalizeProject(data.project) };
            } else {
                const res = await this._fetch(`/projects/${project.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name:        project.name,
                        description: project.description || '',
                        data:        project,
                    }),
                });
                if (!res) return { ok: false, message: 'Sem resposta do servidor.' };
                const data = await res.json();
                if (!res.ok) {
                    console.error('[saveProject] Erro:', data);
                    return { ok: false, message: data.message || 'Erro ao atualizar projeto' };
                }
                return { ok: true, project: this._normalizeProject(data.project) };
            }
        } catch(e) {
            console.error('saveProject:', e);
            return { ok: false, message: 'Erro inesperado: ' + e.message };
        }
    },

    async deleteProject(projectId) {
        try {
            const res = await this._fetch(`/projects/${projectId}`, { method: 'DELETE' });
            return res && res.ok;
        } catch(e) {
            console.error('deleteProject:', e);
            return false;
        }
    },

    // ---- Usuários ----
    // Verifica se um email está cadastrado. Retorna { exists, name } ou null em caso de erro.
    async checkUserByEmail(email) {
        try {
            const res = await this._fetch(`/users/check?email=${encodeURIComponent(email)}`);
            if (!res) return null;
            const data = await res.json();
            if (!res.ok) return null;
            return data;
        } catch(e) {
            console.error('checkUserByEmail:', e);
            return null;
        }
    },

    // ---- Convites ----
    async getMyInvites() {
        try {
            const res = await this._fetch('/invites/my');
            if (!res || !res.ok) return [];
            return await res.json();
        } catch(e) {
            console.error('getMyInvites:', e);
            return [];
        }
    },

    async sendInvite(email, projectId) {
        try {
            const res = await this._fetch('/invites', {
                method: 'POST',
                body: JSON.stringify({ email, projectId }),
            });
            if (!res) return { ok: false, message: 'Sem resposta do servidor.' };
            const data = await res.json();
            return { ok: res.ok, message: data.message };
        } catch(e) {
            return { ok: false, message: 'Erro de conexão' };
        }
    },

    async acceptInvite(inviteId) {
        try {
            const res = await this._fetch(`/invites/${inviteId}/accept`, { method: 'POST' });
            if (!res) return { ok: false, message: 'Sem resposta do servidor.' };
            const data = await res.json();
            return { ok: res.ok, message: data.message, project: data.project };
        } catch(e) {
            return { ok: false, message: 'Erro de conexão' };
        }
    },

    async declineInvite(inviteId) {
        try {
            const res = await this._fetch(`/invites/${inviteId}`, { method: 'DELETE' });
            if (!res) return { ok: false, message: 'Sem resposta do servidor.' };
            const data = await res.json();
            return { ok: res.ok, message: data.message };
        } catch(e) {
            return { ok: false, message: 'Erro de conexão' };
        }
    },

    async getProjectInvites(projectId) {
        try {
            const res = await this._fetch(`/invites/project/${projectId}`);
            if (!res || !res.ok) return [];
            return await res.json();
        } catch(e) {
            return [];
        }
    },

    async cancelInvite(inviteId) {
        try {
            const res = await this._fetch(`/invites/${inviteId}`, { method: 'DELETE' });
            if (!res) return { ok: false, message: 'Sem resposta do servidor.' };
            const data = await res.json();
            return { ok: res.ok, message: data.message };
        } catch(e) {
            return { ok: false, message: 'Erro de conexão' };
        }
    },

    // ---- Normaliza projeto do backend para o formato do frontend ----
    _normalizeProject(p) {
        const extra = p.data || {};
        return {
            id:             p.id,
            name:           p.name        || extra.name        || '',
            description:    p.description || extra.description || '',
            createdAt:      p.created_at  || extra.createdAt   || new Date().toISOString(),
            updatedAt:      p.updated_at  || extra.updatedAt   || new Date().toISOString(),
            creatorId:      p.creator_id  || extra.creatorId   || '',
            creatorName:    p.creator?.name  || extra.creatorName  || '',
            creatorEmail:   p.creator?.email || extra.creatorEmail || '',
            members:        extra.members        || [],
            memberNames:    extra.memberNames     || {},
            pendingInvites: extra.pendingInvites  || [],
            productOwner:   extra.productOwner    || '',
            productOwnerId: extra.productOwnerId  || null,
            scrumMaster:    extra.scrumMaster     || '',
            scrumMasterId:  extra.scrumMasterId   || null,
            devPairs:       extra.devPairs        || [{ id: this.generateId(), dev1Id: null, dev1: '', dev2Id: null, dev2: '' }],
            backlog:        extra.backlog         || [],
            sprints:        extra.sprints         || [],
            wipLimits:      extra.wipLimits       || { todo: 10, inProgress: 3, review: 3, done: 0 },
            dailyScrums:    extra.dailyScrums     || [],
            retrospectives: extra.retrospectives  || [],
            myRole:         p.myRole              || 'member',
            _backendMembers: (p.project_members || []).map(m => ({
                userId: m.users?.id,
                name:   m.users?.name,
                email:  m.users?.email,
                role:   m.role,
            })),
        };
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },
};