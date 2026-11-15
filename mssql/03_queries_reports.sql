-- ============================================================================
-- Sakthi Auto Component Limited (SACL) - Change Management System
-- 03_queries_reports.sql : Operational & Management T-SQL Reporting Queries
-- ============================================================================

USE SACL;
GO

-- 1. Full 7-Form Interconnected Status Report per Change Request
SELECT
  cr.pcrfNo,
  cr.title,
  COALESCE(c.code, 'SACL') AS companyCode,
  COALESCE(cr.companyName, c.name) AS companyName,
  cr.currentStage,
  cr.overallStatus,
  cr.priority,
  cr.createdBy,
  cr.dueDate,
  f2.conclusion AS form2_feasibility_conclusion,
  f3.overallRiskLevel AS form3_risk_level,
  f3.conclusion AS form3_risk_conclusion,
  f4.goForNextPhase AS form4_timing_go,
  f6.ptr1Status AS form6_ptr1,
  f6.ptr2Status AS form6_ptr2,
  f6.ptr3Status AS form6_ptr3,
  f7.submissionStatus AS form7_ppap_status,
  cr.updatedAt
FROM dbo.ChangeRequests cr
LEFT JOIN dbo.Companies c ON cr.companyId = c.id
LEFT JOIN dbo.Form1_PCRF f1 ON cr.id = f1.pcrfId
LEFT JOIN dbo.Form2_Feasibility f2 ON cr.id = f2.pcrfId
LEFT JOIN dbo.Form3_RiskAnalysis f3 ON cr.id = f3.pcrfId
LEFT JOIN dbo.Form4_TimingPlan f4 ON cr.id = f4.pcrfId
LEFT JOIN dbo.Form5_ChangeChecklist f5 ON cr.id = f5.pcrfId
LEFT JOIN dbo.Form6_PTR f6 ON cr.id = f6.pcrfId
LEFT JOIN dbo.Form7_PPAP f7 ON cr.id = f7.pcrfId
ORDER BY cr.updatedAt DESC;
GO

-- 2. Workflow Stage Bottleneck Summary (Active vs Closed Change Requests)
SELECT
  currentStage,
  overallStatus,
  COUNT(*) AS requestCount
FROM dbo.ChangeRequests
GROUP BY currentStage, overallStatus
ORDER BY requestCount DESC;
GO

-- 3. Company / Manufacturing Plant Workload Breakdown
SELECT
  c.code AS companyCode,
  c.name AS companyName,
  c.unitName,
  c.facilityType,
  COUNT(cr.id) AS totalRequests,
  SUM(CASE WHEN cr.overallStatus = 'Closed' THEN 1 ELSE 0 END) AS closedRequests,
  SUM(CASE WHEN cr.overallStatus NOT IN ('Closed', 'Rejected') THEN 1 ELSE 0 END) AS openRequests
FROM dbo.Companies c
LEFT JOIN dbo.ChangeRequests cr ON c.id = cr.companyId
GROUP BY c.code, c.name, c.unitName, c.facilityType
ORDER BY totalRequests DESC;
GO

-- 4. High-Risk Change Requests Requiring Escalated Review (Form 3 = 'H')
SELECT
  cr.pcrfNo,
  cr.title,
  cr.currentStage,
  f3.overallRiskLevel,
  f3.conclusion,
  cr.createdBy,
  cr.dueDate
FROM dbo.ChangeRequests cr
INNER JOIN dbo.Form3_RiskAnalysis f3 ON cr.id = f3.pcrfId
WHERE f3.overallRiskLevel = 'H'
ORDER BY cr.dueDate ASC;
GO

-- 5. PTR Sequential Gate & Pending PPAP Dispatch Queue
SELECT
  cr.pcrfNo,
  cr.title,
  f6.ptr1Status,
  f6.ptr2Status,
  f6.ptr3Status,
  f7.submissionStatus AS ppapStatus
FROM dbo.ChangeRequests cr
INNER JOIN dbo.Form6_PTR f6 ON cr.id = f6.pcrfId
INNER JOIN dbo.Form7_PPAP f7 ON cr.id = f7.pcrfId
WHERE f7.submissionStatus <> 'Approved'
ORDER BY cr.updatedAt DESC;
GO

-- 6. Recent Immutable Change Audit Trail (Top 50 Events)
SELECT TOP 50
  timestamp,
  actorId,
  actorName,
  actorRole,
  entityType,
  entityId,
  action,
  details
FROM dbo.AuditLogs
ORDER BY timestamp DESC;
GO
