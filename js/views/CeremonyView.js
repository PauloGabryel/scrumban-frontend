// ========================================
// CEREMONY VIEW (Daily Scrum + Retrospective)
// ========================================
const CeremonyView = {
    render(project) {
        const p = project;
        const activeSprint = p.getActiveSprint();

        return `
            <!-- DAILY SCRUM -->
            <div class="ceremony-section">
                <div class="ceremony-header">
                    <h3>
                        <span class="ceremony-icon daily">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </span>
                        Daily Scrum
                    </h3>
                    <button class="btn btn-primary btn-sm" onclick="CeremonyView.showDailyModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Registrar Daily
                    </button>
                </div>
                <p class="text-sm text-muted mb-md">Reunião diária de 15 minutos para alinhar progresso e identificar impedimentos.</p>

                <div class="ceremony-entries">
                    ${this.renderDailies(p)}
                </div>
            </div>

            <hr class="section-divider">

            <!-- SPRINT RETROSPECTIVE -->
            <div class="ceremony-section">
                <div class="ceremony-header">
                    <h3>
                        <span class="ceremony-icon retro">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                            </svg>
                        </span>
                        Sprint Retrospective
                    </h3>
                    <button class="btn btn-warning btn-sm" onclick="CeremonyView.showRetroModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nova Retrospectiva
                    </button>
                </div>
                <p class="text-sm text-muted mb-md">Reflexão ao final de cada sprint: o que funcionou, o que melhorar, ações concretas.</p>

                <div class="ceremony-entries">
                    ${this.renderRetros(p)}
                </div>
            </div>
        `;
    },

    renderDailies(project) {
        if (!project.dailyScrums || project.dailyScrums.length === 0) {
            return `
                <div class="empty-state">
                    <p class="text-muted">Nenhuma Daily Scrum registrada ainda.</p>
                </div>
            `;
        }

        return project.dailyScrums.slice(0, 10).map(daily => {
            let entriesHtml = '';
            if (daily.entries && daily.entries.length > 0) {
                entriesHtml = daily.entries.map(entry => `
                    <div class="daily-answers">
                        <strong class="text-sm" style="color:var(--primary)">${HomeView.escapeHtml(entry.name)}</strong>
                        <div class="daily-question">
                            <label>✅ O que fez ontem?</label>
                            <p class="text-sm">${HomeView.escapeHtml(entry.yesterday || '—')}</p>
                        </div>
                        <div class="daily-question">
                            <label>📌 O que vai fazer hoje?</label>
                            <p class="text-sm">${HomeView.escapeHtml(entry.today || '—')}</p>
                        </div>
                        <div class="daily-question">
                            <label>🚧 Algum impedimento?</label>
                            <p class="text-sm">${HomeView.escapeHtml(entry.impediments || 'Nenhum')}</p>
                        </div>
                    </div>
                `).join('<hr style="border:none;border-top:1px solid var(--gray-100);margin:var(--space-sm) 0;">');
            }

            return `
                <div class="ceremony-entry">
                    <div class="ceremony-entry-header">
                        <span class="ceremony-entry-date">📅 ${new Date(daily.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <button class="btn-icon" onclick="CeremonyView.deleteDaily('${daily.id}')" title="Excluir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                        </button>
                    </div>
                    ${entriesHtml}
                </div>
            `;
        }).join('');
    },

    renderRetros(project) {
        if (!project.retrospectives || project.retrospectives.length === 0) {
            return `
                <div class="empty-state">
                    <p class="text-muted">Nenhuma Retrospectiva registrada ainda.</p>
                </div>
            `;
        }

        return project.retrospectives.map(retro => {
            const wentWellHtml = (retro.wentWell || []).map(item => `
                <div class="retro-item">
                    <span>${HomeView.escapeHtml(item)}</span>
                </div>
            `).join('');

            const improveHtml = (retro.toImprove || []).map(item => `
                <div class="retro-item">
                    <span>${HomeView.escapeHtml(item)}</span>
                </div>
            `).join('');

            const actionHtml = (retro.actionItems || []).map(item => `
                <div class="retro-item">
                    <span>${HomeView.escapeHtml(item)}</span>
                </div>
            `).join('');

            return `
                <div class="ceremony-entry">
                    <div class="ceremony-entry-header">
                        <span class="ceremony-entry-date">📋 ${HomeView.escapeHtml(retro.sprintName || 'Sprint')} — ${new Date(retro.date).toLocaleDateString('pt-BR')}</span>
                        <button class="btn-icon" onclick="CeremonyView.deleteRetro('${retro.id}')" title="Excluir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                        </button>
                    </div>
                    <div class="retro-columns">
                        <div class="retro-column went-well">
                            <h5>😊 O que funcionou</h5>
                            <div class="retro-items">${wentWellHtml || '<p class="text-xs text-muted">Nenhum item</p>'}</div>
                        </div>
                        <div class="retro-column improve">
                            <h5>🔧 O que melhorar</h5>
                            <div class="retro-items">${improveHtml || '<p class="text-xs text-muted">Nenhum item</p>'}</div>
                        </div>
                        <div class="retro-column action">
                            <h5>🎯 Ações</h5>
                            <div class="retro-items">${actionHtml || '<p class="text-xs text-muted">Nenhum item</p>'}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    showDailyModal() {
        const p = ProjectView.currentProject;
        const today = new Date().toISOString().split('T')[0];

        // Get all dev names for participants
        const devNames = p.getAllDevNames();
        let participantsHtml = '';
        devNames.forEach((name, idx) => {
            participantsHtml += `
                <div class="daily-answers" style="background:var(--gray-50);padding:var(--space-md);border-radius:var(--radius-md);margin-bottom:var(--space-md);">
                    <strong class="text-sm" style="color:var(--primary)">${HomeView.escapeHtml(name)}</strong>
                    <div class="form-group" style="margin-top:var(--space-sm)">
                        <label>✅ O que fez ontem?</label>
                        <input type="text" class="form-input daily-yesterday" data-name="${HomeView.escapeHtml(name)}" placeholder="Atividades realizadas...">
                    </div>
                    <div class="form-group">
                        <label>📌 O que vai fazer hoje?</label>
                        <input type="text" class="form-input daily-today" data-name="${HomeView.escapeHtml(name)}" placeholder="Planejamento de hoje...">
                    </div>
                    <div class="form-group">
                        <label>🚧 Impedimentos?</label>
                        <input type="text" class="form-input daily-impediments" data-name="${HomeView.escapeHtml(name)}" placeholder="Bloqueios ou dificuldades...">
                    </div>
                </div>
            `;
        });

        if (devNames.length === 0) {
            participantsHtml = `
                <div class="daily-answers" style="background:var(--gray-50);padding:var(--space-md);border-radius:var(--radius-md);">
                    <div class="form-group">
                        <label>Participante</label>
                        <input type="text" class="form-input" id="dailyParticipant" placeholder="Nome do participante">
                    </div>
                    <div class="form-group">
                        <label>✅ O que fez ontem?</label>
                        <input type="text" class="form-input daily-yesterday" data-name="manual" placeholder="Atividades realizadas...">
                    </div>
                    <div class="form-group">
                        <label>📌 O que vai fazer hoje?</label>
                        <input type="text" class="form-input daily-today" data-name="manual" placeholder="Planejamento de hoje...">
                    </div>
                    <div class="form-group">
                        <label>🚧 Impedimentos?</label>
                        <input type="text" class="form-input daily-impediments" data-name="manual" placeholder="Bloqueios ou dificuldades...">
                    </div>
                </div>
            `;
        }

        App.showModal('Registrar Daily Scrum (15 min)', `
            <div class="modal-body">
                <div class="form-group">
                    <label>Data *</label>
                    <input type="date" class="form-input" id="dailyDate" value="${today}" min="2000-01-01" max="${today}">
                </div>
                <hr class="section-divider" style="margin:var(--space-md) 0;">
                ${participantsHtml}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="CeremonyView.saveDaily()">Salvar Daily</button>
            </div>
        `);
    },

    saveDaily() {
        const p = ProjectView.currentProject;
        const date = document.getElementById('dailyDate').value;

        // Validação de data
        if (!date) {
            App.toast('Informe a data da Daily', 'warning');
            return;
        }
        if (!CeremonyView._isValidDate(date)) {
            App.toast('Data inválida. Verifique o dia e mês informados', 'warning');
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        if (date > today) {
            App.toast('A data não pode ser no futuro', 'warning');
            return;
        }

        const entries = [];
        const yesterdays   = document.querySelectorAll('.daily-yesterday');
        const todays       = document.querySelectorAll('.daily-today');
        const impediments  = document.querySelectorAll('.daily-impediments');

        // Validar que pelo menos um participante tem "ontem" ou "hoje" preenchido
        let algumPreenchido = false;
        yesterdays.forEach((input, idx) => {
            const y = input.value.trim();
            const t = todays[idx] ? todays[idx].value.trim() : '';
            if (y || t) algumPreenchido = true;
        });
        if (!algumPreenchido) {
            App.toast('Preencha pelo menos "O que fez ontem" ou "O que vai fazer hoje" para um participante', 'warning');
            return;
        }

        yesterdays.forEach((input, idx) => {
            let name = input.dataset.name;
            if (name === 'manual') {
                const manualInput = document.getElementById('dailyParticipant');
                name = manualInput ? manualInput.value.trim() : '';
                if (!name) {
                    name = 'Participante';
                }
            }
            entries.push({
                name,
                yesterday:   input.value.trim(),
                today:       todays[idx] ? todays[idx].value.trim() : '',
                impediments: impediments[idx] ? impediments[idx].value.trim() : ''
            });
        });

        const activeSprint = p.getActiveSprint();
        const daily = new DailyScrum({
            date,
            sprintId: activeSprint ? activeSprint.id : null,
            entries
        });

        p.addDailyScrum(daily.toJSON());
        App.closeModal();
        App.toast('Daily Scrum registrada! ☀️', 'success');
        ProjectView.refreshProject();
        ProjectView.refreshTab();
    },

    deleteDaily(dailyId) {
        const p = ProjectView.currentProject;
        p.dailyScrums = p.dailyScrums.filter(d => d.id !== dailyId);
        p.save();
        App.toast('Daily removida', 'info');
        ProjectView.refreshProject();
        ProjectView.refreshTab();
    },

    showRetroModal() {
        const p = ProjectView.currentProject;
        const today = new Date().toISOString().split('T')[0];

        let sprintOptions = '<option value="">Selecione a Sprint</option>';
        p.sprints.forEach(s => {
            sprintOptions += `<option value="${s.id}" data-name="${HomeView.escapeHtml(s.name)}">${HomeView.escapeHtml(s.name)}</option>`;
        });

        App.showModal('Sprint Retrospective', `
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Sprint</label>
                        <select class="form-select" id="retroSprint">${sprintOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>Data *</label>
                        <input type="date" class="form-input" id="retroDate" value="${today}" min="2000-01-01" max="${today}">
                    </div>
                </div>

                <div class="retro-columns" style="margin-bottom:var(--space-lg);">
                    <div class="retro-column went-well">
                        <h5>😊 O que funcionou</h5>
                        <div id="retroWentWell" class="retro-items"></div>
                        <div class="comment-input-row mt-sm">
                            <input type="text" id="retroWentWellInput" placeholder="Adicionar...">
                            <button class="btn btn-sm btn-ghost" onclick="CeremonyView.addRetroItem('wentWell')">+</button>
                        </div>
                    </div>
                    <div class="retro-column improve">
                        <h5>🔧 O que melhorar</h5>
                        <div id="retroImprove" class="retro-items"></div>
                        <div class="comment-input-row mt-sm">
                            <input type="text" id="retroImproveInput" placeholder="Adicionar...">
                            <button class="btn btn-sm btn-ghost" onclick="CeremonyView.addRetroItem('improve')">+</button>
                        </div>
                    </div>
                    <div class="retro-column action">
                        <h5>🎯 Ações</h5>
                        <div id="retroActions" class="retro-items"></div>
                        <div class="comment-input-row mt-sm">
                            <input type="text" id="retroActionsInput" placeholder="Adicionar...">
                            <button class="btn btn-sm btn-ghost" onclick="CeremonyView.addRetroItem('actions')">+</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-warning" onclick="CeremonyView.saveRetro()">Salvar Retrospectiva</button>
            </div>
        `);

        // Store temp data
        this._retroData = { wentWell: [], improve: [], actions: [] };
    },

    _retroData: { wentWell: [], improve: [], actions: [] },

    addRetroItem(category) {
        const inputMap = {
            wentWell: 'retroWentWellInput',
            improve: 'retroImproveInput',
            actions: 'retroActionsInput'
        };
        const containerMap = {
            wentWell: 'retroWentWell',
            improve: 'retroImprove',
            actions: 'retroActions'
        };

        const input = document.getElementById(inputMap[category]);
        const text = input.value.trim();
        if (!text) return;

        this._retroData[category].push(text);
        input.value = '';

        const container = document.getElementById(containerMap[category]);
        container.innerHTML = this._retroData[category].map((item, idx) => `
            <div class="retro-item">
                <span>${HomeView.escapeHtml(item)}</span>
                <button class="btn-icon" style="width:20px;height:20px;" onclick="CeremonyView.removeRetroItem('${category}', ${idx})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `).join('');
    },

    removeRetroItem(category, index) {
        this._retroData[category].splice(index, 1);
        // Re-render
        const containerMap = {
            wentWell: 'retroWentWell',
            improve: 'retroImprove',
            actions: 'retroActions'
        };
        const container = document.getElementById(containerMap[category]);
        container.innerHTML = this._retroData[category].map((item, idx) => `
            <div class="retro-item">
                <span>${HomeView.escapeHtml(item)}</span>
                <button class="btn-icon" style="width:20px;height:20px;" onclick="CeremonyView.removeRetroItem('${category}', ${idx})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `).join('');
    },

    saveRetro() {
        const p = ProjectView.currentProject;
        const sprintSelect = document.getElementById('retroSprint');
        const sprintId     = sprintSelect.value;
        const sprintName   = sprintSelect.options[sprintSelect.selectedIndex]?.dataset?.name || '';
        const date         = document.getElementById('retroDate').value;

        // Validações obrigatórias
        if (!sprintId) {
            App.toast('Selecione a Sprint da retrospectiva', 'warning');
            return;
        }
        if (!date) {
            App.toast('Informe a data da retrospectiva', 'warning');
            return;
        }
        if (!CeremonyView._isValidDate(date)) {
            App.toast('Data inválida. Verifique o dia e mês informados', 'warning');
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        if (date > today) {
            App.toast('A data não pode ser no futuro', 'warning');
            return;
        }

        const totalItens = this._retroData.wentWell.length + this._retroData.improve.length + this._retroData.actions.length;
        if (totalItens === 0) {
            App.toast('Adicione pelo menos um item em "O que funcionou", "O que melhorar" ou "Ações"', 'warning');
            return;
        }

        const retro = new Retrospective({
            sprintId,
            sprintName,
            date,
            wentWell: this._retroData.wentWell,
            toImprove: this._retroData.improve,
            actionItems: this._retroData.actions
        });

        p.addRetrospective(retro.toJSON());
        App.closeModal();
        App.toast('Retrospectiva salva! 🔄', 'success');
        ProjectView.refreshProject();
        ProjectView.refreshTab();
    },

    deleteRetro(retroId) {
        const p = ProjectView.currentProject;
        p.retrospectives = p.retrospectives.filter(r => r.id !== retroId);
        p.save();
        App.toast('Retrospectiva removida', 'info');
        ProjectView.refreshProject();
        ProjectView.refreshTab();
    },

    // Limita o ano a 4 dígitos e impede datas futuras em tempo real
    _clampDate(input, maxDate) {
        const val = input.value;
        if (!val) return;
        const parts = val.split('-');
        if (parts[0] && parts[0].length > 4) {
            parts[0] = parts[0].slice(0, 4);
            input.value = parts.join('-');
        }
        if (input.value && input.value > maxDate) {
            input.value = maxDate;
        }
    },

    // Verifica se uma data YYYY-MM-DD é de fato válida (sem dias/meses impossíveis)
    _isValidDate(str) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
        const [y, m, d] = str.split('-').map(Number);
        const dt = new Date(str);
        return !isNaN(dt.getTime()) &&
               dt.getFullYear() === y &&
               dt.getMonth() + 1 === m &&
               dt.getDate() === d;
    }
};