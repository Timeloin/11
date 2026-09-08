import React, { useState } from 'react';
import { ChevronLeft, Zap, Link, X, Check } from 'lucide-react';
import { ITeam } from '@/types';

interface NewTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: ITeam[];
  currentTeam: ITeam | null;
  onSelectTeam: (team: ITeam) => void;
  onCreateTeam: (name: string) => Promise<void>;
  onJoinTeam: (inviteCode: string) => Promise<void>;
}

export const NewTeamModal: React.FC<NewTeamModalProps> = ({
  isOpen,
  onClose,
  teams,
  currentTeam,
  onSelectTeam,
  onCreateTeam,
  onJoinTeam,
}) => {
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onCreateTeam(teamName.trim());
      setView('main');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onJoinTeam(inviteCode.trim());
      setView('main');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header Matching Screenshot 5 */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100">
          <button
            onClick={() => {
              if (view !== 'main') setView('main');
              else onClose();
            }}
            className="p-1 rounded-full text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900 text-lg mr-7">
            {view === 'create' ? 'Create Team' : view === 'join' ? 'Join Team' : 'New Team'}
          </h1>
        </div>

        {/* View 1: Main Matching Screenshot 5 */}
        {view === 'main' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <p className="text-gray-500 text-sm text-center px-4 leading-relaxed">
              Create your own team or join one with an invite link.
            </p>

            {/* Current Active Team Selector */}
            {teams.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                  Your Shops / Teams
                </span>
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-2 space-y-1">
                  {teams.map((t) => {
                    const isSelected = currentTeam?._id === t._id;
                    return (
                      <button
                        key={t._id}
                        onClick={() => {
                          onSelectTeam(t);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                          isSelected ? 'bg-blue-50/80 text-blue-900 font-bold' : 'hover:bg-white text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-sm">{t.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Cards matching Screenshot 5 */}
            <div className="space-y-3 pt-2">
              {/* Card 1: Create Team */}
              <button
                onClick={() => setView('create')}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-xs p-5 text-left flex items-start space-x-4 hover:border-blue-200 active:scale-98 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <Zap className="w-5 h-5 fill-blue-500 group-hover:fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Create Team</h3>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                    Set up a new team to start managing inventory.
                  </p>
                </div>
              </button>

              {/* Card 2: Join Team */}
              <button
                onClick={() => setView('join')}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-xs p-5 text-left flex items-start space-x-4 hover:border-blue-200 active:scale-98 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                  <Link className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Join Team</h3>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                    Enter an invite link or code to join a team.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* View 2: Create Team Form */}
        {view === 'create' && (
          <form onSubmit={handleCreate} className="p-5 space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{error}</div>}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Shop / Team Name
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. simran mobile shop"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4965fa] text-white font-bold text-sm rounded-xl shadow-md hover:bg-blue-600 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Shop'}
            </button>
          </form>
        )}

        {/* View 3: Join Team Form */}
        {view === 'join' && (
          <form onSubmit={handleJoin} className="p-5 space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{error}</div>}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Invite Code
              </label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. SIMRAN88"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono tracking-widest uppercase text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4965fa] text-white font-bold text-sm rounded-xl shadow-md hover:bg-blue-600 transition-colors"
            >
              {loading ? 'Joining...' : 'Join Team'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
