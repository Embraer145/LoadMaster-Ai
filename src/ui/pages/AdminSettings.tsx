/**
 * Admin Settings Page
 * 
 * Comprehensive settings management interface.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Settings, 
  Zap, 
  AlertTriangle, 
  Truck, 
  Monitor,
  ShieldCheck,
  DoorOpen,
  RotateCcw,
  Check,
  ChevronRight,
  Shield,
  Fuel,
  Clock,
  Scale,
  X,
} from 'lucide-react';
import { useSettingsStore, useSettings } from '@core/settings';
import { env } from '@/config/env';
import { evaluateCompliance } from '@core/compliance';
import { useAuthStore } from '@core/auth';
import type { AirframeLabelPreset, AirframeLayout, AirframeStationOverride, DoorKind, DoorSide, AircraftConfig, AircraftLimits, MACData } from '@core/types';
import type { OptimizationMode } from '@core/optimizer/types';
import { WAREHOUSE_SORT_LABEL, WAREHOUSE_SORT_MODES } from '@core/warehouse';
import { useLoadPlanStore } from '@store/loadPlanStore';
import { getDbRevKey, isDatabaseInitialized, query } from '@db/database';
import { getAirframeLayoutByRegistration, upsertAirframeLayout } from '@db/repositories/airframeLayoutRepository';
import { upsertAircraftTypeTemplate } from '@db/repositories/aircraftTypeTemplateRepository';
import { getAircraftConfig, getAvailableAircraftTypes, getEditableTemplateTypes, getTemplateDisplayName } from '@data/aircraft';
import { WGA_FLEET } from '@data/operators';
import { EnhancedUnloadSettingsPanel } from './UnloadSettingsPanel';
import { PasswordPromptModal } from '@ui/components/modals';

type SettingsTab = 'general' | 'standardWeights' | 'optimization' | 'dg' | 'unload' | 'display' | 'compliance' | 'airframeLayouts' | 'typeTemplates';

interface AdminSettingsProps {
  onClose: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('optimization');
  const { currentUser } = useAuthStore();
  
  // Permission levels
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;
  const isMechanic = currentUser?.role === 'mechanic';
  const canEdit = isAdmin; // General settings require admin or super_admin
  const canEditAirframes = isMechanic || isAdmin; // Airframe layouts: mechanic, admin, or super_admin
  
  const settings = useSettings();
  const { 
    updateGeneralSettings,
    updateStandardWeightsSettings,
    updateOptimizationSettings, 
    updateDGSettings,
    updateUnloadSettings,
    updateDisplaySettings,
    updateComplianceSettings,
    resetSection,
    resetToDefaults,
  } = useSettingsStore();

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; requiredRole?: 'admin' | 'mechanic' | 'super_admin' }[] = [
    { id: 'general', label: 'General', icon: <Settings size={16} />, requiredRole: 'admin' },
    { id: 'standardWeights', label: 'Standard Weights', icon: <Scale size={16} />, requiredRole: 'admin' },
    { id: 'optimization', label: 'AI Optimization', icon: <Zap size={16} />, requiredRole: 'admin' },
    { id: 'dg', label: 'Dangerous Goods', icon: <AlertTriangle size={16} />, requiredRole: 'admin' },
    { id: 'unload', label: 'Unload Efficiency', icon: <Truck size={16} />, requiredRole: 'admin' },
    { id: 'display', label: 'Display', icon: <Monitor size={16} />, requiredRole: 'admin' },
    { id: 'compliance', label: 'Compliance', icon: <ShieldCheck size={16} />, requiredRole: 'admin' },
    { id: 'typeTemplates', label: 'Type Templates', icon: <Shield size={16} />, requiredRole: 'super_admin' },
    { id: 'airframeLayouts', label: 'Airframe Layouts', icon: <DoorOpen size={16} />, requiredRole: 'mechanic' },
  ];

  // Filter tabs based on user role
  const hasTabAccess = (tab: typeof tabs[0]) => {
    if (!tab.requiredRole) return true;
    if (isSuperAdmin) return true; // Super admin sees everything
    if (tab.requiredRole === 'admin') return isAdmin;
    if (tab.requiredRole === 'mechanic') return canEditAirframes;
    return false;
  };

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
                disabled={!canEdit}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <RotateCcw size={14} /> Reset All
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"
              >
                <Check size={14} /> Done
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
                {tabs
                  .filter(hasTabAccess)
                  .map(tab => (
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
            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-6 relative">
              {!canEdit && (
                <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200">
                  <div className="text-xs font-bold uppercase tracking-wider">Read-only</div>
                  <div className="text-[11px] mt-1 opacity-90">
                    Current user role <span className="font-mono">{currentUser?.role ?? 'anonymous'}</span> cannot modify admin settings yet.
                    (RBAC enforcement is in place; role management will be expanded later.)
                  </div>
                </div>
              )}

              <div className={canEdit ? '' : 'pointer-events-none opacity-60'}>
                {activeTab === 'general' && (
                  <GeneralSettingsPanel 
                    settings={settings.general}
                    onUpdate={updateGeneralSettings}
                    onReset={() => resetSection('general')}
                  />
                )}
                {activeTab === 'standardWeights' && (
                  <StandardWeightsPanel
                    settings={settings.standardWeights}
                    onUpdate={updateStandardWeightsSettings}
                    onReset={() => resetSection('standardWeights')}
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
                {activeTab === 'compliance' && (
                  <ComplianceSettingsPanel
                    settings={settings.compliance}
                    onUpdate={updateComplianceSettings}
                    onReset={() => resetSection('compliance')}
                    fullSettings={settings}
                  />
                )}
                {activeTab === 'typeTemplates' && isSuperAdmin && (
                  <TypeTemplatesPanel />
                )}
                {activeTab === 'airframeLayouts' && canEditAirframes && (
                  <AirframeLayoutsPanel />
                )}
              </div>
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

// Standard Weights Panel
const StandardWeightsPanel: React.FC<PanelProps<typeof import('@core/settings').DEFAULT_SETTINGS.standardWeights>> = ({
  settings, onUpdate, onReset
}) => (
  <div>
    <SectionHeader
      title="Standard Weights"
      description="Audit-facing standard weights used in calculations (set per operator/FAA policy)."
      onReset={onReset}
    />

    <SettingRow
      label="Crew Total Weight (kg)"
      description="Fixed crew total weight used for W&B. Set this according to your operator standard weight policy."
    >
      <input
        type="number"
        value={settings.crewTotalKg}
        onChange={(e) => onUpdate({ crewTotalKg: parseInt(e.target.value) || 0 })}
        className="w-28 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white text-center"
        min={0}
        step={1}
      />
    </SettingRow>

    <SettingRow
      label="Standard Additional Rider Weight (kg)"
      description="Used for jumpseaters/extra riders (unless overridden later)."
    >
      <input
        type="number"
        value={settings.standardRiderKg}
        onChange={(e) => onUpdate({ standardRiderKg: parseInt(e.target.value) || 0 })}
        className="w-28 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white text-center"
        min={0}
        step={1}
      />
    </SettingRow>

    <SettingRow
      label="Max Additional Riders"
      description="Upper bound for UI controls (0–6 typical for this simulator)."
    >
      <input
        type="number"
        value={settings.maxAdditionalRiders}
        onChange={(e) => onUpdate({ maxAdditionalRiders: Math.max(0, Math.min(6, parseInt(e.target.value) || 0)) })}
        className="w-20 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white text-center"
        min={0}
        max={6}
        step={1}
      />
    </SettingRow>

    <SettingRow
      label="Additional Items Default (kg)"
      description="Convenience default for catering/equipment/misc items."
    >
      <input
        type="number"
        value={settings.additionalItemsDefaultKg}
        onChange={(e) => onUpdate({ additionalItemsDefaultKg: parseInt(e.target.value) || 0 })}
        className="w-28 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white text-center"
        min={0}
        step={1}
      />
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
        onSelect={() => {
          onUpdate({ defaultMode: 'safety' });
          useLoadPlanStore.getState().setOptimizationMode('safety');
        }}
      />
      <ModeCard 
        mode="fuel_efficiency"
        title="Fuel Efficient"
        description="Aft CG for reduced drag"
        icon={<Fuel className="w-5 h-5" />}
        selected={settings.defaultMode === 'fuel_efficiency'}
        onSelect={() => {
          onUpdate({ defaultMode: 'fuel_efficiency' });
          useLoadPlanStore.getState().setOptimizationMode('fuel_efficiency');
        }}
      />
      <ModeCard 
        mode="unload_efficiency"
        title="Fast Turnaround"
        description="Optimized for unloading"
        icon={<Clock className="w-5 h-5" />}
        selected={settings.defaultMode === 'unload_efficiency'}
        onSelect={() => {
          onUpdate({ defaultMode: 'unload_efficiency' });
          useLoadPlanStore.getState().setOptimizationMode('unload_efficiency');
        }}
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
    <SettingRow label="Max Autoload Attempts" description="Bounded repack retries when auto-load can’t place everything (default 10)">
      <input
        type="number"
        value={settings.maxAutoloadAttempts}
        onChange={(e) => onUpdate({ maxAutoloadAttempts: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) })}
        className="w-20 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white text-center"
        min={1}
        max={50}
        step={1}
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
    
    <SettingRow label="Default Warehouse Sort" description="Initial sort mode for the Payload staging bar">
      <select
        value={settings.defaultWarehouseSort}
        onChange={(e) => onUpdate({ defaultWarehouseSort: e.target.value as typeof settings.defaultWarehouseSort })}
        className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white min-w-[220px]"
      >
        {WAREHOUSE_SORT_MODES.map((m) => (
          <option key={m} value={m}>
            {WAREHOUSE_SORT_LABEL[m]}
          </option>
        ))}
      </select>
    </SettingRow>

    <SettingRow
      label="Cargo Color Mode"
      description="Choose whether cargo colors represent handling class (DG/PER/PRI/...) or physical ULD type/contour family."
    >
      <select
        value={settings.cargoColorMode}
        onChange={(e) => onUpdate({ cargoColorMode: e.target.value as typeof settings.cargoColorMode })}
        className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white min-w-[220px]"
      >
        <option value="handling">Handling (current)</option>
        <option value="uld">ULD / Contour family</option>
      </select>
    </SettingRow>

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

// Compliance Settings Panel
const ComplianceSettingsPanel: React.FC<
  PanelProps<typeof import('@core/settings').DEFAULT_SETTINGS.compliance> & { fullSettings: import('@core/settings').AppSettings }
> = ({ settings, onUpdate, onReset, fullSettings }) => {
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const report = useMemo(() => {
    // Feature flags (will flip to true as we implement them)
    const hasEnvelopeInterpolation = true;
    const hasImmutableFinalize = true;
    const hasRoleBasedAccess = true;
    return evaluateCompliance({
      env,
      settings: fullSettings,
      online,
      hasEnvelopeInterpolation,
      hasImmutableFinalize,
      hasRoleBasedAccess,
    });
  }, [fullSettings, online]);

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_report_${report.generatedAtUtc.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const statusTone =
    report.summary.ready ? 'text-emerald-300 bg-emerald-900/20 border-emerald-900/50' : 'text-amber-300 bg-amber-900/20 border-amber-900/50';

  return (
    <div>
      <SectionHeader
        title="Compliance / Self-Audit"
        description="Checklist-driven operational readiness, offline policy, and exportable compliance reports."
        onReset={onReset}
      />

      <div className={`p-3 rounded border ${statusTone}`}>
        <div className="text-xs font-bold uppercase tracking-wider">
          Readiness: {report.summary.ready ? 'READY (no blocking TODO/FAIL)' : 'NOT READY (blocking items present)'}
        </div>
        <div className="mt-1 text-[11px] opacity-80 font-mono">
          pass {report.summary.pass} • warn {report.summary.warn} • fail {report.summary.fail} • todo {report.summary.todo} • blocking {report.summary.blockingFailures}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-bold text-white mb-2">Offline Policy</div>
        <SettingRow
          label="Allow Offline Operation"
          description="If enabled, the app may be used offline (requires cached data and cache-age enforcement)."
        >
          <Toggle
            checked={settings.offlinePolicy.allowed}
            onChange={(v) => onUpdate({ offlinePolicy: { ...settings.offlinePolicy, allowed: v } })}
          />
        </SettingRow>
        <SettingRow
          label="Max Cache Age (hours)"
          description="Maximum permitted age of cached data in offline mode."
        >
          <input
            type="number"
            value={settings.offlinePolicy.maxCacheAgeHours}
            onChange={(e) =>
              onUpdate({
                offlinePolicy: {
                  ...settings.offlinePolicy,
                  maxCacheAgeHours: Math.max(1, Math.min(168, parseInt(e.target.value) || 24)),
                },
              })
            }
            className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white text-center"
            min={1}
            max={168}
            step={1}
          />
        </SettingRow>
        <div className="mt-2 text-[11px] text-slate-500">
          Current device: <span className="font-mono text-slate-300">{online ? 'ONLINE' : 'OFFLINE'}</span> • Env offline enabled:{' '}
          <span className="font-mono text-slate-300">{env.offlineEnabled ? 'true' : 'false'}</span>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-bold text-white mb-2">Report Controls</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadReport}
            className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200 hover:bg-slate-100"
          >
            Download Readiness Report (JSON)
          </button>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          This report is designed to be shareable with internal audit / authorities. PDF export can be added later.
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-bold text-white mb-2">Checklist</div>
        <div className="space-y-2">
          {report.checks.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-lg border border-slate-800 bg-slate-950/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {c.section} • {c.id}
                    {c.blocking && <span className="ml-2 text-[10px] text-amber-300">BLOCKING</span>}
                  </div>
                  <div className="text-[12px] text-white font-bold mt-0.5">{c.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{c.requirement}</div>
                  {c.details && <div className="text-[11px] text-slate-500 mt-1">{c.details}</div>}
                </div>
                <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${
                  c.status === 'pass'
                    ? 'bg-emerald-900/20 text-emerald-300 border-emerald-900/50'
                    : c.status === 'warn'
                      ? 'bg-amber-900/20 text-amber-300 border-amber-900/50'
                      : c.status === 'fail'
                        ? 'bg-red-900/20 text-red-300 border-red-900/50'
                        : 'bg-slate-800/40 text-slate-200 border-slate-700'
                }`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-bold text-white mb-2">Reference System Comparison (Evionica)</div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30">
          <div className="text-[11px] text-slate-400">
            This will ingest Evionica exports and generate tolerance reports (ZFW/TOW/CG/envelope). It’s intentionally marked <span className="font-bold">TODO</span> until you provide exports.
          </div>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input
              type="file"
              disabled
              className="text-[11px] text-slate-500"
            />
            <span className="text-[10px] text-slate-500">
              Upload disabled (waiting for file format + sample exports).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

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

// --- Airframe Layouts (super_admin only) ---

function defaultDoorsForType(type: string): { kind: DoorKind; enabled: boolean; side: DoorSide; anchorKey: string }[] {
  // Initial defaults; per-registration overrides are the point.
  if (type.startsWith('B747')) {
    const isUps = type.toUpperCase().includes('UPS');
    return [
      { kind: 'nose', enabled: true, side: 'L', anchorKey: 'nose' },
      { kind: 'main_side', enabled: true, side: 'L', anchorKey: 'main_side_PL' },
      { kind: 'lower_fwd', enabled: true, side: 'R', anchorKey: 'lower_fwd' },
      { kind: 'lower_aft', enabled: true, side: 'R', anchorKey: 'lower_aft' },
      { kind: 'bulk', enabled: !isUps, side: 'R', anchorKey: 'bulk' },
    ];
  }
  return [
    { kind: 'main_side', enabled: true, side: 'L', anchorKey: 'main_side' },
  ];
}

const DOOR_LABEL: Record<DoorKind, string> = {
  nose: 'Nose cargo door',
  main_side: 'Main deck side cargo door',
  lower_fwd: 'Lower deck FWD cargo door',
  lower_aft: 'Lower deck AFT cargo door',
  bulk: 'Bulk cargo door',
};

const ANCHOR_KEYS: Record<DoorKind, string[]> = {
  nose: ['nose'],
  main_side: ['main_side_PL', 'main_side_GK', 'main_side'],
  lower_fwd: ['lower_fwd'],
  lower_aft: ['lower_aft'],
  bulk: ['bulk'],
};

const MARKER_STYLE_LABEL: Record<NonNullable<NonNullable<AirframeLayout['doors'][number]['anchor']>['markerStyle']>, string> = {
  horizontal_under: 'Horizontal (under slot)',
  horizontal_beside: 'Horizontal (beside slot)',
  vertical: 'Vertical',
};

function defaultPresetForType(type: string): AirframeLabelPreset {
  const t = type.toLowerCase();
  if (t.includes('ups')) return 'ups';
  if (t.includes('numeric')) return 'numeric';
  return 'alphabetic';
}

function buildDefaultLabels(input: {
  preset: AirframeLabelPreset;
  positions: Array<{ id: string }>;
  stations: Array<{ id: string; label: string }>;
}): { positionLabels: Record<string, string>; stationLabels: Record<string, string>; stationOverrides: Record<string, AirframeStationOverride> } {
  if (input.preset === 'blank') {
    return { positionLabels: {}, stationLabels: {}, stationOverrides: {} };
  }
  // For now, presets just seed labels with the aircraft config's ids/labels.
  // Per-tail manual edits are the primary feature, and presets are a convenience starting point.
  const positionLabels: Record<string, string> = {};
  for (const p of input.positions) positionLabels[p.id] = p.id;
  const stationLabels: Record<string, string> = {};
  for (const s of input.stations) stationLabels[s.id] = s.label;
  const stationOverrides: Record<string, AirframeStationOverride> = {};
  return { positionLabels, stationLabels, stationOverrides };
}

const TypeTemplatesPanel: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('B747-400F-ALPHABETIC');
  const [templates, setTemplates] = useState<Record<string, AircraftConfig>>({});
  const [editedTemplate, setEditedTemplate] = useState<AircraftConfig | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ state: 'idle' | 'saving' | 'saved' | 'error'; message?: string }>({ state: 'idle' });
  const [passwordPrompt, setPasswordPrompt] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Load templates from database (with code file fallback)
  useEffect(() => {
    const editableTypes = getEditableTemplateTypes();
    const loaded: Record<string, AircraftConfig> = {};
    
    // getAircraftConfig now checks database first, then code
    for (const type of editableTypes) {
      const config = getAircraftConfig(type);
      if (config) loaded[type] = config;
    }
    
    setTemplates(loaded);
    if (!selectedTemplate && editableTypes.length > 0) {
      setSelectedTemplate(editableTypes[0]!);
    }
  }, []);

  // Load selected template into editor
  useEffect(() => {
    if (selectedTemplate && templates[selectedTemplate]) {
      setEditedTemplate(JSON.parse(JSON.stringify(templates[selectedTemplate])));
    }
  }, [selectedTemplate, templates]);

  const updatePosition = (posId: string, field: 'arm' | 'maxWeight', value: number) => {
    if (!editedTemplate) return;
    setEditedTemplate({
      ...editedTemplate,
      positions: editedTemplate.positions.map(p =>
        p.id === posId ? { ...p, [field]: value } : p
      ),
    });
  };

  const updateLimit = (field: keyof AircraftLimits, value: number) => {
    if (!editedTemplate) return;
    setEditedTemplate({
      ...editedTemplate,
      limits: { ...editedTemplate.limits, [field]: value },
    });
  };

  const updateCgLimit = (field: 'forward' | 'aft', value: number) => {
    if (!editedTemplate) return;
    setEditedTemplate({
      ...editedTemplate,
      cgLimits: { ...editedTemplate.cgLimits, [field]: value },
    });
  };

  const updateMac = (field: keyof MACData, value: number) => {
    if (!editedTemplate) return;
    setEditedTemplate({
      ...editedTemplate,
      mac: { ...editedTemplate.mac, [field]: value },
    });
  };

  const updateFuelArm = (value: number) => {
    if (!editedTemplate) return;
    setEditedTemplate({ ...editedTemplate, fuelArm: value });
  };

  const updateStation = (stationId: string, field: 'arm' | 'label', value: string | number) => {
    if (!editedTemplate) return;
    setEditedTemplate({
      ...editedTemplate,
      stations: (editedTemplate.stations ?? []).map(s =>
        s.id === stationId ? { ...s, [field]: value } : s
      ),
    });
  };

  const saveTemplate = () => {
    if (!editedTemplate) return;
    setPasswordPrompt({
      show: true,
      title: 'Save Aircraft Type Template',
      message: `⚠️ WARNING: Saving this template will affect ALL NEW registrations created with type "${selectedTemplate}". Existing registrations are NOT affected. Only proceed if you are updating the master template for this aircraft type.`,
      onConfirm: () => {
        try {
          setSaveStatus({ state: 'saving' });
          
          if (!isDatabaseInitialized()) {
            setSaveStatus({ state: 'error', message: 'Database not ready' });
            setPasswordPrompt(null);
            return;
          }

          // Ensure the table exists (in case of old database)
          try {
            query('SELECT COUNT(*) FROM aircraft_type_templates');
          } catch {
            // Table doesn't exist - run schema migration
            console.warn('aircraft_type_templates table missing - creating it');
            const { SCHEMA_SQL } = require('@db/schema');
            const { getDatabase } = require('@db/database');
            getDatabase().run(SCHEMA_SQL);
          }

          // Save to database
          const saved = upsertAircraftTypeTemplate({
            typeCode: selectedTemplate,
            displayName: getTemplateDisplayName(selectedTemplate),
            config: editedTemplate,
            isSystemDefault: false, // User-modified templates are not system defaults
            userId: currentUser?.username ?? 'ADMIN',
          });

          // Update in-memory templates
          setTemplates(prev => ({ ...prev, [selectedTemplate]: saved.config }));
          
          setSaveStatus({ state: 'saved' });
          setTimeout(() => setSaveStatus({ state: 'idle' }), 3000);
          setPasswordPrompt(null);

          // Notify that templates have changed (triggers any listeners to reload)
          window.dispatchEvent(new CustomEvent('lm:templateUpdated', { detail: { typeCode: selectedTemplate } }));
        } catch (err) {
          console.error('Template save failed:', err);
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setSaveStatus({ state: 'error', message: `Save failed: ${errorMsg}` });
          setPasswordPrompt(null);
        }
      },
    });
  };

  const revertChanges = () => {
    if (selectedTemplate && templates[selectedTemplate]) {
      setEditedTemplate(JSON.parse(JSON.stringify(templates[selectedTemplate])));
    }
  };

  if (!editedTemplate) {
    return <div className="text-slate-400">Loading...</div>;
  }

  return (
    <div>
      <SectionHeader
        title="Aircraft Type Templates (Master Definitions)"
        description="Edit base aircraft type templates. Changes affect NEW registrations only. Existing registrations keep their custom values."
        onReset={() => {}}
      />

      {/* Warning Banner */}
      <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-200 font-bold">Super Admin Only - Master Template Editor</p>
          <p className="text-xs text-amber-300/70 mt-1">
            These are the BASE templates used when creating new registrations. Modifying these templates does NOT affect existing aircraft configurations. 
            To change an existing aircraft, use the "Airframe Layouts" tab.
          </p>
        </div>
      </div>

      {/* Template Selector */}
      <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
              Select Template to Edit
            </div>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
            >
              {Object.keys(templates).map((type) => (
                <option key={type} value={type}>
                  {getTemplateDisplayName(type)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={revertChanges}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold"
            >
              Revert
            </button>
            <button
              onClick={saveTemplate}
              disabled={saveStatus.state === 'saving'}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {saveStatus.state === 'saving' ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
        {saveStatus.state === 'saved' && (
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-2">
            <Check size={14} /> Template saved successfully
          </div>
        )}
        {saveStatus.state === 'error' && (
          <div className="mt-2 text-xs text-red-400 flex items-center gap-2">
            <X size={14} /> {saveStatus.message || 'Save failed'}
          </div>
        )}
      </div>

      {/* Aircraft Limits */}
      <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 mb-4">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
          Aircraft Limits (Base Template)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['OEW', 'MZFW', 'MTOW', 'MLW'] as const).map((key) => (
            <div key={key} className="flex flex-col">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                {key} (kg)
              </label>
              <input
                type="number"
                value={editedTemplate.limits[key]}
                onChange={(e) => updateLimit(key, Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* CG & MAC */}
      <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 mb-4">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
          CG & MAC (Base Template)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              CG FWD (%MAC)
            </label>
            <input
              type="number"
              step="0.1"
              value={editedTemplate.cgLimits.forward}
              onChange={(e) => updateCgLimit('forward', Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              CG AFT (%MAC)
            </label>
            <input
              type="number"
              step="0.1"
              value={editedTemplate.cgLimits.aft}
              onChange={(e) => updateCgLimit('aft', Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              MAC refChord (in)
            </label>
            <input
              type="number"
              step="0.1"
              value={editedTemplate.mac.refChord}
              onChange={(e) => updateMac('refChord', Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              MAC LEMAC (in)
            </label>
            <input
              type="number"
              step="0.1"
              value={editedTemplate.mac.leMAC}
              onChange={(e) => updateMac('leMAC', Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              Fuel Arm (in)
            </label>
            <input
              type="number"
              step="0.1"
              value={editedTemplate.fuelArm}
              onChange={(e) => updateFuelArm(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Upper Deck Stations (Non-Cargo) */}
      <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 mb-4">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
          👨‍✈️ Upper Deck Stations (Non-Cargo W&B)
        </div>
        <div className="text-xs text-slate-400 mb-3">
          Crew, jumpseats, riders, and items/equipment. Showing {editedTemplate.stations?.length ?? 0} stations.
        </div>
        {(editedTemplate.stations?.length ?? 0) > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Station ID</th>
                  <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Label</th>
                  <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Category</th>
                  <th className="text-right py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Arm (in)</th>
                  <th className="text-right py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Max Count</th>
                </tr>
              </thead>
              <tbody>
                {(editedTemplate.stations ?? []).map((station) => (
                  <tr key={station.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-mono text-white text-xs">{station.id}</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={station.label}
                        onChange={(e) => updateStation(station.id, 'label', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        station.category === 'crew' ? 'bg-blue-600/20 text-blue-300' :
                        station.category === 'rider' ? 'bg-violet-600/20 text-violet-300' :
                        'bg-amber-600/20 text-amber-300'
                      }`}>
                        {station.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        value={station.arm}
                        onChange={(e) => updateStation(station.id, 'arm', Number(e.target.value))}
                        className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white text-right"
                      />
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 text-xs">
                      {station.maxCount ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">No stations defined for this template</div>
        )}
      </div>

      {/* Main Deck Positions */}
      <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 mb-4">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
          📦 Main Deck Positions
        </div>
        <div className="text-xs text-slate-400 mb-3">
          Upper cargo deck. Showing {editedTemplate.positions.filter(p => p.deck === 'MAIN').length} positions.
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Position ID</th>
                <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Type</th>
                <th className="text-right py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Arm (in)</th>
                <th className="text-right py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Max Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {editedTemplate.positions.filter(p => p.deck === 'MAIN').map((pos) => (
                <tr key={pos.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-mono text-white">{pos.id}</td>
                  <td className="py-2 px-3 text-slate-400 text-xs">{pos.type}</td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={pos.arm}
                      onChange={(e) => updatePosition(pos.id, 'arm', Number(e.target.value))}
                      className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white text-right"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={pos.maxWeight}
                      onChange={(e) => updatePosition(pos.id, 'maxWeight', Number(e.target.value))}
                      className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower Deck Positions */}
      <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 mb-4">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
          📦 Lower Deck Positions (Belly Holds)
        </div>
        <div className="text-xs text-slate-400 mb-3">
          Belly cargo holds. Showing {editedTemplate.positions.filter(p => p.deck === 'LOWER').length} positions.
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Position ID</th>
                <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Type</th>
                <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Group</th>
                <th className="text-right py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Arm (in)</th>
                <th className="text-right py-2 px-3 text-[10px] text-slate-500 font-bold uppercase">Max Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {editedTemplate.positions.filter(p => p.deck === 'LOWER').map((pos) => (
                <tr key={pos.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-mono text-white">{pos.id}</td>
                  <td className="py-2 px-3 text-slate-400 text-xs">{pos.type}</td>
                  <td className="py-2 px-3 text-slate-400 text-xs">
                    {pos.group && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pos.group === 'FWD' ? 'bg-cyan-600/20 text-cyan-300' :
                        pos.group === 'AFT' ? 'bg-orange-600/20 text-orange-300' :
                        'bg-red-600/20 text-red-300'
                      }`}>
                        {pos.group}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={pos.arm}
                      onChange={(e) => updatePosition(pos.id, 'arm', Number(e.target.value))}
                      className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white text-right"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={pos.maxWeight}
                      onChange={(e) => updatePosition(pos.id, 'maxWeight', Number(e.target.value))}
                      className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Prompt */}
      {passwordPrompt && (
        <PasswordPromptModal
          title={passwordPrompt.title}
          message={passwordPrompt.message}
          contactInfo="LoadMasterProAI.com"
          onConfirm={passwordPrompt.onConfirm}
          onCancel={() => setPasswordPrompt(null)}
        />
      )}
    </div>
  );
};

const AirframeLayoutsPanel: React.FC = () => {
  const [selectedReg, setSelectedReg] = useState<string>(() => useLoadPlanStore.getState().flight?.registration ?? '');
  const [layoutsByReg, setLayoutsByReg] = useState<Record<string, AirframeLayout | null>>({});
  const [fleet, setFleet] = useState<Array<{ registration: string; aircraftType: string }>>([]);
  const [provenanceDraft, setProvenanceDraft] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<{ state: 'idle' | 'saving' | 'saved' | 'error'; message?: string; at?: string }>({
    state: 'idle',
  });
  const lastSavedAtRef = useRef<string | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const { currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    try {
      const fromDb: Array<{ registration: string; aircraftType: string }> = [];
      if (isDatabaseInitialized()) {
        const rows = query<{ registration: string; aircraft_type: string }>(
          `SELECT registration, aircraft_type FROM fleet_aircraft WHERE active = 1 ORDER BY registration`
        );
        fromDb.push(...rows.map((r) => ({ registration: r.registration, aircraftType: r.aircraft_type })));
      }

      const fromCode = WGA_FLEET.map((f) => ({ registration: f.reg, aircraftType: f.type }));

      const mergedMap = new Map<string, { registration: string; aircraftType: string }>();
      for (const e of [...fromDb, ...fromCode]) mergedMap.set(e.registration, e);
      const merged = Array.from(mergedMap.values()).sort((a, b) => a.registration.localeCompare(b.registration));
      setFleet(merged);
      if (!selectedReg && merged.length > 0) setSelectedReg(merged[0]!.registration);
    } catch {
      // best-effort (prototype)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-tab + same-tab refresh: if DB changes, re-fetch the selected registration layout so the editor matches reality.
  useEffect(() => {
    const refreshSelected = () => {
      try {
        if (!selectedReg) return;
        if (!isDatabaseInitialized()) return;
        const l = getAirframeLayoutByRegistration(selectedReg);
        setLayoutsByReg((prev) => ({ ...prev, [selectedReg]: l }));
      } catch {
        // ignore
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key !== getDbRevKey()) return;
      refreshSelected();
    };
    const onLayoutUpdated = () => refreshSelected();

    window.addEventListener('storage', onStorage);
    window.addEventListener('lm:airframeLayoutUpdated', onLayoutUpdated as any);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('lm:airframeLayoutUpdated', onLayoutUpdated as any);
    };
  }, [selectedReg]);

  const selectedType = useMemo(() => {
    // Prefer the per-registration layout record's aircraftType when present (super admin can override).
    return (layoutsByReg[selectedReg]?.aircraftType ?? fleet.find((f) => f.registration === selectedReg)?.aircraftType) ?? 'B747-400F';
  }, [fleet, selectedReg]);

  const typeConfig = useMemo(() => getAircraftConfig(selectedType), [selectedType]);

  const current = useMemo(() => {
    return layoutsByReg[selectedReg] ?? null;
  }, [layoutsByReg, selectedReg]);

  const ensureLoaded = (reg: string) => {
    if (!reg) return;
    if (Object.prototype.hasOwnProperty.call(layoutsByReg, reg)) return;
    try {
      if (!isDatabaseInitialized()) return;
      const l = getAirframeLayoutByRegistration(reg);
      setLayoutsByReg((prev) => ({ ...prev, [reg]: l }));
    } catch {
      // ignore
    }
  };

  const revertToSaved = () => {
    try {
      if (!selectedReg) return;
      if (!isDatabaseInitialized()) return;
      const l = getAirframeLayoutByRegistration(selectedReg);
      setLayoutsByReg((prev) => ({ ...prev, [selectedReg]: l }));
      setSaveStatus({ state: 'idle' });
    } catch {
      // ignore
    }
  };

  const exportPdfWorksheet = () => {
    try {
      if (!selectedReg) return;
      const nowIso = new Date().toISOString();
      const type = selectedType;
      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) {
        alert('Popup blocked. Allow popups to export PDF.');
        return;
      }

      const esc = (s: string) =>
        s
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');

      const fmt = (n: unknown) =>
        typeof n === 'number' && Number.isFinite(n) ? String(Math.round(n)) : '';
      const fmtFixed = (n: unknown, d: number) =>
        typeof n === 'number' && Number.isFinite(n) ? Number(n).toFixed(d) : '';

      const limits = editable.limits ?? getAircraftConfig(type)?.limits;
      const cg = editable.cgLimits ?? getAircraftConfig(type)?.cgLimits;
      const mac = editable.mac ?? getAircraftConfig(type)?.mac;
      const fuelArm = typeof editable.fuelArm === 'number' ? editable.fuelArm : getAircraftConfig(type)?.fuelArm;

      const stations = (typeConfig?.stations ?? []).map((s) => ({
        id: s.id,
        label: (editable.stationLabels?.[s.id] ?? s.label) as string,
        arm: typeof editable.stationArms?.[s.id] === 'number' ? editable.stationArms?.[s.id] : s.arm,
      }));

      const positions = (typeConfig?.positions ?? []).map((p) => ({
        id: p.id,
        deck: p.deck,
        label: (editable.positionLabels?.[p.id] ?? p.id) as string,
        arm: typeof editable.positionArms?.[p.id] === 'number' ? editable.positionArms?.[p.id] : p.arm,
        maxW:
          typeof editable.positionMaxWeights?.[p.id] === 'number' ? editable.positionMaxWeights?.[p.id] : p.maxWeight,
      }));

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Airframe Data Card Update • ${esc(selectedReg)}</title>
  <style>
    @page { size: auto; margin: 14mm; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color: #0f172a; }
    h1 { margin: 0; font-size: 20px; letter-spacing: -0.02em; }
    .sub { margin-top: 4px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #334155; font-weight: 700; }
    .grid { display: grid; gap: 12px; }
    .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    .muted { color: #475569; }
    .hdr { display: flex; justify-content: space-between; align-items: start; gap: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 7px 8px; font-size: 11px; vertical-align: top; }
    th { background: #f1f5f9; text-transform: uppercase; letter-spacing: 0.14em; font-size: 10px; color: #334155; text-align: left; }
    .right { text-align: right; }
    .box { height: 22px; border: 1px solid #94a3b8; border-radius: 6px; background: #ffffff; }
    .smallbox { height: 20px; border: 1px solid #94a3b8; border-radius: 6px; background: #ffffff; }
    .pagebreak { page-break-before: always; }
    .sig { margin-top: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .line { border-top: 1px solid #94a3b8; margin-top: 28px; }
  </style>
</head>
<body>
  <div class="hdr">
    <div>
      <h1>AIRFRAME DATA CARD UPDATE</h1>
      <div class="sub">Existing vs New (mechanic pencil worksheet)</div>
    </div>
    <div class="mono muted" style="font-size: 11px; text-align:right;">
      <div>Generated: ${esc(nowIso)}</div>
      <div>LoadMaster Pro</div>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 14px;">
    <div class="card">
      <div class="sub" style="margin-top:0;">Registration</div>
      <div class="mono" style="font-size: 14px; font-weight: 800; margin-top: 6px;">${esc(selectedReg)}</div>
    </div>
    <div class="card">
      <div class="sub" style="margin-top:0;">Aircraft Type</div>
      <div class="mono" style="font-size: 14px; font-weight: 800; margin-top: 6px;">${esc(type)}</div>
    </div>
    <div class="card">
      <div class="sub" style="margin-top:0;">Revision</div>
      <div class="mono" style="font-size: 14px; font-weight: 800; margin-top: 6px;">${esc(String(editable.revisionNumber ?? '—'))}</div>
    </div>
  </div>

  <div class="card" style="margin-top: 14px;">
    <table>
      <thead>
        <tr><th style="width: 240px;">Field</th><th>Existing</th><th>NEW</th></tr>
      </thead>
      <tbody>
        <tr><td class="sub" style="letter-spacing:.12em;">Status</td><td class="mono">${esc(String(editable.status ?? '—'))}</td><td></td></tr>
        <tr><td class="sub">Effective From (UTC)</td><td class="mono">${esc(String(editable.effectiveFromUtc ?? '—'))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">Weigh Report Date (UTC)</td><td class="mono">${esc(String(editable.weighReportDateUtc ?? '—'))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">Next Weigh Due (UTC)</td><td class="mono">${esc(String(editable.nextWeighDueUtc ?? '—'))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">OEW (kg)</td><td class="mono right">${esc(fmt(limits?.OEW ?? editable.oewKg))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">MZFW (kg)</td><td class="mono right">${esc(fmt(limits?.MZFW))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">MTOW (kg)</td><td class="mono right">${esc(fmt(limits?.MTOW))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">MLW (kg)</td><td class="mono right">${esc(fmt(limits?.MLW))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">CG FWD (%MAC)</td><td class="mono right">${esc(fmtFixed(cg?.forward, 1))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">CG AFT (%MAC)</td><td class="mono right">${esc(fmtFixed(cg?.aft, 1))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">MAC refChord (in)</td><td class="mono right">${esc(fmtFixed(mac?.refChord, 1))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">MAC leMAC (in)</td><td class="mono right">${esc(fmtFixed(mac?.leMAC, 0))}</td><td><div class="box"></div></td></tr>
        <tr><td class="sub">Fuel Arm (in)</td><td class="mono right">${esc(fmtFixed(fuelArm, 0))}</td><td><div class="box"></div></td></tr>
      </tbody>
    </table>
    <div class="sub" style="margin-top: 12px;">Change reason (NEW)</div>
    <div class="box" style="height: 34px; margin-top: 6px;"></div>
    <div class="sub" style="margin-top: 12px;">Provenance / references (NEW)</div>
    <div class="box" style="height: 52px; margin-top: 6px;"></div>
  </div>

  <div class="pagebreak"></div>

  <div class="sub" style="margin-top:0;">Stations (Existing vs NEW arms)</div>
  <div class="card" style="margin-top: 10px;">
    <table>
      <thead>
        <tr><th style="width: 220px;">Station</th><th>ID</th><th class="right" style="width: 140px;">Existing Arm</th><th class="right">NEW Arm</th></tr>
      </thead>
      <tbody>
        ${stations
          .map(
            (s) => `
          <tr>
            <td>${esc(s.label)}</td>
            <td class="mono muted">${esc(s.id)}</td>
            <td class="mono right">${esc(fmtFixed(s.arm, 0))}</td>
            <td><div class="smallbox"></div></td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="pagebreak"></div>

  <div class="sub" style="margin-top:0;">Cargo Positions (Existing vs NEW arm / max weight)</div>
  <div class="card" style="margin-top: 10px;">
    <table>
      <thead>
        <tr>
          <th style="width: 70px;">Deck</th>
          <th style="width: 90px;">Pos</th>
          <th>Label</th>
          <th class="right" style="width: 120px;">Arm</th>
          <th class="right">NEW Arm</th>
          <th class="right" style="width: 120px;">Max Wt</th>
          <th class="right">NEW Max Wt</th>
        </tr>
      </thead>
      <tbody>
        ${positions
          .map(
            (p) => `
          <tr>
            <td class="muted"><b>${esc(p.deck)}</b></td>
            <td class="mono">${esc(p.id)}</td>
            <td>${esc(p.label)}</td>
            <td class="mono right">${esc(fmtFixed(p.arm, 0))}</td>
            <td><div class="smallbox"></div></td>
            <td class="mono right">${esc(fmt(p.maxW))}</td>
            <td><div class="smallbox"></div></td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="sig">
    <div>
      <div class="sub">Mechanic</div>
      <div class="line"></div>
    </div>
    <div>
      <div class="sub">Tech / Data Entry</div>
      <div class="line"></div>
    </div>
  </div>
</body>
</html>`;

      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } catch {
      alert('Export failed. Check console for details.');
    }
  };

  useEffect(() => {
    if (!selectedReg) return;
    ensureLoaded(selectedReg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReg]);

  const editable = useMemo(() => {
    const typeDefaultOewKg = getAircraftConfig(selectedType)?.limits.OEW;
    const defaultPositionArms: Record<string, number> = {};
    const defaultStationArms: Record<string, number> = {};
    const defaultPositionMaxWeights: Record<string, number> = {};
    for (const p of typeConfig?.positions ?? []) defaultPositionArms[p.id] = p.arm;
    for (const p of typeConfig?.positions ?? []) defaultPositionMaxWeights[p.id] = p.maxWeight;
    for (const s of typeConfig?.stations ?? []) defaultStationArms[s.id] = s.arm;

    const preset = current?.labelPreset ?? defaultPresetForType(selectedType);
    const defaults = buildDefaultLabels({
      preset,
      positions: typeConfig?.positions ?? [],
      stations: typeConfig?.stations ?? [],
    });

    // IMPORTANT: keep this typed as AirframeLayout to avoid `current ?? { ... }` producing
    // a union type (which breaks door anchor editing fields like slotId/markerStyle).
    const base: AirframeLayout = current ?? ({
      registration: selectedReg,
      aircraftType: selectedType,
      version: 1,
      locked: true,
      isSampleData: typeConfig?.isSampleData ?? true,
      dataProvenance: typeConfig?.dataProvenance,
      limits: typeConfig?.limits,
      cgLimits: typeConfig?.cgLimits,
      mac: typeConfig?.mac,
      fuelArm: typeConfig?.fuelArm,
      oewKg: typeDefaultOewKg,
      positionArms: defaultPositionArms,
      stationArms: defaultStationArms,
      positionMaxWeights: defaultPositionMaxWeights,
      status: 'draft',
      revisionNumber: 1,
      labelPreset: preset,
      positionLabels: defaults.positionLabels,
      stationLabels: defaults.stationLabels,
      stationOverrides: defaults.stationOverrides,
      doors: defaultDoorsForType(selectedType).map((d) => ({
        kind: d.kind,
        enabled: d.enabled,
        side: d.side,
        anchor: { key: d.anchorKey },
      })),
      updatedAtUtc: new Date().toISOString(),
    } as AirframeLayout);
    // Ensure the editable record always has a complete set of arms for "aircraft report" purposes.
    const mergedPositionLabels = { ...defaults.positionLabels, ...(base.positionLabels ?? {}) };
    const mergedStationLabels = { ...defaults.stationLabels, ...(base.stationLabels ?? {}) };
    return {
      ...base,
      positionArms: { ...defaultPositionArms, ...(base.positionArms ?? {}) },
      stationArms: { ...defaultStationArms, ...(base.stationArms ?? {}) },
      positionMaxWeights: { ...defaultPositionMaxWeights, ...(base.positionMaxWeights ?? {}) },
      positionLabels: mergedPositionLabels,
      stationLabels: mergedStationLabels,
      stationOverrides: { ...(base.stationOverrides ?? {}) },
    };
  }, [current, selectedReg, selectedType, typeConfig]);

  // Keep a text draft for provenance editing so users can type invalid JSON temporarily.
  useEffect(() => {
    const next = editable.dataProvenance ? JSON.stringify(editable.dataProvenance, null, 2) : '';
    setProvenanceDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReg]);

  const setLimit = (field: 'OEW' | 'MZFW' | 'MTOW' | 'MLW', value: number | undefined) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const base = cur.limits ?? getAircraftConfig(selectedType)?.limits ?? ({} as any);
      const limits = { ...base, [field]: value };
      // Keep `oewKg` in sync for backward compatibility.
      const oewKg = field === 'OEW' ? value : cur.oewKg;
      return { ...prev, [selectedReg]: { ...cur, limits, oewKg, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const setCgLimit = (field: 'forward' | 'aft', value: number | undefined) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const base = cur.cgLimits ?? getAircraftConfig(selectedType)?.cgLimits ?? ({} as any);
      const cgLimits = { ...base, [field]: value };
      return { ...prev, [selectedReg]: { ...cur, cgLimits, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const setMacField = (field: 'refChord' | 'leMAC', value: number | undefined) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const base = cur.mac ?? getAircraftConfig(selectedType)?.mac ?? ({} as any);
      const mac = { ...base, [field]: value };
      return { ...prev, [selectedReg]: { ...cur, mac, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const setFuelArm = (value: number | undefined) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      return { ...prev, [selectedReg]: { ...cur, fuelArm: value, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const setPositionMaxWeight = (positionId: string, value: number | undefined) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const positionMaxWeights = { ...(cur.positionMaxWeights ?? {}) };
      if (typeof value === 'number' && Number.isFinite(value)) positionMaxWeights[positionId] = value;
      return { ...prev, [selectedReg]: { ...cur, positionMaxWeights, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const setRevisionMeta = (patch: Partial<Pick<AirframeLayout, 'status' | 'revisionNumber' | 'effectiveFromUtc' | 'weighReportDateUtc' | 'nextWeighDueUtc' | 'changeReason'>>) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      return { ...prev, [selectedReg]: { ...cur, ...patch, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const commitProvenanceDraft = () => {
    const raw = provenanceDraft;
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      if (!raw.trim()) return { ...prev, [selectedReg]: { ...cur, dataProvenance: undefined, updatedAtUtc: new Date().toISOString() } };
      try {
        const parsed = JSON.parse(raw);
        return { ...prev, [selectedReg]: { ...cur, dataProvenance: parsed, updatedAtUtc: new Date().toISOString() } };
      } catch {
        return prev;
      }
    });
  };

  const setStationArm = (stationId: string, arm: number | undefined) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const stationArms = { ...(cur.stationArms ?? {}) };
      if (typeof arm === 'number' && Number.isFinite(arm)) stationArms[stationId] = arm;
      return { ...prev, [selectedReg]: { ...cur, stationArms, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const setPositionArm = (positionId: string, arm: number | undefined) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const positionArms = { ...(cur.positionArms ?? {}) };
      if (typeof arm === 'number' && Number.isFinite(arm)) positionArms[positionId] = arm;
      return { ...prev, [selectedReg]: { ...cur, positionArms, updatedAtUtc: new Date().toISOString() } };
    });
  };

  // Removed: setLabelPreset (unused; applyLabelPreset handles preset changes)

  const applyLabelPresetLocal = (preset: AirframeLabelPreset) => {
    if (!selectedReg) return;
    const ok = window.confirm(
      `Apply label preset "${preset}" to ${selectedReg}?\n\nThis overwrites POSITION + STATION labels for this tail. (Arms/limits are not changed.)`
    );
    if (!ok) return;
    const defaults = buildDefaultLabels({
      preset,
      positions: typeConfig?.positions ?? [],
      stations: typeConfig?.stations ?? [],
    });
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      return {
        ...prev,
        [selectedReg]: {
          ...cur,
          labelPreset: preset,
          // Overwrite labels to match the chosen preset (user requested 1-button flow; preset selection is the “apply” step)
          positionLabels: defaults.positionLabels,
          stationLabels: defaults.stationLabels,
          stationOverrides: defaults.stationOverrides,
          updatedAtUtc: new Date().toISOString(),
        },
      };
    });
  };

  const setAircraftTypeForLayout = (aircraftType: string) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      return { ...prev, [selectedReg]: { ...cur, aircraftType, updatedAtUtc: new Date().toISOString() } };
    });
    setFleet((prev) => prev.map((f) => (f.registration === selectedReg ? { ...f, aircraftType } : f)));
  };

  // NOTE: preset application is now local-only (dropdown change), and persisted via the single "Save" button.

  const setPositionLabel = (positionId: string, label: string | undefined) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const positionLabels = { ...(cur.positionLabels ?? {}) };
      if (label === undefined || label.trim() === '') delete positionLabels[positionId];
      else positionLabels[positionId] = label;
      return { ...prev, [selectedReg]: { ...cur, positionLabels, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const setStationLabel = (stationId: string, label: string | undefined) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const stationLabels = { ...(cur.stationLabels ?? {}) };
      if (label === undefined || label.trim() === '') delete stationLabels[stationId];
      else stationLabels[stationId] = label;
      return { ...prev, [selectedReg]: { ...cur, stationLabels, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const setStationOverride = (stationId: string, patch: Partial<AirframeStationOverride>) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const stationOverrides = { ...(cur.stationOverrides ?? {}) };
      stationOverrides[stationId] = { ...(stationOverrides[stationId] ?? {}), ...patch };
      return { ...prev, [selectedReg]: { ...cur, stationOverrides, updatedAtUtc: new Date().toISOString() } };
    });
  };

  const setDoor = (kind: DoorKind, patch: Partial<AirframeLayout['doors'][number]>) => {
    setLayoutsByReg((prev) => {
      const cur = prev[selectedReg] ?? editable;
      const doors = [...(cur?.doors ?? [])];
      const idx = doors.findIndex((d) => d.kind === kind);
      if (idx >= 0) doors[idx] = { ...doors[idx]!, ...patch };
      else doors.push({ kind, enabled: true, side: 'L', ...patch } as any);
      return {
        ...prev,
        [selectedReg]: { ...cur, doors, updatedAtUtc: new Date().toISOString() },
      };
    });
  };

  const save = () => {
    try {
      if (!selectedReg) return;
      setSaveStatus({ state: 'saving' });
      if (!isDatabaseInitialized()) {
        setSaveStatus({ state: 'error', message: 'DB not ready (cannot save yet).' });
        return;
      }
      // Generate updated by info (in production, use actual user from auth system)
      const updatedBy = currentUser?.username 
        ? `${currentUser.username}`
        : 'Mechanic J. Smith (EMP#4721)'; // Generic mechanic for now

      const saved = upsertAirframeLayout({
        registration: selectedReg,
        aircraftType: selectedType,
        layout: {
          version: editable.version ?? 1,
          locked: true,
          oewKg: editable.oewKg,
          limits: editable.limits,
          cgLimits: editable.cgLimits,
          mac: editable.mac,
          fuelArm: editable.fuelArm,
          positionMaxWeights: editable.positionMaxWeights,
          isSampleData: editable.isSampleData,
          dataProvenance: editable.dataProvenance,
          status: editable.status,
          revisionNumber: editable.revisionNumber,
          effectiveFromUtc: editable.effectiveFromUtc,
          weighReportDateUtc: editable.weighReportDateUtc,
          nextWeighDueUtc: editable.nextWeighDueUtc,
          changeReason: editable.changeReason,
          positionArms: editable.positionArms,
          stationArms: editable.stationArms,
          labelPreset: editable.labelPreset,
          positionLabels: editable.positionLabels,
          stationLabels: editable.stationLabels,
          stationOverrides: editable.stationOverrides,
          positionConstraints: (editable as any).positionConstraints,
          doors: editable.doors,
          updatedBy, // Add who made the change
        },
      });
      setLayoutsByReg((prev) => ({ ...prev, [selectedReg]: saved }));
      const at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      lastSavedAtRef.current = at;
      setSaveStatus({ state: 'saved', at });
    } catch {
      setSaveStatus({ state: 'error', message: 'Save failed. Check console for details.' });
    }
  };

  const resetToDefaults = () => {
    if (!selectedReg) return;
    const token = window.prompt(`Reset ${selectedReg} to defaults?\n\nType the registration to confirm:`);
    if ((token ?? '').trim().toUpperCase() !== selectedReg.trim().toUpperCase()) return;
    const preset = defaultPresetForType(selectedType);
    const typeDefaults = getAircraftConfig(selectedType);
    const defaultPositionArms: Record<string, number> = {};
    const defaultStationArms: Record<string, number> = {};
    const defaultPositionMaxWeights: Record<string, number> = {};
    for (const p of typeConfig?.positions ?? []) {
      defaultPositionArms[p.id] = p.arm;
      defaultPositionMaxWeights[p.id] = p.maxWeight;
    }
    for (const s of typeConfig?.stations ?? []) defaultStationArms[s.id] = s.arm;
    const defaults = buildDefaultLabels({
      preset,
      positions: typeConfig?.positions ?? [],
      stations: typeConfig?.stations ?? [],
    });
    setLayoutsByReg((prev) => ({
      ...prev,
      [selectedReg]: {
        registration: selectedReg,
        aircraftType: selectedType,
        version: 1,
        locked: true,
        isSampleData: typeDefaults?.isSampleData ?? true,
        dataProvenance: typeDefaults?.dataProvenance,
        limits: typeDefaults?.limits,
        cgLimits: typeDefaults?.cgLimits,
        mac: typeDefaults?.mac,
        fuelArm: typeDefaults?.fuelArm,
        oewKg: typeDefaults?.limits.OEW,
        positionArms: defaultPositionArms,
        stationArms: defaultStationArms,
        positionMaxWeights: defaultPositionMaxWeights,
        status: 'draft',
        revisionNumber: 1,
        labelPreset: preset,
        positionLabels: defaults.positionLabels,
        stationLabels: defaults.stationLabels,
        stationOverrides: defaults.stationOverrides,
        positionConstraints: Object.fromEntries(
          (typeConfig?.positions ?? []).map((p) => [p.id, (p as any).constraints ?? {}])
        ),
        doors: defaultDoorsForType(selectedType).map((d) => ({
          kind: d.kind,
          enabled: d.enabled,
          side: d.side,
          anchor: { key: d.anchorKey },
        })),
        updatedAtUtc: new Date().toISOString(),
      },
    }));
  };

  return (
    <div>
      <SectionHeader
        title="Airframe Layouts (Per Registration)"
        description="Set door presence/side per tail number. Intended to be set once during onboarding and then remain stable."
        onReset={resetToDefaults}
      />

      <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/30">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Registration</div>
            <select
              value={selectedReg}
              onChange={(e) => setSelectedReg(e.target.value)}
              className="mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white min-w-[220px]"
            >
              <option value="">-- Select --</option>
              {fleet.map((f) => (
                <option key={f.registration} value={f.registration}>
                  {f.registration} • {f.aircraftType}
                </option>
              ))}
            </select>
          </div>

          {/* Registration Info Banner */}
          {selectedReg && (
            <div className="w-full mt-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-blue-600 px-3 py-1 rounded-md">
                  <div className="text-xs font-bold text-white">{selectedReg}</div>
                </div>
                <div className="text-xs text-slate-300">
                  Viewing configuration for this tail number
                </div>
                {editable.alwaysUseTemplate && (
                  <div className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded">
                    <div className="text-[10px] font-bold text-amber-300">
                      🔗 TEMPLATE-LINKED (Always uses current template)
                    </div>
                  </div>
                )}
                {!editable.alwaysUseTemplate && selectedReg.startsWith('N') && (
                  <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded">
                    <div className="text-[10px] font-bold text-emerald-300">
                      ✈️ LIVE AIRCRAFT (Independent configuration)
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {editable.updatedAtUtc && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <Clock size={12} />
                    Last modified: {new Date(editable.updatedAtUtc).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </div>
                )}
                {editable.updatedBy && (
                  <div className="text-[10px] text-slate-400">
                    By: <span className="font-bold text-blue-300">{editable.updatedBy}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Labels Preset */}
              <div className="flex flex-col">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                  Labels preset
                  {!isSuperAdmin && <Shield size={12} className="text-amber-500" />}
                </div>
                {isSuperAdmin ? (
                  <select
                    value={editable.labelPreset ?? defaultPresetForType(selectedType)}
                    onChange={(e) => {
                      const newValue = e.target.value as AirframeLabelPreset;
                      setPasswordPrompt({
                        show: true,
                        title: 'Change Labels Preset',
                        message: 'Changing the labels preset will reset all position and station labels for this registration.',
                        onConfirm: () => {
                          applyLabelPresetLocal(newValue);
                          setPasswordPrompt(null);
                        },
                      });
                    }}
                    disabled={!selectedReg}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-2 text-xs text-white cursor-pointer"
                    title="Label preset"
                  >
                    <option value="blank">Blank</option>
                    <option value="alphabetic">Alphabetic</option>
                    <option value="numeric">Numeric</option>
                    <option value="ups">UPS</option>
                  </select>
                ) : (
                  <div className="mt-1 p-2 bg-slate-900/50 border border-slate-700 rounded flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded text-xs font-bold text-blue-300">
                      {(editable.labelPreset ?? defaultPresetForType(selectedType)).toUpperCase()}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      (Locked - Contact <span className="text-amber-400 font-bold">LoadMasterProAI.com</span>)
                    </div>
                  </div>
                )}
              </div>

              {/* Aircraft Type */}
              <div className="flex flex-col">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                  Aircraft type
                  {!isSuperAdmin && <Shield size={12} className="text-amber-500" />}
                </div>
                {isSuperAdmin ? (
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setPasswordPrompt({
                        show: true,
                        title: 'Change Aircraft Type',
                        message: '⚠️ WARNING: Changing aircraft type will completely reset ALL position data, arms, constraints, and door configurations for this registration. This action cannot be undone. Only proceed if you are reconfiguring this tail number.',
                        onConfirm: () => {
                          setAircraftTypeForLayout(newType);
                          setPasswordPrompt(null);
                        },
                      });
                    }}
                    disabled={!selectedReg}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-2 text-xs text-white cursor-pointer"
                    title="Aircraft type (controls slot set + diagram layout)"
                  >
                    {getAvailableAircraftTypes().map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1 p-2 bg-slate-900/50 border border-slate-700 rounded flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-emerald-600/20 border border-emerald-500/30 rounded text-xs font-bold text-emerald-300">
                      {selectedType}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      (Locked - Contact <span className="text-amber-400 font-bold">LoadMasterProAI.com</span>)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={exportPdfWorksheet}
              disabled={!selectedReg}
              className="px-3 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700 hover:bg-slate-700 disabled:opacity-50"
              title="Open a printable worksheet (Existing vs NEW) and export to PDF"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={revertToSaved}
              disabled={!selectedReg}
              className="px-3 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700 hover:bg-slate-700 disabled:opacity-50"
              title="Discard unsaved changes and reload last saved DB record for this tail"
            >
              Revert
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!selectedReg}
              className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200 hover:bg-slate-100 disabled:opacity-50"
            >
              Save
            </button>
            {saveStatus.state !== 'idle' && (
              <div
                className={[
                  'absolute right-0 -top-9 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
                  saveStatus.state === 'saved'
                    ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-300'
                    : saveStatus.state === 'saving'
                      ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                      : 'bg-red-900/20 border-red-900/50 text-red-300',
                ].join(' ')}
                title={saveStatus.message ?? (saveStatus.state === 'saved' ? 'Saved to local DB' : undefined)}
              >
                {saveStatus.state === 'saving'
                  ? 'Saving…'
                  : saveStatus.state === 'saved'
                    ? `Saved ${saveStatus.at ?? lastSavedAtRef.current ?? ''}`.trim()
                    : saveStatus.message ?? 'Error'}
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Stored in local DB table <span className="font-mono text-slate-300">airframe_layouts</span>. Only{' '}
          <span className="font-bold text-slate-300">super_admin</span> can edit.
        </div>
      </div>

      <div className="mt-3 p-3 rounded-lg border border-slate-800 bg-slate-950/30">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aircraft limits (per registration)</div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-[11px] text-slate-500">
            These drive dispatch legality. Update them per annual weigh report / manuals for this tail.
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['OEW', 'MZFW', 'MTOW', 'MLW'] as const).map((k) => (
              <div key={k} className="flex flex-col">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{k} (kg)</div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={typeof editable.limits?.[k] === 'number' ? (editable.limits as any)[k] : (k === 'OEW' && typeof editable.oewKg === 'number' ? editable.oewKg : '')}
                  placeholder={String((getAircraftConfig(selectedType)?.limits as any)?.[k] ?? '')}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? undefined : Number(raw);
                    setLimit(k, Number.isFinite(n as number) ? (n as number) : undefined);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-lg border border-slate-800 bg-slate-950/30">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CG / MAC / Fuel (per registration)</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CG FWD (%MAC)</div>
              <input
                type="number"
                value={typeof editable.cgLimits?.forward === 'number' ? editable.cgLimits.forward : ''}
                placeholder={String(getAircraftConfig(selectedType)?.cgLimits?.forward ?? '')}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = raw === '' ? undefined : Number(raw);
                  setCgLimit('forward', Number.isFinite(n as number) ? (n as number) : undefined);
                }}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full"
              />
            </div>
            <div className="flex flex-col">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CG AFT (%MAC)</div>
              <input
                type="number"
                value={typeof editable.cgLimits?.aft === 'number' ? editable.cgLimits.aft : ''}
                placeholder={String(getAircraftConfig(selectedType)?.cgLimits?.aft ?? '')}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = raw === '' ? undefined : Number(raw);
                  setCgLimit('aft', Number.isFinite(n as number) ? (n as number) : undefined);
                }}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">MAC refChord (in)</div>
              <input
                type="number"
                value={typeof editable.mac?.refChord === 'number' ? editable.mac.refChord : ''}
                placeholder={String(getAircraftConfig(selectedType)?.mac?.refChord ?? '')}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = raw === '' ? undefined : Number(raw);
                  setMacField('refChord', Number.isFinite(n as number) ? (n as number) : undefined);
                }}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full"
              />
            </div>
            <div className="flex flex-col">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">MAC leMAC (in)</div>
              <input
                type="number"
                value={typeof editable.mac?.leMAC === 'number' ? editable.mac.leMAC : ''}
                placeholder={String(getAircraftConfig(selectedType)?.mac?.leMAC ?? '')}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = raw === '' ? undefined : Number(raw);
                  setMacField('leMAC', Number.isFinite(n as number) ? (n as number) : undefined);
                }}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <div className="flex flex-col">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fuel Arm (in)</div>
              <input
                type="number"
                value={typeof editable.fuelArm === 'number' ? editable.fuelArm : ''}
                placeholder={String(getAircraftConfig(selectedType)?.fuelArm ?? '')}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = raw === '' ? undefined : Number(raw);
                  setFuelArm(Number.isFinite(n as number) ? (n as number) : undefined);
                }}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full"
              />
            </div>
            <div className="flex items-center justify-between border border-slate-800 rounded-lg px-3 py-2 bg-slate-950/30">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sample data</div>
                <div className="text-[11px] text-slate-500">Turn off when you enter real manual data.</div>
              </div>
              <Toggle
                checked={editable.isSampleData ?? true}
                onChange={(v) => setLayoutsByReg((prev) => {
                  const cur = prev[selectedReg] ?? editable;
                  return { ...prev, [selectedReg]: { ...cur, isSampleData: v, updatedAtUtc: new Date().toISOString() } };
                })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-lg border border-slate-800 bg-slate-950/30">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reweigh / revision metadata</div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div className="flex flex-col">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</div>
            <select
              value={editable.status ?? 'draft'}
              onChange={(e) => setRevisionMeta({ status: e.target.value as any })}
              className="mt-1 bg-slate-800 border border-slate-700 rounded px-2 py-2 text-xs text-white"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Revision #</div>
            <input
              type="number"
              value={typeof editable.revisionNumber === 'number' ? editable.revisionNumber : ''}
              onChange={(e) => {
                const raw = e.target.value;
                const n = raw === '' ? undefined : Number(raw);
                setRevisionMeta({ revisionNumber: Number.isFinite(n as number) ? (n as number) : undefined });
              }}
              className="mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Effective from (UTC ISO)</div>
            <input
              type="text"
              value={editable.effectiveFromUtc ?? ''}
              placeholder="2026-01-15T00:00:00Z"
              onChange={(e) => setRevisionMeta({ effectiveFromUtc: e.target.value || undefined })}
              className="mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white w-full font-mono"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Weigh report date (UTC ISO)</div>
            <input
              type="text"
              value={editable.weighReportDateUtc ?? ''}
              placeholder="2025-12-01T00:00:00Z"
              onChange={(e) => setRevisionMeta({ weighReportDateUtc: e.target.value || undefined })}
              className="mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white w-full font-mono"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Next reweigh due (UTC ISO)</div>
            <input
              type="text"
              value={editable.nextWeighDueUtc ?? ''}
              placeholder="2026-12-01T00:00:00Z"
              onChange={(e) => setRevisionMeta({ nextWeighDueUtc: e.target.value || undefined })}
              className="mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white w-full font-mono"
            />
          </div>
          <div className="flex flex-col md:col-span-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Change reason</div>
            <input
              type="text"
              value={editable.changeReason ?? ''}
              placeholder="Annual weigh report update"
              onChange={(e) => setRevisionMeta({ changeReason: e.target.value || undefined })}
              className="mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white w-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-lg border border-slate-800 bg-slate-950/30">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Data provenance (JSON)</div>
        <div className="mt-2 text-[11px] text-slate-500">
          Store manual/weighing report references here for audit traceability. Must be valid JSON to save.
        </div>
        <textarea
          value={provenanceDraft}
          onChange={(e) => setProvenanceDraft(e.target.value)}
          onBlur={commitProvenanceDraft}
          placeholder={'{\n  "aircraftIdentity": "B747-400F ...",\n  "documents": [\n    { "id": "WB_MANUAL", "title": "W&B Manual", "revision": "Rev X", "reference": "Table 3-1" }\n  ],\n  "notes": "..." \n}'}
          className="mt-2 w-full min-h-[140px] bg-slate-900 border border-slate-800 rounded-lg p-3 text-[12px] text-slate-200 font-mono"
        />
      </div>

      <div className="mt-3 p-3 rounded-lg border border-slate-800 bg-slate-950/30">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Moment Arms (inches from datum)</div>
        <div className="mt-2 text-[11px] text-slate-500">
          These arms drive the actual W&B math. Keep them updated per aircraft report when maintenance updates weights/config.
        </div>

        {/* Upper Deck Stations (Non-cargo) */}
        <div className="mt-3">
          <div className="text-xs text-slate-300 font-bold">👨‍✈️ Upper Deck Stations (Crew / Jumpseats / Items)</div>
          <div className="mt-2 max-h-[220px] overflow-y-auto border border-slate-800 rounded-lg">
            <div className="grid grid-cols-[160px,1fr,150px,80px,90px,120px] gap-2 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
              <div>Station</div>
              <div>ID</div>
              <div>Display label</div>
              <div className="text-center">Enabled</div>
              <div className="text-right">Max</div>
              <div className="text-right">Arm (in)</div>
            </div>
            {(typeConfig?.stations ?? []).map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[160px,1fr,150px,80px,90px,120px] gap-2 p-2 items-center border-b border-slate-800 last:border-b-0"
              >
                <div className="text-xs text-slate-200 truncate">{editable.stationLabels?.[s.id] ?? s.label}</div>
                <div className="text-[11px] font-mono text-slate-400 truncate">{s.id}</div>
                <input
                  type="text"
                  value={editable.stationLabels?.[s.id] ?? ''}
                  placeholder={s.label}
                  onChange={(e) => setStationLabel(s.id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                />
                <div className="flex justify-center">
                  <Toggle
                    checked={editable.stationOverrides?.[s.id]?.enabled ?? true}
                    onChange={(v) => setStationOverride(s.id, { enabled: v })}
                  />
                </div>
                <input
                  type="number"
                  value={typeof editable.stationOverrides?.[s.id]?.maxCount === 'number' ? editable.stationOverrides![s.id]!.maxCount : ''}
                  placeholder={typeof s.maxCount === 'number' ? String(s.maxCount) : ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? undefined : Number(raw);
                    setStationOverride(s.id, { maxCount: Number.isFinite(n as number) ? (n as number) : undefined });
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full text-right"
                />
                <input
                  type="number"
                  value={typeof editable.stationArms?.[s.id] === 'number' ? editable.stationArms![s.id] : ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? undefined : Number(raw);
                    setStationArm(s.id, Number.isFinite(n as number) ? (n as number) : undefined);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full text-right"
                />
              </div>
            ))}
            {(typeConfig?.stations ?? []).length === 0 && (
              <div className="p-3 text-sm text-slate-500">No stations defined for this aircraft type.</div>
            )}
          </div>
        </div>

        {/* Main Deck Cargo Positions */}
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-300 font-bold">📦 Main Deck Cargo Positions</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Upper cargo deck positions. Label + arm + max weight + height constraints.
              </div>
            </div>
          </div>
          <div className="mt-2 max-h-[280px] overflow-y-auto border border-slate-800 rounded-lg">
            <div className="grid grid-cols-[90px,150px,1fr,120px,140px,130px] gap-2 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 bg-slate-900">
              <div>Pos</div>
              <div>Display label</div>
              <div>Type</div>
              <div className="text-right">Arm (in)</div>
              <div className="text-right">Max Wt (kg)</div>
              <div className="text-right">Max Height (in)</div>
            </div>
            {(typeConfig?.positions ?? []).filter(p => p.deck === 'MAIN').map((p) => (
              <div key={p.id} className="grid grid-cols-[90px,150px,1fr,120px,140px,130px] gap-2 p-2 items-center border-b border-slate-800 last:border-b-0 hover:bg-slate-800/30">
                <div className="text-sm font-mono text-slate-200">{p.id}</div>
                <input
                  type="text"
                  value={editable.positionLabels?.[p.id] ?? ''}
                  placeholder={p.id}
                  onChange={(e) => setPositionLabel(p.id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                />
                <div className="text-[11px] text-slate-500 truncate">{p.type}</div>
                <input
                  type="number"
                  value={typeof editable.positionArms?.[p.id] === 'number' ? editable.positionArms![p.id] : ''}
                  placeholder={String(p.arm)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? undefined : Number(raw);
                    setPositionArm(p.id, Number.isFinite(n as number) ? (n as number) : undefined);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full text-right"
                />
                <input
                  type="number"
                  value={typeof editable.positionMaxWeights?.[p.id] === 'number' ? editable.positionMaxWeights![p.id] : ''}
                  placeholder={String(p.maxWeight)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? undefined : Number(raw);
                    setPositionMaxWeight(p.id, Number.isFinite(n as number) ? (n as number) : undefined);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full text-right"
                />
                <input
                  type="number"
                  value={typeof (editable as any).positionConstraints?.[p.id]?.maxHeightIn === 'number' ? (editable as any).positionConstraints[p.id].maxHeightIn : ''}
                  placeholder={(p as any).constraints?.maxHeightIn ? String((p as any).constraints.maxHeightIn) : ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? undefined : Number(raw);
                    setLayoutsByReg((prev) => {
                      const cur = prev[selectedReg] ?? editable;
                      const positionConstraints = { ...((cur as any).positionConstraints ?? {}) };
                      positionConstraints[p.id] = {
                        ...(positionConstraints[p.id] ?? {}),
                        maxHeightIn: Number.isFinite(n as number) ? (n as number) : undefined,
                      };
                      return { ...prev, [selectedReg]: { ...cur, positionConstraints, updatedAtUtc: new Date().toISOString() } };
                    });
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full text-right"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Lower Deck Cargo Positions */}
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-300 font-bold">📦 Lower Deck Cargo Positions (Belly)</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Belly hold cargo positions. Forward, Aft, and Bulk compartments.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm(
                  `Seed lower deck max heights from template into ${selectedReg}?`
                );
                if (!ok) return;
                const seed = Object.fromEntries(
                  (typeConfig?.positions ?? [])
                    .filter(p => p.deck === 'LOWER')
                    .map((p) => [p.id, (p as any).constraints ?? {}])
                );
                setLayoutsByReg((prev) => {
                  const cur = prev[selectedReg] ?? editable;
                  const positionConstraints = { ...((cur as any).positionConstraints ?? {}), ...seed };
                  return { ...prev, [selectedReg]: { ...cur, positionConstraints, updatedAtUtc: new Date().toISOString() } };
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700"
              title="Seed lower deck max heights from template"
            >
              Seed heights
            </button>
          </div>
          <div className="mt-2 max-h-[200px] overflow-y-auto border border-slate-800 rounded-lg">
            <div className="grid grid-cols-[90px,150px,80px,1fr,120px,140px,130px] gap-2 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 bg-slate-900">
              <div>Pos</div>
              <div>Display label</div>
              <div>Group</div>
              <div>Type</div>
              <div className="text-right">Arm (in)</div>
              <div className="text-right">Max Wt (kg)</div>
              <div className="text-right">Max Height (in)</div>
            </div>
            {(typeConfig?.positions ?? []).filter(p => p.deck === 'LOWER').map((p) => (
              <div key={p.id} className="grid grid-cols-[90px,150px,80px,1fr,120px,140px,130px] gap-2 p-2 items-center border-b border-slate-800 last:border-b-0 hover:bg-slate-800/30">
                <div className="text-sm font-mono text-slate-200">{p.id}</div>
                <input
                  type="text"
                  value={editable.positionLabels?.[p.id] ?? ''}
                  placeholder={p.id}
                  onChange={(e) => setPositionLabel(p.id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                />
                <div className="text-[11px]">
                  {p.group && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      p.group === 'FWD' ? 'bg-cyan-600/20 text-cyan-300' :
                      p.group === 'AFT' ? 'bg-orange-600/20 text-orange-300' :
                      'bg-red-600/20 text-red-300'
                    }`}>
                      {p.group}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{p.type}</div>
                <input
                  type="number"
                  value={typeof editable.positionArms?.[p.id] === 'number' ? editable.positionArms![p.id] : ''}
                  placeholder={String(p.arm)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? undefined : Number(raw);
                    setPositionArm(p.id, Number.isFinite(n as number) ? (n as number) : undefined);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full text-right"
                />
                <input
                  type="number"
                  value={typeof editable.positionMaxWeights?.[p.id] === 'number' ? editable.positionMaxWeights![p.id] : ''}
                  placeholder={String(p.maxWeight)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? undefined : Number(raw);
                    setPositionMaxWeight(p.id, Number.isFinite(n as number) ? (n as number) : undefined);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full text-right"
                />
                <input
                  type="number"
                  value={typeof (editable as any).positionConstraints?.[p.id]?.maxHeightIn === 'number' ? (editable as any).positionConstraints[p.id].maxHeightIn : ''}
                  placeholder={(p as any).constraints?.maxHeightIn ? String((p as any).constraints.maxHeightIn) : ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? undefined : Number(raw);
                    setLayoutsByReg((prev) => {
                      const cur = prev[selectedReg] ?? editable;
                      const positionConstraints = { ...((cur as any).positionConstraints ?? {}) };
                      positionConstraints[p.id] = {
                        ...(positionConstraints[p.id] ?? {}),
                        maxHeightIn: Number.isFinite(n as number) ? (n as number) : undefined,
                      };
                      return { ...prev, [selectedReg]: { ...cur, positionConstraints, updatedAtUtc: new Date().toISOString() } };
                    });
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full text-right"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-bold text-white mb-2">Doors</div>
        <div className="space-y-2">
          {(['nose', 'main_side', 'lower_fwd', 'lower_aft', 'bulk'] as DoorKind[]).map((kind) => {
            const d = editable.doors.find((x) => x.kind === kind);
            const enabled = d?.enabled ?? false;
            const side = (d?.side ?? (kind === 'main_side' || kind === 'nose' ? 'L' : 'R')) as DoorSide;
            const anchorKey = d?.anchor?.key ?? (ANCHOR_KEYS[kind]?.[0] ?? '');
            const anchorSlotId = d?.anchor?.slotId ?? '';
            const markerStyle =
              (d?.anchor?.markerStyle ??
                (kind === 'nose'
                  ? 'vertical'
                  : kind === 'main_side' || kind === 'bulk'
                    ? 'horizontal_under'
                    : 'horizontal_beside')) as NonNullable<NonNullable<AirframeLayout['doors'][number]['anchor']>['markerStyle']>;
            return (
              <div key={kind} className="p-3 rounded-lg border border-slate-800 bg-slate-950/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-slate-100">{DOOR_LABEL[kind]}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{kind}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={side}
                      onChange={(e) => setDoor(kind, { side: e.target.value as DoorSide })}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      title="Door side"
                    >
                      <option value="L">L</option>
                      <option value="R">R</option>
                    </select>
                    <select
                      value={anchorSlotId}
                      onChange={(e) => setDoor(kind, { anchor: { ...(d?.anchor ?? {}), slotId: e.target.value || undefined } })}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white min-w-[100px]"
                      title="Anchor slot (recommended)"
                    >
                      <option value="">(no slot)</option>
                      {(typeConfig?.positions ?? []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id}
                        </option>
                      ))}
                    </select>
                    <select
                      value={markerStyle}
                      onChange={(e) =>
                        setDoor(kind, {
                          anchor: { ...(d?.anchor ?? {}), markerStyle: e.target.value as any },
                        })
                      }
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      title="Marker style"
                    >
                      {Object.entries(MARKER_STYLE_LABEL).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={anchorKey}
                      onChange={(e) => setDoor(kind, { anchor: { ...(d?.anchor ?? {}), key: e.target.value || undefined } })}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      title="Legacy anchor key (optional)"
                    >
                      <option value="">(none)</option>
                      {ANCHOR_KEYS[kind].map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <Toggle checked={enabled} onChange={(v) => setDoor(kind, { enabled: v })} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Password Prompt Modal */}
      {passwordPrompt && (
        <PasswordPromptModal
          title={passwordPrompt.title}
          message={passwordPrompt.message}
          contactInfo="LoadMasterProAI.com"
          onConfirm={passwordPrompt.onConfirm}
          onCancel={() => setPasswordPrompt(null)}
        />
      )}
    </div>
  );
};

