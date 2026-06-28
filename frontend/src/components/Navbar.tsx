import { NavLink } from 'react-router-dom';
import { BrainCircuit, History, LineChart, Settings } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

export default function Navbar() {
  const { profiles, activeProfileId, setActiveProfileId, loading } = useProfile();

  return (
    <div className="navbar bg-base-200 border-b border-base-300 px-6">
      <div className="navbar-start">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Retraq</span>
        </div>
      </div>

      <div className="navbar-center">
        <div className="flex items-center gap-1 bg-base-300 p-1.5 rounded-xl">
          <NavLink
            to="/replay"
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
              }`
            }
          >
            <History className="h-4 w-4" />
            复盘
          </NavLink>
          <NavLink
            to="/analysis"
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
              }`
            }
          >
            <LineChart className="h-4 w-4" />
            分析
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
              }`
            }
          >
            <Settings className="h-4 w-4" />
            设置
          </NavLink>
        </div>
      </div>

      <div className="navbar-end">
        <select
          className="select select-bordered select-sm max-w-[12rem]"
          disabled={loading || profiles.length === 0}
          value={activeProfileId ?? ''}
          onChange={(e) => setActiveProfileId(Number(e.target.value))}
          aria-label="当前档案"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}