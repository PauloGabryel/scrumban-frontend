// ========================================
// PROJECT MODEL
// ========================================
class Project {
    constructor(data = {}) {
        this.id          = data.id          || Storage.generateId();
        this.name        = data.name        || '';
        this.description = data.description || '';
        this.creatorId   = data.creatorId   || null;
        this.creatorName = data.creatorName || '';
        this.creatorEmail= data.creatorEmail|| '';

        // Equipe
        this.members      = data.members      || [];   // array de userId
        this.memberNames  = data.memberNames  || {};   // { userId: name }

        // Papéis Scrum
        this.productOwner   = data.productOwner   || '';
        this.productOwnerId = data.productOwnerId || null;
        this.scrumMaster    = data.scrumMaster    || '';
        this.scrumMasterId  = data.scrumMasterId  || null;
        this.devPairs       = data.devPairs       || [];  // [{ id, dev1Id, dev1, dev2Id, dev2 }]

        // Conteúdo do projeto
        this.backlog        = data.backlog        || [];
        this.sprints        = data.sprints        || [];
        this.ceremonies     = data.ceremonies     || [];
        this.dailyScrums    = data.dailyScrums    || [];
        this.retrospectives = data.retrospectives || [];

        // Convites pendentes (por email)
        this.pendingInvites = data.pendingInvites || [];

        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    // ---- Persistência ----
    save() {
        this.updatedAt = new Date().toISOString();
        Storage.saveProject(this.toJSON());
    }

    toJSON() {
        return {
            id:            this.id,
            name:          this.name,
            description:   this.description,
            creatorId:     this.creatorId,
            creatorName:   this.creatorName,
            creatorEmail:  this.creatorEmail,
            members:       this.members,
            memberNames:   this.memberNames,
            productOwner:   this.productOwner,
            productOwnerId: this.productOwnerId,
            scrumMaster:    this.scrumMaster,
            scrumMasterId:  this.scrumMasterId,
            devPairs:       this.devPairs,
            backlog:       this.backlog,
            sprints:       this.sprints,
            ceremonies:    this.ceremonies,
            dailyScrums:   this.dailyScrums,
            retrospectives:this.retrospectives,
            pendingInvites: this.pendingInvites,
            createdAt:     this.createdAt,
            updatedAt:     this.updatedAt,
        };
    }

    // ---- Acesso ----
    isCreator(userId) {
        return this.creatorId && this.creatorId === userId;
    }

    isMember(userId) {
        return this.members.includes(userId);
    }

    hasAccess(userId) {
        return this.isCreator(userId) || this.isMember(userId);
    }

    // ---- Backlog ----
    getBacklogStats() {
        const total = this.backlog.length;
        const done  = this.backlog.filter(i => i.status === 'done').length;
        return { total, done, pending: total - done };
    }

    addBacklogItem(item) {
        this.backlog.push(item);
        this.save();
    }

    updateBacklogItem(itemId, changes) {
        const idx = this.backlog.findIndex(i => i.id === itemId);
        if (idx !== -1) {
            this.backlog[idx] = { ...this.backlog[idx], ...changes };
            this.save();
        }
    }

    removeBacklogItem(itemId) {
        this.backlog = this.backlog.filter(i => i.id !== itemId);
        this.save();
    }

    // ---- Sprints ----
    getActiveSprint() {
        return this.sprints.find(s => s.status === 'active') || null;
    }

    addSprint(sprint) {
        this.sprints.push(sprint);
        this.save();
    }

    updateSprint(sprintId, changes) {
        const idx = this.sprints.findIndex(s => s.id === sprintId);
        if (idx !== -1) {
            this.sprints[idx] = { ...this.sprints[idx], ...changes };
            this.save();
        }
    }

    removeSprint(sprintId) {
        this.sprints = this.sprints.filter(s => s.id !== sprintId);
        this.save();
    }

    // ---- Cerimônias ----
    addCeremony(ceremony) {
        this.ceremonies.push(ceremony);
        this.save();
    }

    updateCeremony(ceremonyId, changes) {
        const idx = this.ceremonies.findIndex(c => c.id === ceremonyId);
        if (idx !== -1) {
            this.ceremonies[idx] = { ...this.ceremonies[idx], ...changes };
            this.save();
        }
    }

    // ---- Daily Scrum ----
    addDailyScrum(daily) {
        if (!this.dailyScrums) this.dailyScrums = [];
        this.dailyScrums.unshift(daily);
        this.save();
    }

    // ---- Retrospectivas ----
    addRetrospective(retro) {
        if (!this.retrospectives) this.retrospectives = [];
        this.retrospectives.unshift(retro);
        this.save();
    }

    // ---- Helpers de Dupla ----
    getPairLabel(pair) {
        if (!pair) return '';
        const d1 = pair.dev1 || '';
        const d2 = pair.dev2 || '';
        if (d1 && d2) return `${d1} & ${d2}`;
        if (d1) return d1;
        if (d2) return d2;
        return `Par ${pair.id ? pair.id.slice(0,4) : ''}`;
    }

    getAllDevNames() {
        const names = [];
        (this.devPairs || []).forEach(pair => {
            if (pair.dev1 && pair.dev1.trim()) names.push(pair.dev1.trim());
            if (pair.dev2 && pair.dev2.trim()) names.push(pair.dev2.trim());
        });
        return [...new Set(names)]; // sem duplicatas
    }
}