const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
export type InvitationTemplateInput = {
  recipientName: string;
  loginUrl?: string;
};
export function buildInvitationTemplate({
  recipientName,
  loginUrl = "https://vitrunexus.com",
}: InvitationTemplateInput) {
  const safeName = escapeHtml(recipientName.trim() || "Olá");
  const safeUrl = escapeHtml(loginUrl);
  const subject = "Seu acesso ao Vitru Nexus";
  const text =
    "" +
    (recipientName.trim() || "Olá") +
    ", voc\u00EA foi convidado para acessar o Vitru Nexus. Entre em " +
    loginUrl +
    (" e use a mesma conta corporativa deste " +
      "e-mail. N\u00E3o \u00E9 necess\u00E1rio criar uma nova senha.");
  const html =
    '<!doctype html>\n<html lang="pt-BR">\n  <body ' +
    "style=\"margin:0;background:#08070d;font-family:'Trebuchet " +
    "MS',Arial,sans-serif;color:#ffffff;\">\n    <table " +
    'role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
    'style="background:#08070d;padding:32px ' +
    '16px;">\n      <tr><td align="center">\n        <table ' +
    'role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
    'style={"max-width:620px;background:linear-gradient(145deg,#171122,#0d0a14);border:1px solid ' +
    '#302643;border-radius:22px;overflow:hidden;"}>\n          <tr><td ' +
    'style="height:5px;background:linear-gradient(90deg,#6824D3,#A689F7,#FFC20E);"></td></tr>\n          <tr><td ' +
    'style="padding:34px 38px 18px;">\n            <img ' +
    'src="https://vitrunexus.com/manus-storage/vitru-logo-negativa_39bed332.webp" ' +
    'width="138" alt="Vitru Educa\u00E7\u00E3o" ' +
    'style="display:block;max-width:138px;height:auto;" ' +
    "/>\n          </td></tr>\n     " +
    '     <tr><td style="padding:8px 38px ' +
    '36px;">\n            <p style="margin:0 0 ' +
    '10px;color:#FFC20E;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Vitru ' +
    'Nexus</p>\n            <h1 style="margin:0 0 ' +
    '18px;font-size:30px;line-height:1.2;color:#ffffff;">Voc\u00EA ' +
    "foi convidado para o NEXUS.</h1>\n " +
    '           <p style="margin:0 0 ' +
    '14px;color:#d8d2e3;font-size:16px;line-height:1.65;">Ol\u00E1, ' +
    safeName +
    ('.</p>\n            <p style="margin:0 0 ' +
      '26px;color:#b7afc4;font-size:15px;line-height:1.7;">Seu acesso \u00E0 plataforma ' +
      "executiva de governan\u00E7a da Vitru est\u00E1 pronto. Entre com " +
      'a <strong style="color:#ffffff;">mesma conta corporativa ' +
      "deste e-mail</strong>. O NEXUS n\u00E3o solicitar\u00E1 a " +
      "cria\u00E7\u00E3o de uma nova senha.</p>\n            <table " +
      'role="presentation" cellpadding="0" cellspacing="0"><tr><td ' +
      'style="border-radius:10px;background:#FFC20E;">\n              <a href="') +
    safeUrl +
    ('" style="display:inline-block;padding:14px ' +
      '24px;color:#1d1600;text-decoration:none;font-size:15px;font-weight:700;">Acessar o Vitru Nexus</a>\n ' +
      '           </td></tr></table>\n            <p style="margin:28px 0 ' +
      '0;color:#847b91;font-size:12px;line-height:1.6;">Se voc\u00EA n\u00E3o reconhece este ' +
      "convite, desconsidere esta mensagem. Para sua seguran\u00E7a, n\u00E3o compartilhe " +
      "seu acesso corporativo.</p>\n          </td></tr>\n        </table>\n       " +
      ' <p style="margin:18px 0 0;color:#655d70;font-size:11px;">Onde ' +
      "Estrat\u00E9gia Encontra Execu\u00E7\u00E3o.</p>\n      " +
      "</td></tr>\n    </table>\n  </body>\n</html>");
  return { subject, text, html };
}
