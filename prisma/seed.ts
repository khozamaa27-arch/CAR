import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const dataDir = path.join(__dirname, "seed-data");

function loadJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, `${name}.json`), "utf-8"));
}

function toDate(v: unknown): Date | null {
  if (!v || typeof v !== "string") return null;
  const dt = new Date(v);
  return isNaN(dt.getTime()) ? null : dt;
}

function toNum(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

async function main() {
  console.log("🌱 بدء تعبئة البيانات...");

  // ===== الإعدادات =====
  const settingsRaw = loadJson<{
    settings: Record<string, unknown>;
    lists: Record<string, string[]>;
  }>("settings");

  await prisma.settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      vatRate: toNum(settingsRaw.settings["نسبة ضريبة القيمة المضافة"]) || 0.15,
      daysInMonth: toNum(settingsRaw.settings["أيام الشهر"]) || 30,
      escalationDays: toNum(settingsRaw.settings["حد التصعيد (أيام غير مسددة)"]) || 15,
      warningDays: toNum(settingsRaw.settings["حد الإنذار (أيام غير مسددة)"]) || 7,
      claimGraceDays: toNum(settingsRaw.settings["مهلة السداد في المطالبة (يوم)"]) || 7,
      branch: (settingsRaw.settings["الفرع"] as string) || "الفرع الرئيسي — الدمام",
      companyName: (settingsRaw.settings["اسم الشركة"] as string) || "شركة فرناس المستقبل المحدودة",
      crNumber: (settingsRaw.settings["السجل التجاري"] as string) || "1009118320",
      unifiedNationalNumber: (settingsRaw.settings["الرقم الوطني الموحد"] as string) || "7040012226",
      taxNumber: (settingsRaw.settings["الرقم الضريبي"] as string) || "312599044300003",
      address:
        (settingsRaw.settings["العنوان"] as string) ||
        "3569 طريق الملك فهد، حي الاتصالات، الدمام 32257",
      carOwnersList: JSON.stringify(settingsRaw.lists["ملاك السيارات"] || []),
      paymentMethodsList: JSON.stringify(settingsRaw.lists["طرق الدفع"] || []),
      employeesList: JSON.stringify(settingsRaw.lists["الموظفون / المشرفون"] || []),
      expenseTypesList: JSON.stringify(settingsRaw.lists["أنواع المصروفات"] || []),
      chargeToList: JSON.stringify(settingsRaw.lists["يُحمّل على"] || []),
      carStatusList: JSON.stringify(settingsRaw.lists["حالات السيارة"] || []),
      statementMethodsList: JSON.stringify(settingsRaw.lists["طرق اختيار الإفادة"] || []),
      followUpResultsList: JSON.stringify(settingsRaw.lists["نتائج المتابعة"] || []),
      commitmentCategoryList: JSON.stringify(settingsRaw.lists["فئات الالتزامات"] || []),
    },
    update: {},
  });
  console.log("✔ الإعدادات");

  // ===== المستخدمون الافتراضيون =====
  const users: { name: string; email: string; role: "ADMIN" | "ACCOUNTANT" | "SUPERVISOR"; password: string }[] = [
    { name: "مدير النظام", email: "admin@farnas.sa", role: "ADMIN", password: "admin@2026" },
    { name: "محمد علاء إسماعيل عبود — المحاسب", email: "accountant@farnas.sa", role: "ACCOUNTANT", password: "acc@2026" },
    { name: "حسام حسن محمد أحمد — الحركة", email: "supervisor@farnas.sa", role: "SUPERVISOR", password: "sup@2026" },
  ];
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      create: { name: u.name, email: u.email, role: u.role, passwordHash },
      update: {},
    });
  }
  console.log("✔ المستخدمون");

  // ===== العملاء =====
  type ClientRow = {
    "العميل": string;
    "النوع": string | null;
    "الرقم الضريبي": string | null;
    "الجوال": string | null;
    "البريد الإلكتروني": string | null;
  };
  const clientRows = loadJson<ClientRow[]>("clients");
  const clientIdByName = new Map<string, string>();
  for (const row of clientRows) {
    const name = row["العميل"]?.toString().trim();
    if (!name) continue;
    const existing = await prisma.client.findFirst({ where: { name } });
    const client = existing
      ? existing
      : await prisma.client.create({
          data: {
            name,
            type: row["النوع"] || null,
            taxNumber: row["الرقم الضريبي"] ? String(row["الرقم الضريبي"]) : null,
            mobile: row["الجوال"] ? String(row["الجوال"]) : null,
            email: row["البريد الإلكتروني"] || null,
          },
        });
    clientIdByName.set(name, client.id);
  }
  console.log(`✔ العملاء (${clientIdByName.size})`);

  // ===== السيارات =====
  type CarRow = {
    "رقم اللوحة": string;
    "الماركة": string | null;
    "الطراز": string | null;
    "الموديل": string | number | null;
    "رقم الهيكل (VIN)": string | null;
    "المالك": string | null;
    "التفويض": string | null;
    "انتهاء الاستمارة": string | null;
    "انتهاء التأمين": string | null;
    "شركة التأمين": string | null;
    "انتهاء الفحص الدوري": string | null;
    "السعر اليومي": number | null;
    "الأسبوعي": number | null;
    "الشهري": number | null;
    "الحالة اليدوية": string | null;
    "ملاحظات": string | null;
  };
  const carRows = loadJson<CarRow[]>("cars");
  const carIdByPlate = new Map<string, string>();
  for (const row of carRows) {
    const plate = row["رقم اللوحة"]?.toString().trim();
    if (!plate) continue;
    const existing = await prisma.car.findUnique({ where: { plate } });
    const car = existing
      ? existing
      : await prisma.car.create({
          data: {
            plate,
            brand: row["الماركة"] || null,
            model: row["الطراز"] || null,
            year: row["الموديل"] ? String(row["الموديل"]) : null,
            vin: row["رقم الهيكل (VIN)"] || null,
            owner: row["المالك"] || null,
            authorization: row["التفويض"] || null,
            istimaraExpiry: toDate(row["انتهاء الاستمارة"]),
            insuranceExpiry: toDate(row["انتهاء التأمين"]),
            insuranceCompany: row["شركة التأمين"] || null,
            inspectionExpiry: toDate(row["انتهاء الفحص الدوري"]),
            dailyPrice: toNum(row["السعر اليومي"]),
            weeklyPrice: toNum(row["الأسبوعي"]),
            monthlyPrice: toNum(row["الشهري"]),
            manualStatus: row["الحالة اليدوية"] || null,
            notes: row["ملاحظات"] || null,
          },
        });
    carIdByPlate.set(plate, car.id);
  }
  console.log(`✔ السيارات (${carIdByPlate.size})`);

  // ===== العقود =====
  type ContractRow = {
    "رقم العقد": number;
    "العميل": string;
    "السائق / المستخدم": string | null;
    "الجوال": string | null;
    "رقم اللوحة": string | null;
    "تاريخ البدء": string | null;
    "السعر اليومي (بدون ضريبة)": number | null;
    "الحالة": string | null;
    "تاريخ الإغلاق": string | null;
    "ملاحظات المتابعة": string | null;
  };
  const contractRows = loadJson<ContractRow[]>("contracts");
  const contractIdByNo = new Map<number, string>();
  const STATUS_MAP: Record<string, "OPEN" | "CLOSED" | "SUSPENDED"> = {
    "مفتوح": "OPEN",
    "مغلق": "CLOSED",
    "معلق": "SUSPENDED",
  };
  for (const row of contractRows) {
    const contractNo = toNum(row["رقم العقد"]);
    if (!contractNo) continue;
    const clientName = row["العميل"]?.toString().trim();
    if (!clientName) continue;
    let clientId = clientIdByName.get(clientName);
    if (!clientId) {
      const c = await prisma.client.create({ data: { name: clientName } });
      clientId = c.id;
      clientIdByName.set(clientName, clientId);
    }
    const plate = row["رقم اللوحة"]?.toString().trim() || null;
    const carId = plate ? carIdByPlate.get(plate) : undefined;

    const existing = await prisma.contract.findUnique({ where: { contractNo } });
    const contract = existing
      ? existing
      : await prisma.contract.create({
          data: {
            contractNo,
            clientId,
            driverName: row["السائق / المستخدم"] || null,
            mobile: row["الجوال"] ? String(row["الجوال"]) : null,
            carId: carId || null,
            plateText: plate,
            startDate: toDate(row["تاريخ البدء"]) || new Date(),
            dailyPrice: toNum(row["السعر اليومي (بدون ضريبة)"]),
            status: STATUS_MAP[row["الحالة"] || "مفتوح"] || "OPEN",
            closeDate: toDate(row["تاريخ الإغلاق"]),
            followUpNotes: row["ملاحظات المتابعة"] || null,
          },
        });
    contractIdByNo.set(contractNo, contract.id);
  }
  console.log(`✔ العقود (${contractIdByNo.size})`);

  // ===== سندات القبض =====
  type ReceiptRow = {
    "التاريخ": string | null;
    "اختر العقد (رقم أو اسم)": number | string | null;
    "المبلغ": number | null;
    "طريقة الدفع": string | null;
    "المرجع البنكي": string | null;
    "النوع": string | null;
    "استلمنا من": string | null;
    "رقم الفاتورة (النظام)": string | null;
  };
  const receiptRows = loadJson<ReceiptRow[]>("receipts");
  let rvCounter = 0;
  let obCounter = 0;
  let created = 0;
  for (const row of receiptRows) {
    const contractNoRaw = row["اختر العقد (رقم أو اسم)"];
    const contractNo = toNum(contractNoRaw);
    const contractId = contractIdByNo.get(contractNo);
    if (!contractId) continue;
    const amount = toNum(row["المبلغ"]);
    if (!amount) continue;
    const isOpening = row["النوع"] === "افتتاحي";
    const receiptNo = isOpening ? `OB-${String(++obCounter).padStart(4, "0")}` : `RV-${String(++rvCounter).padStart(4, "0")}`;
    const method = row["طريقة الدفع"] === "—" ? null : row["طريقة الدفع"];
    const invoiceNo = row["رقم الفاتورة (النظام)"] === "—" ? null : row["رقم الفاتورة (النظام)"];
    await prisma.receipt.create({
      data: {
        receiptNo,
        date: toDate(row["التاريخ"]) || new Date(),
        contractId,
        amount,
        method,
        bankRef: row["المرجع البنكي"] || null,
        type: isOpening ? "OPENING" : "PAYMENT",
        receivedFrom: row["استلمنا من"] || null,
        taxInvoiceNo: invoiceNo || null,
      },
    });
    created++;
  }
  console.log(`✔ سندات القبض (${created})`);

  // ===== الموظفون =====
  type EmployeeRow = {
    "الرقم الوظيفي": string;
    "الاسم": string;
    "الوظيفة": string | null;
    "الجنسية": string | null;
    "رقم الإقامة / الهوية": string | null;
    "انتهاء الإقامة": string | null;
    "انتهاء رخصة العمل": string | null;
    "انتهاء الجواز": string | null;
    "انتهاء التأمين الطبي": string | null;
    "تاريخ الالتحاق": string | null;
    "الجوال": string | null;
    "الراتب الأساسي": number | null;
    "بدل السكن": number | null;
    "بدل النقل": number | null;
    "بدلات أخرى": number | null;
  };
  const employeeRows = loadJson<EmployeeRow[]>("employees");
  let empCount = 0;
  for (const row of employeeRows) {
    const empNo = row["الرقم الوظيفي"]?.toString().trim();
    const name = row["الاسم"]?.toString().trim();
    if (!empNo || !name) continue;
    const nationality = row["الجنسية"] || null;
    await prisma.employee.upsert({
      where: { empNo },
      create: {
        empNo,
        name,
        jobTitle: row["الوظيفة"] || null,
        nationality,
        isSaudi: nationality === "سعودي",
        iqamaNo: row["رقم الإقامة / الهوية"] || null,
        iqamaExpiry: toDate(row["انتهاء الإقامة"]),
        workPermitExpiry: toDate(row["انتهاء رخصة العمل"]),
        passportExpiry: toDate(row["انتهاء الجواز"]),
        medicalInsuranceExpiry: toDate(row["انتهاء التأمين الطبي"]),
        hireDate: toDate(row["تاريخ الالتحاق"]),
        mobile: row["الجوال"] || null,
        basicSalary: toNum(row["الراتب الأساسي"]),
        housingAllowance: toNum(row["بدل السكن"]),
        transportAllowance: toNum(row["بدل النقل"]),
        otherAllowances: toNum(row["بدلات أخرى"]),
      },
      update: {},
    });
    empCount++;
  }
  console.log(`✔ الموظفون (${empCount})`);

  // ===== الالتزامات =====
  type CommitmentRow = {
    "البند": string;
    "الفئة": string;
    "الجهة / المؤجر": string | null;
    "رقم العقد (إيجار)": string | null;
    "بداية العقد": string | null;
    "نهاية العقد": string | null;
    "القيمة الإجمالية للعقد": number | null;
    "دورية السداد": string | null;
    "عدد الدفعات": number | null;
    "قيمة الدفعة": number | null;
    "المدفوع حتى الآن": number | null;
    "المسؤول": string | null;
    "جوال المسؤول": string | null;
    "ملاحظات": string | null;
  };
  const commitmentRows = loadJson<CommitmentRow[]>("commitments");
  let commCount = 0;
  for (const row of commitmentRows) {
    const item = row["البند"]?.toString().trim();
    if (!item) continue;
    await prisma.commitment.create({
      data: {
        item,
        category: row["الفئة"] || "أخرى",
        vendor: row["الجهة / المؤجر"] || null,
        leaseContractNo: row["رقم العقد (إيجار)"] ? String(row["رقم العقد (إيجار)"]) : null,
        startDate: toDate(row["بداية العقد"]),
        endDate: toDate(row["نهاية العقد"]),
        totalValue: row["القيمة الإجمالية للعقد"] ? toNum(row["القيمة الإجمالية للعقد"]) : null,
        periodicity: row["دورية السداد"] || "شهري",
        paymentsCount: row["عدد الدفعات"] ? toNum(row["عدد الدفعات"]) : null,
        paymentAmount: row["قيمة الدفعة"] ? toNum(row["قيمة الدفعة"]) : null,
        paidSoFar: toNum(row["المدفوع حتى الآن"]),
        responsible: row["المسؤول"] || null,
        responsiblePhone: row["جوال المسؤول"] || null,
        notes: row["ملاحظات"] || null,
      },
    });
    commCount++;
  }
  console.log(`✔ الالتزامات (${commCount})`);

  // ===== مستندات الشركة =====
  type DocRow = {
    "المستند / الالتزام": string;
    "الجهة / المنصة": string | null;
    "الرقم": string | null;
    "تاريخ الإصدار / آخر تجديد": string | null;
    "تاريخ الانتهاء / الاستحقاق": string | null;
    "دورة التجديد (شهر)": number | null;
    "الرسوم (فاتورة/متوقعة)": number | null;
    "تم التجديد لهذه الدورة؟": string | null;
    "التنبيه قبل (يوم)": number | null;
    "يوقف ترخيص النقل؟": string | null;
    "المسؤول": string | null;
    "جوال المسؤول": string | null;
    "ملاحظات": string | null;
  };
  const docRows = loadJson<DocRow[]>("company_docs");
  let docCount = 0;
  for (const row of docRows) {
    const name = row["المستند / الالتزام"]?.toString().trim();
    if (!name) continue;
    await prisma.companyDocument.create({
      data: {
        name,
        authority: row["الجهة / المنصة"] || null,
        number: row["الرقم"] ? String(row["الرقم"]) : null,
        issueDate: toDate(row["تاريخ الإصدار / آخر تجديد"]),
        expiryDate: toDate(row["تاريخ الانتهاء / الاستحقاق"]),
        renewalCycleMonths: row["دورة التجديد (شهر)"] ? toNum(row["دورة التجديد (شهر)"]) : null,
        fees: row["الرسوم (فاتورة/متوقعة)"] ? toNum(row["الرسوم (فاتورة/متوقعة)"]) : null,
        renewedThisCycle: row["تم التجديد لهذه الدورة؟"] === "نعم",
        alertBeforeDays: toNum(row["التنبيه قبل (يوم)"]) || 30,
        stopsTransportLicense: row["يوقف ترخيص النقل؟"] === "نعم",
        responsible: row["المسؤول"] || null,
        responsiblePhone: row["جوال المسؤول"] || null,
        notes: row["ملاحظات"] || null,
      },
    });
    docCount++;
  }
  console.log(`✔ مستندات الشركة (${docCount})`);

  console.log("🎉 اكتملت التعبئة بنجاح");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
