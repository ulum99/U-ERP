import db from "../models/index.js";
const { Account, JournalEntry, JournalEntryLine } = db;

// PENTING: Di aplikasi nyata, mapping ini akan disimpan di database atau file konfigurasi
const ACCOUNT_MAPPING = {
  ACCOUNTS_RECEIVABLE: 1120, // Piutang Usaha
  SALES_REVENUE: 4100, // Pendapatan Penjualan
  CASH_IN_BANK: 1110, // Kas di Bank
};

class AccountingService {
  static async postSalesInvoice(invoice, transaction) {
    const arAccount = await Account.findOne({
      where: { accountNumber: ACCOUNT_MAPPING.ACCOUNTS_RECEIVABLE },
      transaction,
    });
    const revenueAccount = await Account.findOne({
      where: { accountNumber: ACCOUNT_MAPPING.SALES_REVENUE },
      transaction,
    });

    if (!arAccount || !revenueAccount) {
      throw new Error("Akun untuk Piutang atau Pendapatan tidak ditemukan.");
    }

    const journal = await JournalEntry.create(
      {
        date: invoice.issueDate,
        notes: `Jurnal untuk Faktur #${invoice.invoiceNumber}`,
        referenceType: "SALES_INVOICE",
        referenceId: invoice.id,
        branchId: invoice.branchId,
      },
      { transaction }
    );

    await JournalEntryLine.bulkCreate(
      [
        // Debit: Piutang Usaha bertambah
        {
          journalEntryId: journal.id,
          accountId: arAccount.id,
          type: "DEBIT",
          amount: invoice.totalAmount,
        },
        // Kredit: Pendapatan Penjualan bertambah
        {
          journalEntryId: journal.id,
          accountId: revenueAccount.id,
          type: "CREDIT",
          amount: invoice.totalAmount,
        },
      ],
      { transaction }
    );
  }

  static async postPaymentReceived(payment, invoice, transaction) {
    const cashAccount = await Account.findOne({
      where: { accountNumber: ACCOUNT_MAPPING.CASH_IN_BANK },
      transaction,
    });
    const arAccount = await Account.findOne({
      where: { accountNumber: ACCOUNT_MAPPING.ACCOUNTS_RECEIVABLE },
      transaction,
    });

    if (!cashAccount || !arAccount) {
      throw new Error("Akun untuk Kas atau Piutang tidak ditemukan.");
    }

    const journal = await JournalEntry.create(
      {
        date: payment.paymentDate,
        notes: `Jurnal untuk Pembayaran Faktur #${invoice.invoiceNumber}`,
        referenceType: "PAYMENT_RECEIVED",
        referenceId: payment.id,
        branchId: payment.branchId,
      },
      { transaction }
    );

    await JournalEntryLine.bulkCreate(
      [
        // Debit: Kas bertambah
        {
          journalEntryId: journal.id,
          accountId: cashAccount.id,
          type: "DEBIT",
          amount: payment.amount,
        },
        // Kredit: Piutang Usaha berkurang
        {
          journalEntryId: journal.id,
          accountId: arAccount.id,
          type: "CREDIT",
          amount: payment.amount,
        },
      ],
      { transaction }
    );
  }
}

export default AccountingService;
