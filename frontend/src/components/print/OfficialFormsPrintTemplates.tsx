import React from 'react';
import type { ChangeRequestRecord, FormIdentifier } from '../../types/pcms';

function Box({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[10px] font-bold leading-none mr-1 align-middle">
      {checked ? '✓' : ''}
    </span>
  );
}

function OfficialHeader({
  title,
  rightBlock,
}: {
  title: string;
  rightBlock?: React.ReactNode;
}) {
  return (
    <table className="official-paper-table mb-0">
      <tbody>
        <tr>
          <td className="w-[26%] align-middle">
            <div className="flex items-center gap-2">
              <img
                src="/assets/aistudio/SakthiLogo_37b22494.png"
                alt="Sakthi Auto"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="text-[10px] font-bold leading-tight uppercase">
                SAKTHI<br />
                AUTO COMPONENT<br />
                LIMITED
              </div>
            </div>
          </td>
          <td className="text-center align-middle">
            <div className="text-[14px] font-bold tracking-wide uppercase">{title}</div>
          </td>
          {rightBlock && <td className="w-[24%] align-middle text-[10px]">{rightBlock}</td>}
        </tr>
      </tbody>
    </table>
  );
}

export function PrintForm1PCRF({ record }: { record: ChangeRequestRecord }) {
  const f = record.form1;
  return (
    <div className="official-paper-sheet p-2">
      <OfficialHeader title="PROCESS CHANGE REQUISITION FORM" />
      <table className="official-paper-table border-t-0">
        <tbody>
          <tr>
            <td className="w-[16%] font-bold">REQUISITION BY</td>
            <td className="w-[20%]">{f.requisitionBy}</td>
            <td className="w-[18%] font-bold">REQUISITIONER SIGN</td>
            <td className="w-[16%]">{f.requisitionerSign}</td>
            <td className="w-[13%] font-bold">PCRF NO.</td>
            <td className="w-[17%] font-mono font-bold">{f.pcrfNo}</td>
          </tr>
          <tr>
            <td className="font-bold">DEPARTMENT</td>
            <td>{f.department}</td>
            <td className="font-bold">REQUISITIONER HOD SIGN</td>
            <td>{f.requisitionerHodSign}</td>
            <td className="font-bold">DATE</td>
            <td>{f.date}</td>
          </tr>
          <tr>
            <td className="font-bold">CUSTOMER</td>
            <td>{f.customer}</td>
            <td className="font-bold">PART NAME</td>
            <td>{f.partName}</td>
            <td className="font-bold">PART NO.</td>
            <td className="font-mono">{f.partNo}</td>
          </tr>
          <tr>
            <td className="font-bold">CLASSIFICATION</td>
            <td colSpan={5}>
              <div className="flex items-center justify-between px-2">
                {(['Man', 'Machine', 'Material', 'Method'] as const).map((c) => (
                  <span key={c} className="font-semibold uppercase">
                    <Box checked={f.classifications.includes(c)} /> {c}
                  </span>
                ))}
                <span className="border-l border-black pl-3 font-semibold">
                  Type: <Box checked={f.changeType === 'Product'} /> Product{' '}
                  <Box checked={f.changeType === 'Process'} /> Process
                </span>
                <span className="border-l border-black pl-3 font-semibold">
                  Scope: <Box checked={f.facilityScope === 'Foundry' || f.facilityScope === 'Foundry & Machine Shop'} /> F{' '}
                  <Box checked={f.facilityScope === 'Machine Shop' || f.facilityScope === 'Foundry & Machine Shop'} /> M{' '}
                  <Box checked={f.facilityScope === 'Foundry & Machine Shop'} /> F&amp;M
                </span>
              </div>
            </td>
          </tr>
          <tr className="bg-neutral-100">
            <td colSpan={6} className="text-center font-bold uppercase">
              DETAILS OF CHANGE REQUIRED
            </td>
          </tr>
        </tbody>
      </table>

      <table className="official-paper-table border-t-0">
        <thead>
          <tr className="bg-neutral-50">
            <th className="w-[28%] text-center uppercase">PARTICULARS</th>
            <th className="w-[32%] text-center uppercase">CURRENT STATUS</th>
            <th className="w-[32%] text-center uppercase">CHANGE REQUIRED</th>
            <th className="w-[8%] text-center uppercase">FACILITY</th>
          </tr>
        </thead>
        <tbody>
          {f.particularsRows.map((row) => (
            <tr key={row.id} className="h-14">
              <td>
                {row.particulars === 'Any Other' && row.customParticular
                  ? `Any Other: ${row.customParticular}`
                  : row.particulars}
              </td>
              <td>{row.currentStatus}</td>
              <td>{row.changeRequired}</td>
              <td className="text-center font-bold">{row.targetFacility}</td>
            </tr>
          ))}
          <tr className="bg-neutral-100">
            <td colSpan={4} className="text-center font-bold uppercase">
              REASON FOR CHANGE REQUIRED
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="h-20">
              <div className="mb-1 font-semibold text-[10px]">
                Category: {f.changeType} · Applicable Facility: {f.reasonFacilityApplicable}
              </div>
              <div>{f.reasonForChange}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="official-paper-table border-t-0">
        <thead>
          <tr className="bg-neutral-100">
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
            <td colSpan={2} className="h-24">
              <div className="font-semibold text-[10px] mb-1">
                Feasibility: {f.cftFoundryFeasibility}
              </div>
              <div>{f.cftCommentsFoundry}</div>
            </td>
            <td colSpan={2} className="h-24">
              <div className="font-semibold text-[10px] mb-1">
                Feasibility: {f.cftMachineShopFeasibility}
              </div>
              <div>{f.cftCommentsMachineShop}</div>
            </td>
          </tr>
          <tr>
            <td className="w-[32%] font-bold">CFT Leader Signature : {f.cftLeaderFoundrySign}</td>
            <td className="w-[18%] font-bold">Date : {f.cftLeaderFoundryDate}</td>
            <td className="w-[32%] font-bold">CFT Leader Signature : {f.cftLeaderMachineShopSign}</td>
            <td className="w-[18%] font-bold">Date : {f.cftLeaderMachineShopDate}</td>
          </tr>
          <tr className="bg-neutral-100">
            <td colSpan={4} className="text-center font-bold uppercase">
              INTERNAL APPROVAL
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <div className="flex items-center gap-6 mb-1.5">
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
            <td>
              <div className="font-bold">Approving Authority: {f.approvingAuthority}</div>
              <div className="mt-1">Signature: {f.approvingAuthoritySign}</div>
            </td>
            <td>
              <div className="font-bold text-center">PLANT HEAD</div>
              <div className="mt-1 text-center font-semibold">
                {f.plantHeadApproval} {f.plantHeadSign ? `— ${f.plantHeadSign}` : ''}
              </div>
            </td>
          </tr>
          <tr className="bg-neutral-100">
            <td colSpan={4} className="text-center font-bold uppercase">
              CUSTOMER COMMUNICATION DETAIL
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="h-16">
              <div>{f.customerCommunicationDetail}</div>
              <div className="mt-2 text-[10px] font-semibold flex justify-between">
                <span>
                  Change Reflection in SOP: {f.changeReflectionInSOP ? `Yes (${f.sopDocumentRef})` : 'No'}
                </span>
                <span>Forwarded To: {f.forwardedTo}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-1 text-[10px] font-bold">QF/07/MRO-15, Rev.No: 03 dt 04.10.2021</div>
    </div>
  );
}

