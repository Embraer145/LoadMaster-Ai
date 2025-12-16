import React from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Plane, ShieldCheck } from 'lucide-react';

interface HowToPageProps {
  onLaunchApp: () => void;
}

export const HowToPage: React.FC<HowToPageProps> = ({ onLaunchApp }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  LoadMaster <span className="text-blue-500">Pro AI</span>
                </h1>
                <div className="mt-1 text-[11px] text-slate-500 font-mono uppercase tracking-widest">
                  Weight &amp; Balance • Load planning • Prototype
                </div>
              </div>
            </div>

            <p className="mt-5 text-slate-300 max-w-2xl leading-relaxed">
              LoadMaster Pro AI helps load teams build a cargo plan faster while keeping the aircraft inside weight, CG,
              and operational constraints. This prototype focuses on workflow clarity and safety checks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLaunchApp}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
            >
              Launch App <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Value props */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3">
          <FeatureCard
            icon={<ClipboardList className="w-5 h-5 text-blue-400" />}
            title="Faster load planning"
            body="Import cargo, drag-and-drop onto positions, and see immediate CG / envelope feedback."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
            title="Safety-first checks"
            body="Prototype checks for basic limits and highlights out-of-bounds conditions early."
          />
          <FeatureCard
            icon={<CheckCircle2 className="w-5 h-5 text-amber-300" />}
            title="Audit-ready foundation"
            body="User context (TEST) + audit hooks are in place so usage can be tracked/billed later."
          />
        </div>

        {/* How-to */}
        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-slate-950/40 border-b border-slate-800">
            <h2 className="text-lg font-black text-white">How to use (prototype)</h2>
            <p className="text-sm text-slate-400 mt-1">
              This is the operator workflow we’ll polish as we integrate real aircraft data and customer accounts.
            </p>
          </div>

          <div className="p-5 space-y-5">
            <Step
              n={1}
              title="Launch the workspace"
              body="Click “Launch App”. You’ll start signed in as TEST (prototype user)."
            />
            <Step
              n={2}
              title="Select the flight details"
              body="Pick fleet, tail, flight number, origin, stopover (optional), destination, and date in the header."
            />
            <Step
              n={3}
              title="Import a manifest (demo)"
              body="Click Import (or Test Data) to generate a sample warehouse payload you can stage and load."
            />
            <Step
              n={4}
              title="Load cargo and monitor CG"
              body="Drag cargo from the warehouse onto aircraft positions. Watch the envelope and warnings update live."
            />
            <Step
              n={5}
              title="Finalize / NOTOC / Captain brief"
              body="Use the action buttons to generate paperwork outputs. These are prototype-grade and will mature."
            />
          </div>
        </div>

        {/* SEO-friendly copy blocks */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-black text-white">Who it’s for</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Loadmasters, dispatch, and operations teams who want a clear, repeatable cargo planning workflow with
              fast feedback on limits and risk.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-black text-white">What’s next</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Multi-user accounts, customer billing, operator-managed settings, and certified data integration. This page
              is a placeholder we can expand later for SEO (FAQ, examples, screenshots, and glossary).
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={onLaunchApp}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-bold border border-slate-700 flex items-center gap-2"
          >
            Go to the App <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-8 text-center text-[11px] text-slate-500">
          Prototype note: This tool is not a certified load control system yet. We’ll align to operator manuals and
          approved data sources as we mature the product.
        </div>
      </div>
    </div>
  );
};

function FeatureCard(props: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-center">
          {props.icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black text-white">{props.title}</div>
          <div className="mt-1 text-[12px] text-slate-400 leading-relaxed">{props.body}</div>
        </div>
      </div>
    </div>
  );
}

function Step(props: { n: number; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-300 font-black">
        {props.n}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-black text-white">{props.title}</div>
        <div className="mt-1 text-sm text-slate-300 leading-relaxed">{props.body}</div>
      </div>
    </div>
  );
}


