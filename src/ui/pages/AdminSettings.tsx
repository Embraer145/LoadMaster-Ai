/**
 * Admin Settings Page
 * 
 * Comprehensive settings management interface.
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Zap, 
  AlertTriangle, 
  Truck, 
  Monitor,
  RotateCcw,
  Save,
  ChevronRight,
  Shield,
  Fuel,
  Clock,
  X,
} from 'lucide-react';
import { useSettingsStore, useSettings } from '@core/settings';
import type { OptimizationMode } from '@core/optimizer/types';
import { EnhancedUnloadSettingsPanel } from './UnloadSettingsPanel';

type SettingsTab = 'general' | 'optimization' | 'dg' | 'unload' | 'display';

interface AdminSettingsProps {
  onClose: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('optimization');
  const settings = useSettings();
  const { 
    updateGeneralSettings,
    updateOptimizationSettings, 
    updateDGSettings,
    updateUnloadSettings,
    updateDisplaySettings,
    resetSection,
    resetToDefaults,
  } = useSettingsStore();

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'optimization', label: 'AI Optimization', icon: <Zap size={16} /> },
    { id: 'dg', label: 'Dangerous Goods', icon: <AlertTriangle size={16} /> },
    { id: 'unload', label: 'Unload Efficiency', icon: <Truck size={16} /> },
    { id: 'display', label: 'Display', icon: <Monitor size={16} /> },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-[200] overflow-y-auto">
      <div className="min-h-screen p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
                <p className="text-sm text-slate-400">Configure optimization, DG rules, and display options</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={resetToDefaults}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <RotateCcw size={14} /> Reset All
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"
              >
                <Save size={14} /> Save & Close
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-56 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    <ChevronRight size={14} className="ml-auto opacity-50" />
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-6">
              {activeTab === 'general' && (
                <GeneralSettingsPanel 
                  settings={settings.general}
                  onUpdate={updateGeneralSettings}
                  onReset={() => resetSection('general')}
                />
              )}
              {activeTab === 'optimization' && (
                <OptimizationSettingsPanel 
                  settings={settings.optimization}
                  onUpdate={updateOptimizationSettings}
                  onReset={() => resetSection('optimization')}
                />
              )}
              {activeTab === 'dg' && (
                <DGSettingsPanel 
                  settings={settings.dangerousGoods}
                  onUpdate={updateDGSettings}
                  onReset={() => resetSection('dangerousGoods')}
                />
              )}
              {activeTab === 'unload' && (
                <EnhancedUnloadSettingsPanel 
                  settings={settings.unloadEfficiency}
                  onUpdate={updateUnloadSettings}
                  onReset={() => resetSection('unloadEfficiency')}
                />
              )}
              {activeTab === 'display' && (
                <DisplaySettingsPanel 
                  settings={settings.display}
                  onUpdate={updateDisplaySettings}
                  onReset={() => resetSection('display')}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Settings Panels ---

interface PanelProps<T> {
  settings: T;
  onUpdate: (updates: Partial<T>) => void;
  onReset: () => void;
}

const SectionHeader: React.FC<{ title: string; description: string; onReset: () => void }> = ({ 
  title, description, onReset 
}) => (
  <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-800">
    <div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </div>
    <button 
      onClick={onReset}
      className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
    >
      <RotateCcw size={12} /> Reset
    </button>
  </div>
);

const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({
  label, description, children
}) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-800/50 last:border-0">
    <div className="flex-1">
      <div className="text-sm font-medium text-white">{label}</div>
      {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
    </div>
    <div className="flex-shrink-0 ml-4">{children}</div>
  </div>
);

// General Settings Panel
const GeneralSettingsPanel: React.FC<PanelProps<typeof import('@core/settings').DEFAULT_SETTINGS.general>> = ({
  settings, onUpdate, onReset
}) => (
  <div>
    <SectionHeader 
      title="General Settings" 
      description="Basic application configuration"
      onReset={onReset}
    />
    <SettingRow label="Weight Unit" description="Display weight in kilograms or pounds">
      <select 
        value={settings.weightUnit}
        onChange={(e) => onUpdate({ weightUnit: e.target.value as 'kg' | 'lbs' })}
        className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
      >
        <option value="kg">Kilograms (kg)</option>
        <option value="lbs">Pounds (lbs)</option>
      </select>
    </SettingRow>
    <SettingRow label="Date Format">
      <select 
        value={settings.dateFormat}
        onChange={(e) => onUpdate({ dateFormat: e.target.value as typeof settings.dateFormat })}
        className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
      >
        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
      </select>
    </SettingRow>
    <SettingRow label="Auto-Save Interval" description="Seconds between auto-saves (0 = disabled)">
      <input 
        type="number"
        value={settings.autoSaveInterval}
        onChange={(e) => onUpdate({ autoSaveInterval: parseInt(e.target.value) || 0 })}
        className="w-20 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white text-center"
        min={0}
        max={300}
      />
    </SettingRow>
    <SettingRow label="Audit Logging" description="Log all actions for compliance">
      <Toggle checked={settings.auditLogging} onChange={(v) => onUpdate({ auditLogging: v })} />
    </SettingRow>
    <SettingRow label="Require Finalize Confirmation" description="Ask before finalizing loadsheet">
      <Toggle checked={settings.requireFinalizeConfirmation} onChange={(v) => onUpdate({ requireFinalizeConfirmation: v })} />
    </SettingRow>
  </div>
);

// Optimization Settings Panel
const OptimizationSettingsPanel: React.FC<PanelProps<typeof import('@core/settings').DEFAULT_SETTINGS.optimization>> = ({
  settings, onUpdate, onReset
}) => (
  <div>
    <SectionHeader 
      title="AI Optimization Settings" 
      description="Configure how the AI auto-load algorithm works"
      onReset={onReset}
    />
    
    {/* Mode Cards */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      <ModeCard 
        mode="safety"
        title="Safety First"
        description="Maximum CG margin from limits"
        icon={<Shield className="w-5 h-5" />}
        selected={settings.defaultMode === 'safety'}
        onSelect={() => onUpdate({ defaultMode: 'safety' })}
      />
      <ModeCard 
        mode="fuel_efficiency"
        title="Fuel Efficient"
        description="Aft CG for reduced drag"
        icon={<Fuel className="w-5 h-5" />}
        selected={settings.defaultMode === 'fuel_efficiency'}
        onSelect={() => onUpdate({ defaultMode: 'fuel_efficiency' })}
      />
      <ModeCard 
        mode="unload_efficiency"
        title="Fast Turnaround"
        description="Optimized for unloading"
        icon={<Clock className="w-5 h-5" />}
        selected={settings.defaultMode === 'unload_efficiency'}
        onSelect={() => onUpdate({ defaultMode: 'unload_efficiency' })}
      />
    </div>

    <SettingRow label="Minimum CG Margin" description="Minimum distance from CG limits (% MAC)">
      <div className="flex items-center gap-2">
        <input 
          type="range"
          value={settings.minCGMargin}
          onChange={(e) => onUpdate({ minCGMargin: parseFloat(e.target.value) })}
          className="w-24"
          min={0.5}
          max={5}
          step={0.5}
        />
        <span className="text-sm text-white font-mono w-12">{settings.minCGMargin}%</span>
      </div>
    </SettingRow>
    <SettingRow label="Fuel Efficient CG Target" description="Target CG for fuel efficiency mode (% MAC)">
      <div className="flex items-center gap-2">
        <input 
          type="range"
          value={settings.fuelEfficientCGTarget}
          onChange={(e) => onUpdate({ fuelEfficientCGTarget: parseFloat(e.target.value) })}
          className="w-24"
          min={20}
          max={32}
          step={1}
        />
        <span className="text-sm text-white font-mono w-12">{settings.fuelEfficientCGTarget}%</span>
      </div>
    </SettingRow>
    <SettingRow label="Check Lateral Balance" description="Verify left/right weight distribution">
      <Toggle checked={settings.checkLateralBalance} onChange={(v) => onUpdate({ checkLateralBalance: v })} />
    </SettingRow>
    <SettingRow label="Max Lateral Imbalance" description="Maximum left/right weight difference (kg)">
      <input 
        type="number"
        value={settings.maxLateralImbalance}
        onChange={(e) => onUpdate({ maxLateralImbalance: parseInt(e.target.value) || 0 })}
        className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white text-center"
        min={1000}
        max={20000}
        step={500}
      />
    </SettingRow>
  </div>
);

