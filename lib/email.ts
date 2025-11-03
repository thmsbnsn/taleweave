import { Resend } from 'resend';

// Initialize Resend client (lazy loaded to prevent build errors)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set. Email functionality disabled.');
    return null;
  }
  
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  
  return resendClient;
}

export async function sendCoParentInvitation(params: {
  to: string;
  inviterName: string;
  childName: string;
  invitationLink: string;
}) {
  const client = getResendClient();
  if (!client) {
    console.warn('Email service not configured. Invitation link:', params.invitationLink);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: 'TaleWeave <invites@taleweave.com>', // Update with your verified domain
      to: params.to,
      subject: `${params.inviterName} invited you to manage ${params.childName}'s account`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Nunito', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FF6B6B, #4ECDC4); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 15px 30px; background: #FF6B6B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ TaleWeave Co-Parent Invitation</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>
                <p><strong>${params.inviterName}</strong> has invited you to help manage <strong>${params.childName}</strong>'s TaleWeave account.</p>
                <p>As a co-parent, you'll be able to:</p>
                <ul>
                  <li>View ${params.childName}'s progress and achievements</li>
                  <li>Manage app access and time limits</li>
                  <li>Create stories and manage their account</li>
                </ul>
                <p style="text-align: center;">
                  <a href="${params.invitationLink}" class="button">Accept Invitation</a>
                </p>
                <p style="font-size: 14px; color: #666;">
                  This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>© TaleWeave - Making stories magical for kids!</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        TaleWeave Co-Parent Invitation
        
        ${params.inviterName} has invited you to help manage ${params.childName}'s TaleWeave account.
        
        As a co-parent, you'll be able to view their progress, manage app access, and create stories.
        
        Accept the invitation here: ${params.invitationLink}
        
        This link expires in 7 days.
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendChildAccountCreated(params: {
  to: string;
  childName: string;
  username: string;
}) {
  const client = getResendClient();
  if (!client) {
    console.warn('Email service not configured. Skipping welcome email.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: 'TaleWeave <noreply@taleweave.com>',
      to: params.to,
      subject: `${params.childName}'s TaleWeave account is ready!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Nunito', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FF6B6B, #4ECDC4); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF6B6B; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Account Created!</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>
                <p><strong>${params.childName}</strong>'s TaleWeave account has been created successfully!</p>
                <div class="info-box">
                  <p><strong>Username:</strong> ${params.username}</p>
                  <p>They can now login at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/children/login">${process.env.NEXT_PUBLIC_APP_URL}/children/login</a></p>
                </div>
                <p>Your child can now:</p>
                <ul>
                  <li>Create and read personalized AI stories</li>
                  <li>Play educational games</li>
                  <li>Learn with interactive quizzes</li>
                  <li>And much more!</li>
                </ul>
                <p>Happy storytelling! 📚✨</p>
              </div>
              <div class="footer">
                <p>© TaleWeave - Making stories magical for kids!</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

