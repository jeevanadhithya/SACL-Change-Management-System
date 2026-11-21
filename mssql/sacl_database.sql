-- ============================================================================
-- SAKTHI AUTO COMPONENT LIMITED (SACL) - CHANGE MANAGEMENT SYSTEM
-- Single Common Master Database Script (Microsoft SQL Server 2019 / 2022 / 2025)
-- File: mssql/sacl_database.sql
--
-- ONE UNIFIED, 100% IDEMPOTENT SCRIPT FOR BOTH FRESH SETUP & SAFE UPDATES:
--   SECTION 1 : Database Creation ([SACL]) + Optional Dev Clean Reset Block
--   SECTION 2 : All 15 Tables (Companies, Users with Self-Service Profile &
--               JWT RBAC, Departments, Customers, Company Manufactured Parts,
--               ChangeRequests, Form1_PCRF .. Form7_PPAP, Notifications, AuditLogs)
--   SECTION 3 : Idempotent Schema-Sync Upgrades (Safe to re-run on existing DB)
--   SECTION 4 : Performance Indexes
--   SECTION 5 : User Directory, Change Request & KPI Views
--   SECTION 6 : Operational Stored Procedures (incl. Self-Service Profile Update)
--   SECTION 7 : Core 8 Sakthi Auto Portal Users (EMP101, HOD201, HOF301, COF302,
--               CFT401, CFTL01, PH001, ADM001 | Default password: password123)
--               Zero fake companies, parts, or change requests.
--   SECTION 8 : Verification & Table Health Check Queries
-- ============================================================================

SET NOCOUNT ON;
GO

-- ============================================================================
-- SECTION 1: DATABASE CREATION
-- Optional Development Reset:
-- To wipe and rebuild [SACL] completely from scratch during development,
-- uncomment the block below before executing.
-- ============================================================================
/*
USE [master];
GO
IF DB_ID(N'SACL') IS NOT NULL
BEGIN
  ALTER DATABASE [SACL] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE [SACL];
END;
GO
*/

IF DB_ID(N'SACL') IS NULL
BEGIN
  CREATE DATABASE [SACL];
END;
GO

USE [SACL];
GO

-- ============================================================================
-- SECTION 2: ALL 15 PROJECT TABLES
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

