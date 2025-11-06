'use client';
import { useMemo, useState, useEffect } from 'react';
import { SETUP_STEPS, TOTAL_STEPS } from '../constants/steps.js';

// Step components (same folder)
import Step1CompanyInfo from './Step1CompanyInfo';
import Step2Address from './Step2Address';
import Step3TaxInfo from './Step3TaxInfo';
import Step4Currency from './Step4Currency';
import Step5Logo from './Step5Logo';
import Step6Modules from './Step6Modules';
import Step7Review from './Step7Review';
import { leftArrow, rightArrow } from '@/utils/SVG.jsx';

const COMPONENTS = {
  companyBasics: Step1CompanyInfo,
  address: Step2Address,
  taxInfo: Step3TaxInfo,
  localization: Step4Currency,
  logo: Step5Logo,
  modules: Step6Modules,
  review: Step7Review,
};

/**
 * WizardShell — lightweight controller for the 7-step company setup.
 *
 * Props:
 * - formData: object — full company object used by steps
 * - setupProgress: object — e.g., { companyBasics: true, address: false, ... }
 * - serverProgress: object — server-confirmed progress (optional)
 * - saving: boolean — global saving indicator (optional)
 * - onSave: function(stepKey, partialPayload) => Promise  — caller persists data
 * - onFinish: function() => Promise  — finalize setup
 */
export default function WizardShell({ formData, setupProgress = {}, serverProgress = {}, saving = false, onSave, onFinish }) {
  // Use ONLY server-confirmed progress for percent & checkmarks
  const progressSource = serverProgress || {};

  // First incomplete step, else last completed, else 0
  const initialIndex = useMemo(() => {
    const firstIncomplete = SETUP_STEPS.findIndex(s => !progressSource?.[s.key]);
    if (firstIncomplete >= 0) return firstIncomplete;
    // all complete -> review
    const reviewIndex = SETUP_STEPS.findIndex(s => s.key === 'review');
    return reviewIndex >= 0 ? reviewIndex : 0;
  }, [progressSource]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeStep = SETUP_STEPS[activeIndex];
  const ActiveComponent = COMPONENTS[activeStep.key] || (() => null);
  // console.log("activeStep", activeStep)
  // console.log("formData", formData)
  const [isValid, setIsValid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [drafts, setDrafts] = useState({});
  const updateDraft = (key, partial) => {
    setDrafts(prev => ({ ...prev, [key]: partial }));
  };

  // Reset validity/dirty when step changes
  useEffect(() => {
    setIsValid(true);
    setIsDirty(false);
  }, [activeIndex]);

  const percent = useMemo(() => {
    const done = SETUP_STEPS.reduce((acc, s) => acc + (progressSource?.[s.key] ? 1 : 0), 0);
    return Math.round((done / TOTAL_STEPS) * 100);
  }, [progressSource]);

  function goNext() {
    setActiveIndex(i => Math.min(i + 1, SETUP_STEPS.length - 1));
  }
  function goBack() {
    setActiveIndex(i => Math.max(i - 1, 0));
  }
  function goTo(index) {
    setActiveIndex(() => Math.min(Math.max(index, 0), SETUP_STEPS.length - 1));
  }

  async function handleSave(partial) {
    if (typeof onSave !== 'function') return false;
    try {
      const payload = (partial && Object.keys(partial).length > 0)
        ? partial
        : (drafts[activeStep.key] || {});
      console.log("payload: ", payload, partial)
      const ok = await onSave(activeStep.key, payload);
      return ok !== false;
    } catch (e) {
      return false;
    }
  }

  async function handleSaveAndNext(partial) {
    if (!isValid) return; // don't proceed if current step invalid
    const ok = await handleSave(partial);
    if (ok) {
      goNext();
    }
  }

  return (
    <div className="w-full grid grid-cols-12 gap-6 h-full overflow-hidden">
      {/* Sidebar: step list */}
      <aside className="col-span-12 md:col-span-3 lg:col-span-3 rounded-md p-3 max-h-full overflow-hidden flex flex-col ">
        <div className="mb-3">
          <div className="text-sm">Setup Progress</div>
          <div className="w-full  h-2 rounded bg-most my-1">
            <div className="h-2 rounded bg-green-600" style={{ width: `${percent}%` }} />
          </div>
          <div className="text-xs mt-1">{percent}% complete</div>
        </div>
        <ol className="flex flex-col gap-2 overflow-auto max-h-full">
          {SETUP_STEPS.map((s, idx) => {
            const done = !!progressSource?.[s.key];
            const isActive = idx === activeIndex;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => goTo(idx)}
                  className={`w-full text-left px-3 py-2 border-l-[10px] hover:bg-white-100/50 ${isActive ? 'bg-white-100 ' : ''
                    } ${done ? ' border-green-500' : ' border-white-100'
                    }`}
                >
                  <span className="text-sm font-medium">{s.label}</span>

                </button>
              </li>
            );
          }
          )}
        </ol>
      </aside>

      {/* Main panel: active step */}
      <section className="col-span-12 md:col-span-9 lg:col-span-9 bg-most rounded-lg border border-color-100 overflow-hidden text-secondary-text max-h-full h-fit flex flex-col">
        <header className="flex p-4 items-center justify-between">
          <h2 className="text-lg font-semibold">{activeStep.label}</h2>
          <div className="text-xs text-gray-500">Step {activeIndex + 1} of {TOTAL_STEPS}</div>
        </header>
        <div className="max-h-full px-4 overflow-auto">
          <ActiveComponent
            values={formData}
            saving={saving}
            onSave={handleSave}
            onNext={goNext}
            onBack={goBack}
            onValidityChange={setIsValid}
            onDirtyChange={setIsDirty}
            onPartialChange={(partial) => updateDraft(activeStep.key, partial)}
          />
        </div>
        {/* Footer controls (optional) */}
        <div className="p-4 flex items-center justify-between">
          <div className='flex gap-2'>
            <div className="relative group">
              <button
                type="button"
                onClick={goBack}
                disabled={activeIndex === 0 || saving}
                className="btn-ghost disabled:opacity-50 flex items-center justify-center"
                aria-label="Back"
                title="Back"
              >
                <span className='text-lg transition-all duration-300 group-hover:-translate-x-1'>{leftArrow()}</span>
              </button>
              {/* Tooltip */}
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] rounded px-2 py-1 bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow">
                Back
              </span>
            </div>
            <div className="relative group">
              <button
                type="button"
                onClick={goNext}
                disabled={!isValid || activeIndex === SETUP_STEPS.length - 1}
                className="btn-ghost disabled:opacity-50 rotate-180"
                aria-label="Next"
                title="Next"
              >
                <span className='text-lg transition-all duration-300 group-hover:-translate-x-1'>{rightArrow()}</span>
              </button>
              {/* Tooltip */}
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] rounded px-2 py-1 bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow">
                Next
              </span>
            </div>
          </div>

          {activeStep.key !== 'review' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving || !isDirty || !isValid}
                className="btn-border disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => handleSaveAndNext()}
                disabled={saving || !isValid}
                className="btn-primary disabled:opacity-50"
              >
                Save & Next
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onFinish}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
              autoFocus
            >
              Finish Setup
            </button>
          )}
        </div>
      </section>
    </div>
  );
}