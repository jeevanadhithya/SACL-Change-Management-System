-- ============================================================================
-- Sakthi Auto Component Limited (SACL) - Change Management System
-- 02_seed_master_data.sql : Idempotent Master Data Seed (Companies, Users,
-- Departments, Customers, and Parts)
-- ============================================================================

USE SACL;
GO

-- 1. Companies / Plant Units
MERGE dbo.Companies AS target
USING (VALUES
  ('comp-01', 'SACL-MSH', 'Sakthi Auto Component Limited', 'Machine Shop Division (Unit I)', 'Machine Shop', 'Mukasi Pallagoundanpalayam, Pollachi, TN', '33AAACS8812N1Z4', 'machineshop@sakthiauto.com', 1),
  ('comp-02', 'SACL-FDY', 'Sakthi Auto Component Limited', 'Foundry Operations (Disamatic Lines)', 'Foundry', 'Pollachi, Tamil Nadu', '33AAACS8812N1Z4', 'foundry@sakthiauto.com', 1),
  ('comp-03', 'SACL-COI', 'Sakthi Auto Precision Machining Pvt. Ltd.', 'CNC & Axle Sub-Assembly Plant', 'Foundry & Machine Shop', 'Coimbatore Industrial Estate, TN', '33AABCS9044K1Z9', 'coimbatore.plant@sakthiauto.com', 1)
) AS src (id, code, name, unitName, facilityType, location, gstOrRegNo, contactEmail, active)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, code, name, unitName, facilityType, location, gstOrRegNo, contactEmail, active)
  VALUES (src.id, src.code, src.name, src.unitName, src.facilityType, src.location, src.gstOrRegNo, src.contactEmail, src.active);
GO

-- 2. Departments & CFT Units
MERGE dbo.Departments AS target
USING (VALUES
  ('dept-01', 'MSH-CNC', 'Machine Shop Operations', 'Machine Shop', 'S. Rajeshkumar', 42),
  ('dept-02', 'FDY-DISA', 'Foundry Operations (DISA)', 'Foundry', 'K. Natarajan', 64),
  ('dept-03', 'QA-MET', 'Quality Assurance & Metallurgy', 'Quality', 'P. Anitha', 28),
  ('dept-04', 'TOOL-ENG', 'Tooling, Fixtures & Pattern', 'Machine Shop', 'M. Senthil Kumar', 19),
  ('dept-05', 'MKT-CUST', 'Marketing & Customer Coordination', 'Corporate', 'R. Karthik', 12),
  ('dept-06', 'MAINT-UTL', 'Plant Maintenance & Utilities', 'Machine Shop', 'S. Velmurugan', 22)
) AS src (id, code, name, facility, hodName, memberCount)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, code, name, facility, hodName, memberCount)
  VALUES (src.id, src.code, src.name, src.facility, src.hodName, src.memberCount);
GO

-- 3. Customers Master
MERGE dbo.Customers AS target
USING (VALUES
  ('cust-01', 'CUST-BOSCH', 'Bosch Chassis Systems India', 'Pune, Maharashtra', 'Mr. Arvind Kulkarni'),
  ('cust-02', 'CUST-TATA', 'Tata Motors Limited (CVBU)', 'Jamshedpur, Jharkhand', 'Mr. Sanjay Deshmukh'),
  ('cust-03', 'CUST-MM', 'Mahindra & Mahindra Ltd.', 'Chakan, Pune', 'Ms. Priya Menon'),
  ('cust-04', 'CUST-ASHOK', 'Ashok Leyland Ltd.', 'Hosur, Tamil Nadu', 'Mr. Raghavan Iyer'),
  ('cust-05', 'CUST-DANA', 'Dana India Technical Centre', 'Pune, Maharashtra', 'Mr. Vikram Joshi')
) AS src (id, code, name, location, contactPerson)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, code, name, location, contactPerson)
  VALUES (src.id, src.code, src.name, src.location, src.contactPerson);
GO

-- 4. Parts Master
MERGE dbo.Parts AS target
USING (VALUES
  ('part-01', 'SA-SK-4021', 'Steering Knuckle LH', 'Mahindra & Mahindra Ltd.', 'Machine Shop', 'Rev 04'),
  ('part-02', 'SA-FH-8812', 'Flywheel Housing Heavy Duty', 'Tata Motors Limited (CVBU)', 'Foundry', 'Rev 07'),
  ('part-03', 'SA-BC-1095', 'Brake Caliper Housing', 'Bosch Chassis Systems India', 'Machine Shop', 'Rev 05'),
  ('part-04', 'SA-DC-3308', 'Differential Case SG500', 'Dana India Technical Centre', 'Foundry', 'Rev 03'),
  ('part-05', 'SA-CC-5120', 'Clutch Housing Assembly', 'Ashok Leyland Ltd.', 'Machine Shop', 'Rev 02')
) AS src (id, partNumber, partName, customer, facility, currentRevision)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, partNumber, partName, customer, facility, currentRevision)
  VALUES (src.id, src.partNumber, src.partName, src.customer, src.facility, src.currentRevision);
GO

-- 5. Default Portal Users (Default demo password: password123)
-- Note: Replace passwordHash using bcryptjs hash in production deployments.
MERGE dbo.Users AS target
USING (VALUES
  ('u-emp',  'EMP401',  'R. Karthik',        'karthik@sakthiauto.com',   'EMPLOYEE',   'Machine Shop Operations',      'Senior Process Engineer',       'Machine Shop', 'comp-01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1),
  ('u-hod',  'HOD201',  'S. Rajeshkumar',    'rajesh@sakthiauto.com',    'HOD',        'Machine Shop Operations',      'Head of Machine Shop',          'Machine Shop', 'comp-01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1),
  ('u-hof',  'HOF301',  'K. Natarajan',      'natarajan@sakthiauto.com', 'HOF',        'Foundry Operations (DISA)',    'Head of Foundry (HOF)',         'Foundry',      'comp-02', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1),
  ('u-cof',  'COF302',  'M. Senthil Kumar',  'senthil@sakthiauto.com',   'COF',        'Tooling, Fixtures & Pattern',  'Chief of Facility (COF)',       'Machine Shop', 'comp-01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1),
  ('u-cft',  'CFT101',  'P. Anitha',         'anitha@sakthiauto.com',    'CFT',        'Quality Assurance & Metallurgy', 'CFT Quality Lead',            'Quality',      'comp-01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1),
  ('u-cftl', 'CFTL105', 'D. Prabhu',         'prabhu@sakthiauto.com',    'CFT_LEADER', 'Quality Assurance & Metallurgy', 'CFT Leader & APQP Lead',      'Quality',      'comp-01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1),
  ('u-ph',   'PH001',   'T. Chandrasekar',   'planthead@sakthiauto.com', 'PLANT_HEAD', 'Corporate & Plant Leadership', 'Vice President & Plant Head',   'Corporate',    'comp-01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1),
  ('u-adm',  'ADM001',  'V. Balasubramanian','admin@sakthiauto.com',     'ADMIN',      'Corporate IT & Systems',       'System Administrator',          'Corporate',    'comp-01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1)
) AS src (id, employeeId, name, email, role, department, title, facility, companyId, passwordHash, active)
ON target.id = src.id
WHEN NOT MATCHED THEN
  INSERT (id, employeeId, name, email, role, department, title, facility, companyId, passwordHash, active)
  VALUES (src.id, src.employeeId, src.name, src.email, src.role, src.department, src.title, src.facility, src.companyId, src.passwordHash, src.active);
GO
