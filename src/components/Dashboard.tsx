import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { supabase, Procedure } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Header } from './Header';
import { ProcedureModal } from './ProcedureModal';
import { ProcedureCard } from './ProcedureCard';

export function Dashboard() {
  const { profile } = useAuth();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'replaced'>('active');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title'>('date-desc');

  useEffect(() => {
    loadProcedures();
  }, []);

  useEffect(() => {
    filterAndSortProcedures();
  }, [procedures, searchQuery, statusFilter, sortBy]);

  const loadProcedures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProcedures(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProcedures = () => {
    let filtered = [...procedures];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.source.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime();
        case 'date-asc':
          return new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredProcedures(filtered);
  };

  const handleEdit = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProcedure(undefined);
  };

  const handleSuccess = () => {
    loadProcedures();
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-100">Procedures</h2>
              <p className="text-slate-400 mt-2">
                {statusFilter === 'all' ? 'All procedures' : `${statusFilter} procedures`}
              </p>
            </div>
            {profile?.role === 'admin' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Procedure</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search procedures by title, description, or source..."
                className="input-field w-full pl-10"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="input-field pl-9 pr-4 py-2.5 appearance-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="all">All Status</option>
                  <option value="archived">Archived</option>
                  <option value="replaced">Replaced</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-field px-4 py-2.5 appearance-none cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400 font-medium">Loading procedures...</div>
          </div>
        ) : filteredProcedures.length === 0 ? (
          <div className="card-elevated rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">No procedures found</h3>
              <p className="text-slate-400">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : profile?.role === 'admin'
                  ? 'Get started by adding your first procedure'
                  : 'No procedures have been added yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProcedures.map((procedure) => (
              <ProcedureCard
                key={procedure.id}
                procedure={procedure}
                onEdit={handleEdit}
                onRefresh={loadProcedures}
              />
            ))}
          </div>
        )}
      </main>

      <ProcedureModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        procedure={editingProcedure}
      />
    </div>
  );
}
