import React from 'react';
import type { ChangeRequestRecord, FormIdentifier } from '../../types/pcms';

function Box({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-white text-[10px] font-bold leading-none mr-1 align-middle">
      {checked ? '✓' : ''}
    </span>
  );
}

function OfficialHeader({
  title,
  rightBlock,
  shaded = false,
  leftShaded = false,
}: {
  title: React.ReactNode;
  rightBlock?: React.ReactNode;
  shaded?: boolean;
  leftShaded?: boolean;
}) {
  return (
    <table className="official-paper-table">
      <tbody>
        <tr>
          <td className={`w-[26%] align-middle ${leftShaded ? 'official-shade-bar' : ''}`}>
            <div className="flex items-center gap-2">
              <img
                src="/assets/aistudio/SakthiLogo_37b22494.png"
                alt="Sakthi Auto"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="text-[10px] font-bold leading-tight uppercase">
                SAKTHI
                <br />
                AUTO COMPONENT
                <br />
                LIMITED
              </div>
            </div>
          </td>
          <td className={`text-center align-middle ${shaded ? 'official-shade-bar' : ''}`}>
            <div className="text-[14px] font-bold tracking-wide uppercase leading-snug">
              {title}
            </div>
          </td>
          {rightBlock && (
            <td className={`w-[24%] align-middle text-[10px] ${shaded ? 'official-shade-bar' : ''}`}>
              {rightBlock}
            </td>
          )}
        </tr>
      </tbody>
    </table>
  );
}

