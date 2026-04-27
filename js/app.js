// ========================================
// APP CONTROLLER — 100% API (sem localStorage de dados)
// Preferência de tema fica em localStorage (dado de UI, não de negócio)
// ========================================
const App = {
    currentView:      'home',
    currentProjectId: null,
    currentUser:      null,

    async init() {
        if (!Auth.requireAuth()) return;
        this.currentUser = Auth.currentUser;

        this.updateUserDisplay();
        this.setupEventListeners();
        this.initDarkMode();
        await this.navigateTo('home');
        await this.renderNotifications();
    },

    // ---- Exibição do usuário ----
    updateUserDisplay() {
        const el = document.getElementById('userDisplay');
        if (!el || !this.currentUser) return;
        const name     = this.currentUser.name || '?';
        const email    = (this.currentUser.email || '').trim().toLowerCase();
        const initials = name.trim().split(' ').filter(Boolean)
            .map((p, i, a) => (i === 0 || i === a.length - 1) ? p[0] : null)
            .filter(Boolean).join('').toUpperCase().slice(0, 2);
        el.innerHTML = `
            <span class="nav-user-avatar" id="navUserAvatar" title="${name}">
                <span class="nav-user-initials">${initials}</span>
            </span>
            <span class="nav-user-name">${name}</span>`;
        if (email) {
            this._gravatarUrl(email).then(url => {
                const avatar = document.getElementById('navUserAvatar');
                if (!avatar) return;
                const img = new Image();
                img.onload = () => { avatar.innerHTML = `<img src="${url}" alt="${name}" class="nav-user-photo">`; };
                img.src = url;
            });
        }
    },

    async _gravatarUrl(email) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
        const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
        return `https://gravatar.com/avatar/${hex}?s=80&d=404`;
    },

    // ---- Event listeners ----
    setupEventListeners() {
        document.getElementById('btnHome')    ?.addEventListener('click', () => this.navigateTo('home'));
        document.getElementById('btnLogout')  ?.addEventListener('click', () => { if (confirm('Tem certeza que deseja sair?')) Auth.logout(); });
        document.getElementById('btnDarkMode')?.addEventListener('click', () => this.toggleDarkMode());
        document.addEventListener('keydown', e => { if (e.key === 'Escape') { this.closeModal(); this.closeDrawer(); } });

        // Sino
        document.getElementById('btnNotif')?.addEventListener('click', e => {
            e.stopPropagation();
            document.getElementById('notifPanel')?.classList.toggle('open');
        });
        document.addEventListener('click', () => document.getElementById('notifPanel')?.classList.remove('open'));
        document.getElementById('notifPanel')?.addEventListener('click', e => e.stopPropagation());

        // Hamburger
        document.getElementById('btnHamburger')?.addEventListener('click', e => { e.stopPropagation(); this.toggleDrawer(); });
        document.getElementById('mobileLogout')?.addEventListener('click', () => { this.closeDrawer(); if (confirm('Tem certeza?')) Auth.logout(); });
        document.getElementById('mobileDarkMode')?.addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('mobileNotif')?.addEventListener('click', () => { this.closeDrawer(); document.getElementById('notifPanel')?.classList.toggle('open'); });
    },

    toggleDrawer() {
        const drawer  = document.getElementById('mobileNavDrawer');
        const btn     = document.getElementById('btnHamburger');
        const overlay = document.getElementById('drawerOverlay');
        const isOpen  = drawer?.classList.toggle('open');
        btn?.classList.toggle('open', isOpen);
        if (overlay) overlay.style.display = isOpen ? 'block' : 'none';
        btn?.setAttribute('aria-expanded', String(isOpen));
        if (isOpen && this.currentUser) {
            const el = document.getElementById('mobileUserDisplay');
            if (el) el.textContent = '👤 ' + (this.currentUser.name || '');
        }
    },

    closeDrawer() {
        const drawer  = document.getElementById('mobileNavDrawer');
        const btn     = document.getElementById('btnHamburger');
        const overlay = document.getElementById('drawerOverlay');
        drawer?.classList.remove('open');
        btn?.classList.remove('open');
        if (overlay) overlay.style.display = 'none';
        btn?.setAttribute('aria-expanded', 'false');
    },

    // ---- Notificações via API ----
    async renderNotifications() {
        const badge = document.getElementById('notifBadge');
        const list  = document.getElementById('notifList');
        const mobileBadge = document.getElementById('mobileNotifCount');
        if (!badge || !list) return;

        try {
            const invites = await Storage.getMyInvites();

            if (!invites || invites.length === 0) {
                badge.style.display = 'none';
                if (mobileBadge) mobileBadge.style.display = 'none';
                list.innerHTML = '<div class="notif-empty">Nenhum convite pendente 🎉</div>';
                return;
            }

            badge.style.display  = 'flex';
            badge.textContent    = invites.length;
            if (mobileBadge) { mobileBadge.style.display = 'inline'; mobileBadge.textContent = invites.length; }

            list.innerHTML = invites.map(inv => `
                <div class="notif-item" id="notif-${inv.id}">
                    <div class="notif-item-title">📋 ${this._esc(inv.project_name || inv.projectName || '')}</div>
                    <div class="notif-item-sub">Convidado por <strong>${this._esc(inv.invited_by_name || inv.creatorName || '')}</strong></div>
                    <div class="notif-item-actions">
                        <button class="btn-notif-accept"  onclick="App.acceptInvite('${inv.id}', '${this._esc(inv.project_name || '')}')">Aceitar</button>
                        <button class="btn-notif-decline" onclick="App.declineInvite('${inv.id}')">Recusar</button>
                    </div>
                </div>
            `).join('');
        } catch(e) {
            console.error('renderNotifications:', e);
        }
    },

    async acceptInvite(inviteId, projectName) {
        const result = await Storage.acceptInvite(inviteId);
        document.getElementById(`notif-${inviteId}`)?.remove();
        await this.renderNotifications();
        if (result.ok) {
            this.toast(`Você entrou no projeto "${projectName}"!`, 'success');
            await this.navigateTo('home');
        } else {
            this.toast(result.message || 'Erro ao aceitar convite', 'error');
        }
    },

    async declineInvite(inviteId) {
        const result = await Storage.declineInvite(inviteId);
        document.getElementById(`notif-${inviteId}`)?.remove();
        await this.renderNotifications();
        this.toast(result.ok ? 'Convite recusado' : result.message, result.ok ? 'info' : 'error');
    },

    _esc(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    },

    // ---- Navegação ----
    async navigateTo(view, projectId = null) {
        this.currentView      = view;
        this.currentProjectId = projectId;
        const main = document.getElementById('mainContent');

        switch (view) {
            case 'home':
                this.setBreadcrumb([]);
                main.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;color:#64748b;">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2" style="animation:spin 1s linear infinite">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        <span style="font-size:14px;font-weight:500;">Carregando projetos...</span>
                    </div>`;
                main.innerHTML = await HomeView.render(this.currentUser);
                break;
            case 'project':
                if (projectId) window.location.href = `project.html?id=${projectId}`;
                break;
        }
        window.scrollTo(0, 0);
    },

    setBreadcrumb(items) {
        const bc = document.getElementById('breadcrumb');
        if (!bc) return;
        if (!items.length) { bc.innerHTML = ''; return; }
        bc.innerHTML = items.map(item => {
            if (item.current) return `<span class="breadcrumb-current">${HomeView.escapeHtml(item.label)}</span>`;
            return `<span class="breadcrumb-item" onclick="${item.action}">${HomeView.escapeHtml(item.label)}</span><span class="breadcrumb-separator">›</span>`;
        }).join('');
    },

    showModal(title, content) {
        const overlay = document.getElementById('modalOverlay');
        const modal   = document.getElementById('modalContent');
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="btn-icon" onclick="App.closeModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            ${content}`;
        overlay.classList.add('active');
    },

    closeModal() {
        document.getElementById('modalOverlay')?.classList.remove('active');
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toast.innerHTML = `
            <span>${icons[type] || 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>`;
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity   = '0';
                toast.style.transform = 'translateX(100px)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    },

    // ---- Dark mode (preferência de UI — localStorage é OK aqui) ----
    initDarkMode() {
        const isDark = localStorage.getItem('scrumban_dark_mode') === 'true';
        if (isDark) document.body.classList.add('dark-mode');
        this._updateDarkIcons(isDark);
    },

    toggleDarkMode() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('scrumban_dark_mode', String(isDark));
        this._updateDarkIcons(isDark);
    },

    _updateDarkIcons(isDark) {
        document.getElementById('iconDark') ?.setAttribute('style', isDark ? 'display:none' : '');
        document.getElementById('iconLight')?.setAttribute('style', isDark ? '' : 'display:none');
        const label = document.getElementById('darkModeLabel');
        if (label) label.textContent = isDark ? 'Claro' : 'Escuro';
        const btn = document.getElementById('btnDarkMode');
        if (btn) btn.title = isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro';
    },
};

document.addEventListener('DOMContentLoaded', () => { App.init(); });