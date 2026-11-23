-- =========================================================
-- 0_init : baseline skema Payroll Admin
--
-- Gabungan dari schema.sql + hr/attendance/leave/payroll
-- migration lama (lihat prisma/legacy-sql). Database yang
-- sudah berjalan TIDAK perlu menjalankan berkas ini; cukup
-- tandai sebagai sudah diterapkan:
--   npx prisma migrate resolve --applied 0_init
-- Database baru: npx prisma migrate deploy
-- =========================================================

-- users
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(150) NOT NULL,
  "email" VARCHAR(150) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" VARCHAR(20) NOT NULL DEFAULT 'admin',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- departments
CREATE TABLE "departments" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- positions
CREATE TABLE "positions" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");

-- employees
CREATE TABLE "employees" (
  "id" SERIAL PRIMARY KEY,
  "employee_code" VARCHAR(30) NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "email" VARCHAR(150) NOT NULL,
  "position" VARCHAR(100),
  "department" VARCHAR(100),
  "join_date" DATE NOT NULL,
  "base_salary" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "bank_account" VARCHAR(50),
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "department_id" INTEGER,
  "position_id" INTEGER,
  CONSTRAINT "fk_employees_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_employees_position" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
CREATE INDEX "idx_employees_department" ON "employees"("department");
CREATE INDEX "idx_employees_status" ON "employees"("status");
CREATE INDEX "idx_employees_department_id" ON "employees"("department_id");
CREATE INDEX "idx_employees_position_id" ON "employees"("position_id");

-- salary_components
CREATE TABLE "salary_components" (
  "id" SERIAL PRIMARY KEY,
  "employee_id" INTEGER NOT NULL,
  "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('allowance', 'deduction')),
  "name" VARCHAR(100) NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "is_percentage" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "category" VARCHAR(30) DEFAULT 'allowance',
  CONSTRAINT "salary_components_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_salary_components_employee" ON "salary_components"("employee_id");
CREATE INDEX "idx_salary_components_category" ON "salary_components"("category");

-- payroll_periods
CREATE TABLE "payroll_periods" (
  "id" SERIAL PRIMARY KEY,
  "month" INTEGER NOT NULL CHECK ("month" BETWEEN 1 AND 12),
  "year" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "payroll_period_status_check" CHECK ("status" IN ('draft', 'processing', 'completed', 'locked'))
);
CREATE UNIQUE INDEX "payroll_periods_month_year_key" ON "payroll_periods"("month", "year");

-- payroll_runs
CREATE TABLE "payroll_runs" (
  "id" SERIAL PRIMARY KEY,
  "period_id" INTEGER NOT NULL,
  "employee_id" INTEGER NOT NULL,
  "base_salary" DECIMAL(14,2) NOT NULL,
  "total_allowance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_deduction" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "gross_salary" DECIMAL(14,2) NOT NULL,
  "net_salary" DECIMAL(14,2) NOT NULL,
  "component_breakdown" JSONB,
  "generated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "total_bonus" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_tax" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_bpjs" DECIMAL(14,2) NOT NULL DEFAULT 0,
  CONSTRAINT "payroll_runs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE,
  CONSTRAINT "payroll_runs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "payroll_runs_period_id_employee_id_key" ON "payroll_runs"("period_id", "employee_id");
CREATE INDEX "idx_payroll_runs_period" ON "payroll_runs"("period_id");
CREATE INDEX "idx_payroll_runs_employee" ON "payroll_runs"("employee_id");

-- employment_contracts
CREATE TABLE "employment_contracts" (
  "id" SERIAL PRIMARY KEY,
  "employee_id" INTEGER NOT NULL,
  "contract_type" VARCHAR(30) NOT NULL CHECK ("contract_type" IN ('permanent', 'contract', 'internship')),
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'expired', 'terminated')),
  "notes" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "employment_contracts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
  CHECK ("end_date" IS NULL OR "end_date" >= "start_date")
);
CREATE INDEX "idx_employment_contracts_employee" ON "employment_contracts"("employee_id");
CREATE INDEX "idx_employment_contracts_status" ON "employment_contracts"("status");

-- employment_history
CREATE TABLE "employment_history" (
  "id" SERIAL PRIMARY KEY,
  "employee_id" INTEGER NOT NULL,
  "position_id" INTEGER,
  "department_id" INTEGER,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "notes" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "employment_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
  CONSTRAINT "employment_history_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL,
  CONSTRAINT "employment_history_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL,
  CHECK ("end_date" IS NULL OR "end_date" >= "start_date")
);
CREATE INDEX "idx_employment_history_employee" ON "employment_history"("employee_id");
CREATE INDEX "idx_employment_history_department" ON "employment_history"("department_id");
CREATE INDEX "idx_employment_history_position" ON "employment_history"("position_id");

-- attendance
CREATE TABLE "attendance" (
  "id" SERIAL PRIMARY KEY,
  "employee_id" INTEGER NOT NULL,
  "attendance_date" DATE NOT NULL,
  "check_in" TIMESTAMP(6),
  "check_out" TIMESTAMP(6),
  "late_minutes" INTEGER NOT NULL DEFAULT 0,
  "overtime_minutes" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(20) NOT NULL DEFAULT 'present' CHECK ("status" IN ('present', 'late', 'absent', 'leave', 'sick')),
  "notes" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
  CHECK ("check_out" IS NULL OR "check_in" IS NULL OR "check_out" >= "check_in"),
  CHECK ("late_minutes" >= 0),
  CHECK ("overtime_minutes" >= 0)
);
CREATE UNIQUE INDEX "attendance_employee_id_attendance_date_key" ON "attendance"("employee_id", "attendance_date");
CREATE INDEX "idx_attendance_employee" ON "attendance"("employee_id");
CREATE INDEX "idx_attendance_date" ON "attendance"("attendance_date");
CREATE INDEX "idx_attendance_employee_date" ON "attendance"("employee_id", "attendance_date");
CREATE INDEX "idx_attendance_status" ON "attendance"("status");

-- leave_requests
CREATE TABLE "leave_requests" (
  "id" SERIAL PRIMARY KEY,
  "employee_id" INTEGER NOT NULL,
  "leave_type" VARCHAR(30) NOT NULL CHECK ("leave_type" IN ('annual', 'sick', 'permission', 'maternity', 'other')),
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "total_days" INTEGER NOT NULL,
  "reason" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected', 'cancelled')),
  "approved_by" INTEGER,
  "approved_at" TIMESTAMP(6),
  "rejection_reason" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
  CONSTRAINT "leave_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL,
  CHECK ("end_date" >= "start_date"),
  CHECK ("total_days" > 0)
);
CREATE INDEX "idx_leave_requests_employee" ON "leave_requests"("employee_id");
CREATE INDEX "idx_leave_requests_status" ON "leave_requests"("status");
CREATE INDEX "idx_leave_requests_dates" ON "leave_requests"("start_date", "end_date");

-- employee_leave_balances
CREATE TABLE "employee_leave_balances" (
  "id" SERIAL PRIMARY KEY,
  "employee_id" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "annual_quota" INTEGER NOT NULL DEFAULT 12,
  "annual_used" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "employee_leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
  CHECK ("annual_quota" >= 0),
  CHECK ("annual_used" >= 0),
  CHECK ("annual_used" <= "annual_quota")
);
CREATE UNIQUE INDEX "employee_leave_balances_employee_id_year_key" ON "employee_leave_balances"("employee_id", "year");
CREATE INDEX "idx_leave_balances_employee_year" ON "employee_leave_balances"("employee_id", "year");
