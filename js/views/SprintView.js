// ========================================
// SPRINT VIEW
// ========================================
const SprintView = {
    selectedSprintId: null,
    currentUser: null,

    render(project, currentUser = null) {
        this.currentUser = currentUser;
        const p = project;

        // Check if user is Scrum Master (comparing userId)
        const isScrumMaster = !currentUser || 
                              currentUser.isAdmin || 
                              (p.scrumMasterId && currentUser.id === p.scrumMasterId);

        // Available backlog items (not assigned to any sprint)
        const availableItems = p.backlog.filter(i => !i.sprintId);

        let sprintCardsHtml = '';
        if (p.sprints.length === 0) {
            sprintCardsHtml = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polyline points="13 17 18 12 13 7"></polyline>
                        <polyline points="6 17 11 12 6 7"></polyline>
                    </svg>
                    <h4>Nenhuma Sprint criada</h4>
                    <p>O Scrum Master pode criar sprints e mover itens do backlog para elas.</p>
                </div>
            `;
        } else {
            p.sprints.forEach(sprint => {
                const progress = sprint.tasks ? new Sprint(sprint).getProgress() : 0;
                const taskCount = sprint.tasks ? sprint.tasks.length : 0;
                const doneCount = sprint.tasks ? sprint.tasks.filter(t => t.status === 'done').length : 0;
                const remaining = new Sprint(sprint).getRemainingDays();
                const isSelected = this.selectedSprintId === sprint.id;

                sprintCardsHtml += `
                    <div class="sprint-card ${sprint.status === 'active' ? 'active' : ''} ${isSelected ? 'active' : ''}"
                         onclick="SprintView.selectSprint('${sprint.id}')">
                        <div class="sprint-card-header">
                            <h4>${HomeView.escapeHtml(sprint.name)}</h4>
                            <span class="sprint-status ${sprint.status}">${
                                sprint.status === 'planning' ? 'Planejamento' :
                                sprint.status === 'active' ? 'Ativa' : 'Concluída'
                            }</span>
                        </div>
                        ${sprint.goal ? `<p class="text-sm text-muted">${HomeView.escapeHtml(sprint.goal)}</p>` : ''}
                        <div class="sprint-dates">
                            📅 ${sprint.startDate ? new Date(sprint.startDate).toLocaleDateString('pt-BR') : '—'} →
                            ${sprint.endDate ? new Date(sprint.endDate).toLocaleDateString('pt-BR') : '—'}
                            ${sprint.status === 'active' ? ` (${remaining} dias restantes)` : ''}
                        </div>
                        <div class="sprint-progress">
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width:${progress}%"></div>
                            </div>
                            <div class="progress-label">
                                <span>${doneCount}/${taskCount} tarefas</span>
                                <span>${progress}%</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // Sprint detail
        let sprintDetailHtml = '';
        if (this.selectedSprintId) {
            sprintDetailHtml = this.renderSprintDetail(p);
        }

        return `
            <div class="backlog-header">
                <div>
                    <h3>Gerenciamento de Sprints</h3>
                    <p class="text-sm text-muted mt-sm">Gerenciado pelo Scrum Master: <strong>${HomeView.escapeHtml(p.scrumMaster || 'Não definido')}</strong></p>
                </div>
                <div style="display:flex;gap:var(--space-sm)">
                    ${isScrumMaster ? `
                    <button class="btn btn-primary" onclick="SprintView.showCreateSprintModal()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nova Sprint
                    </button>
                    ` : ''}
                </div>
            </div>

            <div class="sprint-overview">
                ${sprintCardsHtml}
            </div>

            ${sprintDetailHtml}
        `;
    },

    selectSprint(sprintId) {
        this.selectedSprintId = sprintId;
        ProjectView.refreshTab();
    },

    renderSprintDetail(project) {
        const p = project;
        const sprint = p.sprints.find(s => s.id === this.selectedSprintId);
        if (!sprint) return '';

        // Check if current user is Scrum Master
        const isScrumMaster = !this.currentUser || 
                              this.currentUser.isAdmin || 
                              (p.scrumMasterId && this.currentUser && this.currentUser.id === p.scrumMasterId);

        // Tasks of this sprint
        const tasks = sprint.tasks || [];

        let tasksHtml = '';
        if (tasks.length === 0) {
            tasksHtml = '<p class="text-muted text-sm">Nenhuma tarefa adicionada a esta sprint ainda.</p>';
        } else {
            tasks.forEach(task => {
                const statusColors = {
                    todo: 'var(--kanban-todo)',
                    inProgress: 'var(--kanban-progress)',
                    review: 'var(--kanban-review)',
                    done: 'var(--kanban-done)'
                };
                const statusLabels = {
                    todo: 'A Fazer',
                    inProgress: 'Em Andamento',
                    review: 'Revisão',
                    done: 'Concluído'
                };
                tasksHtml += `
                    <div class="sprint-task">
                        <div class="priority-dot" style="background:${statusColors[task.status]};margin-top:6px;"></div>
                        <div class="sprint-task-content">
                            <div class="sprint-task-title">${HomeView.escapeHtml(task.title)}</div>
                            <div class="text-xs text-muted mt-sm">
                                Origem: ${HomeView.escapeHtml(task.backlogItemTitle || '—')}
                            </div>
                            <div style="display:flex;gap:var(--space-sm);margin-top:6px;align-items:center;flex-wrap:wrap;">
                                ${task.assignedPairLabel ? `<span class="subtask-assignee">👥 ${HomeView.escapeHtml(task.assignedPairLabel)}</span>` : ''}
                                <span class="tag" style="background:${statusColors[task.status]}20;color:${statusColors[task.status]}">${statusLabels[task.status]}</span>
                            </div>
                        </div>
                        <button class="btn-icon" onclick="SprintView.deleteTask('${sprint.id}', '${task.id}')" title="Remover" ${!isScrumMaster ? 'style="display:none"' : ''}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                `;
            });
        }

        return `
            <hr class="section-divider">
            <div class="flex-between mb-md">
                <h3>📋 ${HomeView.escapeHtml(sprint.name)} — Tarefas</h3>
                <div style="display:flex;gap:var(--space-sm);">
                    ${isScrumMaster ? `
                    <button class="btn btn-sm btn-secondary" onclick="SprintView.showAddTaskModal('${sprint.id}')">
                        + Adicionar Subtarefa do Backlog
                    </button>
                    ` : ''}
                    ${isScrumMaster ? `
                        ${sprint.status === 'planning' ? `
                        <button class="btn btn-sm btn-success" onclick="SprintView.startSprint('${sprint.id}')">
                            ▶ Iniciar Sprint
                        </button>` : ''}
                        ${sprint.status === 'active' ? `
                        <button class="btn btn-sm btn-warning" onclick="SprintView.completeSprint('${sprint.id}')">
                            ✓ Concluir Sprint
                        </button>` : ''}
                    ` : ''}
                </div>
            </div>
            <div class="sprint-tasks-section">
                ${tasksHtml}
            </div>
        `;
    },

    showCreateSprintModal() {
        const p = ProjectView.currentProject;
        const sprintNumber = p.sprints.length + 1;

        // Default dates: today + 2 weeks
        const today = new Date().toISOString().split('T')[0];
        const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        App.showModal('Criar Nova Sprint', `
            <div class="modal-body">
                <div class="form-group">
                    <label>Nome da Sprint *</label>
                    <input type="text" class="form-input" id="sprintName" value="Sprint ${sprintNumber}" placeholder="Ex: Sprint 1">
                </div>
                <div class="form-group">
                    <label>Meta da Sprint</label>
                    <textarea class="form-textarea" id="sprintGoal" placeholder="O que queremos alcançar nesta sprint?"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Data de Início</label>
                        <input type="date" class="form-input" id="sprintStart" value="${today}" min="${today}" max="2099-12-31">
                    </div>
                    <div class="form-group">
                        <label>Data de Término</label>
                        <input type="date" class="form-input" id="sprintEnd" value="${twoWeeks}" min="${today}" max="2099-12-31">
                    </div>
                </div>
                <p class="text-xs text-muted">💡 Sprints devem ter duração de 2 a 4 semanas.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="SprintView.createSprint()">Criar Sprint</button>
            </div>
        `);
    },

    createSprint() {
        const name = document.getElementById('sprintName').value.trim();
        if (!name) {
            App.toast('Informe o nome da sprint', 'warning');
            return;
        }

        const startDate = document.getElementById('sprintStart').value;
        const endDate   = document.getElementById('sprintEnd').value;

        if (!startDate || !endDate) {
            App.toast('Data de início e término são obrigatórias', 'warning');
            return;
        }

        // Validação robusta: checar se a data é real (formato YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            App.toast('Formato de data inválido', 'warning');
            return;
        }

        // Checar se dia e mês são possíveis sem depender de fuso horário
        const [sy, sm, sd] = startDate.split('-').map(Number);
        const [ey, em, ed] = endDate.split('-').map(Number);

        if (sm < 1 || sm > 12 || sd < 1 || sd > 31 || sy < 2000 || sy > 2099) {
            App.toast('Data de início inválida', 'warning');
            return;
        }
        if (em < 1 || em > 12 || ed < 1 || ed > 31 || ey < 2000 || ey > 2099) {
            App.toast('Data de término inválida', 'warning');
            return;
        }

        // Verificar dias válidos para o mês (ex: 30 de fevereiro)
        const diasNoMes = (y, m) => new Date(y, m, 0).getDate();
        if (sd > diasNoMes(sy, sm)) {
            App.toast(`Data de início inválida: ${sm}/${sy} não tem dia ${sd}`, 'warning');
            return;
        }
        if (ed > diasNoMes(ey, em)) {
            App.toast(`Data de término inválida: ${em}/${ey} não tem dia ${ed}`, 'warning');
            return;
        }

        // Bloquear datas passadas (comparação de string YYYY-MM-DD é segura)
        const todayStr = new Date().toISOString().split('T')[0];
        if (startDate < todayStr) {
            App.toast('A data de início não pode ser no passado', 'warning');
            return;
        }
        if (endDate < todayStr) {
            App.toast('A data de término não pode ser no passado', 'warning');
            return;
        }

        // Fim deve ser depois do início
        if (endDate <= startDate) {
            App.toast('A data de término deve ser depois da data de início', 'warning');
            return;
        }

        // Validar 2 a 4 semanas (new Date(y, m-1, d) usa hora local — sem problema de fuso)
        const diffDays = (new Date(ey, em-1, ed) - new Date(sy, sm-1, sd)) / (1000 * 60 * 60 * 24);
        if (diffDays < 14 || diffDays > 28) {
            App.toast('A sprint deve ter entre 2 e 4 semanas (14–28 dias)', 'warning');
            return;
        }

        const sprint = new Sprint({
            name,
            goal: document.getElementById('sprintGoal').value.trim(),
            startDate,
            endDate,
            status: 'planning',
            tasks: []
        });

        const p = ProjectView.currentProject;
        p.addSprint(sprint.toJSON());
        p.save(); // Garantir que o projeto foi salvo

        this.selectedSprintId = sprint.id;
        App.closeModal();
        App.toast('Sprint criada! Agora adicione tarefas do backlog.', 'success');
        ProjectView.refreshProject();
        ProjectView.refreshTab();
    },

    showAddTaskModal(sprintId) {
        const p = ProjectView.currentProject;
        
        // Verificar permissão: apenas SM pode adicionar tarefas
        const isScrumMaster = !Auth.currentUser || Auth.currentUser.isAdmin || 
                              (p.scrumMasterId && Auth.currentUser.id === p.scrumMasterId);
        if (!isScrumMaster) {
            App.toast('Apenas o Scrum Master pode adicionar tarefas à sprint', 'warning');
            return;
        }
        
        // Available backlog items (not in any sprint)
        const available = p.backlog.filter(i => !i.sprintId);

        if (available.length === 0) {
            App.toast('Não há itens disponíveis no backlog. Adicione itens pelo Product Owner.', 'warning');
            return;
        }

        let itemsHtml = '';
        available.forEach(item => {
            const difficultyLabel = item.difficulty ? `${item.difficulty}` : 'Sem nível';
            itemsHtml += `<option value="${item.id}">${HomeView.escapeHtml(item.title)} (${item.priority}, ${difficultyLabel})</option>`;
        });

        let pairsHtml = '<option value="">Sem atribuição</option>';
        p.devPairs.forEach(pair => {
            const label = pair.dev1 && pair.dev2 ? `${pair.dev1} & ${pair.dev2}` : 
                          pair.dev1 ? pair.dev1 : 
                          pair.dev2 ? pair.dev2 : 'Par sem nome';
            pairsHtml += `<option value="${pair.id}">${HomeView.escapeHtml(label)}</option>`;
        });

        App.showModal('Adicionar Tarefa à Sprint', `
            <div class="modal-body">
                <div class="form-group">
                    <label>Item do Backlog *</label>
                    <select class="form-select" id="taskBacklogItem">${itemsHtml}</select>
                </div>
                <div class="form-group">
                    <label>Título da Subtarefa *</label>
                    <input type="text" class="form-input" id="taskTitle" placeholder="Ex: Implementar tela de login">
                    <p class="text-xs text-muted mt-sm">Você pode dividir o item do backlog em subtarefas menores</p>
                </div>
                <div class="form-group">
                    <label>Atribuir à Dupla</label>
                    <select class="form-select" id="taskPair">${pairsHtml}</select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="SprintView.addTask('${sprintId}')">Adicionar Tarefa</button>
            </div>
        `);

        // Auto-fill task title from backlog item
        document.getElementById('taskBacklogItem').addEventListener('change', function() {
            const item = available.find(i => i.id === this.value);
            if (item) {
                document.getElementById('taskTitle').value = item.title;
            }
        });
        // Trigger initial fill
        const firstItem = available[0];
        if (firstItem) {
            document.getElementById('taskTitle').value = firstItem.title;
        }
    },

    addTask(sprintId) {
        const p = ProjectView.currentProject;
        
        // Verificar permissão: apenas SM pode adicionar tarefas
        const isScrumMaster = !Auth.currentUser || Auth.currentUser.isAdmin || 
                              (p.scrumMasterId && Auth.currentUser.id === p.scrumMasterId);
        if (!isScrumMaster) {
            App.toast('Apenas o Scrum Master pode adicionar tarefas', 'warning');
            return;
        }
        
        const backlogItemId = document.getElementById('taskBacklogItem').value;
        const title = document.getElementById('taskTitle').value.trim();
        const pairId = document.getElementById('taskPair').value;

        if (!title) {
            App.toast('Informe o título da tarefa', 'warning');
            return;
        }

        const backlogItem = p.backlog.find(i => i.id === backlogItemId);
        const pair = pairId ? p.devPairs.find(pp => pp.id === pairId) : null;

        let assignedLabel = '';
        if (pair) {
            assignedLabel = pair.dev1 && pair.dev2 ? `${pair.dev1} & ${pair.dev2}` : 
                           pair.dev1 ? pair.dev1 : 
                           pair.dev2 ? pair.dev2 : '';
        }

        const task = new SprintTask({
            title,
            backlogItemId,
            backlogItemTitle: backlogItem ? backlogItem.title : '',
            assignedPairId: pairId || null,
            assignedPairLabel: assignedLabel
        });

        // Mark backlog item as assigned to sprint
        p.updateBacklogItem(backlogItemId, { sprintId });

        // Add task to sprint
        const sprint = p.sprints.find(s => s.id === sprintId);
        if (sprint) {
            if (!sprint.tasks) sprint.tasks = [];
            sprint.tasks.push(task.toJSON());
            p.updateSprint(sprintId, { tasks: sprint.tasks });
        }
        p.save(); // Persistir adição de tarefa

        App.closeModal();
        App.toast('Tarefa adicionada à sprint!', 'success');
        ProjectView.refreshProject();
        ProjectView.refreshTab();
    },

    deleteTask(sprintId, taskId) {
        const p = ProjectView.currentProject;
        
        // Verificar permissão: apenas SM pode remover tarefas
        const isScrumMaster = !Auth.currentUser || Auth.currentUser.isAdmin || 
                              (p.scrumMasterId && Auth.currentUser.id === p.scrumMasterId);
        if (!isScrumMaster) {
            App.toast('Apenas o Scrum Master pode remover tarefas', 'warning');
            return;
        }
        
        const sprint = p.sprints.find(s => s.id === sprintId);
        if (sprint) {
            const task = sprint.tasks.find(t => t.id === taskId);
            // Free up the backlog item
            if (task && task.backlogItemId) {
                p.updateBacklogItem(task.backlogItemId, { sprintId: null });
            }
            sprint.tasks = sprint.tasks.filter(t => t.id !== taskId);
            p.updateSprint(sprintId, { tasks: sprint.tasks });
        }
        p.save(); // Persistir remoção de tarefa
        App.toast('Tarefa removida', 'info');
        ProjectView.refreshProject();
        ProjectView.refreshTab();
    },

    startSprint(sprintId) {
        const p = ProjectView.currentProject;
        
        // Deactivate other sprints (set to planning, not all to planning)
        p.sprints.forEach(s => {
            if (s.status === 'active' && s.id !== sprintId) {
                p.updateSprint(s.id, { status: 'planning' });
            }
        });
        
        p.updateSprint(sprintId, { status: 'active' });
        p.save(); // Persistir início de sprint
        App.toast('Sprint iniciada! 🚀', 'success');
        ProjectView.refreshProject();
        ProjectView.refreshTab();
    },

    completeSprint(sprintId) {
        const p = ProjectView.currentProject;
        p.updateSprint(sprintId, { status: 'completed' });
        p.save(); // Persistir a conclusão da sprint
        App.toast('Sprint concluída! Hora da retrospectiva. 🎉', 'success');
        ProjectView.refreshProject();
        ProjectView.refreshTab();
    },

    // Impede digitação de datas inválidas ou no passado em tempo real
    _clampDate(input, minDate) {
        const val = input.value;
        if (!val) return;
        // Limita o ano a 4 dígitos (evita 222222)
        const parts = val.split('-');
        if (parts[0] && parts[0].length > 4) {
            parts[0] = parts[0].slice(0, 4);
            input.value = parts.join('-');
        }
        // Se a data resultante for anterior ao mínimo, corrige
        if (input.value && input.value < minDate) {
            input.value = minDate;
        }
    }
};