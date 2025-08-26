Alur Fitur yang Akan Dibangun:
Pesanan Penjualan (Sales Order) ➡️ Faktur Penjualan (Sales Invoice) ➡️ Pencatatan Pembayaran (Payment Receipt)

💰 Modul: Dasar Akuntansi & Keuangan
Kita akan mulai dengan membuat model, controller, dan route untuk manajemen Faktur Penjualan dan Pembayaran.

## 1. Desain Model Database (Keuangan)

Kita memerlukan dua model baru: SalesInvoice untuk faktur dan PaymentReceived untuk catatan pembayaran yang masuk.

models/salesInvoiceModel.js (Baru)
Model ini merepresentasikan faktur/tagihan yang dikirim ke pelanggan.

Alur Fitur yang Akan Dibangun:
Penerimaan Barang dari Pesanan Pembelian (PO) ➡️ Pencatatan Tagihan Pemasok (Purchase Invoice/Vendor Bill) ➡️ Pencatatan Pembayaran Keluar (Payment Made)

🧾 Modul: Manajemen Utang (Accounts Payable)
Kita akan membuat dua model baru serta menambahkan logika dan route baru ke modul keuangan yang sudah ada.

## 1. Desain Model Database (Utang Usaha)

models/purchaseInvoiceModel.js (Baru)
Model ini merepresentasikan tagihan yang kita terima dari pemasok.
