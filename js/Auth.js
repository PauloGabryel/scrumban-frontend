// ========================================
// AUTH — 100% API (sem localStorage de dados)
// Só sessionStorage para token/user da sessão
// ========================================
const Auth = {
    currentUser:  null,
    currentToken: null,

    init() {
        this.setupEventListeners();
        this.checkSession();
    },

    // ---- Sessão (token fica em sessionStorage, não localStorage) ----
    checkSession() {
        const savedUser  = sessionStorage.getItem('scrumban_user');
        const savedToken = sessionStorage.getItem('scrumban_token');
        if (savedUser && savedToken) {
            try {
                this.currentUser  = JSON.parse(savedUser);
                this.currentToken = savedToken;
            } catch(e) {}
        }
    },

    _saveSession(user, token) {
        const safe = {
            id:    user.id || user._id || '',
            name:  user.name || user.username || '',
            email: user.email || '',
        };
        sessionStorage.setItem('scrumban_user',  JSON.stringify(safe));
        sessionStorage.setItem('scrumban_token', token);
        this.currentUser  = safe;
        this.currentToken = token;
    },

    // ---- Login ----
    async login() {
        const email    = (document.getElementById('loginEmail')    || {}).value || '';
        const password = (document.getElementById('loginPassword') || {}).value || '';
        const msgEl    = document.getElementById('loginMessage');
        const btn      = document.querySelector('#loginForm button[type="submit"]');

        if (!email || !password) {
            this._msg('Por favor, preencha email e senha', 'error', msgEl); return;
        }
        if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

        try {
            const res  = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (res.ok) {
                this._saveSession(data.user, data.token);
                this._msg('✅ Login realizado com sucesso!', 'success', msgEl);
                setTimeout(() => { window.location.href = 'index.html'; }, 700);
            } else {
                this._msg(data.message || 'Email ou senha incorretos', 'error', msgEl);
                if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
            }
        } catch (e) {
            this._msg('Erro de conexão. Backend está rodando?', 'error', msgEl);
            if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
        }
    },

    // ---- Registro ----
    async register() {
        const name     = (document.getElementById('signupName')     || {}).value || '';
        const email    = (document.getElementById('signupEmail')    || {}).value || '';
        const password = (document.getElementById('signupPassword') || {}).value || '';
        const confirm  = (document.getElementById('signupConfirm')  || {}).value || '';
        const msgEl    = document.getElementById('signupMessage');
        const btn      = document.querySelector('#signupForm button[type="submit"]');

        if (!name || !email || !password || !confirm) {
            this._msg('Por favor, preencha todos os campos', 'error', msgEl); return;
        }
        if (password !== confirm) {
            this._msg('As senhas não conferem', 'error', msgEl); return;
        }
        if (btn) { btn.disabled = true; btn.textContent = 'Criando conta...'; }

        try {
            const res  = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, passwordConfirm: confirm }),
            });
            const data = await res.json();

            if (res.ok) {
                this._saveSession(data.user, data.token);
                this._msg('✅ Conta criada com sucesso!', 'success', msgEl);
                setTimeout(() => { window.location.href = 'index.html'; }, 700);
            } else {
                this._msg(data.message || 'Erro ao criar conta', 'error', msgEl);
                if (btn) { btn.disabled = false; btn.textContent = 'Criar Conta'; }
            }
        } catch (e) {
            this._msg('Erro de conexão. Backend está rodando?', 'error', msgEl);
            if (btn) { btn.disabled = false; btn.textContent = 'Criar Conta'; }
        }
    },

    logout() {
        sessionStorage.removeItem('scrumban_user');
        sessionStorage.removeItem('scrumban_token');
        this.currentUser  = null;
        this.currentToken = null;
        window.location.href = 'login.html';
    },

    requireAuth() {
        const savedUser  = sessionStorage.getItem('scrumban_user');
        const savedToken = sessionStorage.getItem('scrumban_token');
        if (!savedUser || !savedToken) {
            window.location.href = 'login.html';
            return false;
        }
        try {
            this.currentUser  = JSON.parse(savedUser);
            this.currentToken = savedToken;
            return true;
        } catch(e) {
            window.location.href = 'login.html';
            return false;
        }
    },

    getToken()   { return sessionStorage.getItem('scrumban_token') || ''; },
    getHeaders() {
        return {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${this.getToken()}`,
        };
    },

    setupEventListeners() {
        document.getElementById('loginForm') ?.addEventListener('submit',  e => { e.preventDefault(); this.login(); });
        document.getElementById('signupForm')?.addEventListener('submit', e => { e.preventDefault(); this.register(); });
    },

    _msg(text, type, el) {
        const target = el || document.getElementById('loginMessage');
        if (!target) return;
        target.textContent   = text;
        target.className     = `auth-message ${type}`;
        target.style.display = 'block';
        if (type === 'error') setTimeout(() => { target.style.display = 'none'; }, 5000);
    },
};