// DG Settings Panel
const DGSettingsPanel: React.FC<PanelProps<typeof import('@core/settings').DEFAULT_SETTINGS.dangerousGoods>> = ({
  settings, onUpdate, onReset
}) => (
  <div>
    <SectionHeader 
      title="Dangerous Goods Handling" 
      description="Configure DG separation and position rules (IATA DGR compliant)"
      onReset={onReset}
    />
    
    <SettingRow label="Enable DG Handling" description="Apply dangerous goods rules during loading">
      <Toggle checked={settings.enabled} onChange={(v) => onUpdate({ enabled: v })} />
    </SettingRow>
    <SettingRow label="Require NOTOC" description="Generate NOTOC for any DG cargo">
      <Toggle checked={settings.requireNotoc} onChange={(v) => onUpdate({ requireNotoc: v })} />
    </SettingRow>

    {/* DG Classes Summary */}
    <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
      <h3 className="text-sm font-bold text-white mb-3">Configured DG Classes ({settings.classRules.length})</h3>
      <div className="flex flex-wrap gap-2">
        {settings.classRules.slice(0, 12).map(rule => (
          <span 
            key={rule.classCode}
            className="px-2 py-1 bg-slate-700 rounded text-xs text-white font-mono"
            title={rule.name}
          >
            {rule.classCode}
          </span>
        ))}
        {settings.classRules.length > 12 && (
          <span className="px-2 py-1 text-xs text-slate-400">
            +{settings.classRules.length - 12} more
          </span>
        )}
      </div>
    </div>

    {/* Separation Rules Summary */}
    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
      <h3 className="text-sm font-bold text-white mb-3">Separation Rules ({settings.separationRules.length})</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded"></span>
          <span className="text-slate-400">Prohibited: {settings.separationRules.filter(r => r.separation === 'prohibited').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-amber-500 rounded"></span>
          <span className="text-slate-400">Segregated: {settings.separationRules.filter(r => r.separation === 'segregated').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-500 rounded"></span>
          <span className="text-slate-400">Separated: {settings.separationRules.filter(r => r.separation === 'separated').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded"></span>
          <span className="text-slate-400">Allowed: {settings.separationRules.filter(r => r.separation === 'allowed').length}</span>
        </div>
      </div>
    </div>

    <p className="mt-4 text-xs text-slate-500 italic">
      Note: Full DG rule editing coming soon. Current rules based on IATA DGR 65th Edition.
    </p>
  </div>
);

// Note: UnloadSettingsPanel moved to separate file (UnloadSettingsPanel.tsx)

// Display Settings Panel
const DisplaySettingsPanel: React.FC<PanelProps<typeof import('@core/settings').DEFAULT_SETTINGS.display>> = ({
  settings, onUpdate, onReset
}) => (
  <div>
    <SectionHeader 
      title="Display Settings" 
      description="Customize the visual appearance"
      onReset={onReset}
    />
    
    <SettingRow label="Theme">
      <select 
        value={settings.theme}
        onChange={(e) => onUpdate({ theme: e.target.value as typeof settings.theme })}
        className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="auto">Auto (System)</option>
      </select>
    </SettingRow>
    <SettingRow label="Show Position IDs" description="Display position labels on deck view">
      <Toggle checked={settings.showPositionIds} onChange={(v) => onUpdate({ showPositionIds: v })} />
    </SettingRow>
    <SettingRow label="Show Weight on Positions" description="Display cargo weight on loaded positions">
      <Toggle checked={settings.showWeightOnPositions} onChange={(v) => onUpdate({ showWeightOnPositions: v })} />
    </SettingRow>
    <SettingRow label="Highlight Overweight" description="Visually highlight overweight positions">
      <Toggle checked={settings.highlightOverweight} onChange={(v) => onUpdate({ highlightOverweight: v })} />
    </SettingRow>
    <SettingRow label="Show CG Travel" description="Show CG movement on envelope chart">
      <Toggle checked={settings.showCGTravel} onChange={(v) => onUpdate({ showCGTravel: v })} />
    </SettingRow>
    <SettingRow label="AI Animation Speed" description="Speed of AI loading animation (ms per item)">
      <div className="flex items-center gap-2">
        <input 
          type="range"
          value={settings.aiAnimationSpeed}
          onChange={(e) => onUpdate({ aiAnimationSpeed: parseInt(e.target.value) })}
          className="w-24"
          min={50}
          max={500}
          step={25}
        />
        <span className="text-sm text-white font-mono w-16">{settings.aiAnimationSpeed}ms</span>
      </div>
    </SettingRow>
  </div>
);

// --- Helper Components ---

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

const ModeCard: React.FC<{
  mode: OptimizationMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}> = ({ title, description, icon, selected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`p-4 rounded-xl border-2 text-left transition-all ${
      selected 
        ? 'border-blue-500 bg-blue-500/10' 
        : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
    }`}
  >
    <div className={`mb-2 ${selected ? 'text-blue-400' : 'text-slate-400'}`}>{icon}</div>
    <div className={`text-sm font-bold ${selected ? 'text-white' : 'text-slate-300'}`}>{title}</div>
    <div className="text-xs text-slate-500 mt-1">{description}</div>
  </button>
);

