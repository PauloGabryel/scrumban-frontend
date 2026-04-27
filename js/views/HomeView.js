// ========================================
// HOME VIEW — async, 100% API
// ========================================
const HomeView = {
    currentUser: null,

    async render(currentUser = null) {
        this.currentUser = currentUser;
        const userId = currentUser ? (currentUser.id || currentUser._id) : null;

        // Testa conexão antes de renderizar
        let projects;
        try {
            projects = await Storage.getProjects();
        } catch(e) {
            projects = null;
        }

        if (!Array.isArray(projects)) {
            return `
                <div class="home-hero">
                    <h2>Projetos</h2>
                    <p>Gerencie seus projetos ágeis com Scrum + Kanban integrados</p>
                </div>
                <div class="empty-state" style="text-align:center;padding:60px 20px;">
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" style="margin:0 auto 16px;display:block;opacity:0.7">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h4 style="color:#ef4444;margin-bottom:8px;">Erro de conexão com o servidor</h4>
                    <p style="color:#64748b;max-width:380px;margin:0 auto 20px;">
                        Não foi possível carregar os projetos. Verifique se o backend está rodando em <code>localhost:5000</code> e tente novamente.
                    </p>
                    <button class="btn btn-primary" onclick="App.navigateTo('home')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        Tentar novamente
                    </button>
                </div>`;
        }

        let projectCards = '';
        projects.forEach(p => {
            const project   = new Project(p);
            const stats     = project.getBacklogStats();
            const activeSprint = project.getActiveSprint();
            const sprintCount  = project.sprints.length;

            // Usa myRole do backend (mais confiável que comparar UUID)
            const myRole    = p.myRole || '';
            const isCreator = myRole === 'admin' || (userId && project.isCreator(userId));

            projectCards += `
                <div class="project-card" onclick="App.navigateTo('project', '${project.id}')">
                    <div class="project-card-header">
                        <h3>${this.escapeHtml(project.name)}</h3>
                        <div style="display:flex;gap:6px;align-items:center;">
                            ${isCreator ? `
                            <button class="btn-icon" onclick="event.stopPropagation(); HomeView.showInviteModal('${project.id}')" title="Convidar membro">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="event.stopPropagation(); HomeView.showEditModal('${project.id}', ${JSON.stringify(this.escapeHtml(project.name))}, ${JSON.stringify(this.escapeHtml(project.description || ''))})" title="Editar projeto">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="event.stopPropagation(); HomeView.deleteProject('${project.id}')" title="Excluir">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>` : ''}
                        </div>
                    </div>
                    <p class="project-card-description">${this.escapeHtml(project.description || 'Sem descrição')}</p>
                    <div class="project-card-meta">
                        <span class="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 11l3 3L22 4"></path>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                            ${stats.total} itens
                        </span>
                        <span class="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${sprintCount} sprint${sprintCount !== 1 ? 's' : ''}
                        </span>
                        ${activeSprint ? `<span class="meta-item" style="background:var(--success-light);color:var(--success)">● Sprint Ativa</span>` : ''}
                        ${isCreator
                            ? `<span class="meta-item" style="background:var(--primary-light,#e8eaff);color:var(--primary,#667eea);font-size:11px;">✦ Criador</span>`
                            : `<span class="meta-item" style="font-size:11px;color:var(--gray-500,#999);">Membro</span>`}
                    </div>
                </div>
            `;
        });

        if (projects.length === 0) {
            projectCards = `
                <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:50px 20px;">
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin:0 auto 16px;display:block;">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <h4 style="color:#475569;margin-bottom:8px;">Nenhum projeto ainda</h4>
                    <p style="color:#94a3b8;max-width:320px;margin:0 auto;">Clique em <strong>Criar Novo Projeto</strong> para começar, ou aguarde um convite de outro usuário.</p>
                </div>`;
        }

        return `
            <div class="home-hero">
                <h2>Projetos</h2>
                <p>Gerencie seus projetos ágeis com Scrum + Kanban integrados</p>
            </div>
            <div class="projects-grid">
                <div class="project-card new-project-card" onclick="HomeView.showCreateModal()">
                    <div class="new-project-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                    <span>Criar Novo Projeto</span>
                </div>
                ${projectCards}
            </div>
        `;
    },

    // ---- Criar projeto ----
    showCreateModal() {
        App.showModal('Criar Novo Projeto', `
            <div class="modal-body">
                <div class="form-group">
                    <label>Nome do Projeto *</label>
                    <input type="text" class="form-input" id="projectName" placeholder="Ex: App Mobile E-commerce" autofocus>
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea class="form-textarea" id="projectDesc" placeholder="Descreva brevemente o objetivo do projeto..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="HomeView.createProject()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Criar Projeto
                </button>
            </div>
        `);
    },

    async createProject() {
        const name        = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDesc').value.trim();

        if (!name) { App.toast('Por favor, informe o nome do projeto', 'warning'); return; }

        const btn = document.querySelector('#modalContent .btn-primary');
        if (btn) { btn.disabled = true; btn.textContent = 'Criando...'; }

        const result = await Storage.saveProject({ name, description });

        if (result && result.ok) {
            App.closeModal();
            App.toast('Projeto criado com sucesso!', 'success');
            App.navigateTo('project', result.project.id);
        } else {
            const msg = (result && result.message) || 'Erro ao criar projeto. Verifique o console para detalhes.';
            App.toast(msg, 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Criar Projeto'; }
        }
    },

    // ---- Editar projeto ----
    showEditModal(projectId, name, description) {
        App.showModal('Editar Projeto', `
            <div class="modal-body">
                <div class="form-group">
                    <label>Nome do Projeto *</label>
                    <input type="text" class="form-input" id="editProjectName" value="${name}" autofocus>
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea class="form-textarea" id="editProjectDesc">${description}</textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="HomeView.saveEdit('${projectId}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Salvar
                </button>
            </div>
        `);
    },

    async saveEdit(projectId) {
        const name        = document.getElementById('editProjectName').value.trim();
        const description = document.getElementById('editProjectDesc').value.trim();

        if (!name) { App.toast('Por favor, informe o nome do projeto', 'warning'); return; }

        const btn = document.querySelector('#modalContent .btn-primary');
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

        const result = await Storage.saveProject({ id: projectId, name, description });

        if (result && result.ok) {
            App.closeModal();
            App.toast('Projeto atualizado!', 'success');
            await App.navigateTo('home');
        } else {
            const msg = (result && result.message) || 'Erro ao atualizar projeto.';
            App.toast(msg, 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
        }
    },

    // ---- Convidar membro ----
    showInviteModal(projectId) {
        App.showModal('Convidar Membro por Email', `
            <div class="modal-body">
                <p style="color:var(--gray-600,#666);font-size:14px;margin-bottom:16px;">
                    Apenas usuários já cadastrados na aplicação podem ser convidados.
                </p>
                <div class="form-group">
                    <label>Email do convidado *</label>
                    <input type="email" class="form-input" id="inviteEmail" placeholder="exemplo@email.com" autofocus>
                </div>
                <div id="inviteMsg" style="display:none;margin-top:8px;padding:10px;border-radius:6px;font-size:13px;"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="HomeView.sendInvite('${projectId}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    Enviar Convite
                </button>
            </div>
        `);
    },

    async sendInvite(projectId) {
        const email = (document.getElementById('inviteEmail').value || '').trim().toLowerCase();
        const msgEl = document.getElementById('inviteMsg');

        const showMsg = (text, ok) => {
            msgEl.style.display    = 'block';
            msgEl.style.background = ok ? '#d4edda' : '#ffeaea';
            msgEl.style.color      = ok ? '#155724' : '#b91c1c';
            msgEl.textContent      = text;
        };

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showMsg('Por favor, informe um email válido.', false); return;
        }

        const btn = document.querySelector('#modalContent .btn-primary');
        if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

        // Verificar se o email está cadastrado antes de enviar o convite
        const userCheck = await Storage.checkUserByEmail(email);

        if (userCheck === null) {
            // Erro de conexão ao verificar — tenta enviar mesmo assim
            if (btn) { btn.textContent = 'Enviando...'; }
        } else if (!userCheck.exists) {
            showMsg(`Nenhuma conta encontrada para "${email}". Só é possível convidar usuários já cadastrados.`, false);
            if (btn) { btn.disabled = false; btn.textContent = 'Enviar Convite'; }
            return;
        } else {
            if (btn) { btn.textContent = 'Enviando...'; }
        }

        const result = await Storage.sendInvite(email, projectId);

        if (result.ok) {
            const nome = (userCheck && userCheck.name) ? ` para ${userCheck.name}` : '';
            showMsg(`✅ Convite enviado${nome} (${email})`, true);
            setTimeout(() => App.closeModal(), 2000);
        } else {
            showMsg(result.message || 'Erro ao enviar convite.', false);
            if (btn) { btn.disabled = false; btn.textContent = 'Enviar Convite'; }
        }
    },

    // ---- Excluir projeto ----
    deleteProject(projectId) {
        App.showModal('Confirmar Exclusão', `
            <div class="modal-body">
                <p>Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-danger" onclick="HomeView.confirmDelete('${projectId}')">Excluir Projeto</button>
            </div>
        `);
    },

    async confirmDelete(projectId) {
        const ok = await Storage.deleteProject(projectId);
        App.closeModal();
        App.toast(ok ? 'Projeto excluído' : 'Erro ao excluir projeto', ok ? 'info' : 'error');
        await App.navigateTo('home');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text || '');
        return div.innerHTML;
    }
};