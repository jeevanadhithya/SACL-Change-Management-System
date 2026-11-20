-- ============================================================================
-- SAKTHI AUTO COMPONENT LIMITED (SACL) - CHANGE MANAGEMENT SYSTEM
-- Master Database Script (Microsoft SQL Server / T-SQL 2019 / 2022 / 2025)
-- File: mssql/sacl_change_management_complete.sql
--
-- Covers the ENTIRE project in a single, idempotent, production-ready script:
--   SECTION 1 : Database Creation (SACL)
--   SECTION 2 : Core Master Tables (Companies, Users, Departments, Customers, Parts)
--   SECTION 3 : Change Requests & All 7 Official Consultancy Form Tables
--               (Form1_PCRF .. Form7_PPAP)
--   SECTION 4 : Notifications & Immutable Audit Trail Tables
--   SECTION 5 : Performance Indexes
--   SECTION 6 : Reporting & Management Views
--   SECTION 7 : Operational Stored Procedures
--   SECTION 8 : Idempotent Seed Data (Companies, Departments, Customers, Parts,
--               8 Portal Users [default password: password123], Sample PCRF-2026-041
--               across all 7 Forms, Notifications, and Audit Logs)
--   SECTION 9 : Verification & Operational Reporting Queries
-- ============================================================================

SET NOCOUNT ON;
GO

-- ============================================================================
-- SECTION 1: DATABASE CREATION
-- ============================================================================
IF DB_ID(N'SACL') IS NULL
BEGIN
  CREATE DATABASE [SACL];
END;
GO

USE [SACL];
GO

-- ============================================================================
-- SECTION 2: CORE MASTER TABLES
-- ============================================================================

