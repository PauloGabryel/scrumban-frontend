// ========================================
// BACKLOG VIEW
// ========================================
const BacklogView = {
    currentUser: null,

    render(project, currentUser = null) {
        this.currentUser = currentUser;
        const p = project;
        const stats = p.getBacklogStats();
        
        // Check if user is Product Owner (comparing userId)
        const isProductOwner = !currentUser || 
                               currentUser.isAdmin || 
                               (p.productOwnerId && currentUser.id === p.productOwnerId);


        let backlogHtml = '';
        if (p.backlog.length === 0) {
            backlogHtml = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <h4>Backlog vazio</h4>
                    <p>O Product Owner pode adicionar itens ao backlog clicando no botão acima.</p>
                </div>
            `;
        } else {
            // Sort by order/priority
            const sorted = [...p.backlog].sort((a, b) => {
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            });

            sorted.forEach(item => {
                const typeTag = item.type === 'story' ? 'tag-story' :
                               item.type === 'bug' ? 'tag-bug' :
                               item.type === 'spike' ? 'tag-spike' : 'tag-task';
                const typeLabel = item.type === 'story' ? 'História' :
                                 item.type === 'bug' ? 'Bug' :
                                 item.type === 'spike' ? 'Spike' : 'Tarefa Técnica';

                // Show difficulty instead of points
                const difficultyTag = item.difficulty ? `<span class="tag tag-difficulty">${item.difficulty}</span>` : '';

                const editButton = isProductOwner ? `
                    <button class="btn-icon" onclick="BacklogView.editItem('${item.id}')" title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                ` : '';

                const deleteButton = isProductOwner ? `
                    <button class="btn-icon" onclick="BacklogView.deleteItem('${item.id}')" title="Remover">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                ` : '';

                backlogHtml += `
                    <div class="backlog-item ${item.sprintId ? 'in-sprint' : ''}" draggable="true"
                         data-id="${item.id}">
                        <div class="drag-handle">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                                <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                                <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                            </svg>
                        </div>
                        <div class="priority-dot ${item.priority}" title="Prioridade: ${item.priority}"></div>
                        <div class="backlog-item-content">
                            <div class="backlog-item-title">${HomeView.escapeHtml(item.title)}</div>
                            ${item.description ? `<div class="backlog-item-desc">${HomeView.escapeHtml(item.description)}</div>` : ''}
                            <div class="backlog-item-tags">
                                <span class="tag ${typeTag}">${typeLabel}</span>
                                ${difficultyTag}
                                ${item.sprintId ? `<span class="tag" style="background:var(--success-light);color:var(--success)">Em Sprint</span>` : ''}
                            </div>
                        </div>
                        <div class="backlog-item-actions">
                            ${editButton}
                            ${deleteButton}
                        </div>
                    </div>
                `;
            });
        }

        return `
            <div class="backlog-header">
                <div>
                    <h3>Product Backlog</h3>
                    <p class="text-sm text-muted mt-sm">Gerenciado pelo Product Owner: <strong>${HomeView.escapeHtml(p.productOwner || 'Não definido')}</strong></p>
                </div>
                <div style="display:flex;gap:var(--space-md);align-items:center;flex-wrap:wrap;">
                    <div class="backlog-stats">
                        <span class="stat-chip total">${stats.total} total</span>
                        <span class="stat-chip sprint">${stats.inSprints} em sprints</span>
                    </div>
                    ${isProductOwner ? `
                    <button class="btn btn-primary" onclick="BacklogView.showAddModal()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Adicionar Item
                    </button>
                    ` : ''}
                </div>
            </div>
            <div class="backlog-list">
                ${backlogHtml}
            </div>
        `;
    },

    showAddModal(editItem = null) {
        const isEdit = !!editItem;
        const title = isEdit ? 'Editar Item do Backlog' : 'Novo Item do Backlog';

        App.showModal(title, `
            <div class="modal-body">
                <div class="form-group">
                    <label>Título *</label>
                    <input type="text" class="form-input" id="itemTitle"
                           value="${isEdit ? HomeView.escapeHtml(editItem.title) : ''}"
                           placeholder="Ex: Como usuário, quero poder fazer login...">
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea class="form-textarea" id="itemDesc" placeholder="Detalhes da história/tarefa...">${isEdit ? HomeView.escapeHtml(editItem.description) : ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo</label>
                        <select class="form-select" id="itemType">
                            <option value="story" ${isEdit && editItem.type === 'story' ? 'selected' : ''}>📖 História de Usuário</option>
                            <option value="bug" ${isEdit && editItem.type === 'bug' ? 'selected' : ''}>🐛 Bug</option>
                            <option value="spike" ${isEdit && editItem.type === 'spike' ? 'selected' : ''}>🔍 Spike</option>
                            <option value="task" ${isEdit && editItem.type === 'task' ? 'selected' : ''}>📋 Tarefa Técnica</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Prioridade</label>
                        <select class="form-select" id="itemPriority">
                            <option value="critical" ${isEdit && editItem.priority === 'critical' ? 'selected' : ''}>🔴 Crítica</option>
                            <option value="high" ${isEdit && editItem.priority === 'high' ? 'selected' : ''}>🟠 Alta</option>
                            <option value="medium" ${isEdit && editItem.priority === 'medium' ? 'selected' : ''}>🔵 Média</option>
                            <option value="low" ${isEdit && editItem.priority === 'low' ? 'selected' : ''}>⚪ Baixa</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Nível de Dificuldade</label>
                    <select class="form-select" id="itemDifficulty">
                        <option value="">Sem dificuldade</option>
                        <option value="Muito Fácil" ${isEdit && editItem.difficulty === 'Muito Fácil' ? 'selected' : ''}>🟢 Muito Fácil</option>
                        <option value="Fácil" ${isEdit && editItem.difficulty === 'Fácil' ? 'selected' : ''}>🔵 Fácil</option>
                        <option value="Médio" ${isEdit && editItem.difficulty === 'Médio' ? 'selected' : ''}>🟡 Médio</option>
                        <option value="Difícil" ${isEdit && editItem.difficulty === 'Difícil' ? 'selected' : ''}>🟠 Difícil</option>
                        <option value="Muito Difícil" ${isEdit && editItem.difficulty === 'Muito Difícil' ? 'selected' : ''}>🔴 Muito Difícil</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="BacklogView.saveItem(${isEdit ? `'${editItem.id}'` : 'null'})">
                    ${isEdit ? 'Salvar Alterações' : 'Adicionar ao Backlog'}
                </button>
            </div>
        `);
    },

    async saveItem(editId) {
        const title = document.getElementById('itemTitle').value.trim();
        if (!title) {
            App.toast('Informe o título do item', 'warning');
            return;
        }

        const p = ProjectView.currentProject;
        const itemData = {
            title,
            description: document.getElementById('itemDesc').value.trim(),
            type: document.getElementById('itemType').value,
            priority: document.getElementById('itemPriority').value,
            difficulty: document.getElementById('itemDifficulty').value
        };

        if (editId) {
            p.updateBacklogItem(editId, itemData);
            App.toast('Item atualizado!', 'success');
        } else {
            const item = new BacklogItem(itemData);
            p.addBacklogItem(item.toJSON());
            App.toast('Item adicionado ao backlog!', 'success');
        }
        p.save(); // Persistir alterações no backlog

        App.closeModal();
        await ProjectView.refreshTab();
    },

    editItem(itemId) {
        const p = ProjectView.currentProject;
        const item = p.backlog.find(i => i.id === itemId);
        if (item) {
            this.showAddModal(item);
        }
    },

    async deleteItem(itemId) {
        App.showModal('Confirmar Exclusão', `
            <div class="modal-body">
                <p style="text-align:center;padding:16px 0;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.5" style="display:block;margin:0 auto 12px;">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                    Tem certeza que deseja excluir este item do backlog?<br>
                    <small style="color:var(--gray-500)">Esta ação não pode ser desfeita.</small>
                </p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-danger" onclick="BacklogView._confirmDelete('${itemId}')">Excluir</button>
            </div>
        `);
    },

    _confirmDelete(itemId) {
        const p = ProjectView.currentProject;
        p.removeBacklogItem(itemId);
        p.save();
        App.closeModal();
        App.toast('Item removido do backlog', 'info');
        await ProjectView.refreshTab();
    }
};