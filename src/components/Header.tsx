import { useAuth } from '../contexts/AuthContext';
import { LogOut, FileText, Shield, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { profile, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-lg shadow-lg shadow-blue-500/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Procedure Hub</h1>
              <p className="text-xs text-slate-400">Organize, acknowledge, deliver</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800/80 rounded-lg border border-slate-700/50 transition-all duration-200 group"
              >
                {profile?.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                ) : (
                  <User className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                )}
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-100">{profile?.full_name}</div>
                  <div className="text-xs text-slate-400 capitalize">{profile?.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-transform duration-200" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl shadow-black/30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="text-xs text-slate-400">Account</p>
                    <p className="text-sm font-medium text-slate-100">{profile?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-100 hover:bg-slate-700/50 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
