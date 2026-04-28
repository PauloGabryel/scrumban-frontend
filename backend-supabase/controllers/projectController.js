const { supabase } = require('../config/database');

// Criar projeto
exports.createProject = async (req, res) => {
  try {
    const { name, description, data } = req.body;
    if (!name) return res.status(400).json({ message: 'Nome do projeto é obrigatório' });

    const { data: project, error } = await supabase
      .from('projects')
      .insert({ name, description: description || '', creator_id: req.user.id, data: data || {} })
      .select()
      .single();

    if (error) throw error;

    // Criador vira membro admin
    await supabase.from('project_members').insert({ project_id: project.id, user_id: req.user.id, role: 'admin' });

    res.status(201).json({ message: 'Projeto criado com sucesso', project });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao criar projeto: ' + e.message });
  }
};

// Listar projetos do usuário
exports.getMyProjects = async (req, res) => {
  try {
    const { data: memberships, error } = await supabase
      .from('project_members')
      .select(`
        role,
        projects (
          id, name, description, creator_id, data, created_at, updated_at,
          users!projects_creator_id_fkey (id, name, email)
        )
      `)
      .eq('user_id', req.user.id);

    if (error) throw error;

    const projects = memberships.map(m => ({
      ...m.projects,
      myRole: m.role,
      creator: m.projects.users,
    }));

    res.json(projects);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar projetos' });
  }
};

// Buscar um projeto
exports.getProject = async (req, res) => {
  try {
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) return res.status(403).json({ message: 'Você não tem acesso a este projeto' });

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id, name, description, creator_id, data, created_at, updated_at,
        creator:users!projects_creator_id_fkey (id, name, email),
        project_members ( role, joined_at, users (id, name, email) )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !project) return res.status(404).json({ message: 'Projeto não encontrado' });

    // Convites pendentes do projeto
    const { data: pendingInvites } = await supabase
      .from('invites')
      .select('id, email, created_at, expires_at')
      .eq('project_id', req.params.id)
      .eq('accepted', false);

    res.json({ ...project, myRole: membership.role, pendingInvites: pendingInvites || [] });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar projeto' });
  }
};

// Atualizar projeto (nome, descrição e campo data)
exports.updateProject = async (req, res) => {
  try {
    const { name, description, data } = req.body;

    const { data: proj } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', req.params.id)
      .single();

    if (!proj) return res.status(404).json({ message: 'Projeto não encontrado' });
    if (proj.creator_id !== req.user.id) return res.status(403).json({ message: 'Apenas o criador pode editar o projeto' });

    const updates = { updated_at: new Date().toISOString() };
    if (name        !== undefined) updates.name        = name;
    if (description !== undefined) updates.description = description;
    if (data        !== undefined) updates.data        = data;

    const { data: updated, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Projeto atualizado com sucesso', project: updated });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao atualizar projeto: ' + e.message });
  }
};

// Deletar projeto
exports.deleteProject = async (req, res) => {
  try {
    const { data: proj } = await supabase.from('projects').select('creator_id').eq('id', req.params.id).single();
    if (!proj) return res.status(404).json({ message: 'Projeto não encontrado' });
    if (proj.creator_id !== req.user.id) return res.status(403).json({ message: 'Apenas o criador pode deletar o projeto' });

    await supabase.from('projects').delete().eq('id', req.params.id);
    res.json({ message: 'Projeto deletado com sucesso' });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao deletar projeto: ' + e.message });
  }
};

// Remover membro do projeto
exports.removeMember = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    const { data: proj } = await supabase.from('projects').select('creator_id').eq('id', projectId).single();
    if (!proj) return res.status(404).json({ message: 'Projeto não encontrado' });
    if (proj.creator_id !== req.user.id) return res.status(403).json({ message: 'Apenas o criador pode remover membros' });
    if (userId === proj.creator_id) return res.status(400).json({ message: 'Não é possível remover o criador do projeto' });

    const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId);
    if (error) throw error;

    res.json({ message: 'Membro removido com sucesso' });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao remover membro: ' + e.message });
  }
};