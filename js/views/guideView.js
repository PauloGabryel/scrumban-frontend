// ========================================
// GUIDE VIEW — Guia de uso / Onboarding
// ========================================
const GuideView = {

    sections: [
        {
            id: 'home',
            icon: '🏠',
            title: 'Página Inicial',
            content: `
                <p>Na página inicial você vê todos os seus projetos e pode criar novos.</p>
                <ul>
                    <li><strong>Criar projeto:</strong> Clique em "Novo Projeto", informe nome e descrição.</li>
                    <li><strong>Abrir projeto:</strong> Clique no card do projeto.</li>
                    <li><strong>Editar/Excluir:</strong> Use os ícones no canto do card (apenas criador).</li>
                </ul>
            `
        },
        {
            id: 'team',
            icon: '👥',
            title: 'Equipe',
            content: `
                <p>Gerencie os membros e papéis do seu projeto.</p>
                <ul>
                    <li><strong>Convidar membro:</strong> Informe o e-mail do usuário e clique em "Convidar". O usuário receberá uma notificação (🔔).</li>
                    <li><strong>Product Owner:</strong> Responsável pelo backlog. Selecione um membro no campo correspondente.</li>
                    <li><strong>Scrum Master:</strong> Facilita cerimônias e remove impedimentos.</li>
                    <li><strong>Programação em Pares:</strong> Associe dois desenvolvedores por par. Clique em "+ Adicionar Par" para criar novos pares.</li>
                    <li><strong>Remover membro:</strong> Apenas o criador do projeto pode remover membros.</li>
                </ul>
            `
        },
        {
            id: 'backlog',
            icon: '📋',
            title: 'Product Backlog',
            content: `
                <p>O Product Backlog é a lista priorizada de tudo que precisa ser feito no produto.</p>
                <ul>
                    <li><strong>Adicionar item:</strong> Clique em "+ Novo Item" (disponível para o Product Owner).</li>
                    <li><strong>Tipos:</strong> História de usuário, Bug, Tarefa Técnica ou Spike.</li>
                    <li><strong>Prioridade:</strong> Crítica 🔴, Alta 🟠, Média 🔵, Baixa ⚪.</li>
                    <li><strong>Dificuldade:</strong> Define o nível de esforço estimado para o item.</li>
                    <li><strong>Reordenar:</strong> Arraste pelo ícone ⠿ para reorganizar a ordem dos itens.</li>
                    <li><strong>Excluir:</strong> Clique no ícone de lixeira e confirme na caixa de diálogo.</li>
                    <li><strong>Mover para Sprint:</strong> Itens podem ser adicionados a uma Sprint na aba Sprints.</li>
                </ul>
            `
        },
        {
            id: 'sprints',
            icon: '⚡',
            title: 'Sprints',
            content: `
                <p>Sprints são ciclos de trabalho com duração fixa (2 a 4 semanas).</p>
                <ul>
                    <li><strong>Criar Sprint:</strong> Clique em "Nova Sprint", defina nome, meta e datas.</li>
                    <li><strong>Datas:</strong> Não é possível selecionar datas no passado. O ano aceita até 4 dígitos.</li>
                    <li><strong>Adicionar tarefas:</strong> Clique em "+ Adicionar do Backlog" para mover itens do backlog para a sprint.</li>
                    <li><strong>Iniciar Sprint:</strong> Clique em "▶ Iniciar" — apenas uma sprint pode estar ativa por vez.</li>
                    <li><strong>Concluir Sprint:</strong> Clique em "✓ Concluir" ao terminar o ciclo.</li>
                    <li><strong>Status das tarefas:</strong> Mude entre A Fazer, Em Andamento e Concluído.</li>
                </ul>
            `
        },
        {
            id: 'kanban',
            icon: '🗂️',
            title: 'Kanban',
            content: `
                <p>O Kanban mostra o fluxo visual das tarefas da sprint ativa.</p>
                <ul>
                    <li><strong>Colunas:</strong> A Fazer → Em Andamento → Concluído.</li>
                    <li><strong>Mover cartão:</strong> Arraste e solte o card entre as colunas.</li>
                    <li><strong>Visualização:</strong> Apenas tarefas da sprint ativa aparecem aqui.</li>
                    <li><strong>Prioridade:</strong> O ponto colorido indica a prioridade do item.</li>
                </ul>
            `
        },
        {
            id: 'ceremonies',
            icon: '📅',
            title: 'Cerimônias Scrum',
            content: `
                <p>Registre as cerimônias do Scrum para manter o histórico do projeto.</p>
                <ul>
                    <li><strong>Daily Scrum:</strong> Reunião diária de 15min. Registre o que cada membro fez ontem, fará hoje e eventuais impedimentos.</li>
                    <li><strong>Retrospectiva:</strong> Ao final de cada sprint, documente o que funcionou, o que melhorar e ações concretas.</li>
                    <li><strong>Excluir registro:</strong> Clique no ícone de lixeira no registro desejado.</li>
                </ul>
            `
        },
        {
            id: 'notifications',
            icon: '🔔',
            title: 'Notificações e Convites',
            content: `
                <p>O sistema de notificações gerencia convites para projetos.</p>
                <ul>
                    <li><strong>Receber convite:</strong> Ao ser convidado, aparece uma notificação com badge vermelho no sino 🔔.</li>
                    <li><strong>Aceitar/Recusar:</strong> Clique no sino e use os botões "Aceitar" ou "Recusar".</li>
                    <li><strong>Mobile:</strong> No celular, acesse as notificações pelo menu hambúrguer (≡) → "Convites".</li>
                    <li><strong>Toasts:</strong> Mensagens de confirmação aparecem no canto inferior direito (ou inferior no celular).</li>
                </ul>
            `
        },
        {
            id: 'roles',
            icon: '🔐',
            title: 'Papéis e Permissões',
            content: `
                <p>Entenda quem pode fazer o quê no Scrumban.</p>
                <ul>
                    <li><strong>Criador do projeto:</strong> Pode renomear, excluir o projeto e gerenciar membros.</li>
                    <li><strong>Product Owner:</strong> Pode criar, editar e excluir itens do backlog.</li>
                    <li><strong>Scrum Master:</strong> Facilita cerimônias, sem restrições de acesso à leitura.</li>
                    <li><strong>Desenvolvedores:</strong> Podem atualizar status de tarefas no Kanban e Sprint.</li>
                    <li><strong>Todos os membros:</strong> Podem registrar Daily Scrums e Retrospectivas.</li>
                </ul>
            `
        }
    ],

    open() {
        const nav = this.sections.map((s, i) => `
            <button class="guide-nav-btn ${i === 0 ? 'active' : ''}"
                    onclick="GuideView.showSection(${i})"
                    id="guide-nav-${i}">
                <span>${s.icon}</span> ${s.title}
            </button>
        `).join('');

        const content = this.sections.map((s, i) => `
            <div class="guide-section ${i === 0 ? 'active' : ''}" id="guide-sec-${i}">
                <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:1.4rem">${s.icon}</span> ${s.title}
                </h3>
                ${s.content}
            </div>
        `).join('');

        App.showModal('📖 Guia de Uso — Scrumban', `
            <style>
                .guide-layout { display:flex; gap:0; min-height:340px; }
                .guide-nav { width:180px; flex-shrink:0; border-right:1px solid var(--gray-200); padding:8px; display:flex; flex-direction:column; gap:4px; }
                .guide-body { flex:1; padding:20px; overflow-y:auto; max-height:380px; }
                .guide-nav-btn { background:none; border:none; text-align:left; padding:8px 10px; border-radius:8px; cursor:pointer; font-size:0.82rem; color:var(--gray-700); display:flex; align-items:center; gap:6px; transition:background 0.15s; width:100%; }
                .guide-nav-btn:hover { background:var(--gray-100); }
                .guide-nav-btn.active { background:var(--primary-bg); color:var(--primary); font-weight:600; }
                .guide-section { display:none; }
                .guide-section.active { display:block; }
                .guide-section p { margin-bottom:10px; font-size:0.875rem; color:var(--gray-600); }
                .guide-section ul { padding-left:18px; display:flex; flex-direction:column; gap:6px; }
                .guide-section li { font-size:0.85rem; color:var(--gray-700); line-height:1.5; }
                .guide-section strong { color:var(--gray-900); }
                body.dark-mode .guide-nav { border-color:var(--dm-border); }
                body.dark-mode .guide-nav-btn { color:var(--dm-muted); }
                body.dark-mode .guide-nav-btn:hover { background:var(--dm-hover); }
                body.dark-mode .guide-nav-btn.active { background:rgba(91,135,246,0.15); color:var(--dm-primary); }
                body.dark-mode .guide-section p { color:var(--dm-muted); }
                body.dark-mode .guide-section li { color:var(--dm-text); }
                body.dark-mode .guide-section strong { color:var(--dm-text-strong); }
                @media (max-width:600px) {
                    .guide-layout { flex-direction:column; }
                    .guide-nav { width:100%; flex-direction:row; flex-wrap:wrap; border-right:none; border-bottom:1px solid var(--gray-200); }
                    .guide-nav-btn { font-size:0.75rem; padding:5px 8px; }
                    .guide-body { max-height:260px; }
                }
            </style>
            <div class="modal-body" style="padding:0;">
                <div class="guide-layout">
                    <nav class="guide-nav">${nav}</nav>
                    <div class="guide-body">${content}</div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="App.closeModal()">Fechar</button>
            </div>
        `);
    },

    showSection(idx) {
        document.querySelectorAll('.guide-nav-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
        document.querySelectorAll('.guide-section').forEach((s, i) => s.classList.toggle('active', i === idx));
    }
};