export function PrintForm2Feasibility({ record }: { record: ChangeRequestRecord }) {
  const f = record.form2;
  const sections = [
    'Manufacturing Process / Product Requirement',
    'System Requirement',
    'Inspection Requirement',
    'Any Other Requirement',
  ] as const;

  return (
    <div className="official-paper-sheet p-2">
      <OfficialHeader
        title="FEASIBILITY REPORT FOR CHANGE REQUEST"
        rightBlock={
          <div>
            <div>
              <strong>SL. No:</strong> {f.slNo}
            </div>
            <div className="mt-1">
              <strong>Date:</strong> {f.date}
            </div>
          </div>
        }
      />
      <table className="official-paper-table border-t-0">
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
              <strong>Part No :-</strong> {f.partNo}
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <strong>Customer :-</strong> {f.customer}
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <strong>CATEGORY OF CHANGE (as per the change request):</strong> {f.categoryOfChange}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="official-paper-table border-t-0">
        <thead>
          <tr className="bg-neutral-100">
            <th className="w-[26%]"></th>
            <th className="w-[54%] text-center">REQUIREMENTS OF THE CHANGE</th>
            <th className="w-[20%] text-center">FEASIBLE / NOT FEASIBLE</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((sec) => {
            const items = f.requirements.filter((r) => r.section === sec);
            return (
              <React.Fragment key={sec}>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    {idx === 0 && (
                      <td rowSpan={items.length} className="font-bold align-middle">
                        {sec}
                      </td>
                    )}
                    <td>{item.description}</td>
                    <td className="text-center font-semibold">{item.decision}</td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
          <tr>
            <td colSpan={3} className="h-16">
              <div className="font-bold">
                Additional Manufacturing or Inspection or other Resource requirement at Foundry / Machine Shop:
              </div>
              <div className="mt-1">{f.additionalResourceRequirement}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="font-bold">
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

      <table className="official-paper-table border-t-0">
        <tbody>
          <tr>
            <td className="w-[24%] font-bold align-middle">CFT MEMBERS SIGN / DATE</td>
            <td className="w-[38%]">
              {f.cftSignatures.slice(0, 3).map((s) => (
                <div key={s.slot} className="py-0.5">
                  {s.slot}. {s.name} {s.signed ? `(${s.date})` : ''}
                </div>
              ))}
            </td>
            <td className="w-[38%]">
              {f.cftSignatures.slice(3, 6).map((s) => (
                <div key={s.slot} className="py-0.5">
                  {s.slot}. {s.name} {s.signed ? `(${s.date})` : ''}
                </div>
              ))}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="h-14">
              <strong>COMMENTS :-</strong> {f.comments}
            </td>
            <td>
              <div>
                <strong>FORWARDED TO :</strong> {f.forwardedTo}
              </div>
              <div className="mt-1 text-[10px]">
                Acknowledgement: {f.acknowledgementStatus}{' '}
                {f.acknowledgementDate ? `(${f.acknowledgementDate})` : ''}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-1 text-[10px] font-bold underline">QF / 07 / MRO - 02 · 10 / 06 / 2015</div>
    </div>
  );
}

export function PrintForm3RiskAnalysis({ record }: { record: ChangeRequestRecord }) {
  const f = record.form3;
  return (
    <div className="official-paper-sheet p-2">
      <OfficialHeader title="RISK ANALYSIS CHECK SHEET" />
      <table className="official-paper-table border-t-0">
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

      <table className="official-paper-table border-t-0">
        <thead>
          <tr className="bg-neutral-100 text-center">
            <th rowSpan={2}>CATEGORY</th>
            <th rowSpan={2}>RISK POINTS</th>
            <th rowSpan={2}>CONTROL METHOD</th>
            <th colSpan={4}>RISK</th>
            <th rowSpan={2}>EFFECT ON QCD</th>
            <th rowSpan={2}>ACTIONS</th>
          </tr>
          <tr className="bg-neutral-100 text-center">
            <th>HIGH</th>
            <th>LOW</th>
            <th>MEDIUM</th>
            <th>NA</th>
          </tr>
        </thead>
        <tbody>
          {f.riskRows.map((row) => (
            <tr key={row.id}>
              <td className="font-bold">{row.category}</td>
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
            <td colSpan={9} className="font-bold underline">
              Conclusion
            </td>
          </tr>
          <tr>
            <td colSpan={4}>
              <Box checked={f.conclusion === 'Acceptable'} /> Acceptable &nbsp;&nbsp;&nbsp;
              <Box checked={f.conclusion === 'Not Acceptable'} /> Not Acceptable
            </td>
            <td colSpan={5} className="font-bold">
              Overall Risk level - &nbsp;
              <Box checked={f.overallRiskLevel === 'H'} /> H &nbsp;&nbsp;
              <Box checked={f.overallRiskLevel === 'L'} /> L &nbsp;&nbsp;
              <Box checked={f.overallRiskLevel === 'M'} /> M
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="font-bold">
              CFT Members Signature :
            </td>
            <td colSpan={3}>
              {f.cftSignatures.slice(0, 3).map((s) => (
                <div key={s.slot}>
                  {s.slot}) {s.name}
                </div>
              ))}
            </td>
            <td colSpan={3}>
              {f.cftSignatures.slice(3, 6).map((s) => (
                <div key={s.slot}>
                  {s.slot}) {s.name}
                </div>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-1 text-[10px] font-bold">QF/07/MKT-14, Rev.No.02 dt 13.02.2019</div>
    </div>
  );
}

export function PrintForm4TimingPlan({ record }: { record: ChangeRequestRecord }) {
  const f = record.form4;
  return (
    <div className="official-paper-sheet p-2">
      <OfficialHeader
        title="TIMING PLAN"
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
      <table className="official-paper-table border-t-0 text-[10px]">
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
              <strong>Prepared Date:</strong> {f.preparedDate} · <strong>Last Rev:</strong> {f.lastRevDate}
              <br />
              <strong>Rev :</strong> {f.revision} · <strong>Page :</strong> 1 of 15
            </td>
          </tr>
        </tbody>
      </table>

      <table className="official-paper-table border-t-0 text-[9px]">
        <thead>
          <tr className="bg-neutral-100 text-center">
            <th rowSpan={2} className="w-[22%]">
              Activity (Major milestones) / APQP Phases
            </th>
            <th rowSpan={2} className="w-[8%]">
              Applicability
            </th>
            <th rowSpan={2} className="w-[4%]">
              P/A
            </th>
            {f.monthLabels.map((m, i) => (
              <th key={i} colSpan={4}>
                {m}
              </th>
            ))}
            <th rowSpan={2} className="w-[14%]">
              Remarks
            </th>
          </tr>
          <tr className="bg-neutral-50 text-center">
            {f.monthLabels.map((_, mIdx) =>
              ['I', 'II', 'III', 'IV'].map((w, wIdx) => (
                <th key={`${mIdx}-${wIdx}`} className="w-3 px-[2px] text-[8px]">
                  {w}
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
              ['Tier 2 (Sub supplier) Time line', f.tier2TimelineWeeks, f.tier2TimelineRemarks],
            ] as const
          ).map(([lbl, wks, rem]) => (
            <tr key={lbl}>
              <td colSpan={2} className="font-bold">
                {lbl}
              </td>
              <td className="text-center font-bold">TL</td>
              {wks.map((on, i) => (
                <td key={i} className={on ? 'bg-black' : ''} />
              ))}
              <td>{rem}</td>
            </tr>
          ))}
          {f.activities.map((act) => (
            <React.Fragment key={act.id}>
              <tr>
                <td rowSpan={2}>
                  {act.activity} {act.isCritical ? '***' : ''}
                </td>
                <td rowSpan={2} className="text-center">
                  {act.applicability}
                </td>
                <td className="text-center font-bold">P</td>
                {act.plannedWeeks.map((on, i) => (
                  <td key={i} className={on ? 'bg-[#F28C00]' : ''} />
                ))}
                <td rowSpan={2}>{act.remarks}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">A</td>
                {act.actualWeeks.map((on, i) => (
                  <td key={i} className={on ? 'bg-black' : ''} />
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <table className="official-paper-table border-t-0 text-[10px]">
        <tbody>
          <tr>
            <td colSpan={3}>
              <strong>REVIEWED BY:</strong> &nbsp;
              <Box checked={f.reviewMode.includes('Initial Plan')} /> Initial Plan &nbsp;&nbsp;
              <Box checked={f.reviewMode.includes('Actual Status')} /> Actual status &nbsp;&nbsp;
              <Box checked={f.reviewMode.includes('Plan for Remaining')} /> Plan for remaining activities
              <span className="float-right">*** = Critical process, affects customer milestone</span>
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
            <td className="w-[36%]">
              <strong>Remarks:</strong> {f.remarks}
              <div className="mt-2 font-bold">
                Go for next Phase: &nbsp;
                <Box checked={f.goForNextPhase === 'Yes'} /> Yes &nbsp;
                <Box checked={f.goForNextPhase === 'No'} /> No
              </div>
            </td>
            <td className="w-[30%]">
              <div>
                <strong>CFT Leader:</strong> {f.cftLeaderSign}
              </div>
              <div className="mt-3">
                <strong>Plant Head:</strong> {f.plantHeadSign}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-1 text-[10px] font-bold">QF/07/MKT-08, Rev.No: 05 dt. 01.12.2024</div>
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
          <div key={pg} className="p-2 print-page-break border border-neutral-300">
            <OfficialHeader title="CHECKLIST FOR MANAGING AND TRACKING CHANGE" />
            {pg === 1 && (
              <table className="official-paper-table border-t-0">
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
            <table className="official-paper-table border-t-0 text-[10px]">
              <thead>
                <tr className="bg-neutral-100 text-center">
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
                <tr className="bg-neutral-100 text-center">
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
                    <td className="text-center font-bold">{item.isAffected === 'Yes' ? '✓' : ''}</td>
                    <td className="text-center font-bold">{item.isAffected === 'No' ? '✓' : ''}</td>
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
              <table className="official-paper-table border-t-0 text-[10px]">
                <tbody>
                  <tr>
                    <td colSpan={3}>
                      <strong>Actual date of implementation of change (By CFT &amp; Planning):</strong>{' '}
                      {f.actualImplementationDate}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <strong>Actions taken / Proposed on the Stock produce prior to modification:</strong>{' '}
                      {f.actionsOnStockProduced}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <strong>Actions taken / Proposed on toolings prior to modification:</strong>{' '}
                      {f.actionsOnToolings}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <strong>Any other Remarks :</strong> {f.otherRemarks}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <strong>Informed to:</strong> &nbsp;
                      <Box checked={f.informedTo.customer} /> Customer &nbsp;
                      <Box checked={f.informedTo.marketing} /> Marketing &nbsp;
                      <Box checked={f.informedTo.planning} /> Planning &nbsp;
                      <Box checked={f.informedTo.production} /> Production &nbsp;
                      <Box checked={f.informedTo.qa} /> QA &nbsp;
                      <Box checked={f.informedTo.qc} /> QC
                    </td>
                  </tr>
                  <tr>
                    {f.signOffs.map((s, idx) => (
                      <td key={idx} className="w-1/3">
                        <div>SIGN : {s.sign}</div>
                        <div>NAME : {s.name}</div>
                        <div>TITLE : {s.title}</div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}

            <div className="mt-1 flex justify-between text-[10px] font-bold">
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
    <div className="official-paper-sheet p-2">
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
      <table className="official-paper-table border-t-0">
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
          <tr className="bg-neutral-100">
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
          <tr className="bg-neutral-100">
            <td colSpan={3} className="text-center font-bold">
              FOR USE OF CFT
            </td>
          </tr>
        </tbody>
      </table>

      <table className="official-paper-table border-t-0">
        <thead>
          <tr className="bg-neutral-50 text-center">
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
            <td className="text-center">{f.ptr1.required}</td>
            <td className="text-center">{f.ptr2.required}</td>
            <td className="text-center">{f.ptr3.required}</td>
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
            <td className="text-center font-bold">{f.ptr1.sampleStatus}</td>
            <td className="text-center font-bold">{f.ptr2.sampleStatus}</td>
            <td className="text-center font-bold">{f.ptr3.sampleStatus}</td>
          </tr>
          <tr>
            <td colSpan={5}>
              <strong>Comments / Action plan (PTR1):</strong> {f.ptr1.actionPlanComments}
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <strong>Comments / Action plan (PTR2):</strong> {f.ptr2.actionPlanComments}
            </td>
          </tr>
          <tr>
            <td colSpan={5}>
              <strong>Comments / Action plan (PTR3):</strong> {f.ptr3.actionPlanComments}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="official-paper-table border-t-0">
        <thead>
          <tr className="bg-neutral-100 text-center">
            <th colSpan={2}>Approved By Core Team</th>
            <th>PTR 1</th>
            <th>PTR 2</th>
            <th>PTR 3</th>
          </tr>
        </thead>
        <tbody>
          {f.coreTeamApprovals.map((row) => (
            <tr key={row.department}>
              <td className="font-bold w-[24%]">{row.department}</td>
              <td className="w-[28%]">Comments / Signature</td>
              <td className="text-center">
                {row.ptr1Status} {row.ptr1Sign ? `(${row.ptr1Sign})` : ''}
              </td>
              <td className="text-center">
                {row.ptr2Status} {row.ptr2Sign ? `(${row.ptr2Sign})` : ''}
              </td>
              <td className="text-center">
                {row.ptr3Status} {row.ptr3Sign ? `(${row.ptr3Sign})` : ''}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={5}>
              <strong>CFT Comments:</strong> {f.cftComments}
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <strong>Break point date :</strong> {f.breakPointDate}
            </td>
            <td colSpan={2}>
              <strong>Invoice Details :</strong> {f.invoiceDetails}
            </td>
            <td>
              <strong>Part/Box/Trolley ID :</strong> {f.identificationOnPartBoxTrolley}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-1 text-[10px] font-bold">QF /07/ MRO - 16 · 14.08.2017</div>
    </div>
  );
}

export function PrintForm7PPAP({ record }: { record: ChangeRequestRecord }) {
  const f = record.form7;
  return (
    <div className="official-paper-sheet p-2">
      <OfficialHeader
        title="PPAP INITIATION FORM CUM PRODUCTION REPORT"
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
      <table className="official-paper-table border-t-0">
        <tbody>
          <tr>
            <td colSpan={2}>
              <strong>FROM :</strong> {f.from} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>DEPARTMENT :</strong>{' '}
              {f.department}
            </td>
            <td>
              <strong>TO :</strong> {f.to}
            </td>
          </tr>
          <tr className="bg-neutral-100">
            <td colSpan={3} className="text-center font-bold">
              DETAILS OF REQUEST
            </td>
          </tr>
          <tr>
            <td className="w-[32%] font-bold">Customer</td>
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
            <td>{f.requestDate}</td>
            <td>
              <strong>Signature :</strong> {f.requestSignature}
            </td>
          </tr>
          <tr className="bg-neutral-100">
            <td colSpan={3} className="text-center font-bold">
              FOR USE OF CFT
            </td>
          </tr>
          <tr>
            <td colSpan={2}>1) Date of first production run :</td>
            <td>{f.firstProductionRunDate}</td>
          </tr>
          <tr>
            <td colSpan={2}>
              2) Quantity Produced (as per customer requirement or 300 Nos or 1 Day Production qty) :
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
              <Box checked={f.deviationsToProcessFlow === 'Yes'} /> Yes &nbsp;&nbsp;
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
              <Box checked={f.deviationsToControlPlan === 'Yes'} /> Yes &nbsp;&nbsp;
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
              <Box checked={f.submissionRequired === 'Yes'} /> Yes &nbsp;&nbsp;
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

      <table className="official-paper-table border-t-0">
        <tbody>
          <tr>
            <td className="w-[22%] font-bold align-middle">Approved By Core Team</td>
            {f.coreTeamSignOffs.map((s, idx) => (
              <td key={idx} className="w-[26%]">
                <div>Sign : {s.sign}</div>
                <div className="mt-1">Name : {s.name}</div>
                <div className="mt-1">Date : {s.date}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="mt-1 text-[10px] font-bold">QF /07/ MRO - 05 · 20.08.2016</div>
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
