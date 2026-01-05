"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField, SelectField } from '@/components/FormField';
import { SkeletonBlock } from '@/components/feedback/VisualStates';
import { useRole } from '@/lib/use-role';
import { normalizeApiError } from '@/lib/api/errors';
import {
  createUser,
  deactivateUser,
  listUsers,
  resetUserPassword,
  updateUser,
  type CreateUserRequest,
  type UserCollection,
  type UserRecord,
  type UserRole,
} from '@/lib/api/users';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  STAFF: 'Gerente',
  GROOMER: 'Atendente',
  FINANCE: 'Financeiro',
  SUPER_ADMIN: 'Super Admin',
};

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value: value as UserRole, label }));

const STATUS_BADGE = {
  active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  inactive: 'bg-rose-100 text-rose-700 border border-rose-200',
};

type FeedbackState = { type: 'success' | 'error'; message: string; details?: string } | null;

type CreateFormState = {
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  password: string;
  sendInvite: boolean;
};

type EditState = {
  name: string;
  role: UserRole;
  isActive: boolean;
};

const DEFAULT_CREATE_STATE: CreateFormState = {
  name: '',
  email: '',
  role: 'STAFF',
  tenantId: '',
  password: '',
  sendInvite: true,
};

export function UsersManagementView() {
  const { isSuperAdmin } = useRole();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [meta, setMeta] = useState<UserCollection['meta'] | null>(null);
  const [filters, setFilters] = useState({ q: '', role: 'ALL', onlyActive: false, tenantId: '' });
  const [queryConfig, setQueryConfig] = useState({ page: 1, pageSize: 20, q: '', role: 'ALL', onlyActive: false, tenantId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createState, setCreateState] = useState<CreateFormState>(DEFAULT_CREATE_STATE);
  const [createSaving, setCreateSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{ user: UserRecord; password: string } | null>(null);

  const appliedFilters = useMemo(() => {
    const baseTenant = queryConfig.tenantId.trim();
    let tenantFilter: string | undefined;
    if (isSuperAdmin && baseTenant) {
      tenantFilter = baseTenant === '@global' ? 'global' : baseTenant;
    }
    return {
      page: queryConfig.page,
      pageSize: queryConfig.pageSize,
      q: queryConfig.q.trim() ? queryConfig.q.trim() : undefined,
      role: queryConfig.role !== 'ALL' ? (queryConfig.role as UserRole) : undefined,
      onlyActive: queryConfig.onlyActive || undefined,
      tenantId: tenantFilter,
    };
  }, [queryConfig, isSuperAdmin]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listUsers(appliedFilters);
      setUsers(response.data);
      setMeta(response.meta);
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não conseguimos carregar os usuários agora.');
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setCreateSaving(true);
    setFeedback(null);
    try {
      const payload: CreateUserRequest = {
        email: createState.email.trim(),
        name: createState.name.trim(),
        role: createState.role,
        sendInvite: createState.sendInvite,
      };
      if (createState.password.trim()) {
        payload.password = createState.password.trim();
      }
      if (isSuperAdmin && createState.tenantId.trim()) {
        payload.tenantId = createState.tenantId.trim();
      }
      const response = await createUser(payload);
      setUsers((prev) => [response.user, ...prev]);
      setFeedback({
        type: 'success',
        message: 'Usuário criado com sucesso.',
        details: response.temporaryPassword ? `Senha temporária: ${response.temporaryPassword}` : undefined,
      });
      setCreateState({ ...DEFAULT_CREATE_STATE, role: createState.role });
      loadUsers();
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível criar o usuário.');
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setCreateSaving(false);
    }
  };

  const openEditDrawer = (user: UserRecord) => {
    setEditingUser(user);
    setEditState({ name: user.name, role: user.role, isActive: user.isActive });
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editState) return;
    setEditSaving(true);
    setFeedback(null);
    try {
      const updated = await updateUser(editingUser.id, {
        name: editState.name.trim(),
        role: editState.role,
        isActive: editState.isActive,
      });
      setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
      setEditingUser(null);
      setEditState(null);
      setFeedback({ type: 'success', message: 'Usuário atualizado com sucesso.' });
      loadUsers();
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível atualizar o usuário.');
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeactivate = async (user: UserRecord) => {
    const parsed = window.confirm(`Deseja realmente desativar ${user.name}?`);
    if (!parsed) return;
    try {
      await deactivateUser(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: false } : u)));
      setFeedback({ type: 'success', message: 'Usuário desativado.' });
    } catch (err) {
      const normalized = normalizeApiError(err, 'Não foi possível desativar o usuário.');
      setFeedback({ type: 'error', message: normalized.message });
    }
  };

  const handleResetPassword = async (user: UserRecord) => {
    try {
      const response = await resetUserPassword(user.id);
      setPasswordModal({ user: response.user, password: response.temporaryPassword });
      setUsers((prev) => prev.map((u) => (u.id === response.user.id ? response.user : u)));
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível gerar nova senha.');
      setFeedback({ type: 'error', message: parsed.message });
    }
  };

  const canShowTenantField = isSuperAdmin;

  const paginationLabel = meta ? `Página ${meta.page} de ${meta.totalPages}` : '—';

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-500">Administração</p>
        <h1 className="text-3xl font-bold text-slate-900">Usuários & Perfis</h1>
        <p className="text-slate-600 max-w-2xl">Convide pessoas do time, ajuste permissões e centralize acessos do painel.</p>
      </header>

      {feedback && (
        <div className={`rounded-xl border p-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          <p>{feedback.message}</p>
          {feedback.details && <p className="mt-1 font-semibold">{feedback.details}</p>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Novo usuário</h2>
              <p className="text-sm text-slate-500">Convide alguém do time ou gere uma senha temporária.</p>
            </div>
            <FormField
              label="Nome completo"
              id="user-name"
              name="name"
              required
              value={createState.name}
              onChange={(event) => setCreateState((prev) => ({ ...prev, name: event.target.value }))}
            />
            <FormField
              label="Email"
              id="user-email"
              name="email"
              type="email"
              required
              value={createState.email}
              onChange={(event) => setCreateState((prev) => ({ ...prev, email: event.target.value }))}
            />
            <SelectField
              label="Perfil"
              id="user-role"
              name="role"
              required
              value={createState.role}
              onChange={(event) => setCreateState((prev) => ({ ...prev, role: event.target.value as UserRole }))}
              options={ROLE_OPTIONS.filter((option) => option.value !== 'SUPER_ADMIN' || isSuperAdmin)}
            />
            {canShowTenantField && (
              <FormField
                label="Tenant ID (opcional)"
                id="tenant-id"
                name="tenantId"
                placeholder="Ex.: 9bd19c3a-... ou @global"
                value={createState.tenantId}
                onChange={(event) => setCreateState((prev) => ({ ...prev, tenantId: event.target.value }))}
              />
            )}
            <FormField
              label="Senha inicial (opcional)"
              id="user-password"
              name="password"
              type="password"
              placeholder="Geraremos uma senha forte se deixar em branco"
              value={createState.password}
              onChange={(event) => setCreateState((prev) => ({ ...prev, password: event.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={createState.sendInvite}
                onChange={(event) => setCreateState((prev) => ({ ...prev, sendInvite: event.target.checked }))}
              />
              Enviar notificação/convite (quando disponível)
            </label>
            <Button type="submit" isLoading={createSaving}>Criar usuário</Button>
          </form>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Filtros & busca</h2>
              <p className="text-sm text-slate-500">Refine a lista por perfil, status ou tenant.</p>
            </div>
            <FormField
              label="Buscar por nome ou email"
              id="filter-q"
              name="q"
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            />
            <SelectField
              label="Perfil"
              id="filter-role"
              name="role"
              value={filters.role}
              onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}
              options={[{ value: 'ALL', label: 'Todos' }, ...ROLE_OPTIONS.filter((option) => option.value !== 'SUPER_ADMIN' || isSuperAdmin)]}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={filters.onlyActive}
                onChange={(event) => setFilters((prev) => ({ ...prev, onlyActive: event.target.checked }))}
              />
              Mostrar apenas usuários ativos
            </label>
            {canShowTenantField && (
              <FormField
                label="Tenant ID para filtrar"
                id="filter-tenant"
                name="tenantId"
                placeholder="Deixe vazio para todos"
                value={filters.tenantId}
                onChange={(event) => setFilters((prev) => ({ ...prev, tenantId: event.target.value }))}
              />
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setQueryConfig((prev) => ({
                    ...prev,
                    page: 1,
                    q: filters.q,
                    role: filters.role,
                    onlyActive: filters.onlyActive,
                    tenantId: filters.tenantId,
                  }))
                }
              >
                Aplicar filtros
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFilters({ q: '', role: 'ALL', onlyActive: false, tenantId: '' });
                  setQueryConfig({ page: 1, pageSize: 20, q: '', role: 'ALL', onlyActive: false, tenantId: '' });
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Equipe cadastrada</h2>
            <p className="text-sm text-slate-500">{meta ? `${meta.total} usuário${meta.total === 1 ? '' : 's'} registrados` : '—'}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{paginationLabel}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={!meta || meta.page <= 1 || loading}
                onClick={() => setQueryConfig((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!meta || (meta.page ?? 1) >= (meta?.totalPages ?? 1) || loading}
                onClick={() => setQueryConfig((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <SkeletonBlock className="h-48 w-full" />
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Nenhum usuário encontrado com os filtros atuais.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Perfil</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Último acesso</th>
                  {canShowTenantField && <th className="px-4 py-3 text-left font-semibold text-slate-600">Tenant</th>}
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? STATUS_BADGE.active : STATUS_BADGE.inactive}`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('pt-BR') : '—'}
                    </td>
                    {canShowTenantField && (
                      <td className="px-4 py-3 text-slate-600">
                        {user.tenant ? (
                          <div>
                            <p className="font-medium text-slate-800">{user.tenant.name}</p>
                            <p className="text-xs text-slate-500">{user.tenant.slug}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Global</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditDrawer(user)}>Editar</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleResetPassword(user)}>Resetar senha</Button>
                        <Button size="sm" variant="ghost" disabled={!user.isActive} onClick={() => handleDeactivate(user)}>Desativar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {editingUser && editState && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4 py-8">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Editar usuário</h3>
                <p className="text-sm text-slate-500">{editingUser.email}</p>
              </div>
              <button className="text-2xl font-bold text-slate-400 hover:text-slate-600" onClick={() => { setEditingUser(null); setEditState(null); }}>×</button>
            </div>
            <div className="space-y-4">
              <FormField
                label="Nome"
                id="edit-name"
                name="name"
                value={editState.name}
                onChange={(event) => setEditState((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
              />
              <SelectField
                label="Perfil"
                id="edit-role"
                name="role"
                value={editState.role}
                onChange={(event) => setEditState((prev) => (prev ? { ...prev, role: event.target.value as UserRole } : prev))}
                options={ROLE_OPTIONS.filter((option) => option.value !== 'SUPER_ADMIN' || isSuperAdmin)}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={editState.isActive}
                  onChange={(event) => setEditState((prev) => (prev ? { ...prev, isActive: event.target.checked } : prev))}
                />
                Usuário ativo
              </label>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" isLoading={editSaving} onClick={handleUpdateUser}>Salvar alterações</Button>
                <Button type="button" variant="ghost" onClick={() => { setEditingUser(null); setEditState(null); }}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Nova senha temporária</h3>
            <p className="mt-2 text-sm text-slate-500">Compartilhe esta senha com {passwordModal.user.name}. Será solicitada no próximo login.</p>
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-2xl font-mono tracking-widest text-slate-900">
              {passwordModal.password}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setPasswordModal(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersManagementView;
