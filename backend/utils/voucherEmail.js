// Voucher categories (random draw picks one) + coupon-style HTML email builder.
// Pure functions: no mail-sending code here.

const VOUCHER_CATEGORIES = [
  { key: 'FOOD',   label: 'Food',     emoji: 'F', color: '#f97316', perk: 'on your next food order' },
  { key: 'SHOP',   label: 'Shopping', emoji: 'S', color: '#8b5cf6', perk: 'on your next shopping order' },
  { key: 'MOVIE',  label: 'Movie',    emoji: 'M', color: '#ef4444', perk: 'on movie tickets' },
  { key: 'GROC',   label: 'Grocery',  emoji: 'G', color: '#16a34a', perk: 'on groceries' },
  { key: 'TRAVEL', label: 'Travel',   emoji: 'T', color: '#0284c7', perk: 'on a cab or bus ride' },
  { key: 'BOOKS',  label: 'Books',    emoji: 'B', color: '#d97706', perk: 'on books & stationery' }
];

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
});

// Table-based layout + inline CSS (the only thing email clients reliably support).
// The "cutout" look = coloured stub | dashed perforation with two notches | details.
function buildVoucherEmail({ name, category, code, expiresAt, value = 100, minSpend = 200, credits = 50 }) {
  const c = category;
  const validTill = fmtDate(expiresAt);
  const BG = '#eef2f7';
  const subject = `🎟️ Your ${c.label} voucher from CivicAI — use before ${validTill}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 10px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

    <tr><td style="font-family:Arial,Helvetica,sans-serif;padding:0 4px 16px;color:#0f172a;">
      <div style="font-size:20px;font-weight:700;">Hi ${esc(name)} </div>
      <div style="font-size:14px;line-height:1.5;color:#475569;margin-top:6px;">
        Thank you for reporting genuine civic issues. You used <b>${credits} credits</b> and the lucky draw picked a
        <b>${c.label}</b> voucher for you!
      </div>
    </td></tr>

    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;border-collapse:separate;overflow:hidden;">
        <tr>
          <!-- coloured stub -->
          <td rowspan="3" width="30%" align="center" valign="middle"
              style="background:${c.color};color:#ffffff;padding:22px 6px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:38px;line-height:1;">${c.emoji}</div>
            <div style="font-size:12px;letter-spacing:1px;font-weight:700;margin-top:10px;text-transform:uppercase;">${c.label}</div>
            <div style="font-size:10px;letter-spacing:2px;margin-top:4px;opacity:0.9;">VOUCHER</div>
          </td>

          <!-- top notch -->
          <td colspan="2" height="9" style="background:${BG};border-radius:0 0 9px 9px;font-size:0;line-height:0;">&nbsp;</td>

          <!-- details -->
          <td rowspan="3" valign="middle" style="padding:20px 16px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:11px;letter-spacing:2px;color:#64748b;font-weight:700;">CIVICAI CIVIC REWARD</div>
            <div style="font-size:32px;font-weight:800;color:#0f172a;margin-top:6px;line-height:1.1;">₹${value}<span style="font-size:16px;font-weight:700;"> OFF</span></div>
            <div style="font-size:13px;color:#475569;margin-top:2px;">${c.perk}</div>
            <div style="margin-top:8px;display:inline-block;background:#f1f5f9;border-radius:6px;padding:5px 9px;font-size:12px;font-weight:700;color:#0f172a;">
               Valid on a minimum spend of ₹${minSpend}
            </div>

            <div style="margin-top:16px;font-size:10px;letter-spacing:2px;color:#64748b;font-weight:700;">YOUR UNIQUE CODE</div>
            <div style="margin-top:6px;border:2px dashed ${c.color};border-radius:10px;background:#f8fafc;padding:12px 6px;text-align:center;
                        font-family:'Courier New',Courier,monospace;font-size:17px;font-weight:700;letter-spacing:1px;color:#0f172a;word-break:break-all;">
              ${esc(code)}
            </div>

            <div style="margin-top:14px;font-size:13px;color:#0f172a;">
              ⏳ Use before <b style="color:${c.color};">${validTill}</b>
            </div>
          </td>
        </tr>
        <tr>
          <!-- dashed perforation -->
          <td width="9" style="border-right:2px dashed #cbd5e1;font-size:0;line-height:0;">&nbsp;</td>
          <td width="9" style="font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <!-- bottom notch -->
          <td colspan="2" height="9" style="background:${BG};border-radius:9px 9px 0 0;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="font-family:Arial,Helvetica,sans-serif;padding:16px 4px 0;font-size:12px;line-height:1.6;color:#64748b;">
      <b>Terms:</b> Valid only on a minimum spend of ₹${minSpend} &middot; Single use &middot; Non-transferable &middot; Not exchangeable for cash &middot; Valid only till the date shown above.<br>
      Keep this email safe — the code cannot be re-issued. Keep reporting genuine issues to earn more credits.
      <div style="margin-top:12px;color:#94a3b8;">Issued by CivicAI · Smart Citizen Grievance Redressal System</div>
    </td></tr>

  </table>
</td></tr>
</table>
</body></html>`;

  const text = [
    `Hi ${name},`,
    `You used ${credits} credits and won a ${c.label} voucher: Rs ${value} off ${c.perk}, valid on a minimum spend of Rs ${minSpend}.`,
    `Code: ${code}`,
    `Use before: ${validTill}`,
    `Single use, non-transferable, not exchangeable for cash.`,
    `- CivicAI`
  ].join('\n');

  return { subject, html, text };
}

module.exports = { VOUCHER_CATEGORIES, buildVoucherEmail };
