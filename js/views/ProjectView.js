// ========================================
// PROJECT VIEW
// ========================================
const ProjectView = {
    currentProject: null,
    currentUser: null,
    activeTab: 'team',

    async render(projectId, currentUser = null, preloadedData = null) {
        const data = preloadedData || await Storage.getProject(projectId);
        if (!data) return `<div class="empty-state"><h4>Projeto não encontrado</h4></div>`;
        this.currentProject = new Project(data);
        this.currentUser = currentUser;
        const p = this.currentProject;

        App.setBreadcrumb([
            { label: 'Projetos', action: "App.navigateTo('home')" },
            { label: p.name, current: true }
        ]);

        return `
            <div class="project-header">
                <div class="project-title-section">
                    <h2>${this._esc(p.name)}</h2>
                    <p>${this._esc(p.description || 'Sem descrição')}</p>
                </div>
            </div>
            <div class="project-tabs" id="projectTabs">
                ${this._tabBtn('team','Equipe',`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`)}
                ${this._tabBtn('backlog','Product Backlog',`<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>`, (p.backlog || []).length)}
                ${this._tabBtn('sprints','Sprints',`<polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline>`, (p.sprints || []).length)}
                ${this._tabBtn('kanban','Kanban',`<rect x="3" y="3" width="7" height="18" rx="1"></rect><rect x="14" y="3" width="7" height="12" rx="1"></rect>`)}
                ${this._tabBtn('ceremonies','Cerimônias',`<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>`)}
            </div>
            <div id="tabContent">${this.renderActiveTab()}</div>
        `;
    },

    _tabBtn(id, label, iconPath, badge = null) {
        const badgeHtml = badge != null ? `<span class="tab-badge">${badge}</span>` : '';
        return `
            <button class="tab-btn ${this.activeTab === id ? 'active' : ''}" onclick="ProjectView.switchTab('${id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconPath}</svg>
                ${label}${badgeHtml}
            </button>`;
    },

    async switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        // Re-marcar o botão ativo (pode ter sido re-renderizado pelo _updateTabBadges)
        const activeBtn = document.querySelector(`.tab-btn[onclick*="'${tab}'"]`);
        if (activeBtn) activeBtn.classList.add('active');
        const contentEl = document.getElementById('tabContent');
        try {
            contentEl.innerHTML = this.renderActiveTab();
        } catch(e) {
            console.error('Erro ao renderizar aba:', e);
            contentEl.innerHTML = '<div style="padding:40px;text-align:center;color:#ef4444;">Erro ao carregar aba. Tente novamente.</div>';
        }
        if (tab === 'team') this._loadMemberGravatars();
    },

    renderActiveTab() {
        switch (this.activeTab) {
            case 'team':       return this.renderTeamTab();
            case 'backlog':    return BacklogView.render(this.currentProject, this.currentUser);
            case 'sprints':    return SprintView.render(this.currentProject, this.currentUser);
            case 'kanban':     return KanbanView.render(this.currentProject, this.currentUser);
            case 'ceremonies': return CeremonyView.render(this.currentProject, this.currentUser);
            default: return '';
        }
    },

    _isCreator() {
        if (!this.currentUser || !this.currentProject) return false;
        return this.currentProject.isCreator(this.currentUser.id || this.currentUser._id || '');
    },

    // -----------------------------------------------
    // Retorna todos membros (criador + confirmados)
    // com { userId, name }
    // -----------------------------------------------
    _allMembers() {
        const p = this.currentProject;
        const list = [];

        // Criador
        const creatorId = p.creatorId || '__creator__';
        // Tenta nome salvo; se o criador atual for o mesmo, usa o nome da sessão
        const creatorName = p.creatorName
            || (App.currentUser && (App.currentUser.id || App.currentUser._id) === creatorId
                ? (App.currentUser.name || App.currentUser.username)
                : null)
            || p.creatorEmail
            || 'Criador';
        list.push({ userId: creatorId, name: creatorName });

        // Membros confirmados
        (p.members || []).forEach(uid => {
            // 1) nome salvo em memberNames
            let name = (p.memberNames && p.memberNames[uid]) ? p.memberNames[uid] : null;
            // 2) se for o usuário logado atual, usa o nome da sessão
            if (!name && App.currentUser) {
                const curId = App.currentUser.id || App.currentUser._id;
                if (String(curId) === String(uid)) {
                    name = App.currentUser.name || App.currentUser.username || null;
                    // Salva retroativamente para futuras visitas
                    if (name) {
                        if (!p.memberNames) p.memberNames = {};
                        p.memberNames[uid] = name;
                        p.save(); // fire-and-forget: salva retroativamente
                    }
                }
            }
            // 3) fallback legível
            if (!name) name = `Membro #${uid}`;
            list.push({ userId: uid, name });
        });

        return list;
    },

    // -----------------------------------------------
    // TEAM TAB
    // -----------------------------------------------
    renderTeamTab() {
        const p       = this.currentProject;
        const isAdmin = this._isCreator();
        const members = this._allMembers();
        const total   = members.length + (p.pendingInvites || []).length;

        /* ---------- estilos inline da seção ---------- */
        const styles = `
            <style>
            .members-section{margin-top:24px;background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
            .members-section-header{padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;}
            .members-section-header h3{margin:0;font-size:15px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px;}
            .members-count{background:#e0f2fe;color:#0369a1;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:700;}
            .member-item{display:flex;align-items:center;gap:12px;padding:10px 20px;transition:background .15s;}
            .member-item:hover{background:#f8fafc;}
            .m-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#007bff,#0056b3);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
            .m-avatar.creator{background:linear-gradient(135deg,#f59e0b,#d97706);}
            .m-avatar.pending{background:linear-gradient(135deg,#94a3b8,#64748b);}
            .m-info{flex:1;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
            .m-name{font-size:14px;font-weight:600;color:#1e293b;}
            .m-badge{font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600;}
            .badge-creator{background:#fef3c7;color:#92400e;}
            .badge-member{background:#dcfce7;color:#166534;}
            .badge-pending{background:#f1f5f9;color:#64748b;}
            .m-remove{margin-left:auto;opacity:.45;transition:opacity .15s;background:none;border:none;cursor:pointer;padding:4px;}
            .m-remove:hover{opacity:1;}
            .invite-section{margin-top:16px;background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:14px;padding:20px;}
            .invite-section h4{margin:0 0 14px;font-size:14px;font-weight:700;color:#0369a1;display:flex;align-items:center;gap:6px;}
            .invite-row{display:flex;gap:10px;align-items:flex-end;}
            .invite-input{flex:1;padding:10px 14px;border:1.5px solid #bae6fd;border-radius:10px;font-size:14px;font-family:'Inter',sans-serif;background:#fff;transition:border-color .2s;outline:none;}
            .invite-input:focus{border-color:#007bff;box-shadow:0 0 0 3px rgba(0,123,255,.1);}
            .btn-invite{padding:10px 18px;background:linear-gradient(135deg,#007bff,#0056b3);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;}
            .invite-hint{font-size:12px;color:#64748b;margin-top:8px;}
            /* Cargo select */
            .role-select{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:'Inter',sans-serif;background:#fff;color:#0f172a;cursor:pointer;appearance:auto;}
            .role-select:focus{outline:none;border-color:#007bff;box-shadow:0 0 0 3px rgba(0,123,255,.1);}
            .role-readonly{padding:10px 14px;background:var(--gray-50,#f8fafc);border-radius:8px;font-size:14px;color:#334155;font-weight:500;}
            /* === DARK MODE === */
            body.dark-mode .members-section{background:#2b2d31!important;border-color:#3f4147!important;}
            body.dark-mode .members-section-header{border-bottom-color:#3f4147!important;}
            body.dark-mode .members-section-header h3{color:#f2f3f5!important;}
            body.dark-mode .members-count{background:#1e3a5f!important;color:#7ec8ff!important;}
            body.dark-mode .member-item:hover{background:#313338!important;}
            body.dark-mode .m-name{color:#dbdee1!important;}
            body.dark-mode .badge-creator{background:#3d2800!important;color:#fbbf24!important;}
            body.dark-mode .badge-member{background:#1a2e1a!important;color:#4ade80!important;}
            body.dark-mode .badge-pending{background:#313338!important;color:#949ba4!important;}
            body.dark-mode .invite-section{background:#23283a!important;border-color:#3d4a6e!important;}
            body.dark-mode .invite-section h4{color:#7ec8ff!important;}
            body.dark-mode .invite-input{background:#1e1f22!important;border-color:#3f4147!important;color:#dbdee1!important;}
            body.dark-mode .invite-input:focus{border-color:#5865f2!important;box-shadow:0 0 0 3px rgba(88,101,242,.2)!important;}
            body.dark-mode .invite-hint{color:#6d6f78!important;}
            body.dark-mode .role-select{background:#1e1f22!important;border-color:#3f4147!important;color:#dbdee1!important;}
            body.dark-mode .role-readonly{background:#313338!important;color:#b5bac1!important;}
            </style>`;

        /* ---------- lista de membros ---------- */
        let memberRows = '';
        members.forEach((m, i) => {
            const isCreatorRow = i === 0;
            const isMe = this.currentUser && (this.currentUser.id || this.currentUser._id) === m.userId;
            memberRows += `
                <div class="member-item">
                    ${this._avatarHtml(m.userId, m.name, isCreatorRow ? 'creator' : '')}
                    <div class="m-info">
                        <span class="m-name">${this._esc(m.name)}</span>
                        <span class="m-badge ${isCreatorRow ? 'badge-creator' : 'badge-member'}">${isCreatorRow ? 'Criador' : 'Membro'}</span>
                    </div>
                    ${isAdmin && !isCreatorRow ? `
                        <button class="m-remove" onclick="ProjectView.removeMember('${m.userId}')" title="Remover">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>` : ''}
                    ${!isAdmin && !isCreatorRow && isMe ? `
                        <button class="m-remove" onclick="ProjectView.leaveProject()" title="Sair do projeto" style="display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:8px;border:1px solid #ef4444;color:#ef4444;background:none;cursor:pointer;font-size:12px;font-weight:600;">
                            Sair
                        </button>` : ''}
                </div>`;
        });

        // Pendentes
        (p.pendingInvites || []).forEach(inv => {
            const invEmail  = typeof inv === 'string' ? inv : inv.email;
            const invId     = typeof inv === 'string' ? null : inv.id;
            const cancelBtn = isAdmin && invId
                ? `<button class="m-remove" onclick="ProjectView.cancelInvite('${invId}','${this._esc(invEmail)}')" title="Cancelar convite">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                   </button>`
                : '';
            memberRows += `
                <div class="member-item">
                    <div class="m-avatar pending">?</div>
                    <div class="m-info">
                        <span class="m-name" style="color:#64748b">${this._esc(invEmail)}</span>
                        <span class="m-badge badge-pending">⏳ Pendente</span>
                    </div>
                    ${cancelBtn}
                </div>`;
        });

        const memberListSection = `
            <div class="members-section">
                <div class="members-section-header">
                    <h3>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Membros da Equipe
                    </h3>
                    <span class="members-count">${total} ${total === 1 ? 'pessoa' : 'pessoas'}</span>
                </div>
                <div>${memberRows}</div>
            </div>`;

        const inviteSection = isAdmin ? `
            <div class="invite-section">
                <h4>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Convidar Membro
                </h4>
                <div class="invite-row">
                    <input type="email" id="inviteEmailInput" class="invite-input" placeholder="email@exemplo.com">
                    <button class="btn-invite" onclick="ProjectView.sendInvite()">Enviar Convite</button>
                </div>
                <p class="invite-hint">O membro receberá um convite e precisará aceitá-lo para entrar na equipe.</p>
            </div>` : '';

        /* ---------- Cargos ---------- */
        // Monta options do select com membros da equipe
        const memberOptions = members.map(m =>
            `<option value="${this._esc(m.userId)}" data-name="${this._esc(m.name)}">${this._esc(m.name)}</option>`
        ).join('');
        const blankOption = `<option value="">-- Nenhum --</option>`;

        const rolesHtml = isAdmin
            ? this._renderRolesEdit(p, memberOptions, blankOption, members)
            : this._renderRolesReadonly(p);

        return `${styles}<div class="roles-grid">${rolesHtml}</div>${memberListSection}${inviteSection}`;
    },

    _renderRolesEdit(p, memberOptions, blankOption, members) {
        // Pares de dev — cada slot é um select
        let pairsHtml = '';
        p.devPairs.forEach((pair, idx) => {
            // Filtra membros já usados em outros slots deste par para evitar duplicata simples
            pairsHtml += `
                <div class="dev-pair">
                    <span class="dev-pair-label">Par ${idx + 1}</span>
                    <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
                    <select class="role-select" onchange="ProjectView.updatePair('${pair.id}','dev1Id',this.value)">
                        ${blankOption}
                        ${members.map(m => `<option value="${this._esc(m.userId)}" ${pair.dev1Id === m.userId ? 'selected' : ''}>${this._esc(m.name)}</option>`).join('')}
                    </select>
                    <select class="role-select" onchange="ProjectView.updatePair('${pair.id}','dev2Id',this.value)">
                        ${blankOption}
                        ${members.map(m => `<option value="${this._esc(m.userId)}" ${pair.dev2Id === m.userId ? 'selected' : ''}>${this._esc(m.name)}</option>`).join('')}
                    </select>
                    </div>
                    ${p.devPairs.length > 1 ? `
                    <button class="btn-icon" onclick="ProjectView.removePair('${pair.id}')" title="Remover par">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>` : ''}
                </div>`;
        });

        return `
            <!-- Product Owner -->
            <div class="role-card">
                <div class="role-card-header">
                    <div class="role-icon po">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </div>
                    <div><h3>Product Owner</h3><p>Focado no valor para o cliente</p></div>
                </div>
                <div class="role-input-group">
                    <select class="role-select" id="roleProductOwner"
                        onchange="ProjectView.updateRoleFromSelect('productOwner','productOwnerId',this)">
                        ${blankOption}${memberOptions.replace(
                            `value="${this._esc(p.productOwnerId)}"`,
                            `value="${this._esc(p.productOwnerId)}" selected`
                        )}
                    </select>
                </div>
            </div>
            <!-- Scrum Master -->
            <div class="role-card">
                <div class="role-card-header">
                    <div class="role-icon sm">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <div><h3>Scrum Master</h3><p>Focado no processo e remoção de barreiras</p></div>
                </div>
                <div class="role-input-group">
                    <select class="role-select" id="roleScrumMaster"
                        onchange="ProjectView.updateRoleFromSelect('scrumMaster','scrumMasterId',this)">
                        ${blankOption}${memberOptions.replace(
                            `value="${this._esc(p.scrumMasterId)}"`,
                            `value="${this._esc(p.scrumMasterId)}" selected`
                        )}
                    </select>
                </div>
            </div>
            <!-- Dev Team -->
            <div class="role-card">
                <div class="role-card-header">
                    <div class="role-icon dev">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="16 18 22 12 16 6"></polyline>
                            <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                    </div>
                    <div><h3>Equipe de Desenvolvimento</h3><p>Duplas de programação</p></div>
                </div>
                <div class="dev-team-list">${pairsHtml}</div>
                <button class="add-pair-btn" onclick="ProjectView.addPair()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Adicionar Dupla
                </button>
            </div>`;
    },

    _renderRolesReadonly(p) {
        const po = p.productOwner || 'Não definido';
        const sm = p.scrumMaster  || 'Não definido';

        let pairsHtml = '';
        p.devPairs.forEach((pair, idx) => {
            const n1 = pair.dev1 || '—';
            const n2 = pair.dev2 || '—';
            pairsHtml += `
                <div class="dev-pair">
                    <span class="dev-pair-label">Par ${idx + 1}</span>
                    <p class="role-readonly">${this._esc(n1)}${pair.dev2 ? ' &amp; ' + this._esc(n2) : ''}</p>
                </div>`;
        });

        return `
            <div class="role-card">
                <div class="role-card-header">
                    <div class="role-icon po"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
                    <div><h3>Product Owner</h3></div>
                </div>
                <p class="role-readonly">${this._esc(po)}</p>
            </div>
            <div class="role-card">
                <div class="role-card-header">
                    <div class="role-icon sm"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                    <div><h3>Scrum Master</h3></div>
                </div>
                <p class="role-readonly">${this._esc(sm)}</p>
            </div>
            <div class="role-card">
                <div class="role-card-header">
                    <div class="role-icon dev"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></div>
                    <div><h3>Equipe de Desenvolvimento</h3></div>
                </div>
                <div class="dev-team-list">${pairsHtml}</div>
            </div>`;
    },

    // -----------------------------------------------
    // ROLE ACTIONS
    // -----------------------------------------------
    async updateRoleFromSelect(nameField, idField, selectEl) {
        const selectedOpt = selectEl.options[selectEl.selectedIndex];
        const userId = selectEl.value;
        const name   = userId ? (selectedOpt.getAttribute('data-name') || selectedOpt.text) : '';
        this.currentProject[idField]   = userId || null;
        this.currentProject[nameField] = name;
        await this.currentProject.save();
        App.toast('Cargo atualizado', 'success');
    },

    async updateRole(role, value) {
        this.currentProject[role] = value.trim();
        await this.currentProject.save();
        App.toast('Cargo atualizado', 'success');
    },

    async addPair() {
        this.currentProject.devPairs.push({ id: Storage.generateId(), dev1Id: null, dev1: '', dev2Id: null, dev2: '' });
        await this.currentProject.save();
        this.refreshTab();
    },

    async removePair(pairId) {
        this.currentProject.devPairs = this.currentProject.devPairs.filter(p => p.id !== pairId);
        await this.currentProject.save();
        this.refreshTab();
    },

    async updatePair(pairId, field, value) {
        const pair = this.currentProject.devPairs.find(p => p.id === pairId);
        if (!pair) return;
        pair[field] = value || null;
        // Sincroniza nome legível para compatibilidade
        const members = this._allMembers();
        if (field === 'dev1Id') {
            const m = members.find(m => m.userId === value);
            pair.dev1 = m ? m.name : '';
        }
        if (field === 'dev2Id') {
            const m = members.find(m => m.userId === value);
            pair.dev2 = m ? m.name : '';
        }
        await this.currentProject.save();
    },

    // -----------------------------------------------
    // INVITE / MEMBER ACTIONS
    // -----------------------------------------------
    async sendInvite() {
        const input = document.getElementById('inviteEmailInput');
        const email = (input ? input.value : '').trim().toLowerCase();
        if (!email || !email.includes('@')) { App.toast('Email inválido', 'error'); return; }

        const p = this.currentProject;

        if (p.creatorEmail && p.creatorEmail.toLowerCase() === email) {
            App.toast('Este email pertence ao criador do projeto', 'warning'); return;
        }

        // Verifica se o usuário existe no backend
        const userCheck = await Storage.checkUserByEmail(email);
        if (!userCheck || !userCheck.exists) {
            App.toast(`Nenhuma conta encontrada para "${email}". Só é possível convidar usuários já cadastrados.`, 'error');
            return;
        }

        const result = await Storage.sendInvite(email, p.id);
        if (result.ok) {
            if (input) input.value = '';
            App.toast(`Convite enviado para ${userCheck.name || email}`, 'success');
            await this.refreshTab();
        } else {
            App.toast(result.message || 'Erro ao enviar convite', 'error');
        }
    },

    cancelInvite(inviteId, email) {
        if (!confirm(`Cancelar convite para ${email}?`)) return;
        Storage.cancelInvite(inviteId).then(result => {
            if (result.ok) {
                App.toast('Convite cancelado', 'info');
            } else {
                App.toast(result.message || 'Erro ao cancelar convite', 'error');
            }
            this.refreshTab();
        });
    },

    removeMember(userId) {
        if (!confirm('Remover este membro do projeto?')) return;
        const p = this.currentProject;
        Storage.removeMember(p.id, userId).then(result => {
            if (result.ok) {
                App.toast('Membro removido', 'info');
            } else {
                App.toast(result.message || 'Erro ao remover membro', 'error');
            }
            this.refreshTab();
        });
    },

    leaveProject() {
        if (!confirm('Tem certeza que deseja sair deste projeto?')) return;
        const p = this.currentProject;
        const userId = this.currentUser.id || this.currentUser._id;
        Storage.removeMember(p.id, userId).then(result => {
            if (result.ok) {
                App.toast('Você saiu do projeto', 'info');
                window.location.href = 'index.html';
            } else {
                App.toast(result.message || 'Erro ao sair do projeto', 'error');
            }
        });
    },

    // -----------------------------------------------
    // HELPERS
    // -----------------------------------------------
    _esc(str) { return HomeView.escapeHtml(String(str || '')); },

    _initials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },

    // Gera HTML do avatar com iniciais + tenta carregar Gravatar após render
    _avatarHtml(userId, name, extraClass = '') {
        const initials = this._initials(name);
        return `<div class="m-avatar ${extraClass}" id="av-${userId}" data-uid="${userId}">${initials}</div>`;
    },

    // Carrega Gravatars dos membros após renderizar o HTML
    async _loadMemberGravatars() {
        const p = this.currentProject;
        const allUsers = JSON.parse(localStorage.getItem('scrumban_registered_users') || '[]');
        const avatarEls = document.querySelectorAll('.m-avatar[data-uid]');
        for (const el of avatarEls) {
            const uid = el.dataset.uid;
            const user = allUsers.find(u => String(u.id || u._id) === String(uid));
            const email = user?.email || '';
            if (!email) continue;
            try {
                const hash = await this._sha256(email.trim().toLowerCase());
                const url  = `https://gravatar.com/avatar/${hash}?s=80&d=404`;
                const img  = new Image();
                img.onload = () => {
                    el.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                    el.style.background = 'transparent';
                    el.style.padding = '0';
                };
                img.src = url;
            } catch(e) {}
        }
    },

    async _sha256(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    },

    async refreshTab() {
        // Recarrega dados frescos do backend antes de re-renderizar
        try { await this.refreshProject(); } catch(e) { /* usa dados locais em caso de falha */ }
        // Atualiza os badges de contagem nas abas (backlog, sprints)
        this._updateTabBadges();
        const tabContent = document.getElementById('tabContent');
        if (tabContent) {
            tabContent.innerHTML = this.renderActiveTab();
            if (this.activeTab === 'team') this._loadMemberGravatars();
        }
    },

    _updateTabBadges() {
        const p = this.currentProject;
        if (!p) return;
        const tabsEl = document.getElementById('projectTabs');
        if (!tabsEl) return;
        // Re-renderiza apenas a barra de abas para atualizar os badges sem perder o conteúdo
        const backlogCount = (p.backlog || []).length;
        const sprintCount  = (p.sprints || []).length;
        const tabDefs = [
            { id: 'team',       label: 'Equipe',           badge: null,         icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>` },
            { id: 'backlog',    label: 'Product Backlog',  badge: backlogCount, icon: `<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>` },
            { id: 'sprints',    label: 'Sprints',          badge: sprintCount,  icon: `<polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline>` },
            { id: 'kanban',     label: 'Kanban',           badge: null,         icon: `<rect x="3" y="3" width="7" height="18" rx="1"></rect><rect x="14" y="3" width="7" height="12" rx="1"></rect>` },
            { id: 'ceremonies', label: 'Cerimônias',       badge: null,         icon: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>` },
        ];
        tabsEl.innerHTML = tabDefs.map(t => this._tabBtn(t.id, t.label, t.icon, t.badge)).join('');
    },

    async refreshProject() {
        const data = await Storage.getProject(this.currentProject.id);
        if (data) this.currentProject = new Project(data);
    }
};