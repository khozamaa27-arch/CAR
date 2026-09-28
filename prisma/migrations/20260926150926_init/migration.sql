-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "calcDateOverride" DATETIME,
    "branch" TEXT NOT NULL DEFAULT 'الفرع الرئيسي — الدمام',
    "vatRate" REAL NOT NULL DEFAULT 0.15,
    "daysInMonth" INTEGER NOT NULL DEFAULT 30,
    "monthlyTargetManual" REAL,
    "escalationDays" INTEGER NOT NULL DEFAULT 15,
    "warningDays" INTEGER NOT NULL DEFAULT 7,
    "claimGraceDays" INTEGER NOT NULL DEFAULT 7,
    "companyName" TEXT NOT NULL DEFAULT 'شركة فرناس المستقبل المحدودة',
    "crNumber" TEXT NOT NULL DEFAULT '1009118320',
    "unifiedNationalNumber" TEXT NOT NULL DEFAULT '7040012226',
    "taxNumber" TEXT NOT NULL DEFAULT '312599044300003',
    "address" TEXT NOT NULL DEFAULT '3569 طريق الملك فهد، حي الاتصالات، الدمام 32257',
    "iban" TEXT NOT NULL DEFAULT 'SA5020000003275161009940',
    "bankName" TEXT NOT NULL DEFAULT 'بنك الرياض',
    "logoUrl" TEXT,
    "whatsappNumber" TEXT NOT NULL DEFAULT '966500000000',
    "carOwnersList" TEXT NOT NULL DEFAULT '[]',
    "paymentMethodsList" TEXT NOT NULL DEFAULT '[]',
    "employeesList" TEXT NOT NULL DEFAULT '[]',
    "expenseTypesList" TEXT NOT NULL DEFAULT '[]',
    "chargeToList" TEXT NOT NULL DEFAULT '[]',
    "carStatusList" TEXT NOT NULL DEFAULT '[]',
    "statementMethodsList" TEXT NOT NULL DEFAULT '[]',
    "followUpResultsList" TEXT NOT NULL DEFAULT '[]',
    "commitmentCategoryList" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "taxNumber" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plate" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" TEXT,
    "vin" TEXT,
    "owner" TEXT,
    "authorization" TEXT,
    "istimaraExpiry" DATETIME,
    "insuranceExpiry" DATETIME,
    "insuranceCompany" TEXT,
    "inspectionExpiry" DATETIME,
    "dailyPrice" REAL NOT NULL DEFAULT 0,
    "weeklyPrice" REAL NOT NULL DEFAULT 0,
    "monthlyPrice" REAL NOT NULL DEFAULT 0,
    "manualStatus" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNo" INTEGER NOT NULL,
    "clientId" TEXT NOT NULL,
    "driverName" TEXT,
    "mobile" TEXT,
    "carId" TEXT,
    "plateText" TEXT,
    "startDate" DATETIME NOT NULL,
    "dailyPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closeDate" DATETIME,
    "followUpNotes" TEXT,
    "additions" REAL NOT NULL DEFAULT 0,
    "statementFlag" BOOLEAN NOT NULL DEFAULT false,
    "lastFollowUpDate" DATETIME,
    "followUpResult" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "contractId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT,
    "bankRef" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PAYMENT',
    "receivedFrom" TEXT,
    "taxInvoiceNo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receipt_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "carId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "vendor" TEXT,
    "invoiceNo" TEXT,
    "amountBeforeTax" REAL NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "paymentMethod" TEXT,
    "chargeTo" TEXT NOT NULL DEFAULT 'فرناس',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT,
    "leaseContractNo" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "totalValue" REAL,
    "periodicity" TEXT NOT NULL DEFAULT 'شهري',
    "paymentsCount" INTEGER,
    "paymentAmount" REAL,
    "paidSoFar" REAL NOT NULL DEFAULT 0,
    "responsible" TEXT,
    "responsiblePhone" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT,
    "nationality" TEXT,
    "isSaudi" BOOLEAN NOT NULL DEFAULT false,
    "iqamaNo" TEXT,
    "iqamaExpiry" DATETIME,
    "workPermitExpiry" DATETIME,
    "passportExpiry" DATETIME,
    "medicalInsuranceExpiry" DATETIME,
    "hireDate" DATETIME,
    "mobile" TEXT,
    "basicSalary" REAL NOT NULL DEFAULT 0,
    "housingAllowance" REAL NOT NULL DEFAULT 0,
    "transportAllowance" REAL NOT NULL DEFAULT 0,
    "otherAllowances" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'على رأس العمل',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" DATETIME NOT NULL,
    "employeeId" TEXT NOT NULL,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "incentives" REAL NOT NULL DEFAULT 0,
    "absenceDeduction" REAL NOT NULL DEFAULT 0,
    "advances" REAL NOT NULL DEFAULT 0,
    "penalties" REAL NOT NULL DEFAULT 0,
    "paidDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "authority" TEXT,
    "number" TEXT,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "renewalCycleMonths" INTEGER,
    "fees" REAL,
    "renewedThisCycle" BOOLEAN NOT NULL DEFAULT false,
    "alertBeforeDays" INTEGER NOT NULL DEFAULT 30,
    "stopsTransportLicense" BOOLEAN NOT NULL DEFAULT false,
    "responsible" TEXT,
    "responsiblePhone" TEXT,
    "officialSite" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StatementRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNo" TEXT NOT NULL,
    "toEmployee" TEXT NOT NULL,
    "selectionMethod" TEXT NOT NULL,
    "clientName" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replyBy" DATETIME,
    "contractNosJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Car_plate_key" ON "Car"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNo_key" ON "Contract"("contractNo");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_empNo_key" ON "Employee"("empNo");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_month_employeeId_key" ON "Payroll"("month", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "StatementRequest_requestNo_key" ON "StatementRequest"("requestNo");
