import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import type { ChangeRequestRecord, FormIdentifier } from '../../types/pcms';
import { OfficialFormRenderer } from './OfficialFormsPrintTemplates';

interface OfficialFormPrintModalProps {
  record: ChangeRequestRecord;
  initialForm: FormIdentifier;
  onClose: () => void;
}

const FORM_OPTIONS: Array<{ key: FormIdentifier; label: string; code: string }> = [
  { key: 'form1', label: '1. PCRF', code: 'QF/07/MRO-15' },
  { key: 'form2', label: '2. Feasibility', code: 'QF/07/MRO-02' },
  { key: 'form3', label: '3. Risk Analysis', code: 'QF/07/MKT-14' },
  { key: 'form4', label: '4. Timing Plan', code: 'QF/07/MKT-08' },
  { key: 'form5', label: '5. Checklist (4 Pg)', code: 'QF/07/MRO-03' },
  { key: 'form6', label: '6. PTR Form', code: 'QF/07/MRO-16' },
  { key: 'form7', label: '7. PPAP Report', code: 'QF/07/MRO-05' },
];

export function OfficialFormPrintModal({
  record,
  initialForm,
  onClose,
}: OfficialFormPrintModalProps) {
  const [activeForm, setActiveForm] = useState<FormIdentifier>(initialForm);
  const isLandscape = activeForm === 'form4' || activeForm === 'form5';

  useEffect(() => {
    document.body.dataset.printingOfficialForm = activeForm;
    return () => {
      delete document.body.dataset.printingOfficialForm;
    };
  }, [activeForm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Official Form Print Preview"
      className="fixed inset-0 z-50 bg-[#151515]/85 backdrop-blur-xs flex flex-col overflow-y-auto no-scrollbar official-print-portal"
    >
      <style>{`
        @media print {
          @page {
            size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
            margin: ${isLandscape ? '6mm' : '7mm'};
          }
        }
      `}</style>

      {/* Toolbar (hidden during print) */}
      <div className="bg-[#151515] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 no-print border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F28C00]">
            Official Printable Format · {record.pcrfNo}
          </span>
          <div className="flex flex-wrap gap-1">
            {FORM_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setActiveForm(opt.key)}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  activeForm === opt.key
                    ? 'bg-[#F28C00] text-white'
                    : 'bg-[#242424] text-neutral-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden md:inline-block text-[11px] font-mono text-neutral-400">
            {isLandscape ? 'A4 Landscape' : 'A4 Portrait'}
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
          <button
            type="button"
            aria-label="Close print preview"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#242424] hover:bg-white/10 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Paper Sheet Container */}
      <div className="flex-1 w-full max-w-full p-3 sm:p-8 overflow-x-auto no-scrollbar official-print-stage">
        <div
          className={`bg-white mx-auto shadow-2xl p-6 official-print-paper ${
            isLandscape
              ? 'w-fit min-w-[1040px] max-w-[1200px]'
              : 'w-full min-w-[760px] max-w-[880px]'
          }`}
        >
          <OfficialFormRenderer record={record} formKey={activeForm} />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
