using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;

namespace PatryCloset.Infrastructure.Email;

public sealed class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendOrderConfirmationAsync(string toEmail, string orderNumber, CancellationToken ct = default)
    {
        var subject = $"PATRY♡CLOSET — Confirmación de pedido #{orderNumber}";
        var body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
  <div style='text-align: center; padding: 30px 0; border-bottom: 2px solid #1a1a1a;'>
    <h1 style='font-size: 28px; font-weight: 300; letter-spacing: 4px; margin: 0;'>PATRY♡CLOSET</h1>
  </div>
  <div style='padding: 40px 0;'>
    <h2 style='font-weight: 400; font-size: 22px;'>Pedido confirmado</h2>
    <p style='color: #555; line-height: 1.8;'>
      ¡Gracias por tu compra! Tu pedido <strong>#{orderNumber}</strong> ha sido confirmado
      y está siendo procesado.
    </p>
    <div style='background: #f8f7f5; padding: 20px; margin: 20px 0; border-left: 3px solid #1a1a1a;'>
      <p style='margin: 0; font-size: 14px;'>Número de pedido: <strong>#{orderNumber}</strong></p>
    </div>
    <p style='color: #555; line-height: 1.8;'>
      Te notificaremos cuando tu pedido sea enviado con el número de seguimiento.
    </p>
  </div>
  <div style='border-top: 1px solid #e5e5e5; padding-top: 20px; text-align: center; color: #999; font-size: 12px;'>
    <p>PATRY♡CLOSET — Moda con estilo</p>
    <p><a href='https://www.instagram.com/patriiiii93/' style='color: #999;'>@patriiiii93</a></p>
  </div>
</body>
</html>";
        await SendEmailAsync(toEmail, subject, body, ct);
    }

    public async Task SendPasswordResetAsync(string toEmail, string resetLink, CancellationToken ct = default)
    {
        var subject = "PATRY♡CLOSET — Restablecer contraseña";
        var body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
  <div style='text-align: center; padding: 30px 0; border-bottom: 2px solid #1a1a1a;'>
    <h1 style='font-size: 28px; font-weight: 300; letter-spacing: 4px; margin: 0;'>PATRY♡CLOSET</h1>
  </div>
  <div style='padding: 40px 0;'>
    <h2 style='font-weight: 400;'>Restablecer contraseña</h2>
    <p style='color: #555; line-height: 1.8;'>
      Has solicitado restablecer tu contraseña. Haz clic en el botón para crear una nueva:
    </p>
    <div style='text-align: center; padding: 30px 0;'>
      <a href='{resetLink}' style='background: #1a1a1a; color: white; padding: 14px 40px; text-decoration: none; font-size: 14px; letter-spacing: 2px;'>
        RESTABLECER CONTRASEÑA
      </a>
    </div>
    <p style='color: #999; font-size: 13px;'>Este enlace expira en 1 hora. Si no solicitaste esto, ignora este email.</p>
  </div>
  <div style='border-top: 1px solid #e5e5e5; padding-top: 20px; text-align: center; color: #999; font-size: 12px;'>
    <p>PATRY♡CLOSET — Moda con estilo</p>
  </div>
</body>
</html>";
        await SendEmailAsync(toEmail, subject, body, ct);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string firstName, CancellationToken ct = default)
    {
        var subject = "¡Bienvenida a PATRY♡CLOSET!";
        var body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
  <div style='text-align: center; padding: 30px 0; border-bottom: 2px solid #1a1a1a;'>
    <h1 style='font-size: 28px; font-weight: 300; letter-spacing: 4px; margin: 0;'>PATRY♡CLOSET</h1>
  </div>
  <div style='padding: 40px 0;'>
    <h2 style='font-weight: 400;'>¡Hola {firstName}!</h2>
    <p style='color: #555; line-height: 1.8;'>
      Bienvenida a <strong>PATRY♡CLOSET</strong>, tu destino de moda exclusiva.
      Descubre las últimas tendencias y encuentra tu estilo perfecto.
    </p>
    <div style='text-align: center; padding: 30px 0;'>
      <a href='https://patrycloset.com' style='background: #1a1a1a; color: white; padding: 14px 40px; text-decoration: none; font-size: 14px; letter-spacing: 2px;'>
        EXPLORAR COLECCIÓN
      </a>
    </div>
  </div>
  <div style='border-top: 1px solid #e5e5e5; padding-top: 20px; text-align: center; color: #999; font-size: 12px;'>
    <p>Síguenos en Instagram: <a href='https://www.instagram.com/patriiiii93/' style='color: #999;'>@patriiiii93</a></p>
  </div>
</body>
</html>";
        await SendEmailAsync(toEmail, subject, body, ct);
    }

    public async Task SendShippingNotificationAsync(string toEmail, string orderNumber, string trackingNumber, CancellationToken ct = default)
    {
        var subject = $"PATRY♡CLOSET — Tu pedido #{orderNumber} ha sido enviado";
        var body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
  <div style='text-align: center; padding: 30px 0; border-bottom: 2px solid #1a1a1a;'>
    <h1 style='font-size: 28px; font-weight: 300; letter-spacing: 4px; margin: 0;'>PATRY♡CLOSET</h1>
  </div>
  <div style='padding: 40px 0;'>
    <h2 style='font-weight: 400;'>¡Tu pedido está en camino!</h2>
    <p style='color: #555; line-height: 1.8;'>
      Tu pedido <strong>#{orderNumber}</strong> ha sido enviado.
    </p>
    <div style='background: #f8f7f5; padding: 20px; margin: 20px 0; border-left: 3px solid #1a1a1a;'>
      <p style='margin: 0 0 8px; font-size: 14px;'>Número de seguimiento:</p>
      <p style='margin: 0; font-size: 18px; font-weight: 600;'>{trackingNumber}</p>
    </div>
  </div>
  <div style='border-top: 1px solid #e5e5e5; padding-top: 20px; text-align: center; color: #999; font-size: 12px;'>
    <p>PATRY♡CLOSET — Moda con estilo</p>
  </div>
</body>
</html>";
        await SendEmailAsync(toEmail, subject, body, ct);
    }

    private async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken ct)
    {
        try
        {
            var smtpHost = _config["Email:SmtpHost"] ?? "localhost";
            var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "1025");
            var senderEmail = _config["Email:SenderEmail"] ?? "noreply@patrycloset.com";
            var senderName = _config["Email:SenderName"] ?? "PATRY♡CLOSET";
            var username = _config["Email:Username"];
            var password = _config["Email:Password"];
            var enableSsl = bool.Parse(_config["Email:EnableSsl"] ?? "false");

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = enableSsl
            };

            if (!string.IsNullOrEmpty(username))
                client.Credentials = new NetworkCredential(username, password);

            var message = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(to);

            await client.SendMailAsync(message, ct);
            _logger.LogInformation("Email sent to {Recipient}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Recipient}: {Subject}", to, subject);
        }
    }
}
