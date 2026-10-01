import React from 'react';
import { 
  LayoutDashboard, Compass, Flame, Droplet, Cpu, 
  FlaskConical, BarChart3, Info, ChevronLeft, ChevronRight,
  ShieldAlert, Radio, Layers
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsCollapsed }) {
  const navItems = [
    { id: 'integrated-twin', label: 'Integrated Twin', icon: Layers, badge: 'Core 3D' },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: 'Live' },
    { id: 'reservoir', label: 'Reservoir Digital Twin', icon: Compass },
    { id: 'steam', label: 'Steam & Thermal System', icon: Flame },
    { id: 'well', label: 'Well & Pump System', icon: Droplet },
    { id: 'forecast', label: 'AI Production Forecast', icon: Cpu, badge: 'V1.3' },
    { id: 'scenarios', label: 'Scenario Lab', icon: FlaskConical },
    { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'model-info', label: 'Model Information', icon: Info },
  ];

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-circle">
          <Radio size={20} className="text-amber" />
        </div>
        {!isCollapsed && (
          <div className="brand-text-block">
            <span className="brand-primary-text">BAGHEWALA TWIN</span>
            <span className="brand-tag-text font-mono">SIH26120 &bull; CSS-SRP</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              data-page-id={item.id}
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="nav-icon-box">
                <Icon size={18} />
              </span>
              {!isCollapsed && (
                <div className="flex-center justify-between w-full">
                  <span className="nav-label-text">{item.label}</span>
                  {item.badge && (
                    <span className={`nav-pill ${item.badge === 'Live' ? 'pill-live' : 'pill-amber'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status / Compact Specs */}
      {!isCollapsed && (
        <div style={{ padding: '12px 14px', margin: '0 12px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex-center justify-between mb-1">
            <span className="text-xxs font-mono text-dim">BASIN</span>
            <span className="badge badge-amber font-mono text-xxs">RAJASTHAN</span>
          </div>
          <div className="flex-center justify-between">
            <span className="text-xxs font-mono text-dim">FORMATION</span>
            <span className="text-xxs font-mono text-slate-300">JODHPUR SST</span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button 
        className="collapse-toggle-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
