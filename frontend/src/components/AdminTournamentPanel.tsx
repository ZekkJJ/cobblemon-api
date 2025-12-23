'use client';

import { useState, useEffect } from 'react';
import { tournamentsAPI } from '@/src/lib/api-client';
import { 
  Tournament, 
  TournamentParticipant, 
  TournamentMatch,
  getStatusText, 
  getStatusColor 
} from '@/src/lib/types/tournament';
import { playSound } from '@/src/lib/sounds';

interface AdminTournamentPanelProps {
  onClose?: () => void;
}

export default function AdminTournamentPanel({ onClose }: AdminTournamentPanelProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    maxParticipants: 16,
    bracketType: 'single' as 'single' | 'double',
    prizes: '',
    rules: '',
    format: '6v6 Singles',
    registrationSeconds: 30, // Tiempo para inscribirse in-game
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentsAPI.getAll();
      const data = response.data || response;
      setTournaments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar torneos');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      await tournamentsAPI.create(formData);
      playSound('success');
      showMessage('success', '¡Torneo creado exitosamente!');
      setActiveTab('list');
      resetForm();
      fetchTournaments();
    } catch (err: any) {
      showMessage('error', err.message || 'Error al crear torneo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    setActionLoading(true);

    try {
      await tournamentsAPI.update(selectedTournament._id, formData);
      playSound('success');
      showMessage('success', '¡Torneo actualizado!');
      setActiveTab('list');
      setSelectedTournament(null);
      fetchTournaments();
    } catch (err: any) {
      showMessage('error', err.message || 'Error al actualizar torneo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTournament = async (tournament: Tournament) => {
    if (!confirm(`¿Estás seguro de eliminar el torneo "${tournament.name}"?`)) return;
    setActionLoading(true);

    try {
      await tournamentsAPI.delete(tournament._id);
      playSound('success');
      showMessage('success', 'Torneo eliminado');
      fetchTournaments();
    } catch (err: any) {
      showMessage('error', err.message || 'Error al eliminar torneo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTournament = async (tournament: Tournament) => {
    if (!confirm(`¿Iniciar el torneo "${tournament.name}"? Esto generará el bracket.`)) return;
    setActionLoading(true);

    try {
      await tournamentsAPI.start(tournament._id);
      playSound('success');
      showMessage('success', '¡Torneo iniciado!');
      fetchTournaments();
    } catch (err: any) {
      showMessage('error', err.message || 'Error al iniciar torneo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTournament = async (tournament: Tournament) => {
    if (!confirm(`¿Cancelar el torneo "${tournament.name}"? Esta acción no se puede deshacer.`)) return;
    setActionLoading(true);

    try {
      await tournamentsAPI.cancel(tournament._id);
      playSound('click');
      showMessage('success', 'Torneo cancelado');
      fetchTournaments();
    } catch (err: any) {
      showMessage('error', err.message || 'Error al cancelar torneo');
    } finally {
      setActionLoading(false);
    }
  };


  // ============================================
  // PARTICIPANT MANAGEMENT
  // ============================================

  const handleRemoveParticipant = async (tournament: Tournament, participant: TournamentParticipant) => {
    if (!confirm(`¿Remover a "${participant.username}" del torneo?`)) return;
    setActionLoading(true);

    try {
      await tournamentsAPI.removeParticipant(tournament._id, participant.id);
      playSound('click');
      showMessage('success', `${participant.username} removido del torneo`);
      fetchTournaments();
      // Refresh selected tournament
      if (selectedTournament?._id === tournament._id) {
        const updated = await tournamentsAPI.getById(tournament._id);
        setSelectedTournament(updated.data || updated);
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Error al remover participante');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // MATCH MANAGEMENT
  // ============================================

  const handleForceMatchResult = async (match: TournamentMatch, winnerId: string) => {
    const winner = selectedTournament?.participants.find(p => p.id === winnerId);
    if (!confirm(`¿Forzar victoria para "${winner?.username}"?`)) return;
    setActionLoading(true);

    try {
      await tournamentsAPI.forceMatchResult(match.id, winnerId, selectedTournament?._id);
      playSound('success');
      showMessage('success', 'Resultado forzado');
      // Refresh tournament
      if (selectedTournament) {
        const updated = await tournamentsAPI.getById(selectedTournament._id);
        setSelectedTournament(updated.data || updated);
      }
      fetchTournaments();
    } catch (err: any) {
      showMessage('error', err.message || 'Error al forzar resultado');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // FORM HELPERS
  // ============================================

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      maxParticipants: 16,
      bracketType: 'single',
      prizes: '',
      rules: '',
      format: '6v6 Singles',
      registrationSeconds: 30,
    });
  };

  const editTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description,
      startDate: tournament.startDate.split('T')[0],
      maxParticipants: tournament.maxParticipants,
      bracketType: tournament.bracketType,
      prizes: typeof tournament.prizes === 'string' ? tournament.prizes : '',
      rules: tournament.rules || '',
      format: tournament.format || '6v6 Singles',
      registrationSeconds: (tournament as any).registrationSeconds || 30,
    });
    setActiveTab('edit');
  };

  const viewTournamentDetails = async (tournament: Tournament) => {
    try {
      const response = await tournamentsAPI.getById(tournament._id);
      setSelectedTournament(response.data || response);
    } catch (err: any) {
      showMessage('error', 'Error al cargar detalles del torneo');
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-poke-yellow border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <i className="fas fa-trophy text-poke-yellow"></i>
          Administración de Torneos
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <i className="fas fa-times text-xl"></i>
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`px-6 py-3 ${message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => { setActiveTab('list'); setSelectedTournament(null); }}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'list' ? 'bg-slate-800 text-poke-yellow border-b-2 border-poke-yellow' : 'text-slate-400 hover:text-white'}`}
        >
          <i className="fas fa-list mr-2"></i>Lista
        </button>
        <button
          onClick={() => { setActiveTab('create'); resetForm(); setSelectedTournament(null); }}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'create' ? 'bg-slate-800 text-poke-yellow border-b-2 border-poke-yellow' : 'text-slate-400 hover:text-white'}`}
        >
          <i className="fas fa-plus mr-2"></i>Crear
        </button>
        {activeTab === 'edit' && (
          <button className="px-6 py-3 font-medium bg-slate-800 text-poke-yellow border-b-2 border-poke-yellow">
            <i className="fas fa-edit mr-2"></i>Editar
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'list' && !selectedTournament && (
          <TournamentList
            tournaments={tournaments}
            onView={viewTournamentDetails}
            onEdit={editTournament}
            onDelete={handleDeleteTournament}
            onStart={handleStartTournament}
            onCancel={handleCancelTournament}
            actionLoading={actionLoading}
          />
        )}

        {activeTab === 'list' && selectedTournament && (
          <TournamentDetails
            tournament={selectedTournament}
            onBack={() => setSelectedTournament(null)}
            onRemoveParticipant={handleRemoveParticipant}
            onForceResult={handleForceMatchResult}
            actionLoading={actionLoading}
          />
        )}

        {(activeTab === 'create' || activeTab === 'edit') && (
          <TournamentForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={activeTab === 'create' ? handleCreateTournament : handleUpdateTournament}
            isEdit={activeTab === 'edit'}
            loading={actionLoading}
            onCancel={() => { setActiveTab('list'); setSelectedTournament(null); }}
          />
        )}
      </div>
    </div>
  );
}


// ============================================
// SUB-COMPONENTS
// ============================================

function TournamentList({
  tournaments,
  onView,
  onEdit,
  onDelete,
  onStart,
  onCancel,
  actionLoading,
}: {
  tournaments: Tournament[];
  onView: (t: Tournament) => void;
  onEdit: (t: Tournament) => void;
  onDelete: (t: Tournament) => void;
  onStart: (t: Tournament) => void;
  onCancel: (t: Tournament) => void;
  actionLoading: boolean;
}) {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-trophy text-4xl text-slate-600 mb-4"></i>
        <p className="text-slate-400">No hay torneos creados</p>
        <p className="text-sm text-slate-500 mt-2">Crea tu primer torneo usando el botón &quot;Crear&quot;</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tournaments.map((tournament) => (
        <div
          key={tournament._id}
          className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold">{tournament.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tournament.status)} bg-slate-700`}>
                  {getStatusText(tournament.status)}
                </span>
                <span className="font-mono text-xs bg-slate-700 px-2 py-0.5 rounded text-poke-yellow">
                  {tournament.code}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-2 line-clamp-1">{tournament.description}</p>
              <div className="flex gap-4 text-xs text-slate-500">
                <span><i className="fas fa-users mr-1"></i>{tournament.participants.length}/{tournament.maxParticipants}</span>
                <span><i className="fas fa-calendar mr-1"></i>{new Date(tournament.startDate).toLocaleDateString()}</span>
                <span><i className="fas fa-sitemap mr-1"></i>{tournament.bracketType === 'single' ? 'Simple' : 'Doble'}</span>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onView(tournament)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                title="Ver detalles"
              >
                <i className="fas fa-eye"></i>
              </button>
              
              {(tournament.status === 'registration' || tournament.status === 'draft') && (
                <>
                  <button
                    onClick={() => onEdit(tournament)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
                    title="Editar"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => onStart(tournament)}
                    disabled={actionLoading || tournament.participants.length < 2}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
                    title="Iniciar torneo"
                  >
                    <i className="fas fa-play"></i>
                  </button>
                </>
              )}

              {tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
                <button
                  onClick={() => onCancel(tournament)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-600 rounded text-sm transition-colors"
                  title="Cancelar torneo"
                >
                  <i className="fas fa-ban"></i>
                </button>
              )}

              <button
                onClick={() => onDelete(tournament)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 rounded text-sm transition-colors"
                title="Eliminar"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TournamentDetails({
  tournament,
  onBack,
  onRemoveParticipant,
  onForceResult,
  actionLoading,
}: {
  tournament: Tournament;
  onBack: () => void;
  onRemoveParticipant: (t: Tournament, p: TournamentParticipant) => void;
  onForceResult: (m: TournamentMatch, winnerId: string) => void;
  actionLoading: boolean;
}) {
  const [detailTab, setDetailTab] = useState<'participants' | 'matches'>('participants');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <div>
          <h3 className="text-xl font-bold">{tournament.name}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className={`${getStatusColor(tournament.status)}`}>{getStatusText(tournament.status)}</span>
            <span>•</span>
            <span className="font-mono text-poke-yellow">{tournament.code}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setDetailTab('participants')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${detailTab === 'participants' ? 'bg-poke-yellow text-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
        >
          <i className="fas fa-users mr-2"></i>
          Participantes ({tournament.participants.length})
        </button>
        {tournament.bracket && (
          <button
            onClick={() => setDetailTab('matches')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${detailTab === 'matches' ? 'bg-poke-yellow text-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <i className="fas fa-sitemap mr-2"></i>
            Matches
          </button>
        )}
      </div>

      {/* Participants Tab */}
      {detailTab === 'participants' && (
        <div className="space-y-2">
          {tournament.participants.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay participantes inscritos</p>
          ) : (
            tournament.participants.map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 ${participant.status === 'eliminated' ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold">
                    #{participant.seed}
                  </span>
                  <div>
                    <p className="font-medium">{participant.username}</p>
                    <p className="text-xs text-slate-500">
                      {participant.status === 'eliminated' && '❌ Eliminado'}
                      {participant.status === 'winner' && '🏆 Campeón'}
                      {participant.status === 'active' && '✅ Activo'}
                      {participant.status === 'registered' && '📝 Inscrito'}
                    </p>
                  </div>
                </div>
                {tournament.status !== 'completed' && participant.status !== 'eliminated' && (
                  <button
                    onClick={() => onRemoveParticipant(tournament, participant)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 rounded text-sm transition-colors"
                    title="Remover participante"
                  >
                    <i className="fas fa-user-minus"></i>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Matches Tab */}
      {detailTab === 'matches' && tournament.bracket && (
        <div className="space-y-4">
          {tournament.bracket.rounds.map((round) => (
            <div key={round.roundNumber} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h4 className="font-bold mb-3 text-poke-yellow">{round.name}</h4>
              <div className="space-y-2">
                {round.matches.map((match) => {
                  const player1 = tournament.participants.find(p => p.id === match.player1Id);
                  const player2 = tournament.participants.find(p => p.id === match.player2Id);
                  const canForce = match.status === 'ready' || match.status === 'active' || match.status === 'requires_admin';

                  return (
                    <div key={match.id} className="flex items-center gap-4 p-3 bg-slate-700 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={match.winnerId === match.player1Id ? 'text-green-400 font-bold' : ''}>
                            {player1?.username || 'TBD'}
                          </span>
                          <span className="text-slate-500">vs</span>
                          <span className={match.winnerId === match.player2Id ? 'text-green-400 font-bold' : ''}>
                            {player2?.username || 'TBD'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Estado: {match.status}
                          {match.victoryType && ` • ${match.victoryType}`}
                        </p>
                      </div>
                      {canForce && player1 && player2 && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onForceResult(match, player1.id)}
                            disabled={actionLoading}
                            className="px-2 py-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded text-xs transition-colors"
                            title={`${player1.username} gana`}
                          >
                            {player1.username.substring(0, 8)} ✓
                          </button>
                          <button
                            onClick={() => onForceResult(match, player2.id)}
                            disabled={actionLoading}
                            className="px-2 py-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded text-xs transition-colors"
                            title={`${player2.username} gana`}
                          >
                            {player2.username.substring(0, 8)} ✓
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function TournamentForm({
  formData,
  setFormData,
  onSubmit,
  isEdit,
  loading,
  onCancel,
}: {
  formData: {
    name: string;
    description: string;
    startDate: string;
    maxParticipants: number;
    bracketType: 'single' | 'double';
    prizes: string;
    rules: string;
    format: string;
    registrationSeconds: number;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEdit: boolean;
  loading: boolean;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nombre del Torneo *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            minLength={3}
            maxLength={100}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-poke-yellow focus:outline-none"
            placeholder="Torneo de Verano 2024"
          />
        </div>

        {/* Fecha de inicio */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Fecha de Inicio *
          </label>
          <input
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-poke-yellow focus:outline-none"
          />
        </div>

        {/* Max participantes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Máximo de Participantes *
          </label>
          <select
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-poke-yellow focus:outline-none"
          >
            <option value={4}>4 participantes</option>
            <option value={8}>8 participantes</option>
            <option value={16}>16 participantes</option>
            <option value={32}>32 participantes</option>
            <option value={64}>64 participantes</option>
            <option value={128}>128 participantes</option>
          </select>
        </div>

        {/* Tipo de bracket */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Tipo de Bracket *
          </label>
          <select
            value={formData.bracketType}
            onChange={(e) => setFormData({ ...formData, bracketType: e.target.value as 'single' | 'double' })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-poke-yellow focus:outline-none"
          >
            <option value="single">Eliminación Simple</option>
            <option value="double">Eliminación Doble</option>
          </select>
        </div>

        {/* Formato */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Formato de Batalla
          </label>
          <input
            type="text"
            value={formData.format}
            onChange={(e) => setFormData({ ...formData, format: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-poke-yellow focus:outline-none"
            placeholder="6v6 Singles"
          />
        </div>

        {/* Tiempo de Inscripción */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Tiempo de Inscripción (segundos)
          </label>
          <select
            value={formData.registrationSeconds}
            onChange={(e) => setFormData({ ...formData, registrationSeconds: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-poke-yellow focus:outline-none"
          >
            <option value={15}>15 segundos</option>
            <option value={30}>30 segundos</option>
            <option value={45}>45 segundos</option>
            <option value={60}>1 minuto</option>
            <option value={120}>2 minutos</option>
            <option value={300}>5 minutos</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Tiempo que tienen los jugadores para inscribirse in-game</p>
        </div>

        {/* Premios */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Premios *
          </label>
          <input
            type="text"
            value={formData.prizes}
            onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
            required
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-poke-yellow focus:outline-none"
            placeholder="1°: Master Ball, 2°: 5 Ultra Balls"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Descripción *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          minLength={10}
          rows={3}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-poke-yellow focus:outline-none resize-none"
          placeholder="Descripción del torneo..."
        />
      </div>

      {/* Reglas */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Reglas (opcional)
        </label>
        <textarea
          value={formData.rules}
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-poke-yellow focus:outline-none resize-none"
          placeholder="- No se permiten legendarios&#10;- Nivel máximo 50&#10;- Sin items de batalla"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-poke-yellow to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:from-slate-600 disabled:to-slate-700 text-black font-bold rounded-lg transition-all disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {isEdit ? 'Guardando...' : 'Creando...'}
            </>
          ) : (
            <>
              <i className={`fas ${isEdit ? 'fa-save' : 'fa-plus'} mr-2`}></i>
              {isEdit ? 'Guardar Cambios' : 'Crear Torneo'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
