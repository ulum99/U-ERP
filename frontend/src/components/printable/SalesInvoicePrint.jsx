// src/components/printable/SalesInvoicePrint.jsx
import React from 'react';
import dayjs from 'dayjs';
import './SalesInvoicePrint.css'; // Kita akan buat file CSS ini

// Kita menggunakan React.forwardRef agar bisa mendapatkan ref dari komponen induk
export const SalesInvoicePrint = React.forwardRef(({ invoiceData, settings }, ref) => {
    if (!invoiceData) return null;

    const { Customer, details, TaxRates } = invoiceData;

    return (
        <div ref={ref} className="invoice-box">
            <table cellPadding="0" cellSpacing="0">
                <tr className="top">
                    <td colSpan="4">
                        <table>
                            <tr>
                                <td className="title">
                                    {/* <img src={logoUrl} style={{ width: '100%', maxWidth: '150px' }} /> */}
                                    <h1 className="company-name">{settings?.company_name || 'Nama Perusahaan'}</h1>
                                </td>
                                <td>
                                    Faktur #{invoiceData.invoiceNumber}<br />
                                    Diterbitkan: {dayjs(invoiceData.issueDate).format('DD MMM YYYY')}<br />
                                    Jatuh Tempo: {dayjs(invoiceData.dueDate).format('DD MMM YYYY')}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr className="information">
                    <td colSpan="4">
                        <table>
                            <tr>
                                <td>
                                    {settings?.company_address || 'Alamat Perusahaan'}<br />
                                    {settings?.company_phone || 'Telepon'}<br />
                                    {settings?.company_email || 'Email'}
                                </td>
                                <td>
                                    <b>Ditagihkan Kepada:</b><br />
                                    {Customer?.name}<br />
                                    {Customer?.phone}<br />
                                    {Customer?.email}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr className="heading">
                    <td>Produk / Jasa</td>
                    <td style={{ textAlign: 'center' }}>Kuantitas</td>
                    <td style={{ textAlign: 'right' }}>Harga Satuan</td>
                    <td style={{ textAlign: 'right' }}>Subtotal</td>
                </tr>
                {details?.map(item => (
                    <tr className="item" key={item.id}>
                        <td>{item.Product.name}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>Rp {parseFloat(item.price).toLocaleString('id-ID')}</td>
                        <td style={{ textAlign: 'right' }}>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</td>
                    </tr>
                ))}
                <tr className="total">
                    <td colSpan="3" style={{ textAlign: 'right' }}>Subtotal</td>
                    <td style={{ textAlign: 'right' }}>Rp {parseFloat(invoiceData.subtotal).toLocaleString('id-ID')}</td>
                </tr>
                {TaxRates?.map(tax => (
                    <tr className="total" key={tax.id}>
                        <td colSpan="3" style={{ textAlign: 'right' }}>{tax.name} ({tax.rate}%)</td>
                        <td style={{ textAlign: 'right' }}>Rp {parseFloat(invoiceData.subtotal * (tax.rate/100)).toLocaleString('id-ID')}</td>
                    </tr>
                ))}
                <tr className="total final">
                    <td colSpan="3" style={{ textAlign: 'right' }}><b>Total</b></td>
                    <td style={{ textAlign: 'right' }}><b>Rp {parseFloat(invoiceData.totalAmount).toLocaleString('id-ID')}</b></td>
                </tr>
            </table>
        </div>
    );
});