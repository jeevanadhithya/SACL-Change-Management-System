-- ============================================================================
-- Sakthi Auto Component Limited (SACL) - Change Management System
-- 01_schema.sql : Microsoft SQL Server (T-SQL) Database & Table Schema
-- Database: SACL
-- ============================================================================

IF DB_ID('SACL') IS NULL
BEGIN
  CREATE DATABASE SACL;
END;
GO

USE SACL;
GO

IF OBJECT_ID('dbo.Companies', 'U') IS NULL
CREATE TABLE dbo.Companies (
  id NVARCHAR(64) PRIMARY KEY,
  code NVARCHAR(32) NOT NULL UNIQUE,
  name NVARCHAR(200) NOT NULL,
  unitName NVARCHAR(150) NOT NULL,
  facilityType NVARCHAR(64) NOT NULL,
  location NVARCHAR(200) NOT NULL,
  gstOrRegNo NVARCHAR(80) NULL,
  contactEmail NVARCHAR(150) NULL,
  active BIT NOT NULL DEFAULT 1,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID('dbo.Users', 'U') IS NULL
CREATE TABLE dbo.Users (
  id NVARCHAR(64) PRIMARY KEY,
  employeeId NVARCHAR(32) NOT NULL UNIQUE,
  name NVARCHAR(150) NOT NULL,
  email NVARCHAR(150) NOT NULL,
  role NVARCHAR(32) NOT NULL,
  department NVARCHAR(120) NOT NULL,
  title NVARCHAR(150) NOT NULL,
  facility NVARCHAR(64) NOT NULL,
  companyId NVARCHAR(64) NULL FOREIGN KEY REFERENCES dbo.Companies(id),
  passwordHash NVARCHAR(255) NOT NULL,
  active BIT NOT NULL DEFAULT 1,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID('dbo.Departments', 'U') IS NULL
CREATE TABLE dbo.Departments (
  id NVARCHAR(64) PRIMARY KEY,
  code NVARCHAR(32) NOT NULL UNIQUE,
  name NVARCHAR(150) NOT NULL,
  facility NVARCHAR(64) NOT NULL,
  hodName NVARCHAR(150) NOT NULL,
  memberCount INT NOT NULL DEFAULT 0
);
GO

IF OBJECT_ID('dbo.Customers', 'U') IS NULL
CREATE TABLE dbo.Customers (
  id NVARCHAR(64) PRIMARY KEY,
  code NVARCHAR(32) NOT NULL UNIQUE,
  name NVARCHAR(200) NOT NULL,
  location NVARCHAR(150) NOT NULL,
  contactPerson NVARCHAR(150) NOT NULL
);
GO

IF OBJECT_ID('dbo.Parts', 'U') IS NULL
CREATE TABLE dbo.Parts (
  id NVARCHAR(64) PRIMARY KEY,
  partNumber NVARCHAR(64) NOT NULL UNIQUE,
  partName NVARCHAR(200) NOT NULL,
  customer NVARCHAR(200) NOT NULL,
  facility NVARCHAR(64) NOT NULL,
  currentRevision NVARCHAR(32) NOT NULL
);
GO

IF OBJECT_ID('dbo.ChangeRequests', 'U') IS NULL
CREATE TABLE dbo.ChangeRequests (
  id NVARCHAR(64) PRIMARY KEY,
  pcrfNo NVARCHAR(40) NOT NULL UNIQUE,
  companyId NVARCHAR(64) NULL FOREIGN KEY REFERENCES dbo.Companies(id),
  companyName NVARCHAR(200) NULL,
  title NVARCHAR(300) NOT NULL,
  priority NVARCHAR(32) NOT NULL,
  createdBy NVARCHAR(150) NOT NULL,
  createdByEmployeeId NVARCHAR(32) NOT NULL,
  dueDate NVARCHAR(32) NOT NULL,
  currentStage NVARCHAR(40) NOT NULL,
  overallStatus NVARCHAR(40) NOT NULL,
  workflowJson NVARCHAR(MAX) NOT NULL,
  documentsJson NVARCHAR(MAX) NOT NULL,
  activityHistoryJson NVARCHAR(MAX) NOT NULL,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Form 1: Process Change Requisition Form (QF/07/MRO-15)
IF OBJECT_ID('dbo.Form1_PCRF', 'U') IS NULL
CREATE TABLE dbo.Form1_PCRF (
  pcrfId NVARCHAR(64) PRIMARY KEY FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
  pcrfNo NVARCHAR(40) NOT NULL,
  formDataJson NVARCHAR(MAX) NOT NULL,
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Form 2: Feasibility Report for Change Request (QF/07/MRO-02)
IF OBJECT_ID('dbo.Form2_Feasibility', 'U') IS NULL
CREATE TABLE dbo.Form2_Feasibility (
  pcrfId NVARCHAR(64) PRIMARY KEY FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
  conclusion NVARCHAR(32) NOT NULL,
  formDataJson NVARCHAR(MAX) NOT NULL,
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Form 3: Risk Analysis Check Sheet (QF/07/MKT-14)
IF OBJECT_ID('dbo.Form3_RiskAnalysis', 'U') IS NULL
CREATE TABLE dbo.Form3_RiskAnalysis (
  pcrfId NVARCHAR(64) PRIMARY KEY FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
  overallRiskLevel NVARCHAR(8) NOT NULL,
  conclusion NVARCHAR(32) NOT NULL,
  formDataJson NVARCHAR(MAX) NOT NULL,
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Form 4: Timing Plan (QF/07/MKT-08)
IF OBJECT_ID('dbo.Form4_TimingPlan', 'U') IS NULL
CREATE TABLE dbo.Form4_TimingPlan (
  pcrfId NVARCHAR(64) PRIMARY KEY FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
  goForNextPhase NVARCHAR(16) NOT NULL,
  formDataJson NVARCHAR(MAX) NOT NULL,
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Form 5: Checklist for Managing and Tracking Change (QF/07/MRO-03)
IF OBJECT_ID('dbo.Form5_ChangeChecklist', 'U') IS NULL
CREATE TABLE dbo.Form5_ChangeChecklist (
  pcrfId NVARCHAR(64) PRIMARY KEY FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
  formDataJson NVARCHAR(MAX) NOT NULL,
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Form 6: PTR Initiation Form (QF/07/MRO-16)
IF OBJECT_ID('dbo.Form6_PTR', 'U') IS NULL
CREATE TABLE dbo.Form6_PTR (
  pcrfId NVARCHAR(64) PRIMARY KEY FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
  ptr1Status NVARCHAR(16) NOT NULL,
  ptr2Status NVARCHAR(16) NOT NULL,
  ptr3Status NVARCHAR(16) NOT NULL,
  formDataJson NVARCHAR(MAX) NOT NULL,
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Form 7: PPAP Initiation Form cum Production Report (QF/07/MRO-05)
IF OBJECT_ID('dbo.Form7_PPAP', 'U') IS NULL
CREATE TABLE dbo.Form7_PPAP (
  pcrfId NVARCHAR(64) PRIMARY KEY FOREIGN KEY REFERENCES dbo.ChangeRequests(id) ON DELETE CASCADE,
  submissionStatus NVARCHAR(16) NOT NULL,
  formDataJson NVARCHAR(MAX) NOT NULL,
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
CREATE TABLE dbo.Notifications (
  id NVARCHAR(64) PRIMARY KEY,
  type NVARCHAR(64) NOT NULL,
  title NVARCHAR(250) NOT NULL,
  message NVARCHAR(MAX) NOT NULL,
  pcrfId NVARCHAR(64) NOT NULL,
  pcrfNo NVARCHAR(40) NOT NULL,
  targetRolesJson NVARCHAR(MAX) NOT NULL,
  isRead BIT NOT NULL DEFAULT 0,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
CREATE TABLE dbo.AuditLogs (
  id NVARCHAR(64) PRIMARY KEY,
  timestamp DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  actorId NVARCHAR(64) NOT NULL,
  actorName NVARCHAR(150) NOT NULL,
  actorRole NVARCHAR(32) NOT NULL,
  entityType NVARCHAR(64) NOT NULL,
  entityId NVARCHAR(64) NOT NULL,
  action NVARCHAR(64) NOT NULL,
  details NVARCHAR(MAX) NOT NULL
);
GO

-- Performance Indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ChangeRequests_CurrentStage' AND object_id = OBJECT_ID('dbo.ChangeRequests'))
  CREATE INDEX IX_ChangeRequests_CurrentStage ON dbo.ChangeRequests(currentStage, overallStatus);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ChangeRequests_CompanyId' AND object_id = OBJECT_ID('dbo.ChangeRequests'))
  CREATE INDEX IX_ChangeRequests_CompanyId ON dbo.ChangeRequests(companyId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_CreatedAt' AND object_id = OBJECT_ID('dbo.Notifications'))
  CREATE INDEX IX_Notifications_CreatedAt ON dbo.Notifications(createdAt DESC, isRead);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLogs_Timestamp' AND object_id = OBJECT_ID('dbo.AuditLogs'))
  CREATE INDEX IX_AuditLogs_Timestamp ON dbo.AuditLogs(timestamp DESC);
GO
