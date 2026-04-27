const { supabase } = require('../config/database');
const { sendInviteEmail } = require('../config/email');
const crypto = require('crypto');

// Enviar convite
exports.sendInvite = async (req, res) => {
  try {
    const { email, projectId } = req.body;
    if (!email || !projectId) return res.status(400).json({ message: 'Email e projectId são obrigatórios' });

    const { data: project } = await supabase.from('projects').select('id, name, creator_id').eq('id', projectId).single();
    if (!project) return res.status(404).json({ message: 'Projeto não encontrado' });
    if (project.creator_id !== req.user.id) return res.status(403).json({ message: 'Apenas o criador pode convidar' });

    // Verificar se já é membro
    const { data: targetUser } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).single();
    if (targetUser) {
      const { data: already } = await supabase.from('project_members').select('id').eq('project_id', projectId).eq('user_id', targetUser.id).single();
      if (already) return res.status(400).json({ message: 'Este usuário já é membro do projeto' });
    }

    // Verificar se já tem convite pendente
    const { data: existing } = await supabase.from('invites').select('id').eq('project_id', projectId).eq('email', email.toLowerCase()).eq('accepted', false).single();
    if (existing) return res.status(400).json({ message: 'Já existe um convite pendente para este email' });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error } = await supabase.from('invites').insert({
      email: email.toLowerCase(), project_id: projectId, created_by: req.user.id, token, expires_at: expiresAt, accepted: false,
    }).select().single();

    if (error) throw error;

    const { data: creator } = await supabase.from('users').select('name').eq('id', req.user.id).single();
    await sendInviteEmail(email, token, project.name, creator?.name || '');

    res.status(201).json({ message: `Convite enviado para ${email}`, invite: { id: invite.id, email: invite.email } });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao enviar convite: ' + e.message });
  }
};

// Listar convites pendentes PARA o usuário logado (para o sino)
exports.getMyInvites = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();

    const { data: invites, error } = await supabase
      .from('invites')
      .select(`
        id, email, created_at, expires_at,
        projects ( id, name ),
        inviter:users!invites_created_by_fkey ( name )
      `)
      .eq('email', email)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    const result = (invites || []).map(inv => ({
      id:              inv.id,
      email:           inv.email,
      project_id:      inv.projects?.id,
      project_name:    inv.projects?.name,
      invited_by_name: inv.inviter?.name,
      created_at:      inv.created_at,
      expires_at:      inv.expires_at,
    }));

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar convites: ' + e.message });
  }
};

// Aceitar convite (por ID — usuário logado)
exports.acceptInvite = async (req, res) => {
  try {
    const inviteId = req.params.inviteId || req.params.token;

    // Busca por ID ou token
    const query = supabase.from('invites').select('*');
    const isUUID = /^[0-9a-f-]{36}$/.test(inviteId);
    const { data: invite } = await (isUUID ? query.eq('id', inviteId) : query.eq('token', inviteId)).single();

    if (!invite) return res.status(404).json({ message: 'Convite não encontrado' });
    if (new Date() > new Date(invite.expires_at)) return res.status(400).json({ message: 'Convite expirado' });
    if (invite.accepted) return res.status(400).json({ message: 'Convite já aceito' });
    if (req.user.email.toLowerCase() !== invite.email.toLowerCase())
      return res.status(403).json({ message: 'Este convite é para outro email' });

    // Adicionar como membro
    const { error: memberErr } = await supabase.from('project_members').insert({
      project_id: invite.project_id, user_id: req.user.id, role: 'member',
    });
    if (memberErr && memberErr.code !== '23505') throw memberErr; // ignora duplicata

    // Marcar como aceito
    await supabase.from('invites').update({ accepted: true, accepted_by: req.user.id, accepted_at: new Date().toISOString() }).eq('id', invite.id);

    const { data: project } = await supabase.from('projects').select('id, name').eq('id', invite.project_id).single();
    res.json({ message: 'Convite aceito!', project: { id: project.id, name: project.name } });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao aceitar convite: ' + e.message });
  }
};

// Recusar / cancelar convite
exports.cancelInvite = async (req, res) => {
  try {
    const { data: invite } = await supabase.from('invites').select('project_id, email, created_by').eq('id', req.params.inviteId).single();
    if (!invite) return res.status(404).json({ message: 'Convite não encontrado' });

    // Pode cancelar: criador do projeto OU o próprio convidado
    const isCreator   = invite.created_by === req.user.id;
    const isInvitee   = invite.email.toLowerCase() === req.user.email.toLowerCase();
    if (!isCreator && !isInvitee) return res.status(403).json({ message: 'Sem permissão para cancelar este convite' });

    await supabase.from('invites').delete().eq('id', req.params.inviteId);
    res.json({ message: 'Convite cancelado' });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao cancelar convite: ' + e.message });
  }
};

// Listar convites de um projeto (para o criador)
exports.getProjectInvites = async (req, res) => {
  try {
    const { data: proj } = await supabase.from('projects').select('creator_id').eq('id', req.params.projectId).single();
    if (!proj) return res.status(404).json({ message: 'Projeto não encontrado' });
    if (proj.creator_id !== req.user.id) return res.status(403).json({ message: 'Apenas o criador pode ver convites' });

    const { data: invites, error } = await supabase.from('invites').select('*').eq('project_id', req.params.projectId);
    if (error) throw error;
    res.json(invites);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar convites: ' + e.message });
  }
};