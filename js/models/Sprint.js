// ========================================
// SPRINT MODEL
// ========================================
class Sprint {
    constructor(data = {}) {
        this.id = data.id || Storage.generateId();
        this.name = data.name || '';
        this.goal = data.goal || '';
        this.startDate = data.startDate || '';
        this.endDate = data.endDate || '';
        this.status = data.status || 'planning'; // planning, active, completed
        this.tasks = data.tasks || []; // subtasks derived from backlog items
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    getDurationWeeks() {
        if (!this.startDate || !this.endDate) return 0;
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const diffMs = end - start;
        return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    }

    getRemainingDays() {
        if (!this.endDate) return 0;
        const now = new Date();
        const end = new Date(this.endDate);
        const diffMs = end - now;
        return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    }

    getProgress() {
        if (!this.tasks || this.tasks.length === 0) return 0;
        const done = this.tasks.filter(t => t.status === 'done').length;
        return Math.round((done / this.tasks.length) * 100);
    }

    toJSON() {
        return { ...this };
    }
}

// Sprint Task (subtask within a sprint)
class SprintTask {
    constructor(data = {}) {
        this.id = data.id || Storage.generateId();
        this.title = data.title || '';
        this.backlogItemId = data.backlogItemId || null;
        this.backlogItemTitle = data.backlogItemTitle || '';
        this.assignedPairId = data.assignedPairId || null;
        this.assignedPairLabel = data.assignedPairLabel || '';
        this.status = data.status || 'todo'; // todo, inProgress, review, done
        this.comments = data.comments || [];
        this.history = data.history || [];
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    addComment(text) {
        this.comments.push({
            id: Storage.generateId(),
            text,
            timestamp: new Date().toISOString()
        });
    }

    addHistoryEntry(from, to) {
        this.history.push({
            from,
            to,
            timestamp: new Date().toISOString()
        });
    }

    toJSON() {
        return { ...this };
    }
}