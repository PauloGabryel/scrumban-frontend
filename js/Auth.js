// ========================================
// AUTH — 100% API (sem localStorage de dados)
// Só localStorage para token/user da sessão
// ========================================
const Auth = {
    currentUser:  null,
    currentToken: null,

    init() {
        this.setupEventListeners();
        this.checkSession();
    },

    // ---- Sessão ----
    checkSession() {
        const savedUser  = localStorage.getItem('scrumban_user');
        const savedToken = localStorage.getItem('scrumban_token');
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
        localStorage.setItem('scrumban_user',  JSON.stringify(safe));
        localStorage.setItem('scrumban_token', token);
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
        if (password.length < 6) {
            this._msg('A senha deve ter no mínimo 6 caracteres', 'error', msgEl); return;
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

    // ---- Esqueci a Senha ----
    async forgotPassword() {
        const email = (document.getElementById('forgotEmail') || {}).value || '';
        const msgEl = document.getElementById('forgotMessage');
        const btn   = document.querySelector('#forgotForm button[type="submit"]');

        if (!email) {
            this._msg('Por favor, informe seu email', 'error', msgEl); return;
        }
        if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

        try {
            const res  = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            this._msg(data.message || 'Email enviado!', res.ok ? 'success' : 'error', msgEl);
            if (res.ok) {
                if (btn) { btn.textContent = 'Email enviado!'; }
            } else {
                if (btn) { btn.disabled = false; btn.textContent = 'Enviar Link de Redefinição'; }
            }
        } catch (e) {
            this._msg('Erro de conexão. Backend está rodando?', 'error', msgEl);
            if (btn) { btn.disabled = false; btn.textContent = 'Enviar Link de Redefinição'; }
        }
    },

    // ---- Redefinir Senha ----
    async resetPassword(resetToken) {
        const password = (document.getElementById('resetPassword') || {}).value || '';
        const confirm  = (document.getElementById('resetConfirm')  || {}).value || '';
        const msgEl    = document.getElementById('resetMessage');
        const btn      = document.querySelector('#resetForm button[type="submit"]');

        if (password.length < 6) {
            this._msg('A senha deve ter no mínimo 6 caracteres', 'error', msgEl); return;
        }
        if (password !== confirm) {
            this._msg('As senhas não conferem', 'error', msgEl); return;
        }
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

        try {
            const res  = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken, password, passwordConfirm: confirm }),
            });
            const data = await res.json();

            if (res.ok) {
                this._msg('✅ ' + data.message, 'success', msgEl);
                setTimeout(() => {
                    history.replaceState(null, '', window.location.pathname);
                    if (typeof switchPanel === 'function') switchPanel('login');
                }, 2000);
            } else {
                this._msg(data.message || 'Erro ao redefinir senha', 'error', msgEl);
                if (btn) { btn.disabled = false; btn.textContent = 'Redefinir Senha'; }
            }
        } catch (e) {
            this._msg('Erro de conexão. Backend está rodando?', 'error', msgEl);
            if (btn) { btn.disabled = false; btn.textContent = 'Redefinir Senha'; }
        }
    },

    logout() {
        localStorage.removeItem('scrumban_user');
        localStorage.removeItem('scrumban_token');
        this.currentUser  = null;
        this.currentToken = null;
        window.location.href = 'login.html';
    },

    requireAuth() {
        const savedUser  = localStorage.getItem('scrumban_user');
        const savedToken = localStorage.getItem('scrumban_token');
        console.log('[Auth.requireAuth] user:', savedUser, '| token:', savedToken ? 'existe' : 'VAZIO');
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

    getToken()   { return localStorage.getItem('scrumban_token') || ''; },
    getHeaders() {
        return {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${this.getToken()}`,
        };
    },

    setupEventListeners() {
        // Listeners gerenciados diretamente no login.html para evitar duplicação
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