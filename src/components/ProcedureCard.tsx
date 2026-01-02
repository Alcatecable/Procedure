import { useState, useEffect } from 'react';
import { Calendar, MessageSquare, ExternalLink, Edit2, CheckCircle, Users } from 'lucide-react';
import { supabase, Procedure, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ProcedureCardProps = {
  procedure: Procedure;
  onEdit: (procedure: Procedure) => void;
  onRefresh: () => void;
};

export function ProcedureCard({ procedure, onEdit, onRefresh }: ProcedureCardProps) {
  const { user, profile } = useAuth();
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [stats, setStats] = useState({ total: 0, acknowledged: 0 });
  const [creator, setCreator] = useState<Profile | null>(null);

  useEffect(() => {
    loadData();
  }, [procedure.id, user?.id]);

  const loadData = async () => {
    if (!user) return;

    const { data: ackData } = await supabase
      .from('acknowledgments')
      .select('*')
      .eq('procedure_id', procedure.id)
      .eq('user_id', user.id)
      .maybeSingle();

    setHasAcknowledged(!!ackData);

    const { data: allAcks } = await supabase
      .from('acknowledgments')
      .select('*')
      .eq('procedure_id', procedure.id);

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    setStats({
      total: count || 0,
      acknowledged: allAcks?.length || 0,
    });

    if (procedure.created_by) {
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', procedure.created_by)
        .maybeSingle();

      setCreator(creatorData);
    }
  };

  const handleAcknowledge = async () => {
    if (!user || hasAcknowledged) return;

    setAcknowledging(true);
    try {
      const { error } = await supabase
        .from('acknowledgments')
        .insert({
          procedure_id: procedure.id,
          user_id: user.id,
        });

      if (!error) {
        setHasAcknowledged(true);
        await loadData();
        onRefresh();
      }
    } finally {
      setAcknowledging(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'archived':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'replaced':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const percentage = stats.total > 0 ? Math.round((stats.acknowledged / stats.total) * 100) : 0;

  return (
    <div className="card-elevated rounded-xl hover:border-blue-500/30 transition-all group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors">{procedure.title}</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                procedure.status === 'active' ? 'badge-active' :
                procedure.status === 'archived' ? 'badge-archived' :
                'badge-replaced'
              }`}>
                {procedure.status}
              </span>
            </div>
            {procedure.description && (
              <p className="text-slate-400 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                {procedure.description}
              </p>
            )}
          </div>
          {profile?.role === 'admin' && (
            <button
              onClick={() => onEdit(procedure)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors ml-4 text-slate-400 hover:text-slate-300"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-4 text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Effective: {new Date(procedure.effective_date).toLocaleDateString()}</span>
          </div>
          {procedure.source && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>{procedure.source}</span>
            </div>
          )}
          {creator && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>By {creator.full_name}</span>
            </div>
          )}
          {procedure.source_link && (
            <a
              href={procedure.source_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-500 hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Source</span>
            </a>
          )}
        </div>

        <div className="border-t border-slate-700/50 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">
                  Acknowledgments: {stats.acknowledged} / {stats.total}
                </span>
                <span className="text-sm font-semibold text-slate-100">{percentage}%</span>
              </div>
              <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {!hasAcknowledged && procedure.status === 'active' && (
              <button
                onClick={handleAcknowledge}
                disabled={acknowledging}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Acknowledge</span>
              </button>
            )}

            {hasAcknowledged && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Acknowledged</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