-- 2.1 Companies / Manufacturing Units (Admin-managed)
IF OBJECT_ID(N'dbo.Companies', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Companies (
    id            NVARCHAR(64)  NOT NULL CONSTRAINT PK_Companies PRIMARY KEY,
    code          NVARCHAR(32)  NOT NULL CONSTRAINT UQ_Companies_Code UNIQUE,
    name          NVARCHAR(200) NOT NULL,
    unitName      NVARCHAR(150) NOT NULL,
    facilityType  NVARCHAR(64)  NOT NULL,
    location      NVARCHAR(200) NOT NULL,
    gstOrRegNo    NVARCHAR(80)  NULL,
    contactEmail  NVARCHAR(150) NULL,
    active        BIT           NOT NULL CONSTRAINT DF_Companies_Active DEFAULT (1),
    createdAt     DATETIME2     NOT NULL CONSTRAINT DF_Companies_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Companies_FacilityType CHECK (
      facilityType IN (N'Machine Shop', N'Foundry', N'Foundry & Machine Shop', N'Corporate')
    )
  );
END;
GO

-- 2.2 Portal Users & RBAC Accounts
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Users (
    id            NVARCHAR(64)  NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
    employeeId    NVARCHAR(32)  NOT NULL CONSTRAINT UQ_Users_EmployeeId UNIQUE,
    name          NVARCHAR(150) NOT NULL,
    email         NVARCHAR(150) NOT NULL,
    role          NVARCHAR(32)  NOT NULL,
    department    NVARCHAR(120) NOT NULL,
    title         NVARCHAR(150) NOT NULL,
    facility      NVARCHAR(64)  NOT NULL,
    companyId     NVARCHAR(64)  NULL CONSTRAINT FK_Users_Companies FOREIGN KEY REFERENCES dbo.Companies(id),
    passwordHash  NVARCHAR(255) NOT NULL,
    active        BIT           NOT NULL CONSTRAINT DF_Users_Active DEFAULT (1),
    createdAt     DATETIME2     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Users_Role CHECK (
      role IN (N'ADMIN', N'EMPLOYEE', N'HOD', N'HOF', N'COF', N'CFT', N'CFT_LEADER', N'PLANT_HEAD')
    ),
    CONSTRAINT CK_Users_Facility CHECK (
      facility IN (N'Foundry', N'Machine Shop', N'Quality', N'Corporate')
    )
  );
END;
GO

-- 2.3 Departments & CFT Units
IF OBJECT_ID(N'dbo.Departments', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Departments (
    id           NVARCHAR(64)  NOT NULL CONSTRAINT PK_Departments PRIMARY KEY,
    code         NVARCHAR(32)  NOT NULL CONSTRAINT UQ_Departments_Code UNIQUE,
    name         NVARCHAR(150) NOT NULL,
    facility     NVARCHAR(64)  NOT NULL,
    hodName      NVARCHAR(150) NOT NULL,
    memberCount  INT           NOT NULL CONSTRAINT DF_Departments_MemberCount DEFAULT (0),
    createdAt    DATETIME2     NOT NULL CONSTRAINT DF_Departments_CreatedAt DEFAULT (SYSUTCDATETIME())
  );
END;
GO

-- 2.4 OEM Customers Master
IF OBJECT_ID(N'dbo.Customers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Customers (
    id             NVARCHAR(64)  NOT NULL CONSTRAINT PK_Customers PRIMARY KEY,
    code           NVARCHAR(32)  NOT NULL CONSTRAINT UQ_Customers_Code UNIQUE,
    name           NVARCHAR(200) NOT NULL,
    location       NVARCHAR(150) NOT NULL,
    contactPerson  NVARCHAR(150) NOT NULL,
    createdAt      DATETIME2     NOT NULL CONSTRAINT DF_Customers_CreatedAt DEFAULT (SYSUTCDATETIME())
  );
END;
GO

-- 2.5 Parts Master
IF OBJECT_ID(N'dbo.Parts', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Parts (
    id               NVARCHAR(64)  NOT NULL CONSTRAINT PK_Parts PRIMARY KEY,
    partNumber       NVARCHAR(64)  NOT NULL CONSTRAINT UQ_Parts_PartNumber UNIQUE,
    partName         NVARCHAR(200) NOT NULL,
    customer         NVARCHAR(200) NOT NULL,
    facility         NVARCHAR(64)  NOT NULL,
    currentRevision  NVARCHAR(32)  NOT NULL,
    createdAt        DATETIME2     NOT NULL CONSTRAINT DF_Parts_CreatedAt DEFAULT (SYSUTCDATETIME())
  );
END;
GO

-- ============================================================================
-- SECTION 3: CHANGE REQUEST HEADER & ALL 7 OFFICIAL CONSULTANCY FORM TABLES
-- ============================================================================

-- 3.0 Master Change Request Workflow Record (9-Stage Lifecycle)
IF OBJECT_ID(N'dbo.ChangeRequests', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ChangeRequests (
    id                   NVARCHAR(64)  NOT NULL CONSTRAINT PK_ChangeRequests PRIMARY KEY,
    pcrfNo               NVARCHAR(40)  NOT NULL CONSTRAINT UQ_ChangeRequests_PcrfNo UNIQUE,
    companyId            NVARCHAR(64)  NULL CONSTRAINT FK_ChangeRequests_Companies FOREIGN KEY REFERENCES dbo.Companies(id),
    companyName          NVARCHAR(200) NULL,
    title                NVARCHAR(300) NOT NULL,
    priority             NVARCHAR(32)  NOT NULL CONSTRAINT DF_ChangeRequests_Priority DEFAULT (N'Normal'),
    createdBy            NVARCHAR(150) NOT NULL,
    createdByEmployeeId  NVARCHAR(32)  NOT NULL,
    dueDate              NVARCHAR(32)  NOT NULL,
    currentStage         NVARCHAR(40)  NOT NULL CONSTRAINT DF_ChangeRequests_Stage DEFAULT (N'PCRF'),
    overallStatus        NVARCHAR(40)  NOT NULL CONSTRAINT DF_ChangeRequests_Status DEFAULT (N'In Review'),
    workflowJson         NVARCHAR(MAX) NOT NULL,
    documentsJson        NVARCHAR(MAX) NOT NULL,
    activityHistoryJson  NVARCHAR(MAX) NOT NULL,
    createdAt            DATETIME2     NOT NULL CONSTRAINT DF_ChangeRequests_CreatedAt DEFAULT (SYSUTCDATETIME()),
    updatedAt            DATETIME2     NOT NULL CONSTRAINT DF_ChangeRequests_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_ChangeRequests_Priority CHECK (priority IN (N'Critical', N'High', N'Normal')),
    CONSTRAINT CK_ChangeRequests_Stage CHECK (
      currentStage IN (
        N'PCRF', N'FEASIBILITY', N'RISK_ANALYSIS', N'TIMING_PLAN',
        N'INTERNAL_APPROVAL', N'CHANGE_CHECKLIST', N'PTR', N'PPAP', N'CLOSURE'
      )
    ),
    CONSTRAINT CK_ChangeRequests_WorkflowJson CHECK (ISJSON(workflowJson) = 1),
    CONSTRAINT CK_ChangeRequests_DocumentsJson CHECK (ISJSON(documentsJson) = 1),
    CONSTRAINT CK_ChangeRequests_HistoryJson CHECK (ISJSON(activityHistoryJson) = 1)
  );
END;
GO

-- 3.1 Form 1: Process Change Requisition Form (QF/07/MRO-15, Rev.No: 03 dt 04.10.2021)
IF OBJECT_ID(N'dbo.Form1_PCRF', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Form1_PCRF (
    pcrfId        NVARCHAR(64)  NOT NULL CONSTRAINT PK_Form1_PCRF PRIMARY KEY
                  CONSTRAINT FK_Form1_PCRF_ChangeRequests FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
    pcrfNo        NVARCHAR(40)  NOT NULL,
    formDataJson  NVARCHAR(MAX) NOT NULL,
    updatedAt     DATETIME2     NOT NULL CONSTRAINT DF_Form1_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Form1_Json CHECK (ISJSON(formDataJson) = 1)
  );
END;
GO

-- 3.2 Form 2: Feasibility Report for Change Request (QF/07/MRO-02, 10/06/2015)
IF OBJECT_ID(N'dbo.Form2_Feasibility', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Form2_Feasibility (
    pcrfId        NVARCHAR(64)  NOT NULL CONSTRAINT PK_Form2_Feasibility PRIMARY KEY
                  CONSTRAINT FK_Form2_ChangeRequests FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
    conclusion    NVARCHAR(32)  NOT NULL CONSTRAINT DF_Form2_Conclusion DEFAULT (N'PENDING'),
    formDataJson  NVARCHAR(MAX) NOT NULL,
    updatedAt     DATETIME2     NOT NULL CONSTRAINT DF_Form2_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Form2_Json CHECK (ISJSON(formDataJson) = 1)
  );
END;
GO

-- 3.3 Form 3: Risk Analysis Check Sheet (QF/07/MKT-14, Rev.No.02 dt 13.02.2019)
IF OBJECT_ID(N'dbo.Form3_RiskAnalysis', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Form3_RiskAnalysis (
    pcrfId            NVARCHAR(64)  NOT NULL CONSTRAINT PK_Form3_RiskAnalysis PRIMARY KEY
                      CONSTRAINT FK_Form3_ChangeRequests FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
    overallRiskLevel  NVARCHAR(8)   NOT NULL CONSTRAINT DF_Form3_RiskLevel DEFAULT (N'L'),
    conclusion        NVARCHAR(32)  NOT NULL CONSTRAINT DF_Form3_Conclusion DEFAULT (N'Pending'),
    formDataJson      NVARCHAR(MAX) NOT NULL,
    updatedAt         DATETIME2     NOT NULL CONSTRAINT DF_Form3_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Form3_RiskLevel CHECK (overallRiskLevel IN (N'H', N'M', N'L')),
    CONSTRAINT CK_Form3_Json CHECK (ISJSON(formDataJson) = 1)
  );
END;
GO

-- 3.4 Form 4: Timing Plan (QF/07/MKT-08, Rev.No: 05 dt. 01.12.2024)
IF OBJECT_ID(N'dbo.Form4_TimingPlan', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Form4_TimingPlan (
    pcrfId          NVARCHAR(64)  NOT NULL CONSTRAINT PK_Form4_TimingPlan PRIMARY KEY
                    CONSTRAINT FK_Form4_ChangeRequests FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
    goForNextPhase  NVARCHAR(16)  NOT NULL CONSTRAINT DF_Form4_GoNext DEFAULT (N'Pending'),
    formDataJson    NVARCHAR(MAX) NOT NULL,
    updatedAt       DATETIME2     NOT NULL CONSTRAINT DF_Form4_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Form4_Json CHECK (ISJSON(formDataJson) = 1)
  );
END;
GO

-- 3.5 Form 5: Checklist for Managing and Tracking Change (QF/07/MRO-03, 01.12.2003 - 4 Pages / 33 Items)
IF OBJECT_ID(N'dbo.Form5_ChangeChecklist', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Form5_ChangeChecklist (
    pcrfId        NVARCHAR(64)  NOT NULL CONSTRAINT PK_Form5_ChangeChecklist PRIMARY KEY
                  CONSTRAINT FK_Form5_ChangeRequests FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
    formDataJson  NVARCHAR(MAX) NOT NULL,
    updatedAt     DATETIME2     NOT NULL CONSTRAINT DF_Form5_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Form5_Json CHECK (ISJSON(formDataJson) = 1)
  );
END;
GO

-- 3.6 Form 6: PTR Initiation Form (QF/07/MRO-16, 14.08.2017 - Sequential PTR 1 -> PTR 2 -> PTR 3)
IF OBJECT_ID(N'dbo.Form6_PTR', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Form6_PTR (
    pcrfId        NVARCHAR(64)  NOT NULL CONSTRAINT PK_Form6_PTR PRIMARY KEY
                  CONSTRAINT FK_Form6_ChangeRequests FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
    ptr1Status    NVARCHAR(16)  NOT NULL CONSTRAINT DF_Form6_Ptr1 DEFAULT (N'Pending'),
    ptr2Status    NVARCHAR(16)  NOT NULL CONSTRAINT DF_Form6_Ptr2 DEFAULT (N'Pending'),
    ptr3Status    NVARCHAR(16)  NOT NULL CONSTRAINT DF_Form6_Ptr3 DEFAULT (N'Pending'),
    formDataJson  NVARCHAR(MAX) NOT NULL,
    updatedAt     DATETIME2     NOT NULL CONSTRAINT DF_Form6_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Form6_Json CHECK (ISJSON(formDataJson) = 1)
  );
END;
GO

-- 3.7 Form 7: PPAP Initiation Form cum Production Report (QF/07/MRO-05, 20.08.2016)
IF OBJECT_ID(N'dbo.Form7_PPAP', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Form7_PPAP (
    pcrfId            NVARCHAR(64)  NOT NULL CONSTRAINT PK_Form7_PPAP PRIMARY KEY
                      CONSTRAINT FK_Form7_ChangeRequests FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
    submissionStatus  NVARCHAR(16)  NOT NULL CONSTRAINT DF_Form7_Status DEFAULT (N'Pending'),
    formDataJson      NVARCHAR(MAX) NOT NULL,
    updatedAt         DATETIME2     NOT NULL CONSTRAINT DF_Form7_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Form7_Json CHECK (ISJSON(formDataJson) = 1)
  );
END;
GO

-- ============================================================================
-- SECTION 4: NOTIFICATIONS & IMMUTABLE AUDIT LOGS
-- ============================================================================

IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Notifications (
    id               NVARCHAR(64)  NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY,
    type             NVARCHAR(64)  NOT NULL,
    title            NVARCHAR(250) NOT NULL,
    message          NVARCHAR(MAX) NOT NULL,
    pcrfId           NVARCHAR(64)  NOT NULL,
    pcrfNo           NVARCHAR(40)  NOT NULL,
    targetRolesJson  NVARCHAR(MAX) NOT NULL,
    isRead           BIT           NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT (0),
    createdAt        DATETIME2     NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Notifications_RolesJson CHECK (ISJSON(targetRolesJson) = 1)
  );
END;
GO

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AuditLogs (
    id          NVARCHAR(64)  NOT NULL CONSTRAINT PK_AuditLogs PRIMARY KEY,
    timestamp   DATETIME2     NOT NULL CONSTRAINT DF_AuditLogs_Timestamp DEFAULT (SYSUTCDATETIME()),
    actorId     NVARCHAR(64)  NOT NULL CONSTRAINT DF_AuditLogs_ActorId DEFAULT (N'SYSTEM'),
    actorName   NVARCHAR(150) NOT NULL,
    actorRole   NVARCHAR(32)  NOT NULL,
    entityType  NVARCHAR(64)  NOT NULL CONSTRAINT DF_AuditLogs_EntityType DEFAULT (N'PCRF'),
    entityId    NVARCHAR(64)  NOT NULL,
    action      NVARCHAR(64)  NOT NULL,
    details     NVARCHAR(MAX) NOT NULL
  );
END;
GO

-- ============================================================================
-- SECTION 5: PERFORMANCE INDEXES
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_Role_Active' AND object_id = OBJECT_ID(N'dbo.Users'))
  CREATE INDEX IX_Users_Role_Active ON dbo.Users (role, active) INCLUDE (employeeId, name, department);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChangeRequests_Stage_Status' AND object_id = OBJECT_ID(N'dbo.ChangeRequests'))
  CREATE INDEX IX_ChangeRequests_Stage_Status ON dbo.ChangeRequests (currentStage, overallStatus, updatedAt DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChangeRequests_CompanyId' AND object_id = OBJECT_ID(N'dbo.ChangeRequests'))
  CREATE INDEX IX_ChangeRequests_CompanyId ON dbo.ChangeRequests (companyId, createdAt DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Form3_RiskLevel' AND object_id = OBJECT_ID(N'dbo.Form3_RiskAnalysis'))
  CREATE INDEX IX_Form3_RiskLevel ON dbo.Form3_RiskAnalysis (overallRiskLevel, conclusion);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Form7_SubmissionStatus' AND object_id = OBJECT_ID(N'dbo.Form7_PPAP'))
  CREATE INDEX IX_Form7_SubmissionStatus ON dbo.Form7_PPAP (submissionStatus);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Notifications_CreatedAt' AND object_id = OBJECT_ID(N'dbo.Notifications'))
  CREATE INDEX IX_Notifications_CreatedAt ON dbo.Notifications (createdAt DESC, isRead);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Timestamp' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
  CREATE INDEX IX_AuditLogs_Timestamp ON dbo.AuditLogs (timestamp DESC) INCLUDE (actorName, actorRole, action, entityId);
GO

-- ============================================================================
-- SECTION 6: MANAGEMENT & ANALYTICS VIEWS
-- ============================================================================

-- 6.1 Complete 7-Form Interconnected Change Request Overview
CREATE OR ALTER VIEW dbo.vw_ChangeRequestOverview AS
SELECT
  cr.id,
  cr.pcrfNo,
  cr.title,
  COALESCE(c.code, N'SACL') AS companyCode,
  COALESCE(cr.companyName, c.name) AS companyName,
  c.unitName,
  JSON_VALUE(f1.formDataJson, N'$.customer') AS customer,
  JSON_VALUE(f1.formDataJson, N'$.partName') AS partName,
  JSON_VALUE(f1.formDataJson, N'$.partNo') AS partNo,
  JSON_VALUE(f1.formDataJson, N'$.changeType') AS changeType,
  JSON_VALUE(f1.formDataJson, N'$.facilityScope') AS facilityScope,
  cr.priority,
  cr.currentStage,
  cr.overallStatus,
  cr.createdBy,
  cr.createdByEmployeeId,
  cr.dueDate,
  f2.conclusion AS feasibilityConclusion,
  f3.overallRiskLevel AS riskLevel,
  f3.conclusion AS riskConclusion,
  f4.goForNextPhase AS timingPlanGoNext,
  f6.ptr1Status,
  f6.ptr2Status,
  f6.ptr3Status,
  f7.submissionStatus AS ppapSubmissionStatus,
  cr.createdAt,
  cr.updatedAt
FROM dbo.ChangeRequests cr
LEFT JOIN dbo.Companies c            ON cr.companyId = c.id
LEFT JOIN dbo.Form1_PCRF f1          ON cr.id = f1.pcrfId
LEFT JOIN dbo.Form2_Feasibility f2   ON cr.id = f2.pcrfId
LEFT JOIN dbo.Form3_RiskAnalysis f3  ON cr.id = f3.pcrfId
LEFT JOIN dbo.Form4_TimingPlan f4    ON cr.id = f4.pcrfId
LEFT JOIN dbo.Form5_ChangeChecklist f5 ON cr.id = f5.pcrfId
LEFT JOIN dbo.Form6_PTR f6           ON cr.id = f6.pcrfId
LEFT JOIN dbo.Form7_PPAP f7          ON cr.id = f7.pcrfId;
GO

-- 6.2 Company / Manufacturing Unit Workload KPIs
CREATE OR ALTER VIEW dbo.vw_CompanyUnitKPI AS
SELECT
  c.id AS companyId,
  c.code AS companyCode,
  c.name AS companyName,
  c.unitName,
  c.facilityType,
  c.location,
  c.active,
  COUNT(cr.id) AS totalRequests,
  SUM(CASE WHEN cr.overallStatus NOT IN (N'Closed', N'Rejected') AND cr.id IS NOT NULL THEN 1 ELSE 0 END) AS openRequests,
  SUM(CASE WHEN cr.overallStatus = N'Closed' THEN 1 ELSE 0 END) AS closedRequests,
  SUM(CASE WHEN f3.overallRiskLevel = N'H' THEN 1 ELSE 0 END) AS highRiskRequests
FROM dbo.Companies c
LEFT JOIN dbo.ChangeRequests cr     ON c.id = cr.companyId
LEFT JOIN dbo.Form3_RiskAnalysis f3 ON cr.id = f3.pcrfId
GROUP BY c.id, c.code, c.name, c.unitName, c.facilityType, c.location, c.active;
GO

-- 6.3 Active Pending Approvals Queue
CREATE OR ALTER VIEW dbo.vw_PendingApprovalsQueue AS
SELECT
  cr.id,
  cr.pcrfNo,
  cr.title,
  cr.priority,
  cr.currentStage,
  cr.overallStatus,
  cr.createdBy,
  cr.dueDate,
  f3.overallRiskLevel,
  f2.conclusion AS feasibilityStatus,
  f4.goForNextPhase AS timingApproval,
  f6.ptr1Status,
  f6.ptr2Status,
  f6.ptr3Status,
  f7.submissionStatus AS ppapStatus,
  cr.updatedAt
FROM dbo.ChangeRequests cr
LEFT JOIN dbo.Form2_Feasibility f2  ON cr.id = f2.pcrfId
LEFT JOIN dbo.Form3_RiskAnalysis f3 ON cr.id = f3.pcrfId
LEFT JOIN dbo.Form4_TimingPlan f4   ON cr.id = f4.pcrfId
LEFT JOIN dbo.Form6_PTR f6          ON cr.id = f6.pcrfId
LEFT JOIN dbo.Form7_PPAP f7         ON cr.id = f7.pcrfId
WHERE cr.overallStatus NOT IN (N'Closed', N'Rejected');
GO

-- ============================================================================
-- SECTION 7: OPERATIONAL STORED PROCEDURES
-- ============================================================================

-- 7.1 Fetch Full Change Request + All 7 Forms by ID or PCRF Number
CREATE OR ALTER PROCEDURE dbo.sp_GetChangeRequestBundle
  @pcrfKey NVARCHAR(64)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    cr.*,
    f1.formDataJson AS form1Json,
    f2.formDataJson AS form2Json,
    f3.formDataJson AS form3Json,
    f4.formDataJson AS form4Json,
    f5.formDataJson AS form5Json,
    f6.formDataJson AS form6Json,
    f7.formDataJson AS form7Json
  FROM dbo.ChangeRequests cr
  LEFT JOIN dbo.Form1_PCRF f1            ON cr.id = f1.pcrfId
  LEFT JOIN dbo.Form2_Feasibility f2     ON cr.id = f2.pcrfId
  LEFT JOIN dbo.Form3_RiskAnalysis f3    ON cr.id = f3.pcrfId
  LEFT JOIN dbo.Form4_TimingPlan f4      ON cr.id = f4.pcrfId
  LEFT JOIN dbo.Form5_ChangeChecklist f5 ON cr.id = f5.pcrfId
  LEFT JOIN dbo.Form6_PTR f6             ON cr.id = f6.pcrfId
  LEFT JOIN dbo.Form7_PPAP f7            ON cr.id = f7.pcrfId
  WHERE cr.id = @pcrfKey OR cr.pcrfNo = @pcrfKey;
END;
GO

-- 7.2 Executive Dashboard KPI Summary
CREATE OR ALTER PROCEDURE dbo.sp_GetDashboardSummary
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    COUNT(*) AS totalRequests,
    SUM(CASE WHEN overallStatus NOT IN (N'Closed', N'Rejected') THEN 1 ELSE 0 END) AS openRequests,
    SUM(CASE WHEN overallStatus = N'Closed' THEN 1 ELSE 0 END) AS closedRequests,
    SUM(CASE WHEN priority = N'Critical' THEN 1 ELSE 0 END) AS criticalPriorityCount,
    (SELECT COUNT(*) FROM dbo.Form3_RiskAnalysis WHERE overallRiskLevel = N'H') AS highRiskCount,
    (SELECT COUNT(*) FROM dbo.Companies WHERE active = 1) AS activeCompaniesCount,
    (SELECT COUNT(*) FROM dbo.Users WHERE active = 1) AS activeUsersCount
  FROM dbo.ChangeRequests;

  SELECT currentStage, COUNT(*) AS stageCount
  FROM dbo.ChangeRequests
  GROUP BY currentStage
  ORDER BY stageCount DESC;
END;
GO

-- 7.3 Append Immutable Audit Trail Event
CREATE OR ALTER PROCEDURE dbo.sp_RecordAuditEvent
  @actorId     NVARCHAR(64)  = N'SYSTEM',
  @actorName   NVARCHAR(150),
  @actorRole   NVARCHAR(32),
  @entityType  NVARCHAR(64)  = N'PCRF',
  @entityId    NVARCHAR(64),
  @action      NVARCHAR(64),
  @details     NVARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.AuditLogs (id, actorId, actorName, actorRole, entityType, entityId, action, details)
  VALUES (
    CONCAT(N'aud-', REPLACE(CONVERT(NVARCHAR(36), NEWID()), N'-', N'')),
    COALESCE(@actorId, N'SYSTEM'),
    @actorName,
    @actorRole,
    COALESCE(@entityType, N'PCRF'),
    @entityId,
    @action,
    @details
  );
END;
GO

-- ============================================================================
-- SECTION 8: IDEMPOTENT FULL PROJECT SEED DATA
-- ============================================================================

-- 8.1 Companies / Manufacturing Units
MERGE dbo.Companies AS target
USING (VALUES
  (N'comp-1', N'SACL-MSH', N'Sakthi Auto Component Limited',            N'Machine Shop Division (Unit I)',       N'Machine Shop',           N'Mukasi Pallagoundanpalayam, Pollachi, TN', N'33AAACS8812N1Z4', N'machineshop@sakthiauto.com', 1),
  (N'comp-2', N'SACL-FDY', N'Sakthi Auto Component Limited',            N'Foundry Operations (Disamatic Lines)', N'Foundry',                N'Pollachi, Tamil Nadu',                     N'33AAACS8812N1Z4', N'foundry@sakthiauto.com',     1),
  (N'comp-3', N'SACL-COI', N'Sakthi Auto Precision Machining Pvt. Ltd.',N'CNC & Axle Sub-Assembly Plant',        N'Foundry & Machine Shop', N'Coimbatore Industrial Estate, TN',         N'33AABCS9044K1Z9', N'precision@sakthiauto.com',   1)
) AS src (id, code, name, unitName, facilityType, location, gstOrRegNo, contactEmail, active)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, code, name, unitName, facilityType, location, gstOrRegNo, contactEmail, active)
  VALUES (src.id, src.code, src.name, src.unitName, src.facilityType, src.location, src.gstOrRegNo, src.contactEmail, src.active);
GO

-- 8.2 Departments & CFT Units
MERGE dbo.Departments AS target
USING (VALUES
  (N'd1', N'FDY', N'Foundry Operations',      N'Foundry',      N'K. Natarajan',    42),
  (N'd2', N'MSH', N'Machine Shop',            N'Machine Shop', N'S. Muruganandam', 58),
  (N'd3', N'QA',  N'Quality Assurance',       N'Quality',      N'P. Anitha',       24),
  (N'd4', N'NPD', N'New Product Development', N'Corporate',    N'D. Prakash Raj',  16),
  (N'd5', N'MNT', N'Plant Maintenance',       N'Machine Shop', N'R. Vignesh',      19),
  (N'd6', N'TLG', N'Tooling & Fixtures',      N'Machine Shop', N'G. Aravind',      14)
) AS src (id, code, name, facility, hodName, memberCount)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, code, name, facility, hodName, memberCount)
  VALUES (src.id, src.code, src.name, src.facility, src.hodName, src.memberCount);
GO

-- 8.3 OEM Customers Master
MERGE dbo.Customers AS target
USING (VALUES
  (N'c1', N'TAT', N'Tata Motors Ltd.',      N'Pune / Jamshedpur', N'A. Deshmukh'),
  (N'c2', N'MNM', N'Mahindra & Mahindra',   N'Nashik / Chakan',   N'R. Kulkarni'),
  (N'c3', N'AL',  N'Ashok Leyland',         N'Ennore / Hosur',    N'S. Venkatraman'),
  (N'c4', N'BSH', N'Bosch Chassis Systems', N'Chakan, Pune',      N'M. Patwardhan'),
  (N'c5', N'DAN', N'Dana India Pvt. Ltd.',  N'Pune',              N'K. Joshi'),
  (N'c6', N'HYU', N'Hyundai Motor India',   N'Sriperumbudur',     N'J. Park')
) AS src (id, code, name, location, contactPerson)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, code, name, location, contactPerson)
  VALUES (src.id, src.code, src.name, src.location, src.contactPerson);
GO

-- 8.4 Parts Master
MERGE dbo.Parts AS target
USING (VALUES
  (N'pt1', N'SA-SK-4410', N'Steering Knuckle LH',        N'Tata Motors Ltd.',      N'Foundry & Machine Shop', N'Rev 03'),
  (N'pt2', N'SA-DC-2180', N'Differential Case SG500',    N'Dana India Pvt. Ltd.',  N'Foundry & Machine Shop', N'Rev 02'),
  (N'pt3', N'SA-BC-1095', N'Brake Caliper Housing',      N'Bosch Chassis Systems', N'Machine Shop',           N'Rev 04'),
  (N'pt4', N'SA-FH-3320', N'Flywheel Housing Heavy Duty',N'Ashok Leyland',         N'Foundry',                N'Rev 01'),
  (N'pt5', N'SA-WH-5501', N'Rear Wheel Hub Assembly',    N'Mahindra & Mahindra',   N'Foundry & Machine Shop', N'Rev 02'),
  (N'pt6', N'SA-CR-6120', N'Carrier Differential Axle',  N'Hyundai Motor India',   N'Machine Shop',           N'Rev 03')
) AS src (id, partNumber, partName, customer, facility, currentRevision)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, partNumber, partName, customer, facility, currentRevision)
  VALUES (src.id, src.partNumber, src.partName, src.customer, src.facility, src.currentRevision);
GO

-- 8.5 Default Portal Users (All 8 RBAC Roles — Demo Password: password123)
-- Password hash below is verified bcryptjs (10 rounds) for 'password123'.
MERGE dbo.Users AS target
USING (VALUES
  (N'u-admin', N'ADM001', N'V. Balasubramanian', N'admin@sakthiauto.com',         N'ADMIN',      N'Corporate IT & Systems',  N'System Administrator',                 N'Corporate',    N'comp-1', N'$2a$10$bK8VivrhSr.Z9iAiedaWq.JHKL44SZHjyLso1SxrxPNctw3fsU9k.', 1),
  (N'u-emp',   N'EMP101', N'R. Karthik',         N'karthik.r@sakthiauto.com',     N'EMPLOYEE',   N'Machine Shop',            N'Senior Process Engineer',              N'Machine Shop', N'comp-1', N'$2a$10$bK8VivrhSr.Z9iAiedaWq.JHKL44SZHjyLso1SxrxPNctw3fsU9k.', 1),
  (N'u-hod',   N'HOD201', N'S. Muruganandam',    N'murugan.s@sakthiauto.com',     N'HOD',        N'Machine Shop',            N'Head of Department — Machining',       N'Machine Shop', N'comp-1', N'$2a$10$bK8VivrhSr.Z9iAiedaWq.JHKL44SZHjyLso1SxrxPNctw3fsU9k.', 1),
  (N'u-hof',   N'HOF301', N'K. Natarajan',       N'natarajan.k@sakthiauto.com',   N'HOF',        N'Foundry Operations',      N'Head of Foundry (HOF)',                N'Foundry',      N'comp-2', N'$2a$10$bK8VivrhSr.Z9iAiedaWq.JHKL44SZHjyLso1SxrxPNctw3fsU9k.', 1),
  (N'u-cof',   N'COF302', N'M. Senthil Kumar',   N'senthil.m@sakthiauto.com',     N'COF',        N'Machining & Assembly',    N'Chief of Operations / Facility (COF)', N'Machine Shop', N'comp-1', N'$2a$10$bK8VivrhSr.Z9iAiedaWq.JHKL44SZHjyLso1SxrxPNctw3fsU9k.', 1),
  (N'u-cft',   N'CFT401', N'P. Anitha',          N'anitha.p@sakthiauto.com',      N'CFT',        N'Quality Assurance',       N'CFT Quality Engineer',                 N'Quality',      N'comp-1', N'$2a$10$bK8VivrhSr.Z9iAiedaWq.JHKL44SZHjyLso1SxrxPNctw3fsU9k.', 1),
  (N'u-cftl',  N'CFTL01', N'D. Prakash Raj',     N'prakash.d@sakthiauto.com',     N'CFT_LEADER', N'New Product Development', N'CFT Leader — APQP & Change Control',   N'Corporate',    N'comp-1', N'$2a$10$bK8VivrhSr.Z9iAiedaWq.JHKL44SZHjyLso1SxrxPNctw3fsU9k.', 1),
  (N'u-ph',    N'PH001',  N'N. Chandrasekhar',   N'chandrasekhar.n@sakthiauto.com',N'PLANT_HEAD',N'Plant Management',        N'Plant Head — Pollachi Operations',     N'Corporate',    N'comp-1', N'$2a$10$bK8VivrhSr.Z9iAiedaWq.JHKL44SZHjyLso1SxrxPNctw3fsU9k.', 1)
) AS src (id, employeeId, name, email, role, department, title, facility, companyId, passwordHash, active)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, employeeId, name, email, role, department, title, facility, companyId, passwordHash, active)
  VALUES (src.id, src.employeeId, src.name, src.email, src.role, src.department, src.title, src.facility, src.companyId, src.passwordHash, src.active);
GO

-- 8.6 Complete Seed Change Request (PCRF-2026-041) Across Header + All 7 Consultancy Forms
IF NOT EXISTS (SELECT 1 FROM dbo.ChangeRequests WHERE id = N'pcrf-001')
BEGIN
  INSERT INTO dbo.ChangeRequests (
    id, pcrfNo, companyId, companyName, title, priority,
    createdBy, createdByEmployeeId, dueDate, currentStage, overallStatus,
    workflowJson, documentsJson, activityHistoryJson
  )
  VALUES (
    N'pcrf-001',
    N'PCRF-2026-041',
    N'comp-1',
    N'Sakthi Auto Component Limited — Machine Shop Division',
    N'Steering Knuckle LH — CNC Bore Finishing Cycle Optimization',
    N'Critical',
    N'R. Karthik',
    N'EMP101',
    N'2026-12-20',
    N'INTERNAL_APPROVAL',
    N'In Review',
    N'[{"key":"PCRF","label":"Process Change Requisition","formCode":"QF/07/MRO-15","status":"COMPLETED","updatedAt":"2026-10-19","updatedBy":"S. Muruganandam","comments":"HOD approved requisition"},{"key":"FEASIBILITY","label":"Feasibility Report","formCode":"QF/07/MRO-02","status":"COMPLETED","updatedAt":"2026-10-24","updatedBy":"D. Prakash Raj","comments":"All 6 CFT functions marked Feasible"},{"key":"RISK_ANALYSIS","label":"Risk Analysis","formCode":"QF/07/MKT-14","status":"COMPLETED","updatedAt":"2026-10-28","updatedBy":"P. Anitha","comments":"Risk controls validated"},{"key":"TIMING_PLAN","label":"Timing Plan","formCode":"QF/07/MKT-08","status":"COMPLETED","updatedAt":"2026-11-05","updatedBy":"D. Prakash Raj","comments":"APQP Phase I approved"},{"key":"INTERNAL_APPROVAL","label":"Plant Head / Internal Approval","status":"IN_PROGRESS"},{"key":"CHANGE_CHECKLIST","label":"Change Management Checklist","formCode":"QF/07/MRO-03","status":"PENDING"},{"key":"PTR","label":"PTR Initiation","formCode":"QF/07/MRO-16","status":"PENDING"},{"key":"PPAP","label":"PPAP Initiation","formCode":"QF/07/MRO-05","status":"PENDING"},{"key":"CLOSURE","label":"Final Closure","status":"PENDING"}]',
    N'[{"id":"doc-001","name":"PCRF-2026-041_Initial_Requisition.pdf","category":"Generated Form","formType":"PCRF (QF/07/MRO-15)","uploadedBy":"R. Karthik","uploadedDate":"2026-10-18","revision":"Rev 01"}]',
    N'[{"id":"hist-001","timestamp":"2026-10-18T09:30:00.000Z","actorName":"R. Karthik","actorRole":"EMPLOYEE","action":"Raised Change Request PCRF-2026-041","stage":"Process Change Requisition","comments":"Eliminate taper variation in kingpin bore and reduce VMC cycle time from 142s to 118s"}]'
  );

  INSERT INTO dbo.Form1_PCRF (pcrfId, pcrfNo, formDataJson)
  VALUES (
    N'pcrf-001',
    N'PCRF-2026-041',
    N'{"pcrfNo":"PCRF-2026-041","requisitionBy":"R. Karthik","requisitionerSign":"R. Karthik","department":"Machine Shop","requisitionerHodSign":"S. Muruganandam (19-Oct-2026)","date":"2026-10-18","customer":"Tata Motors Ltd.","partName":"Steering Knuckle LH","partNo":"SA-SK-4410","classifications":["Method","Machine"],"changeType":"Process","facilityScope":"Machine Shop","particularsRows":[{"id":"part-001","particulars":"Machining Cycle Time Optimization","currentStatus":"HSS Reamer finish bore, cycle time 142 sec, Cpk 1.31","changeRequired":"PCD Cartridge finish boring bar on HMC-04, target 118 sec, Cpk >= 1.67","targetFacility":"M"}],"reasonForChange":"Eliminate taper variation in kingpin bore and reduce VMC cycle time from 142s to 118s","reasonFacilityApplicable":"Machine Shop","cftCommentsFoundry":"No impact on raw casting datum pads; foundry riser unchanged.","cftFoundryFeasibility":"Feasible","cftLeaderFoundrySign":"D. Prakash Raj","cftLeaderFoundryDate":"2026-10-22","cftCommentsMachineShop":"HMC-04 fixture clamping checked; PCD boring bar trial confirmed 116s cycle.","cftMachineShopFeasibility":"Feasible","cftLeaderMachineShopSign":"D. Prakash Raj","cftLeaderMachineShopDate":"2026-10-22","internalApprovalStatus":"Pending","internalApprovalOtherText":"","approvingAuthority":"","approvingAuthoritySign":"","plantHeadApproval":"Pending","plantHeadSign":"","customerCommunicationDetail":"Intimated Tata Motors SQA (A. Deshmukh) via ECN notice ref TAT/ECN/2026/88","changeReflectionInSOP":true,"sopDocumentRef":"SOP-MSH-4410-R04","forwardedTo":"Department HOD / CFT"}'
  );

  INSERT INTO dbo.Form2_Feasibility (pcrfId, conclusion, formDataJson)
  VALUES (
    N'pcrf-001',
    N'FEASIBLE',
    N'{"slNo":"PCRF-2026-041","date":"2026-10-23","from":"Machine Shop","to":"CFT","partName":"Steering Knuckle LH","partNo":"SA-SK-4410","customer":"Tata Motors Ltd.","categoryOfChange":"Process (Method, Machine) — Machine Shop","requirements":[{"id":"req-mfg-1","section":"Manufacturing Process / Product Requirement","description":"Foundry moulding / pouring / core process capability verification","decision":"Feasible"},{"id":"req-mfg-2","section":"Manufacturing Process / Product Requirement","description":"CNC machining fixture, clamping & tool life capability","decision":"Feasible"},{"id":"req-sys-1","section":"System Requirement","description":"PFMEA, Control Plan, Work Instruction & SOP revision readiness","decision":"Feasible"},{"id":"req-ins-1","section":"Inspection Requirement","description":"CMM program, attribute gauges & MSA calibration availability","decision":"Feasible"},{"id":"req-oth-1","section":"Any Other Requirement","description":"Customer approval / packaging & traceability tag alignment","decision":"Feasible"}],"additionalResourceRequirement":"1x PCD Cartridge Boring Bar (Sandvik R416) & Air Gauge calibration master","conclusion":"FEASIBLE","cftSignatures":[{"slot":1,"name":"K. Natarajan","department":"Foundry","signed":true,"date":"2026-10-23"},{"slot":2,"name":"S. Muruganandam","department":"Machine Shop","signed":true,"date":"2026-10-23"},{"slot":3,"name":"P. Anitha","department":"Quality Assurance","signed":true,"date":"2026-10-23"},{"slot":4,"name":"R. Karthik","department":"Engineering","signed":true,"date":"2026-10-23"},{"slot":5,"name":"R. Vignesh","department":"Maintenance","signed":true,"date":"2026-10-23"},{"slot":6,"name":"M. Senthil Kumar","department":"Planning","signed":true,"date":"2026-10-23"}],"comments":"All 6 CFT functions confirmed tooling readiness and gauge repeatability.","forwardedTo":"CFT Leader","acknowledgementStatus":"Acknowledged","acknowledgementDate":"2026-10-24"}'
  );

  INSERT INTO dbo.Form3_RiskAnalysis (pcrfId, overallRiskLevel, conclusion, formDataJson)
  VALUES (
    N'pcrf-001',
    N'H',
    N'Acceptable',
    N'{"partName":"Steering Knuckle LH","partNo":"SA-SK-4410","customer":"Tata Motors Ltd.","date":"2026-10-28","riskRows":[{"id":"risk-1","category":"Man","riskPoint":"Insufficient Skill","applicability":"AP","controlMethod":"Operator OJT & Tool Setter SOP","riskLevel":"MEDIUM","effectOnQCD":"Quality","actions":"Conduct shift-wise skill check before PTR 1"},{"id":"risk-2","category":"Man","riskPoint":"Operator Awareness","applicability":"AP","controlMethod":"Operator OJT & Tool Setter SOP","riskLevel":"MEDIUM","effectOnQCD":"Quality","actions":"Conduct shift-wise skill check before PTR 1"},{"id":"risk-3","category":"Man","riskPoint":"Specific Training","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-4","category":"Method","riskPoint":"Process Change","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-5","category":"Method","riskPoint":"Jigs, tool Change","applicability":"AP","controlMethod":"100% Air Gauge Bore Inspection for first 50 pcs","riskLevel":"HIGH","effectOnQCD":"Quality / Cost","actions":"Verify Cpk >= 1.67 during PTR 1 & PTR 2"},{"id":"risk-6","category":"Method","riskPoint":"Cycle time","applicability":"AP","controlMethod":"100% Air Gauge Bore Inspection for first 50 pcs","riskLevel":"HIGH","effectOnQCD":"Quality / Cost","actions":"Verify Cpk >= 1.67 during PTR 1 & PTR 2"},{"id":"risk-7","category":"Method","riskPoint":"Process Capability","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-8","category":"Method","riskPoint":"Parameter Change","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-9","category":"Method","riskPoint":"Document Change","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-10","category":"Method","riskPoint":"Check method","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-11","category":"Machine","riskPoint":"Capacity","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-12","category":"Machine","riskPoint":"Spares","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-13","category":"Machine","riskPoint":"Machine Capability","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-14","category":"Material","riskPoint":"Availability of material","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-15","category":"Material","riskPoint":"Availability of Stock","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-16","category":"Cost","riskPoint":"Increase in cost","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-17","category":"Quality","riskPoint":"Cp, Cpk Change","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"},{"id":"risk-18","category":"Delivery","riskPoint":"Delivery of Modified Parts","applicability":"AP","controlMethod":"Standard Control Plan","riskLevel":"LOW","effectOnQCD":"None","actions":"Monitor in routine audit"}],"conclusion":"Acceptable","overallRiskLevel":"H","cftSignatures":[{"slot":1,"name":"K. Natarajan","department":"Foundry","signed":true,"date":"2026-10-23"},{"slot":2,"name":"S. Muruganandam","department":"Machine Shop","signed":true,"date":"2026-10-23"},{"slot":3,"name":"P. Anitha","department":"Quality Assurance","signed":true,"date":"2026-10-23"},{"slot":4,"name":"R. Karthik","department":"Engineering","signed":true,"date":"2026-10-23"},{"slot":5,"name":"R. Vignesh","department":"Maintenance","signed":true,"date":"2026-10-23"},{"slot":6,"name":"M. Senthil Kumar","department":"Planning","signed":true,"date":"2026-10-23"}]}'
  );

  INSERT INTO dbo.Form4_TimingPlan (pcrfId, goForNextPhase, formDataJson)
  VALUES (
    N'pcrf-001',
    N'Yes',
    N'{"projectName":"Tata Motors Ltd. — Steering Knuckle LH","drawingPartNo":"SA-SK-4410","productName":"Steering Knuckle LH","customer":"Tata Motors Ltd.","preparedDate":"2026-11-01","lastRevDate":"2026-11-05","revision":"01","productTypeFlags":["C"],"monthLabels":["Nov 26","Dec 26","Jan 27","Feb 27","Mar 27","Apr 27"],"customerTimelineWeeks":[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false],"customerTimelineRemarks":"","internalTimelineWeeks":[false,true,true,true,true,true,true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false,false,false],"internalTimelineRemarks":"","tier2TimelineWeeks":[false,false,true,true,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"tier2TimelineRemarks":"","activities":[{"id":"tp-act-1","apqpPhase":"I Phase","activity":"Customer Enquiry","applicability":"AA, A","isCritical":false,"plannedWeeks":[true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Completed on schedule"},{"id":"tp-act-2","apqpPhase":"I Phase","activity":"Receipt of 2D Drawing & 3D Model","applicability":"AA, A, B, C","isCritical":true,"plannedWeeks":[false,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[false,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Completed on schedule"},{"id":"tp-act-3","apqpPhase":"I Phase","activity":"Preliminary Assessment","applicability":"AA, A","isCritical":false,"plannedWeeks":[false,false,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[false,false,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Completed on schedule"},{"id":"tp-act-4","apqpPhase":"I Phase","activity":"Product Feasibility","applicability":"AA, A, B, C","isCritical":true,"plannedWeeks":[false,false,false,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[false,false,false,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Completed on schedule"},{"id":"tp-act-5","apqpPhase":"I Phase","activity":"Clarification required from customer (if any)","applicability":"AA, A, B, C","isCritical":false,"plannedWeeks":[false,false,false,false,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[false,false,false,false,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Completed on schedule"},{"id":"tp-act-6","apqpPhase":"I Phase","activity":"Cost Estimation","applicability":"AA, A, B, C","isCritical":false,"plannedWeeks":[false,false,false,false,false,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[false,false,false,false,false,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Completed on schedule"},{"id":"tp-act-7","apqpPhase":"I Phase","activity":"Quote submission","applicability":"AA, A, B, C","isCritical":false,"plannedWeeks":[false,false,false,false,false,false,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Scheduled"},{"id":"tp-act-8","apqpPhase":"I Phase","activity":"LOI / Purchase order","applicability":"AA, A, B, C","isCritical":true,"plannedWeeks":[false,false,false,false,false,false,false,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Scheduled"},{"id":"tp-act-9","apqpPhase":"I Phase","activity":"Team Feasibility Commitment","applicability":"AA, A","isCritical":false,"plannedWeeks":[false,false,false,false,false,false,false,false,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Scheduled"},{"id":"tp-act-10","apqpPhase":"I Phase","activity":"Contract review & Order acceptance","applicability":"AA, A, B, C","isCritical":false,"plannedWeeks":[false,false,false,false,false,false,false,false,false,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false],"actualWeeks":[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],"remarks":"Scheduled"}],"reviewMode":["Initial Plan"],"cftMembers":["K. Natarajan","S. Muruganandam","P. Anitha","R. Karthik","R. Vignesh","D. Prakash Raj"],"remarks":"","goForNextPhase":"Yes","cftLeaderSign":"D. Prakash Raj (2026-11-05)","plantHeadSign":""}'
  );

  INSERT INTO dbo.Form5_ChangeChecklist (pcrfId, formDataJson)
  VALUES (
    N'pcrf-001',
    N'{"productCode":"SA-SK-4410","productDescription":"Steering Knuckle LH","customerName":"Tata Motors Ltd.","customerPartNo":"SA-SK-4410","items":[{"id":"chk-1-1","page":1,"impactArea":"Assembly Drawing Change","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-1-2","page":1,"impactArea":"Component Drawing Change","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-1-3","page":1,"impactArea":"Engineering Specification","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-1-4","page":1,"impactArea":"Material Specification","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-1-5","page":1,"impactArea":"Process Flow Diagram","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-1-6","page":1,"impactArea":"Control Plan","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-1-7","page":1,"impactArea":"Product Audit Check Sheet","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-1-8","page":1,"impactArea":"Work Instruction","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-1-9","page":1,"impactArea":"Visual Aids","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-1","page":2,"impactArea":"Process FMEA","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-2","page":2,"impactArea":"Jigs / Tool / Gauge / Pattern / Drawings / Layout","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-3","page":2,"impactArea":"Jigs / Tool / Gauge / Pattern modification (Physical Modification)","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-4","page":2,"impactArea":"Calibration Cards (for part specific Gauges)","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-5","page":2,"impactArea":"MSA","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-6","page":2,"impactArea":"Product Cost","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-7","page":2,"impactArea":"Approved list of Sub - Contractors","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-8","page":2,"impactArea":"Action on parts already produced and available on Stock","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-9","page":2,"impactArea":"Actions on Sub - Contractor","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-2-10","page":2,"impactArea":"Sub - Contractor Part Approval","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-1","page":3,"impactArea":"Any Special Characteristics","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-2","page":3,"impactArea":"SPC affected ?","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-3","page":3,"impactArea":"Checking Aids / Gauges","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-4","page":3,"impactArea":"Production Trial Run","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-5","page":3,"impactArea":"PAP","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-6","page":3,"impactArea":"Master List of — a) Drawings","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-7","page":3,"impactArea":"Master List of — b) Engineering / Material Specification","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-8","page":3,"impactArea":"Master List of — c) Process Flow Diagram","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-9","page":3,"impactArea":"Master List of — d) Control Plan","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-10","page":3,"impactArea":"Master List of — e) Work Instruction","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-3-11","page":3,"impactArea":"Master List of — h) Process FMEA","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-4-1","page":4,"impactArea":"Master List of — i) Active Parts list","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-4-2","page":4,"impactArea":"Master List of — j) PAP","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""},{"id":"chk-4-3","page":4,"impactArea":"Master List of — k) IMTE / MMD","isAffected":"Pending","actionComments":"","responsibility":"","reqdDate":"","actualDate":"","docNo":"","curRev":"","remarks":""}],"actualImplementationDate":"","actionsOnStockProduced":"","actionsOnToolings":"","otherRemarks":"","informedTo":{"customer":false,"marketing":false,"planning":false,"production":false,"qa":false,"qc":false},"cftCoreTeamNote":"","preparedOnDate":"","signOffs":[{"sign":"","name":"","title":"Production Lead"},{"sign":"","name":"","title":"QA Lead"},{"sign":"","name":"","title":"Planning Engineer"}]}'
  );

  INSERT INTO dbo.Form6_PTR (pcrfId, ptr1Status, ptr2Status, ptr3Status, formDataJson)
  VALUES (
    N'pcrf-001',
    N'Pending',
    N'Pending',
    N'Pending',
    N'{"date":"2026-10-18","from":"R. Karthik","department":"Machine Shop","to":"CFT","customer":"Tata Motors Ltd.","partNameNumber":"Steering Knuckle LH / SA-SK-4410","revNumber":"Rev 01","reason":"Eliminate taper variation in kingpin bore and reduce VMC cycle time from 142s to 118s","requestDate":"2026-10-18","requestSignature":"R. Karthik","ptr1":{"required":"Yes","productionRunDate":"","quantityProduced":"5 Nos","meetsDrawingReq":"Pending","sampleSubmissionReq":"Yes","sampleSubmittedDate":"","sampleStatus":"Pending","actionPlanComments":""},"ptr2":{"required":"Yes","productionRunDate":"","quantityProduced":"25 Nos","meetsDrawingReq":"Pending","sampleSubmissionReq":"Yes","sampleSubmittedDate":"","sampleStatus":"Pending","actionPlanComments":""},"ptr3":{"required":"Yes","productionRunDate":"","quantityProduced":"50 Nos","meetsDrawingReq":"Pending","sampleSubmissionReq":"Yes","sampleSubmittedDate":"","sampleStatus":"Pending","actionPlanComments":""},"coreTeamApprovals":[{"department":"Production","ptr1Status":"Pending","ptr1Comment":"","ptr1Sign":"","ptr2Status":"Pending","ptr2Comment":"","ptr2Sign":"","ptr3Status":"Pending","ptr3Comment":"","ptr3Sign":""},{"department":"Quality","ptr1Status":"Pending","ptr1Comment":"","ptr1Sign":"","ptr2Status":"Pending","ptr2Comment":"","ptr2Sign":"","ptr3Status":"Pending","ptr3Comment":"","ptr3Sign":""},{"department":"Tooling & Fixtures","ptr1Status":"Pending","ptr1Comment":"","ptr1Sign":"","ptr2Status":"Pending","ptr2Comment":"","ptr2Sign":"","ptr3Status":"Pending","ptr3Comment":"","ptr3Sign":""},{"department":"Marketing","ptr1Status":"Pending","ptr1Comment":"","ptr1Sign":"","ptr2Status":"Pending","ptr2Comment":"","ptr2Sign":"","ptr3Status":"Pending","ptr3Comment":"","ptr3Sign":""},{"department":"Maintenance","ptr1Status":"Pending","ptr1Comment":"","ptr1Sign":"","ptr2Status":"Pending","ptr2Comment":"","ptr2Sign":"","ptr3Status":"Pending","ptr3Comment":"","ptr3Sign":""}],"cftComments":"","breakPointDate":"","invoiceDetails":"","identificationOnPartBoxTrolley":""}'
  );

  INSERT INTO dbo.Form7_PPAP (pcrfId, submissionStatus, formDataJson)
  VALUES (
    N'pcrf-001',
    N'Pending',
    N'{"date":"2026-10-18","from":"R. Karthik","department":"Machine Shop","to":"CFT","customer":"Tata Motors Ltd.","partNameNumber":"Steering Knuckle LH / SA-SK-4410","revNumber":"Rev 01","reason":"Eliminate taper variation in kingpin bore and reduce VMC cycle time from 142s to 118s","requestDate":"2026-10-18","requestSignature":"R. Karthik","firstProductionRunDate":"","quantityProduced":"300 Nos","cycleTimeProductionRate":"","pfdNumber":"","pfdRevNo":"","pfdDate":"","controlPlanNumber":"","controlPlanRevNo":"","controlPlanDate":"","deviationsToProcessFlow":"No","processFlowDeviationNature":"","deviationsToControlPlan":"No","controlPlanDeviationNature":"","pswInternalApprovalDate":"","submissionRequired":"Yes","submissionStatus":"Pending","productDispatchAuthBy":"","coreTeamSignOffs":[{"sign":"","name":"","date":""},{"sign":"","name":"","date":""},{"sign":"","name":"","date":""}]}'
  );
END;
GO

-- 8.7 Initial Notification & Audit Log Seed
MERGE dbo.Notifications AS target
USING (VALUES
  (
    N'notif-001',
    N'APPROVAL_REQUIRED',
    N'Plant Head Approval Pending — PCRF-2026-041',
    N'Steering Knuckle LH CNC Bore Finishing Cycle Optimization has completed Timing Plan and awaits Internal / Plant Head approval.',
    N'pcrf-001',
    N'PCRF-2026-041',
    N'["PLANT_HEAD","ADMIN","CFT_LEADER"]',
    0
  )
) AS src (id, type, title, message, pcrfId, pcrfNo, targetRolesJson, isRead)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, type, title, message, pcrfId, pcrfNo, targetRolesJson, isRead)
  VALUES (src.id, src.type, src.title, src.message, src.pcrfId, src.pcrfNo, src.targetRolesJson, src.isRead);
GO

MERGE dbo.AuditLogs AS target
USING (VALUES
  (
    N'aud-seed-001',
    N'u-admin',
    N'V. Balasubramanian',
    N'ADMIN',
    N'SYSTEM',
    N'SACL',
    N'DB_INITIALIZED',
    N'Initialized Sakthi Auto Component Limited Change Management System SQL Server database, master data, and sample PCRF-2026-041.'
  )
) AS src (id, actorId, actorName, actorRole, entityType, entityId, action, details)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, actorId, actorName, actorRole, entityType, entityId, action, details)
  VALUES (src.id, src.actorId, src.actorName, src.actorRole, src.entityType, src.entityId, src.action, src.details);
GO

-- ============================================================================
-- SECTION 9: VERIFICATION & MANAGEMENT REPORTING QUERIES
-- ============================================================================

-- 9.1 Row Count Health Check Across All 15 Tables
SELECT N'Companies'            AS TableName, COUNT(*) AS RowCount FROM dbo.Companies
UNION ALL SELECT N'Users',                 COUNT(*) FROM dbo.Users
UNION ALL SELECT N'Departments',           COUNT(*) FROM dbo.Departments
UNION ALL SELECT N'Customers',             COUNT(*) FROM dbo.Customers
UNION ALL SELECT N'Parts',                 COUNT(*) FROM dbo.Parts
UNION ALL SELECT N'ChangeRequests',        COUNT(*) FROM dbo.ChangeRequests
UNION ALL SELECT N'Form1_PCRF',            COUNT(*) FROM dbo.Form1_PCRF
UNION ALL SELECT N'Form2_Feasibility',     COUNT(*) FROM dbo.Form2_Feasibility
UNION ALL SELECT N'Form3_RiskAnalysis',    COUNT(*) FROM dbo.Form3_RiskAnalysis
UNION ALL SELECT N'Form4_TimingPlan',      COUNT(*) FROM dbo.Form4_TimingPlan
UNION ALL SELECT N'Form5_ChangeChecklist', COUNT(*) FROM dbo.Form5_ChangeChecklist
UNION ALL SELECT N'Form6_PTR',             COUNT(*) FROM dbo.Form6_PTR
UNION ALL SELECT N'Form7_PPAP',            COUNT(*) FROM dbo.Form7_PPAP
UNION ALL SELECT N'Notifications',         COUNT(*) FROM dbo.Notifications
UNION ALL SELECT N'AuditLogs',             COUNT(*) FROM dbo.AuditLogs;
GO

-- 9.2 Sample Operational Views
SELECT * FROM dbo.vw_ChangeRequestOverview ORDER BY updatedAt DESC;
SELECT * FROM dbo.vw_CompanyUnitKPI ORDER BY totalRequests DESC;
SELECT * FROM dbo.vw_PendingApprovalsQueue ORDER BY dueDate ASC;
GO