-- 2.2 Portal Users, JWT RBAC Roles & Self-Service Profile Customization
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Users (
    id                  NVARCHAR(64)  NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
    employeeId          NVARCHAR(32)  NOT NULL CONSTRAINT UQ_Users_EmployeeId UNIQUE,
    username            NVARCHAR(64)  NULL,
    name                NVARCHAR(150) NOT NULL,
    email               NVARCHAR(150) NOT NULL,
    phone               NVARCHAR(32)  NULL,
    role                NVARCHAR(32)  NOT NULL,
    department          NVARCHAR(120) NOT NULL,
    title               NVARCHAR(150) NOT NULL,
    facility            NVARCHAR(64)  NOT NULL,
    plantLocation       NVARCHAR(150) NULL,
    bio                 NVARCHAR(500) NULL,
    avatarInitials      NVARCHAR(8)   NULL,
    emailNotifications  BIT           NOT NULL CONSTRAINT DF_Users_EmailNotif DEFAULT (1),
    inAppNotifications  BIT           NOT NULL CONSTRAINT DF_Users_InAppNotif DEFAULT (1),
    companyId           NVARCHAR(64)  NULL CONSTRAINT FK_Users_Companies FOREIGN KEY REFERENCES dbo.Companies(id),
    passwordHash        NVARCHAR(255) NOT NULL,
    active              BIT           NOT NULL CONSTRAINT DF_Users_Active DEFAULT (1),
    createdAt           DATETIME2     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
    updatedAt           DATETIME2     NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Users_Role CHECK (
      role IN (
        N'ADMIN',
        N'EMPLOYEE',
        N'COMPANY_USER',
        N'HOD',
        N'HOF',
        N'COF',
        N'CFT',
        N'CFT_LEADER',
        N'PLANT_HEAD'
      )
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

-- 2.5 Company Manufactured Parts Master (Reflected Across PCRF & Forms 1-7)
IF OBJECT_ID(N'dbo.Parts', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Parts (
    id               NVARCHAR(64)  NOT NULL CONSTRAINT PK_Parts PRIMARY KEY,
    companyId        NVARCHAR(64)  NULL CONSTRAINT FK_Parts_Companies FOREIGN KEY REFERENCES dbo.Companies(id),
    partNumber       NVARCHAR(64)  NOT NULL CONSTRAINT UQ_Parts_PartNumber UNIQUE,
    partName         NVARCHAR(200) NOT NULL,
    customer         NVARCHAR(200) NOT NULL,
    facility         NVARCHAR(64)  NOT NULL,
    currentRevision  NVARCHAR(32)  NOT NULL,
    drawingNumber    NVARCHAR(100) NULL,
    materialGrade    NVARCHAR(120) NULL,
    processType      NVARCHAR(120) NULL,
    specifications   NVARCHAR(500) NULL,
    createdAt        DATETIME2     NOT NULL CONSTRAINT DF_Parts_CreatedAt DEFAULT (SYSUTCDATETIME())
  );
END;
GO

-- 2.6 Master Change Request Workflow Record (9-Stage Lifecycle)
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

-- 2.7 Form 1: Process Change Requisition Form (QF/07/MRO-15)
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

-- 2.8 Form 2: Feasibility Report for Change Request (QF/07/MRO-02)
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

-- 2.9 Form 3: Risk Analysis Check Sheet (QF/07/MKT-14)
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

-- 2.10 Form 4: Timing Plan (QF/07/MKT-08)
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

-- 2.11 Form 5: Checklist for Managing and Tracking Change (QF/07/MRO-03 - 4 Pages)
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

-- 2.12 Form 6: PTR Initiation Form (QF/07/MRO-16 - PTR 1 -> PTR 2 -> PTR 3)
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

-- 2.13 Form 7: PPAP Initiation Form cum Production Report (QF/07/MRO-05)
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

-- 2.14 Workflow Notifications
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

-- 2.15 Immutable Audit Trail Logs
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
-- SECTION 3: IDEMPOTENT SCHEMA-SYNC UPGRADES (SAFE ON EXISTING [SACL] DB)
-- ============================================================================

-- 3.1 Ensure dbo.Users has companyId & all self-service profile columns
IF COL_LENGTH(N'dbo.Users', N'companyId') IS NULL
  ALTER TABLE dbo.Users ADD companyId NVARCHAR(64) NULL CONSTRAINT FK_Users_Companies FOREIGN KEY REFERENCES dbo.Companies(id);

IF COL_LENGTH(N'dbo.Users', N'username') IS NULL
  ALTER TABLE dbo.Users ADD username NVARCHAR(64) NULL;

IF COL_LENGTH(N'dbo.Users', N'phone') IS NULL
  ALTER TABLE dbo.Users ADD phone NVARCHAR(32) NULL;

IF COL_LENGTH(N'dbo.Users', N'plantLocation') IS NULL
  ALTER TABLE dbo.Users ADD plantLocation NVARCHAR(150) NULL;

IF COL_LENGTH(N'dbo.Users', N'bio') IS NULL
  ALTER TABLE dbo.Users ADD bio NVARCHAR(500) NULL;

IF COL_LENGTH(N'dbo.Users', N'avatarInitials') IS NULL
  ALTER TABLE dbo.Users ADD avatarInitials NVARCHAR(8) NULL;

IF COL_LENGTH(N'dbo.Users', N'emailNotifications') IS NULL
  ALTER TABLE dbo.Users ADD emailNotifications BIT NOT NULL CONSTRAINT DF_Users_EmailNotif DEFAULT (1);

IF COL_LENGTH(N'dbo.Users', N'inAppNotifications') IS NULL
  ALTER TABLE dbo.Users ADD inAppNotifications BIT NOT NULL CONSTRAINT DF_Users_InAppNotif DEFAULT (1);

IF COL_LENGTH(N'dbo.Users', N'updatedAt') IS NULL
  ALTER TABLE dbo.Users ADD updatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT (SYSUTCDATETIME());
GO

UPDATE dbo.Users SET username = employeeId WHERE username IS NULL;
GO

-- 3.2 Refresh CK_Users_Role constraint to guarantee all 9 RBAC roles (incl. COMPANY_USER)
IF EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE name = N'CK_Users_Role'
    AND parent_object_id = OBJECT_ID(N'dbo.Users')
)
BEGIN
  ALTER TABLE dbo.Users DROP CONSTRAINT CK_Users_Role;
END;

ALTER TABLE dbo.Users
  ADD CONSTRAINT CK_Users_Role CHECK (
    role IN (
      N'ADMIN',
      N'EMPLOYEE',
      N'COMPANY_USER',
      N'HOD',
      N'HOF',
      N'COF',
      N'CFT',
      N'CFT_LEADER',
      N'PLANT_HEAD'
    )
  );
GO

-- 3.3 Ensure dbo.Parts has Company Manufactured Part columns
IF COL_LENGTH(N'dbo.Parts', N'companyId') IS NULL
  ALTER TABLE dbo.Parts ADD companyId NVARCHAR(64) NULL CONSTRAINT FK_Parts_Companies FOREIGN KEY REFERENCES dbo.Companies(id);

IF COL_LENGTH(N'dbo.Parts', N'drawingNumber') IS NULL
  ALTER TABLE dbo.Parts ADD drawingNumber NVARCHAR(100) NULL;

IF COL_LENGTH(N'dbo.Parts', N'materialGrade') IS NULL
  ALTER TABLE dbo.Parts ADD materialGrade NVARCHAR(120) NULL;

IF COL_LENGTH(N'dbo.Parts', N'processType') IS NULL
  ALTER TABLE dbo.Parts ADD processType NVARCHAR(120) NULL;

IF COL_LENGTH(N'dbo.Parts', N'specifications') IS NULL
  ALTER TABLE dbo.Parts ADD specifications NVARCHAR(500) NULL;
GO

-- ============================================================================
-- SECTION 4: PERFORMANCE INDEXES
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_Role_Active' AND object_id = OBJECT_ID(N'dbo.Users'))
  CREATE NONCLUSTERED INDEX IX_Users_Role_Active ON dbo.Users (role, active) INCLUDE (employeeId, username, name, department);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_CompanyId' AND object_id = OBJECT_ID(N'dbo.Users'))
  CREATE NONCLUSTERED INDEX IX_Users_CompanyId ON dbo.Users (companyId, active) INCLUDE (employeeId, name, role);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Parts_CompanyId' AND object_id = OBJECT_ID(N'dbo.Parts'))
  CREATE NONCLUSTERED INDEX IX_Parts_CompanyId ON dbo.Parts (companyId, partNumber);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChangeRequests_Stage_Status' AND object_id = OBJECT_ID(N'dbo.ChangeRequests'))
  CREATE NONCLUSTERED INDEX IX_ChangeRequests_Stage_Status ON dbo.ChangeRequests (currentStage, overallStatus, updatedAt DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChangeRequests_CompanyId' AND object_id = OBJECT_ID(N'dbo.ChangeRequests'))
  CREATE NONCLUSTERED INDEX IX_ChangeRequests_CompanyId ON dbo.ChangeRequests (companyId, createdAt DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Form3_RiskLevel' AND object_id = OBJECT_ID(N'dbo.Form3_RiskAnalysis'))
  CREATE NONCLUSTERED INDEX IX_Form3_RiskLevel ON dbo.Form3_RiskAnalysis (overallRiskLevel, conclusion);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Form7_SubmissionStatus' AND object_id = OBJECT_ID(N'dbo.Form7_PPAP'))
  CREATE NONCLUSTERED INDEX IX_Form7_SubmissionStatus ON dbo.Form7_PPAP (submissionStatus);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Notifications_CreatedAt' AND object_id = OBJECT_ID(N'dbo.Notifications'))
  CREATE NONCLUSTERED INDEX IX_Notifications_CreatedAt ON dbo.Notifications (createdAt DESC, isRead);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Timestamp' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
  CREATE NONCLUSTERED INDEX IX_AuditLogs_Timestamp ON dbo.AuditLogs (timestamp DESC) INCLUDE (actorName, actorRole, action, entityId);
GO

-- ============================================================================
-- SECTION 5: MANAGEMENT, USER DIRECTORY & ANALYTICS VIEWS
-- ============================================================================

-- 5.1 User Directory & Profile Overview (Excludes Password Hashes)
CREATE OR ALTER VIEW dbo.vw_UserDirectory AS
SELECT
  u.id,
  u.employeeId,
  COALESCE(u.username, u.employeeId) AS username,
  u.name,
  u.email,
  u.phone,
  u.role,
  u.department,
  u.title,
  u.facility,
  u.plantLocation,
  u.bio,
  u.avatarInitials,
  u.emailNotifications,
  u.inAppNotifications,
  u.companyId,
  c.code AS companyCode,
  CASE WHEN c.id IS NOT NULL THEN CONCAT(c.name, N' (', c.unitName, N')') ELSE NULL END AS companyName,
  u.active,
  u.createdAt,
  u.updatedAt
FROM dbo.Users u
LEFT JOIN dbo.Companies c ON u.companyId = c.id;
GO

-- 5.2 Complete 7-Form Interconnected Change Request Overview
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
LEFT JOIN dbo.Companies c              ON cr.companyId = c.id
LEFT JOIN dbo.Form1_PCRF f1            ON cr.id = f1.pcrfId
LEFT JOIN dbo.Form2_Feasibility f2     ON cr.id = f2.pcrfId
LEFT JOIN dbo.Form3_RiskAnalysis f3    ON cr.id = f3.pcrfId
LEFT JOIN dbo.Form4_TimingPlan f4      ON cr.id = f4.pcrfId
LEFT JOIN dbo.Form5_ChangeChecklist f5 ON cr.id = f5.pcrfId
LEFT JOIN dbo.Form6_PTR f6             ON cr.id = f6.pcrfId
LEFT JOIN dbo.Form7_PPAP f7            ON cr.id = f7.pcrfId;
GO

-- 5.3 Company / Manufacturing Unit Workload KPIs (Zero NULL-Aggregate Warnings)
CREATE OR ALTER VIEW dbo.vw_CompanyUnitKPI AS
SELECT
  c.id AS companyId,
  c.code AS companyCode,
  c.name AS companyName,
  c.unitName,
  c.facilityType,
  c.location,
  c.active,
  SUM(CASE WHEN cr.id IS NOT NULL THEN 1 ELSE 0 END) AS totalRequests,
  SUM(CASE WHEN cr.overallStatus NOT IN (N'Closed', N'Rejected') AND cr.id IS NOT NULL THEN 1 ELSE 0 END) AS openRequests,
  SUM(CASE WHEN cr.overallStatus = N'Closed' THEN 1 ELSE 0 END) AS closedRequests,
  SUM(CASE WHEN f3.overallRiskLevel = N'H' THEN 1 ELSE 0 END) AS highRiskRequests
FROM dbo.Companies c
LEFT JOIN dbo.ChangeRequests cr     ON c.id = cr.companyId
LEFT JOIN dbo.Form3_RiskAnalysis f3 ON cr.id = f3.pcrfId
GROUP BY c.id, c.code, c.name, c.unitName, c.facilityType, c.location, c.active;
GO

-- 5.4 Active Pending Approvals Queue
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
-- SECTION 6: OPERATIONAL STORED PROCEDURES
-- ============================================================================

-- 6.1 Self-Service User Profile Update (Restricted to Safe Profile Fields Only)
CREATE OR ALTER PROCEDURE dbo.sp_UpdateUserProfile
  @userId              NVARCHAR(64),
  @name                NVARCHAR(150) = NULL,
  @email               NVARCHAR(150) = NULL,
  @phone               NVARCHAR(32)  = NULL,
  @department          NVARCHAR(120) = NULL,
  @title               NVARCHAR(150) = NULL,
  @facility            NVARCHAR(64)  = NULL,
  @plantLocation       NVARCHAR(150) = NULL,
  @bio                 NVARCHAR(500) = NULL,
  @avatarInitials      NVARCHAR(8)   = NULL,
  @emailNotifications  BIT           = NULL,
  @inAppNotifications  BIT           = NULL
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE dbo.Users
  SET
    name               = COALESCE(@name, name),
    email              = COALESCE(@email, email),
    phone              = COALESCE(@phone, phone),
    department         = COALESCE(@department, department),
    title              = COALESCE(@title, title),
    facility           = COALESCE(@facility, facility),
    plantLocation      = COALESCE(@plantLocation, plantLocation),
    bio                = COALESCE(@bio, bio),
    avatarInitials     = COALESCE(@avatarInitials, avatarInitials),
    emailNotifications = COALESCE(@emailNotifications, emailNotifications),
    inAppNotifications = COALESCE(@inAppNotifications, inAppNotifications),
    updatedAt          = SYSUTCDATETIME()
  WHERE id = @userId AND active = 1;

  SELECT * FROM dbo.vw_UserDirectory WHERE id = @userId;
END;
GO

-- 6.2 Fetch Full Change Request + All 7 Forms by ID or PCRF Number
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

-- 6.3 Executive Dashboard KPI Summary
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

-- 6.4 Append Immutable Audit Trail Event
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
-- SECTION 7: SEED DATA — 8 CORE SAKTHI AUTO USERS (ZERO FAKE BUSINESS DATA)
-- Provisions ONLY the 8 Sakthi Auto portal role accounts:
--   1. EMP101  — R. Karthik         (Employee)
--   2. HOD201  — S. Muruganandam    (HOD)
--   3. HOF301  — K. Natarajan       (HOF)
--   4. COF302  — M. Senthil Kumar   (COF)
--   5. CFT401  — P. Anitha          (CFT Member)
--   6. CFTL01  — D. Prakash Raj     (CFT Leader)
--   7. PH001   — N. Chandrasekhar   (Plant Head)
--   8. ADM001  — V. Balasubramanian (Admin)
--
-- Default login password for newly inserted accounts: password123
-- Existing customized profile details & passwords on matched users are preserved.
-- ============================================================================

MERGE dbo.Users AS target
USING (VALUES
  (
    N'u-emp', N'EMP101', N'EMP101', N'R. Karthik', N'karthik.r@sakthiauto.com', N'+91 4259 234101',
    N'EMPLOYEE', N'Machine Shop', N'Senior Process Engineer', N'Machine Shop',
    N'Pollachi Machine Shop Unit I, Tamil Nadu',
    N'CNC turning, VMC fixture engineering, and 4M process change initiation.',
    N'RK', 1, 1, NULL,
    N'scrypt$sacl2026init0001$91052a3e89244c9f7cc226fd3af9303d2ac872e19e01a42513da875482ecfcf6128c03587f423a30515b36c83f5945c6af7504ad7e559bce7b94e88cc5956ca6',
    1
  ),
  (
    N'u-hod', N'HOD201', N'HOD201', N'S. Muruganandam', N'murugan.s@sakthiauto.com', N'+91 4259 234201',
    N'HOD', N'Machine Shop', N'Head of Department — Machining', N'Machine Shop',
    N'Pollachi Machine Shop Unit I, Tamil Nadu',
    N'Department-level technical review and PCRF approval authority for Machining.',
    N'SM', 1, 1, NULL,
    N'scrypt$sacl2026init0001$91052a3e89244c9f7cc226fd3af9303d2ac872e19e01a42513da875482ecfcf6128c03587f423a30515b36c83f5945c6af7504ad7e559bce7b94e88cc5956ca6',
    1
  ),
  (
    N'u-hof', N'HOF301', N'HOF301', N'K. Natarajan', N'natarajan.k@sakthiauto.com', N'+91 4259 234301',
    N'HOF', N'Foundry Operations', N'Head of Foundry (HOF)', N'Foundry',
    N'Pollachi Foundry Division, Tamil Nadu',
    N'Melting, SG Iron metallurgy, molding line governance, and foundry change sign-off.',
    N'KN', 1, 1, NULL,
    N'scrypt$sacl2026init0001$91052a3e89244c9f7cc226fd3af9303d2ac872e19e01a42513da875482ecfcf6128c03587f423a30515b36c83f5945c6af7504ad7e559bce7b94e88cc5956ca6',
    1
  ),
  (
    N'u-cof', N'COF302', N'COF302', N'M. Senthil Kumar', N'senthil.m@sakthiauto.com', N'+91 4259 234302',
    N'COF', N'Machining & Assembly', N'Chief of Operations / Facility (COF)', N'Machine Shop',
    N'Pollachi Operations Complex, Tamil Nadu',
    N'Cross-plant manufacturing operations, capacity planning, and facility sign-off.',
    N'MS', 1, 1, NULL,
    N'scrypt$sacl2026init0001$91052a3e89244c9f7cc226fd3af9303d2ac872e19e01a42513da875482ecfcf6128c03587f423a30515b36c83f5945c6af7504ad7e559bce7b94e88cc5956ca6',
    1
  ),
  (
    N'u-cft', N'CFT401', N'CFT401', N'P. Anitha', N'anitha.p@sakthiauto.com', N'+91 4259 234401',
    N'CFT', N'Quality Assurance', N'CFT Quality Engineer', N'Quality',
    N'Pollachi Quality & Metrology Lab, Tamil Nadu',
    N'Feasibility evaluation, 4M Risk Analysis, PTR inspection, and PPAP verification.',
    N'PA', 1, 1, NULL,
    N'scrypt$sacl2026init0001$91052a3e89244c9f7cc226fd3af9303d2ac872e19e01a42513da875482ecfcf6128c03587f423a30515b36c83f5945c6af7504ad7e559bce7b94e88cc5956ca6',
    1
  ),
  (
    N'u-cftl', N'CFTL01', N'CFTL01', N'D. Prakash Raj', N'prakash.d@sakthiauto.com', N'+91 4259 234501',
    N'CFT_LEADER', N'New Product Development', N'CFT Leader — APQP & Change Control', N'Corporate',
    N'Pollachi APQP & NPD Center, Tamil Nadu',
    N'Leads Cross-Functional Team milestones, APQP Timing Plans, and customer PPAP sign-offs.',
    N'DP', 1, 1, NULL,
    N'scrypt$sacl2026init0001$91052a3e89244c9f7cc226fd3af9303d2ac872e19e01a42513da875482ecfcf6128c03587f423a30515b36c83f5945c6af7504ad7e559bce7b94e88cc5956ca6',
    1
  ),
  (
    N'u-ph', N'PH001', N'PH001', N'N. Chandrasekhar', N'chandrasekhar.n@sakthiauto.com', N'+91 4259 234001',
    N'PLANT_HEAD', N'Plant Management', N'Plant Head — Pollachi Operations', N'Corporate',
    N'Pollachi Plant HQ, Tamil Nadu',
    N'Executive plant leadership and final internal approval authority for 4M changes.',
    N'NC', 1, 1, NULL,
    N'scrypt$sacl2026init0001$91052a3e89244c9f7cc226fd3af9303d2ac872e19e01a42513da875482ecfcf6128c03587f423a30515b36c83f5945c6af7504ad7e559bce7b94e88cc5956ca6',
    1
  ),
  (
    N'u-admin', N'ADM001', N'ADM001', N'V. Balasubramanian', N'admin@sakthiauto.com', N'+91 4259 234100',
    N'ADMIN', N'Corporate IT & Systems', N'System Administrator', N'Corporate',
    N'Pollachi Corporate HQ, Tamil Nadu',
    N'System governance, JWT access control, and plant master administration.',
    N'VB', 1, 1, NULL,
    N'scrypt$sacl2026init0001$91052a3e89244c9f7cc226fd3af9303d2ac872e19e01a42513da875482ecfcf6128c03587f423a30515b36c83f5945c6af7504ad7e559bce7b94e88cc5956ca6',
    1
  )
) AS src (
  id, employeeId, username, name, email, phone,
  role, department, title, facility,
  plantLocation, bio, avatarInitials,
  emailNotifications, inAppNotifications, companyId, passwordHash, active
)
ON UPPER(target.employeeId) = UPPER(src.employeeId)
WHEN MATCHED THEN
  UPDATE SET
    target.username       = COALESCE(target.username, src.username),
    target.phone          = COALESCE(target.phone, src.phone),
    target.plantLocation  = COALESCE(target.plantLocation, src.plantLocation),
    target.bio            = COALESCE(target.bio, src.bio),
    target.avatarInitials = COALESCE(target.avatarInitials, src.avatarInitials)
WHEN NOT MATCHED THEN
  INSERT (
    id, employeeId, username, name, email, phone,
    role, department, title, facility,
    plantLocation, bio, avatarInitials,
    emailNotifications, inAppNotifications, companyId, passwordHash, active
  )
  VALUES (
    src.id, src.employeeId, src.username, src.name, src.email, src.phone,
    src.role, src.department, src.title, src.facility,
    src.plantLocation, src.bio, src.avatarInitials,
    src.emailNotifications, src.inAppNotifications, src.companyId, src.passwordHash, src.active
  );
GO

-- ============================================================================
-- SECTION 8: VERIFICATION & HEALTH CHECK QUERIES
-- ============================================================================

-- 8.1 Verify Active Database Portal Accounts (Powers Login Role-Based Portal Access)
SELECT
  employeeId,
  username,
  name,
  role,
  department,
  title,
  facility,
  phone,
  plantLocation,
  avatarInitials,
  active
FROM dbo.vw_UserDirectory
ORDER BY
  CASE role
    WHEN N'EMPLOYEE'     THEN 1
    WHEN N'HOD'          THEN 2
    WHEN N'HOF'          THEN 3
    WHEN N'COF'          THEN 4
    WHEN N'CFT'          THEN 5
    WHEN N'CFT_LEADER'   THEN 6
    WHEN N'PLANT_HEAD'   THEN 7
    WHEN N'ADMIN'        THEN 8
    WHEN N'COMPANY_USER' THEN 9
    ELSE 10
  END,
  employeeId ASC;

-- 8.2 Row Count Health Check Across All 15 Tables
SELECT N'Companies'            AS TableName, COUNT(*) AS TotalRows FROM dbo.Companies
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
