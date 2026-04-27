// ========================================
// BACKLOG ITEM MODEL
// ========================================
class BacklogItem {
    constructor(data = {}) {
        this.id = data.id || Storage.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.type = data.type || 'story'; // story, bug, spike, task
        this.priority = data.priority || 'medium'; // critical, high, medium, low
        this.difficulty = data.difficulty || ''; // Muito Fácil, Fácil, Médio, Difícil, Muito Difícil
        this.sprintId = data.sprintId || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.order = data.order || 0;
        this.comments = data.comments || [];
    }

    toJSON() {
        return { ...this };
    }
}