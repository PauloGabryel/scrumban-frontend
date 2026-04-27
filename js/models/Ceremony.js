// ========================================
// CEREMONY MODELS
// ========================================
class DailyScrum {
    constructor(data = {}) {
        this.id = data.id || Storage.generateId();
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.sprintId = data.sprintId || null;
        this.participants = data.participants || [];
        this.entries = data.entries || []; // { name, yesterday, today, impediments }
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}

class Retrospective {
    constructor(data = {}) {
        this.id = data.id || Storage.generateId();
        this.sprintId = data.sprintId || null;
        this.sprintName = data.sprintName || '';
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.wentWell = data.wentWell || [];
        this.toImprove = data.toImprove || [];
        this.actionItems = data.actionItems || [];
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}