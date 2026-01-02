import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase, Procedure } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ProcedureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  procedure?: Procedure;
};

export function ProcedureModal({ isOpen, onClose, onSuccess, procedure }: ProcedureModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: '',
    source_link: '',
    effective_date: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'archived' | 'replaced',
  });

  useEffect(() => {
    if (procedure) {
      setFormData({
        title: procedure.title,
        description: procedure.description,
        source: procedure.source,
        source_link: procedure.source_link,
        effective_date: procedure.effective_date,
        status: procedure.status,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        source: '',
        source_link: '',
        effective_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });
    }
    setError('');
  }, [procedure, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (procedure) {
        const { error } = await supabase
          .from('procedures')
          .update(formData)
          .eq('id', procedure.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('procedures')
          .insert({
            ...formData,
            created_by: user?.id,
          });

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card-elevated rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100">
            {procedure ? 'Edit Procedure' : 'Add New Procedure'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field w-full"
              required
              placeholder="e.g., New EFT Process"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field w-full min-h-32"
              placeholder="Paste the chat message or add details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="input-field w-full"
              >
                <option value="">Select source</option>
                <option value="Teams">Microsoft Teams</option>
                <option value="Slack">Slack</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Effective Date *
              </label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="input-field w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Source Link
            </label>
            <input
              type="url"
              value={formData.source_link}
              onChange={(e) => setFormData({ ...formData, source_link: e.target.value })}
              className="input-field w-full"
              placeholder="https://..."
            />
          </div>

          {procedure && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="input-field w-full"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="replaced">Replaced</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/30">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : procedure ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