export function PrintForm1PCRF({ record }: { record: ChangeRequestRecord }) {
  const f = record.form1;
  return (
    <div className="official-paper-sheet official-page-portrait">
      <div className="official-form-frame">
        <OfficialHeader title="PROCESS CHANGE REQUISITION FORM" />
        <table className="official-paper-table">
          <tbody>
            <tr>
              <td className="w-[15%] font-bold">REQUISITION BY :</td>
              <td className="w-[19%]">{f.requisitionBy}</td>
              <td className="w-[19%] font-bold">REQUISITIONER SIGN :</td>
              <td className="w-[17%]">{f.requisitionerSign}</td>
              <td className="w-[12%] font-bold">PCRF NO. :</td>
              <td className="w-[18%] font-mono font-bold">{f.pcrfNo}</td>
            </tr>
            <tr>
              <td className="font-bold">DEPARTMENT :</td>
              <td>{f.department}</td>
              <td className="font-bold">REQUISITIONER HOD SIGN :</td>
              <td>{f.requisitionerHodSign}</td>
              <td className="font-bold">DATE :</td>
              <td>{f.date}</td>
            </tr>
            <tr>
              <td className="font-bold">CUSTOMER :</td>
              <td>{f.customer}</td>
              <td className="font-bold">PART NAME :</td>
              <td>{f.partName}</td>
              <td className="font-bold">PART NO. :</td>
              <td className="font-mono">{f.partNo}</td>
            </tr>
            <tr>
              <td className="font-bold">CLASSIFICATION</td>
              <td colSpan={5}>
                <div className="grid grid-cols-4 gap-2 px-2">
                  {(['Man', 'Machine', 'Material', 'Method'] as const).map((c) => (
                    <span key={c} className="font-semibold uppercase text-center">
                      <Box checked={f.classifications.includes(c)} /> {c}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
            <tr className="official-shade-bar">
              <td colSpan={6} className="text-center font-bold uppercase">
                DETAILS OF CHANGE REQUIRED
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table">
          <thead>
            <tr className="official-shade-bar">
              <th className="w-[28%] text-center uppercase">PARTICULARS</th>
              <th className="w-[34%] text-center uppercase">CURRENT STATUS</th>
              <th className="w-[38%] text-center uppercase">CHANGE REQUIRED</th>
            </tr>
          </thead>
          <tbody>
            {f.particularsRows.map((row, idx) => (
              <tr key={row.id} className="h-28">
                <td>
                  {row.particulars === 'Any Other' && row.customParticular
                    ? `Any Other: ${row.customParticular}`
                    : row.particulars}
                </td>
                <td>{row.currentStatus}</td>
                <td>
                  <div className="flex justify-between gap-2 h-full">
                    <div className="flex-1">{row.changeRequired}</div>
                    {idx === 0 && (
                      <div className="shrink-0 pl-2 flex flex-col justify-center gap-1 text-[10px] font-bold">
                        <div>
                          F <Box checked={row.targetFacility === 'F'} />
                        </div>
                        <div>
                          M <Box checked={row.targetFacility === 'M'} />
                        </div>
                        <div>
                          F&amp;M <Box checked={row.targetFacility === 'F&M'} />
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            <tr className="official-shade-bar">
              <td colSpan={3} className="text-center font-bold uppercase">
                REASON FOR CHANGE REQUIRED
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="h-32">
                <div className="mb-1.5 flex flex-wrap items-center gap-5 text-[10px] font-semibold">
                  <span>
                    <Box checked={f.changeType === 'Product'} /> Product
                  </span>
                  <span>
                    <Box checked={f.changeType === 'Process'} /> Process
                  </span>
                  <span className="ml-2">
                    Applicable:{' '}
                    <Box checked={f.reasonFacilityApplicable === 'Foundry'} /> F &nbsp;
                    <Box checked={f.reasonFacilityApplicable === 'Machine Shop'} /> M &nbsp;
                    <Box checked={f.reasonFacilityApplicable === 'Both'} /> F&amp;M
                  </span>
                </div>
                <div>{f.reasonForChange}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table">
          <thead>
            <tr className="official-shade-bar">
              <th className="w-1/2 text-center uppercase" colSpan={2}>
                CFT COMMENTS - FOUNDRY
              </th>
              <th className="w-1/2 text-center uppercase" colSpan={2}>
                CFT COMMENTS - MACHINE SHOP
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} className="h-36">
                <div className="font-semibold text-[10px] mb-1">
                  Feasibility: {f.cftFoundryFeasibility}
                </div>
                <div>{f.cftCommentsFoundry}</div>
              </td>
              <td colSpan={2} className="h-36">
                <div className="font-semibold text-[10px] mb-1">
                  Feasibility: {f.cftMachineShopFeasibility}
                </div>
                <div>{f.cftCommentsMachineShop}</div>
              </td>
            </tr>
            <tr>
              <td className="w-[34%] font-bold">
                CFT Leader Signature : {f.cftLeaderFoundrySign}
              </td>
              <td className="w-[16%] font-bold">Date : {f.cftLeaderFoundryDate}</td>
              <td className="w-[34%] font-bold">
                CFT Leader Signature : {f.cftLeaderMachineShopSign}
              </td>
              <td className="w-[16%] font-bold">Date : {f.cftLeaderMachineShopDate}</td>
            </tr>
            <tr className="official-shade-bar">
              <td colSpan={4} className="text-center font-bold uppercase">
                INTERNAL APPROVAL
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="align-middle">
                <div className="flex items-center gap-8 mb-2">
                  <span>
                    <Box checked={f.internalApprovalStatus === 'Approved'} /> Approved
                  </span>
                  <span>
                    <Box checked={f.internalApprovalStatus === 'Rejected'} /> Rejected
                  </span>
                </div>
                <div>
                  <Box checked={f.internalApprovalStatus === 'Others'} /> If others, specify:{' '}
                  {f.internalApprovalOtherText}
                </div>
              </td>
              <td className="p-0!">
                <div className="border-b border-black px-1.5 py-1 text-center font-bold">
                  Approving Authority
                </div>
                <div className="px-1.5 py-1.5 text-center text-[10px]">
                  <div>{f.approvingAuthority || '—'}</div>
                  <div className="mt-1 font-semibold">
                    Signature: {f.approvingAuthoritySign}
                  </div>
                </div>
              </td>
              <td className="p-0!">
                <div className="border-b border-black px-1.5 py-1 text-center font-bold">
                  PLANT HEAD
                </div>
                <div className="px-1.5 py-1.5 text-center text-[10px] font-semibold">
                  {f.plantHeadApproval}
                  {f.plantHeadSign ? <div className="mt-0.5 font-normal">{f.plantHeadSign}</div> : null}
                </div>
              </td>
            </tr>
            <tr className="official-shade-bar">
              <td colSpan={4} className="text-center font-bold uppercase">
                CUSTOMER COMMUNICATION DETAIL
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="h-28">
                <div>{f.customerCommunicationDetail}</div>
                <div className="mt-2 text-[10px] font-semibold flex justify-between">
                  <span>
                    Change Reflection in SOP:{' '}
                    {f.changeReflectionInSOP ? `Yes (${f.sopDocumentRef})` : 'No'}
                  </span>
                  <span>Forwarded To: {f.forwardedTo}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 text-[10px] font-bold">
        QF/07/MRO-15, Rev.No: 03 dt 04.10.2021
      </div>
    </div>
  );
}

export function PrintForm2Feasibility({ record }: { record: ChangeRequestRecord }) {
  const f = record.form2;
  const sections = [
    { name: 'Manufacturing Process / Product Requirement', minRows: 5 },
    { name: 'System Requirement', minRows: 4 },
    { name: 'Inspection Requirement', minRows: 4 },
    { name: 'Any Other Requirement', minRows: 4 },
  ] as const;

  return (
    <div className="official-paper-sheet official-page-portrait">
      <div className="official-form-frame">
        <table className="official-paper-table">
          <tbody>
            <tr>
              <td className="w-[62%] align-middle">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/aistudio/SakthiLogo_37b22494.png"
                    alt="Sakthi Auto"
                    className="h-8 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[11px] font-bold leading-tight uppercase">
                    SAKTHI
                    <br />
                    AUTO COMPONENT
                    <br />
                    LIMITED
                  </div>
                </div>
              </td>
              <td className="w-[38%] align-middle text-[10px]">
                <div>
                  <strong>SL. No</strong>{' '}
                  <span className="text-[9px]">(of Change Request)</span> : {f.slNo}
                </div>
                <div className="mt-1">
                  <strong>Date</strong> : {f.date}
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-center py-1.5">
                <div className="text-[14px] font-bold tracking-wide uppercase">
                  FEASIBILITY REPORT FOR CHANGE REQUEST
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table">
          <tbody>
            <tr>
              <td className="w-1/2">
                <strong>FROM :</strong> {f.from}
              </td>
              <td className="w-1/2">
                <strong>TO :</strong> {f.to}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <strong>Part Name :-</strong> {f.partName}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <strong>Part No :-</strong> <span className="font-mono">{f.partNo}</span>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <strong>Customer :-</strong> {f.customer}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <strong>CATEGORY OF CHANGE (as per the change request):</strong>{' '}
                {f.categoryOfChange}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table">
          <thead>
            <tr className="text-center">
              <th className="w-[26%]"></th>
              <th className="w-[54%] uppercase">REQUIREMENTS OF THE CHANGE</th>
              <th className="w-[20%] uppercase">FEASIBLE / NOT FEASIBLE</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((sec) => {
              const actual = f.requirements.filter((r) => r.section === sec.name);
              const totalRows = Math.max(actual.length, sec.minRows);
              return (
                <React.Fragment key={sec.name}>
                  {Array.from({ length: totalRows }).map((_, idx) => {
                    const item = actual[idx];
                    return (
                      <tr key={`${sec.name}-${idx}`} className="h-5">
                        {idx === 0 && (
                          <td rowSpan={totalRows} className="font-bold align-middle text-center">
                            {sec.name}
                          </td>
                        )}
                        <td>{item ? item.description : ''}</td>
                        <td className="text-center font-semibold">
                          {item ? item.decision : ''}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
            <tr>
              <td colSpan={3} className="h-20">
                <div className="font-bold">
                  Additional Manufacturing or Inspection or other Resource requirement at Foundry /
                  Machine Shop
                </div>
                <div className="mt-1.5">{f.additionalResourceRequirement}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="font-bold align-middle">
                CONCLUSION :
              </td>
              <td>
                <div>
                  <Box checked={f.conclusion === 'FEASIBLE'} /> FEASIBLE
                </div>
                <div className="mt-1">
                  <Box checked={f.conclusion === 'NOT FEASIBLE'} /> NOT FEASIBLE
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table">
          <tbody>
            <tr>
              <td className="w-[26%] font-bold align-middle text-center">
                CFT MEMBERS SIGN / DATE
              </td>
              <td className="w-[74%]">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 py-0.5">
                  <div>
                    {f.cftSignatures.slice(0, 3).map((s) => (
                      <div key={s.slot} className="py-0.5">
                        {s.slot}. {s.name} {s.signed ? `(${s.date})` : ''}
                      </div>
                    ))}
                  </div>
                  <div>
                    {f.cftSignatures.slice(3, 6).map((s) => (
                      <div key={s.slot} className="py-0.5">
                        {s.slot}. {s.name} {s.signed ? `(${s.date})` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="h-20">
                <div className="grid grid-cols-12 gap-4 h-full">
                  <div className="col-span-7">
                    <strong>COMMENTS :-</strong>
                    <div className="mt-1">{f.comments}</div>
                  </div>
                  <div className="col-span-5">
                    <strong>FORWARDED TO :</strong> {f.forwardedTo}
                    <div className="mt-1 text-[10px]">
                      Acknowledgement: {f.acknowledgementStatus}{' '}
                      {f.acknowledgementDate ? `(${f.acknowledgementDate})` : ''}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 text-[10px] font-bold underline">
        QF / 07 / MRO - 02 · 10 / 06 / 2015
      </div>
    </div>
  );
}

export function PrintForm3RiskAnalysis({ record }: { record: ChangeRequestRecord }) {
  const f = record.form3;

  // Group consecutive rows by category so CATEGORY column uses rowSpan just like PDF page 3
  const groupedMeta = f.riskRows.map((row, idx) => {
    const isFirstInGroup = idx === 0 || f.riskRows[idx - 1].category !== row.category;
    let span = 0;
    if (isFirstInGroup) {
      for (let i = idx; i < f.riskRows.length && f.riskRows[i].category === row.category; i++) {
        span++;
      }
    }
    return { row, isFirstInGroup, span };
  });

  return (
    <div className="official-paper-sheet official-page-portrait">
      <div className="official-form-frame">
        <OfficialHeader title="RISK ANALYSIS CHECK SHEET" />
        <table className="official-paper-table">
          <tbody>
            <tr>
              <td className="w-1/2">
                <strong>PART NAME :</strong> {f.partName}
              </td>
              <td className="w-1/2">
                <strong>CUSTOMER :</strong> {f.customer}
              </td>
            </tr>
            <tr>
              <td>
                <strong>PART NO. :</strong> <span className="font-mono">{f.partNo}</span>
              </td>
              <td>
                <strong>DATE :</strong> {f.date}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table">
          <thead>
            <tr className="official-shade-bar text-center">
              <th rowSpan={2}>CATEGORY</th>
              <th rowSpan={2}>RISK POINTS</th>
              <th rowSpan={2}>CONTROL METHOD</th>
              <th colSpan={4}>RISK</th>
              <th rowSpan={2}>EFFECT ON QCD</th>
              <th rowSpan={2}>ACTIONS</th>
            </tr>
            <tr className="official-shade-bar text-center">
              <th>HIGH</th>
              <th>LOW</th>
              <th>MEDIUM</th>
              <th>NA</th>
            </tr>
          </thead>
          <tbody>
            {groupedMeta.map(({ row, isFirstInGroup, span }) => (
              <tr key={row.id}>
                {isFirstInGroup && (
                  <td rowSpan={span} className="font-bold text-center align-middle">
                    {row.category}
                  </td>
                )}
                <td>
                  {row.riskPoint}{' '}
                  <span className="text-[9px] text-neutral-500">({row.applicability})</span>
                </td>
                <td>{row.controlMethod}</td>
                <td className="text-center font-bold">{row.riskLevel === 'HIGH' ? '✓' : ''}</td>
                <td className="text-center font-bold">{row.riskLevel === 'LOW' ? '✓' : ''}</td>
                <td className="text-center font-bold">{row.riskLevel === 'MEDIUM' ? '✓' : ''}</td>
                <td className="text-center font-bold">{row.riskLevel === 'NA' ? '✓' : ''}</td>
                <td>{row.effectOnQCD}</td>
                <td>{row.actions}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={9} className="font-bold underline h-9">
                Conclusion
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="align-middle">
                <Box checked={f.conclusion === 'Acceptable'} /> Acceptable &nbsp;&nbsp;&nbsp;
                <Box checked={f.conclusion === 'Not Acceptable'} /> Not Acceptable
              </td>
              <td colSpan={5} className="font-bold official-shade-bar align-middle">
                Overall Risk level - &nbsp;
                <Box checked={f.overallRiskLevel === 'H'} /> H &nbsp;&nbsp;
                <Box checked={f.overallRiskLevel === 'L'} /> L &nbsp;&nbsp;
                <Box checked={f.overallRiskLevel === 'M'} /> M
              </td>
            </tr>
            <tr className="h-24 official-shade-bar">
              <td colSpan={3} className="font-bold">
                CFT Members Signature :
              </td>
              <td colSpan={3}>
                {f.cftSignatures.slice(0, 3).map((s) => (
                  <div key={s.slot} className="py-0.5">
                    {s.slot}) {s.name}
                  </div>
                ))}
              </td>
              <td colSpan={3}>
                {f.cftSignatures.slice(3, 6).map((s) => (
                  <div key={s.slot} className="py-0.5">
                    {s.slot}) {s.name}
                  </div>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 text-[10px] font-bold">QF/07/MKT-14, Rev.No.02 dt 13.02.2019</div>
    </div>
  );
}

export function PrintForm4TimingPlan({ record }: { record: ChangeRequestRecord }) {
  const f = record.form4;
  return (
    <div className="official-paper-sheet official-page-landscape">
      <div className="official-form-frame">
        <OfficialHeader
          title="TIMING PLAN"
          shaded
          rightBlock={
            <div className="text-[9px] space-y-1">
              <div>
                <Box checked={f.productTypeFlags.includes('AA')} /> AA &nbsp;
                <Box checked={f.productTypeFlags.includes('A')} /> A &nbsp; New Product
              </div>
              <div>
                <Box checked={f.productTypeFlags.includes('B')} /> B &nbsp;
                <Box checked={f.productTypeFlags.includes('C')} /> C &nbsp; Process/Product Change
              </div>
            </div>
          }
        />
        <table className="official-paper-table text-[10px]">
          <tbody>
            <tr>
              <td className="w-[34%]">
                <strong>Project Name:</strong> {f.projectName}
                <br />
                <strong>Customer:</strong> {f.customer}
              </td>
              <td className="w-[33%]">
                <strong>Drg.No / Part No :</strong> {f.drawingPartNo}
                <br />
                <strong>Product Name:</strong> {f.productName}
              </td>
              <td className="w-[33%]">
                <strong>Prepared Date:</strong> {f.preparedDate} · <strong>Last Rev:</strong>{' '}
                {f.lastRevDate}
                <br />
                <strong>Rev :</strong> {f.revision} · <strong>Page :</strong> 1 of 15
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table text-[9px]">
          <thead>
            <tr className="official-shade-bar text-center">
              <th rowSpan={2} colSpan={4} className="w-[26%]">
                Activity (Major milestones)
              </th>
              {f.monthLabels.map((m, i) => (
                <th key={i} colSpan={4}>
                  Month : {m}
                </th>
              ))}
              <th rowSpan={2} className="w-[14%]">
                Remarks
              </th>
            </tr>
            <tr className="official-shade-sub text-center">
              {f.monthLabels.map((_, mIdx) =>
                ['Ist', 'IInd', 'IIIrd', 'IVth'].map((w, wIdx) => (
                  <th key={`${mIdx}-${wIdx}`} className="w-3 px-[1px] text-[7.5px]">
                    {w}
                    <br />
                    Wk
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['Customer Time line', f.customerTimelineWeeks, f.customerTimelineRemarks],
                ['Internal time line', f.internalTimelineWeeks, f.internalTimelineRemarks],
                ['Tier 2 (Sub supplier) Time line if applicable', f.tier2TimelineWeeks, f.tier2TimelineRemarks],
              ] as const
            ).map(([lbl, wks, rem]) => (
              <tr key={lbl}>
                <td colSpan={4} className="font-bold">
                  {lbl}
                </td>
                {wks.map((on, i) => (
                  <td
                    key={i}
                    className={on ? 'bg-black' : ''}
                    style={
                      on
                        ? { backgroundColor: '#111111', boxShadow: 'inset 0 0 0 999px #111111' }
                        : undefined
                    }
                  />
                ))}
                <td>{rem}</td>
              </tr>
            ))}

            <tr className="official-shade-bar text-center font-bold">
              <th rowSpan={2} className="w-[6%]">
                APQP Phases
              </th>
              <th rowSpan={2} className="w-[14%]">
                Activity
              </th>
              <th rowSpan={2} colSpan={2} className="w-[6%]">
                Applica bility
              </th>
              {f.monthLabels.map((m, i) => (
                <th key={`m2-${i}`} colSpan={4}>
                  Month : {m}
                </th>
              ))}
              <th rowSpan={2}>Remarks</th>
            </tr>
            <tr className="official-shade-sub text-center font-bold">
              {f.monthLabels.map((_, mIdx) =>
                ['Ist', 'IInd', 'IIIrd', 'IVth'].map((w, wIdx) => (
                  <th key={`w2-${mIdx}-${wIdx}`} className="w-3 px-[1px] text-[7.5px]">
                    {w}
                    <br />
                    Wk
                  </th>
                )),
              )}
            </tr>

            {f.activities.map((act, actIdx) => (
              <React.Fragment key={act.id}>
                <tr>
                  {actIdx === 0 && (
                    <td
                      rowSpan={f.activities.length * 2}
                      className="font-bold text-center align-middle"
                    >
                      I Phase
                    </td>
                  )}
                  <td rowSpan={2}>
                    {act.activity} {act.isCritical ? '***' : ''}
                  </td>
                  <td rowSpan={2} className="text-center text-[8px] px-1">
                    {act.applicability}
                  </td>
                  <td className="text-center font-bold px-1 w-4">P</td>
                  {act.plannedWeeks.map((on, i) => (
                    <td
                      key={i}
                      className={on ? 'bg-[#F28C00]' : ''}
                      style={
                        on
                          ? { backgroundColor: '#F28C00', boxShadow: 'inset 0 0 0 999px #F28C00' }
                          : undefined
                      }
                    />
                  ))}
                  <td rowSpan={2}>{act.remarks}</td>
                </tr>
                <tr>
                  <td className="text-center font-bold px-1 w-4">A</td>
                  {act.actualWeeks.map((on, i) => (
                    <td
                      key={i}
                      className={on ? 'bg-black' : ''}
                      style={
                        on
                          ? { backgroundColor: '#111111', boxShadow: 'inset 0 0 0 999px #111111' }
                          : undefined
                      }
                    />
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <table className="official-paper-table text-[10px]">
          <tbody>
            <tr>
              <td colSpan={3} className="official-shade-bar text-center font-bold">
                REVIEWED BY
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="official-shade-sub">
                <Box checked={f.reviewMode.includes('Initial Plan')} /> Initial Plan &nbsp;&nbsp;&nbsp;&nbsp;
                <Box checked={f.reviewMode.includes('Actual Status')} /> Actual status &nbsp;&nbsp;&nbsp;&nbsp;
                <Box checked={f.reviewMode.includes('Plan for Remaining')} /> Plan for the remaining
                activities
                <span className="float-right">
                  *** = Critical process, it will affect the customer milestone
                </span>
              </td>
            </tr>
            <tr>
              <td className="w-[34%]">
                <strong>CFT Members:</strong>
                <div className="grid grid-cols-2 gap-x-2 mt-1">
                  {f.cftMembers.map((m, i) => (
                    <div key={i}>
                      {i + 1}. {m}
                    </div>
                  ))}
                </div>
              </td>
              <td className="w-[38%]">
                <strong>Remarks:</strong> {f.remarks}
                <div className="mt-3 font-bold">
                  Go for next Phase &nbsp;&nbsp;&nbsp;
                  <Box checked={f.goForNextPhase === 'Yes'} /> Yes &nbsp;&nbsp;
                  <Box checked={f.goForNextPhase === 'No'} /> No
                </div>
              </td>
              <td className="w-[28%]">
                <div>
                  <strong>CFT Leader:</strong> {f.cftLeaderSign}
                </div>
                <div className="mt-4">
                  <strong>Plant Head:</strong> {f.plantHeadSign}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-bold">
        <span>QF/07/MKT-08, Rev.No: 05 dt. 01.12.2024</span>
        <span>Page 1 of 15</span>
      </div>
    </div>
  );
}

export function PrintForm5Checklist({ record }: { record: ChangeRequestRecord }) {
  const f = record.form5;
  const pages: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

  return (
    <div className="official-paper-sheet space-y-6">
      {pages.map((pg) => {
        const items = f.items.filter((i) => i.page === pg);
        return (
          <div key={pg} className="print-page-break official-page-landscape">
            <div className="official-form-frame">
              <OfficialHeader
                title="CHECKLIST FOR MANAGING AND TRACKING CHANGE"
                shaded
                leftShaded
              />
              {pg === 1 && (
                <table className="official-paper-table">
                  <tbody>
                    <tr>
                      <td className="w-1/2">
                        <strong>PRODUCT CODE :-</strong> {f.productCode}
                      </td>
                      <td className="w-1/2">
                        <strong>CUSTOMER NAME :-</strong> {f.customerName}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>PRODUCT DESCRIPTION :-</strong> {f.productDescription}
                      </td>
                      <td>
                        <strong>CUSTOMER PART NO :-</strong> {f.customerPartNo}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
              <table className="official-paper-table text-[10px]">
                <thead>
                  <tr className="official-shade-bar text-center">
                    <th rowSpan={2} className="w-[24%]">
                      Impact of Change to be considered on
                    </th>
                    <th colSpan={2} className="w-[10%]">
                      Is affected ?
                    </th>
                    <th rowSpan={2} className="w-[18%]">
                      Action Comments
                    </th>
                    <th rowSpan={2} className="w-[12%]">
                      Responsibility
                    </th>
                    <th colSpan={2} className="w-[14%]">
                      Date
                    </th>
                    <th colSpan={2} className="w-[12%]">
                      Documents Changed
                    </th>
                    <th rowSpan={2} className="w-[10%]">
                      Remarks
                    </th>
                  </tr>
                  <tr className="official-shade-bar text-center">
                    <th>Yes</th>
                    <th>No</th>
                    <th>Reqd.</th>
                    <th>Actual</th>
                    <th>Doc. No.</th>
                    <th>Cur. Rev.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-semibold">{item.impactArea}</td>
                      <td className="text-center font-bold">
                        {item.isAffected === 'Yes' ? '✓' : ''}
                      </td>
                      <td className="text-center font-bold">
                        {item.isAffected === 'No' ? '✓' : ''}
                      </td>
                      <td>{item.actionComments}</td>
                      <td>{item.responsibility}</td>
                      <td className="font-mono text-[9px]">{item.reqdDate}</td>
                      <td className="font-mono text-[9px]">{item.actualDate}</td>
                      <td className="font-mono text-[9px]">{item.docNo}</td>
                      <td className="font-mono text-[9px]">{item.curRev}</td>
                      <td>{item.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pg === 4 && (
                <table className="official-paper-table text-[10px]">
                  <tbody>
                    <tr>
                      <td colSpan={4}>
                        <strong>
                          Actual date of implementation of change (By CFT &amp; Planning):
                        </strong>{' '}
                        {f.actualImplementationDate}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="h-14">
                        <strong>
                          Actions taken / Proposed on the Stock produce prior to modification (By
                          CFT &amp; Planning):
                        </strong>{' '}
                        {f.actionsOnStockProduced}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="h-14">
                        <strong>
                          Actions taken / Proposed on toolings of prior to modification (By CFT
                          &amp; Planning):
                        </strong>{' '}
                        {f.actionsOnToolings}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="h-16">
                        <strong>Any other Remarks :</strong> {f.otherRemarks}
                      </td>
                    </tr>
                    <tr className="official-shade-bar">
                      <td colSpan={4}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <strong>Informed to:</strong> &nbsp;
                            <Box checked={f.informedTo.customer} /> Customer &nbsp;
                            <Box checked={f.informedTo.marketing} /> Marketing &nbsp;
                            <Box checked={f.informedTo.planning} /> Planning &nbsp;
                            <Box checked={f.informedTo.production} /> Production &nbsp;
                            <Box checked={f.informedTo.qa} /> QA &nbsp;
                            <Box checked={f.informedTo.qc} /> QC
                          </span>
                          <span className="text-[9px] font-bold">CFT &amp; PLANNING</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[25%] font-bold">
                        <div>PREPARED AND SIGNED BY</div>
                        <div className="mt-1">CFT CORE TEAM :</div>
                        <div className="mt-1">ON ( DATE ) : {f.actualImplementationDate}</div>
                      </td>
                      {f.signOffs.map((s, idx) => (
                        <td key={idx} className="w-[25%]">
                          <div>SIGN : {s.sign}</div>
                          <div className="mt-1">NAME : {s.name}</div>
                          <div className="mt-1">TITLE : {s.title}</div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-1.5 flex justify-between text-[10px] font-bold">
              <span>QF / 07 / MRO - 03 · 01.12.2003</span>
              <span>Page No :- 0{pg} of 04</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PrintForm6PTR({ record }: { record: ChangeRequestRecord }) {
  const f = record.form6;
  return (
    <div className="official-paper-sheet official-page-portrait">
      <div className="official-form-frame">
        <OfficialHeader
          title="PTR INITIATION FORM"
          rightBlock={
            <div>
              <div>
                <strong>Date :</strong> {f.date}
              </div>
              <div className="mt-1">
                <strong>Page No. :</strong> 1 of 1
              </div>
            </div>
          }
        />
        <table className="official-paper-table">
          <tbody>
            <tr>
              <td className="w-[34%]">
                <strong>FROM :</strong> {f.from}
              </td>
              <td className="w-[36%]">
                <strong>DEPARTMENT :</strong> {f.department}
              </td>
              <td className="w-[30%]">
                <strong>TO :</strong> {f.to}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="text-center font-bold">
                DETAILS OF REQUEST
              </td>
            </tr>
            <tr>
              <td className="font-bold">Customer</td>
              <td colSpan={2}>{f.customer}</td>
            </tr>
            <tr>
              <td className="font-bold">Part Name / number</td>
              <td>{f.partNameNumber}</td>
              <td>
                <strong>Rev. Number:</strong> {f.revNumber}
              </td>
            </tr>
            <tr>
              <td className="font-bold">Reason</td>
              <td colSpan={2}>{f.reason}</td>
            </tr>
            <tr>
              <td className="font-bold">Date</td>
              <td>{f.requestDate}</td>
              <td>
                <strong>Signature:</strong> {f.requestSignature}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="text-center font-bold">
                FOR USE OF CFT
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table">
          <thead>
            <tr className="text-center">
              <th className="w-[7%]">S.No</th>
              <th className="w-[45%]">Description</th>
              <th className="w-[16%]">PTR 1</th>
              <th className="w-[16%]">PTR 2</th>
              <th className="w-[16%]">PTR 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-center">1</td>
              <td>If required</td>
              <td className="text-center official-shade-sub">{f.ptr1.required}</td>
              <td className="text-center official-shade-sub">{f.ptr2.required}</td>
              <td className="text-center official-shade-sub">{f.ptr3.required}</td>
            </tr>
            <tr>
              <td className="text-center">2</td>
              <td>Date of Production run (If required)</td>
              <td className="text-center">{f.ptr1.productionRunDate}</td>
              <td className="text-center">{f.ptr2.productionRunDate}</td>
              <td className="text-center">{f.ptr3.productionRunDate}</td>
            </tr>
            <tr>
              <td className="text-center">3</td>
              <td>Quantity Produced / unless otherwise customer specified qty</td>
              <td className="text-center">{f.ptr1.quantityProduced}</td>
              <td className="text-center">{f.ptr2.quantityProduced}</td>
              <td className="text-center">{f.ptr3.quantityProduced}</td>
            </tr>
            <tr>
              <td className="text-center">4</td>
              <td>Meet the drawing requirement / customer specific requirement</td>
              <td className="text-center">{f.ptr1.meetsDrawingReq}</td>
              <td className="text-center">{f.ptr2.meetsDrawingReq}</td>
              <td className="text-center">{f.ptr3.meetsDrawingReq}</td>
            </tr>
            <tr>
              <td className="text-center">5</td>
              <td>Sample submission required to Customer</td>
              <td className="text-center">{f.ptr1.sampleSubmissionReq}</td>
              <td className="text-center">{f.ptr2.sampleSubmissionReq}</td>
              <td className="text-center">{f.ptr3.sampleSubmissionReq}</td>
            </tr>
            <tr>
              <td className="text-center">6</td>
              <td>If required, sample submitted Date</td>
              <td className="text-center">{f.ptr1.sampleSubmittedDate}</td>
              <td className="text-center">{f.ptr2.sampleSubmittedDate}</td>
              <td className="text-center">{f.ptr3.sampleSubmittedDate}</td>
            </tr>
            <tr>
              <td className="text-center">7</td>
              <td>Status of the samples submitted</td>
              <td className="text-center font-bold official-shade-sub">{f.ptr1.sampleStatus}</td>
              <td className="text-center font-bold official-shade-sub">{f.ptr2.sampleStatus}</td>
              <td className="text-center font-bold official-shade-sub">{f.ptr3.sampleStatus}</td>
            </tr>
            <tr>
              <td colSpan={5} className="h-9">
                <strong>
                  Comments (If any) / Action plan (if PTR1 not met the Drawing requirement and
                  other customer specific requirement):
                </strong>{' '}
                {f.ptr1.actionPlanComments}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="h-9">
                <strong>
                  Comments (If any) / Action plan (if PTR2 not met the Drawing requirement and
                  other customer specific requirement):
                </strong>{' '}
                {f.ptr2.actionPlanComments}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="h-9">
                <strong>
                  Comments (If any) / Action plan (if PTR3 not met the Drawing requirement and
                  other customer specific requirement):
                </strong>{' '}
                {f.ptr3.actionPlanComments}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table">
          <thead>
            <tr className="text-center">
              <th colSpan={2}>Approved By Core Team</th>
              <th>PTR 1</th>
              <th>PTR 2</th>
              <th>PTR 3</th>
            </tr>
          </thead>
          <tbody>
            {f.coreTeamApprovals.map((row) => (
              <React.Fragment key={row.department}>
                <tr>
                  <td rowSpan={2} className="font-bold w-[22%] text-center align-middle">
                    {row.department}
                  </td>
                  <td className="w-[24%]">Comments / Status</td>
                  <td className="text-center official-shade-sub">
                    {row.ptr1Status}
                    {row.ptr1Comment ? ` — ${row.ptr1Comment}` : ''}
                  </td>
                  <td className="text-center official-shade-sub">
                    {row.ptr2Status}
                    {row.ptr2Comment ? ` — ${row.ptr2Comment}` : ''}
                  </td>
                  <td className="text-center official-shade-sub">
                    {row.ptr3Status}
                    {row.ptr3Comment ? ` — ${row.ptr3Comment}` : ''}
                  </td>
                </tr>
                <tr>
                  <td>Signature</td>
                  <td className="text-center">{row.ptr1Sign}</td>
                  <td className="text-center">{row.ptr2Sign}</td>
                  <td className="text-center">{row.ptr3Sign}</td>
                </tr>
              </React.Fragment>
            ))}
            <tr>
              <td colSpan={5} className="h-12">
                <strong>CFT Comments:</strong> {f.cftComments}
              </td>
            </tr>
            <tr>
              <td colSpan={5}>
                <div className="grid grid-cols-3 gap-3 font-bold text-[10px]">
                  <div>Break point date : {f.breakPointDate}</div>
                  <div>Invoice Details : {f.invoiceDetails}</div>
                  <div>Identification on Part/Box/Trolley : {f.identificationOnPartBoxTrolley}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 text-[10px] font-bold">QF /07/ MRO - 16 · 14.08.2017</div>
    </div>
  );
}

export function PrintForm7PPAP({ record }: { record: ChangeRequestRecord }) {
  const f = record.form7;
  return (
    <div className="official-paper-sheet official-page-portrait">
      <div className="official-form-frame">
        <OfficialHeader
          title={
            <>
              PPAP INITIATION FORM
              <br />
              CUM PRODUCTION REPORT
            </>
          }
          rightBlock={
            <div>
              <div>
                <strong>Date :</strong> {f.date}
              </div>
              <div className="mt-1">
                <strong>Page No. :</strong> 1 of 1
              </div>
            </div>
          }
        />
        <table className="official-paper-table">
          <tbody>
            <tr>
              <td colSpan={2} className="w-[68%]">
                <div>
                  <strong>FROM :</strong> {f.from}
                </div>
                <div className="mt-1">
                  <strong>DEPARTMENT :</strong> {f.department}
                </div>
              </td>
              <td className="w-[32%] align-middle">
                <strong>TO :</strong> {f.to}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="text-center font-bold py-1.5">
                DETAILS OF REQUEST
              </td>
            </tr>
            <tr>
              <td className="w-[26%] font-bold">Customer</td>
              <td colSpan={2}>{f.customer}</td>
            </tr>
            <tr>
              <td className="font-bold">Part Name / number</td>
              <td colSpan={2}>{f.partNameNumber}</td>
            </tr>
            <tr>
              <td className="font-bold">Rev. Number</td>
              <td colSpan={2}>{f.revNumber}</td>
            </tr>
            <tr>
              <td className="font-bold">Reason</td>
              <td colSpan={2}>{f.reason}</td>
            </tr>
            <tr>
              <td className="font-bold">Date</td>
              <td className="w-[42%]">{f.requestDate}</td>
              <td>
                <strong>Signature :</strong> {f.requestSignature}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="text-center font-bold py-1.5">
                FOR USE OF CFT
              </td>
            </tr>
            <tr>
              <td colSpan={2}>1) Date of first production run :</td>
              <td>{f.firstProductionRunDate}</td>
            </tr>
            <tr>
              <td colSpan={2}>
                2) Quantity Produced (as per customer requirement or 300 Nos or 1 Day Production qty)
                :
              </td>
              <td>{f.quantityProduced}</td>
            </tr>
            <tr>
              <td colSpan={2}>3) Cycle time / Production Rate :</td>
              <td>{f.cycleTimeProductionRate}</td>
            </tr>
            <tr>
              <td>4) Process Flow Diagram Number : {f.pfdNumber}</td>
              <td>Rev No : {f.pfdRevNo}</td>
              <td>Date : {f.pfdDate}</td>
            </tr>
            <tr>
              <td>5) Control Plan Number : {f.controlPlanNumber}</td>
              <td>Rev No : {f.controlPlanRevNo}</td>
              <td>Date : {f.controlPlanDate}</td>
            </tr>
            <tr>
              <td colSpan={2}>6) Any Deviations to process flow routing :</td>
              <td>
                <Box checked={f.deviationsToProcessFlow === 'Yes'} /> Yes &nbsp;&nbsp;&nbsp;
                <Box checked={f.deviationsToProcessFlow === 'No'} /> No
              </td>
            </tr>
            <tr>
              <td colSpan={2}>7) If yes - Nature of Deviation :</td>
              <td>{f.processFlowDeviationNature}</td>
            </tr>
            <tr>
              <td colSpan={2}>8) Any Deviations to Control Plan :</td>
              <td>
                <Box checked={f.deviationsToControlPlan === 'Yes'} /> Yes &nbsp;&nbsp;&nbsp;
                <Box checked={f.deviationsToControlPlan === 'No'} /> No
              </td>
            </tr>
            <tr>
              <td colSpan={2}>9) If yes - Nature of Deviation :</td>
              <td>{f.controlPlanDeviationNature}</td>
            </tr>
            <tr>
              <td colSpan={2}>10) PSW internal approval on :</td>
              <td>{f.pswInternalApprovalDate}</td>
            </tr>
            <tr>
              <td colSpan={2}>11) Submission Required :</td>
              <td>
                <Box checked={f.submissionRequired === 'Yes'} /> Yes &nbsp;&nbsp;&nbsp;
                <Box checked={f.submissionRequired === 'No'} /> No
              </td>
            </tr>
            <tr>
              <td colSpan={2}>12) If required, status of submission :</td>
              <td>{f.submissionStatus}</td>
            </tr>
            <tr>
              <td colSpan={2}>13) Product Dispatch Authorisation By :</td>
              <td>{f.productDispatchAuthBy}</td>
            </tr>
          </tbody>
        </table>

        <table className="official-paper-table">
          <tbody>
            <tr className="h-24 official-shade-bar">
              <td className="w-[22%] font-bold align-middle">
                Approved By
                <br />
                Core Team
              </td>
              {f.coreTeamSignOffs.map((s, idx) => (
                <td key={idx} className="w-[26%]">
                  <div>Sign : {s.sign}</div>
                  <div className="mt-2">Name : {s.name}</div>
                  <div className="mt-2">Date : {s.date}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 text-[10px] font-bold">QF /07/ MRO - 05 · 20.08.2016</div>
    </div>
  );
}

export function OfficialFormRenderer({
  record,
  formKey,
}: {
  record: ChangeRequestRecord;
  formKey: FormIdentifier;
}) {
  switch (formKey) {
    case 'form1':
      return <PrintForm1PCRF record={record} />;
    case 'form2':
      return <PrintForm2Feasibility record={record} />;
    case 'form3':
      return <PrintForm3RiskAnalysis record={record} />;
    case 'form4':
      return <PrintForm4TimingPlan record={record} />;
    case 'form5':
      return <PrintForm5Checklist record={record} />;
    case 'form6':
      return <PrintForm6PTR record={record} />;
    case 'form7':
      return <PrintForm7PPAP record={record} />;
    default:
      return null;
  }
}
