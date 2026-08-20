import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  try {
    const { briefId, clientName, clientEmail, category, format } = await request.json()

    const resendApiKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY environment variable is not configured. Skipping email notification.')
      return NextResponse.json({ success: true, message: 'Email API key not configured. Mock notification processed.' })
    }

    if (!adminEmail) {
      console.warn('ADMIN_NOTIFICATION_EMAIL environment variable is not configured. Skipping email notification.')
      return NextResponse.json({ success: true, message: 'Admin notification email not configured. Mock notification processed.' })
    }

    const resend = new Resend(resendApiKey)
    const adminUrl = `${new URL(request.url).origin}/admin`

    const { error } = await resend.emails.send({
      from: 'Nuline Publisher <onboarding@resend.dev>', // Resend default domain for sandbox/verification testing
      to: adminEmail,
      subject: `New Magazine Brief Submitted - ${clientName}`,
      html: `
        <div style="font-family: 'Georgia', serif; color: #111a34; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(185, 167, 111, 0.3); background-color: #faf8f5; border-radius: 8px;">
          <h2 style="font-style: italic; color: #c6a96b; border-bottom: 1px solid rgba(185, 167, 111, 0.3); padding-bottom: 12px; margin-bottom: 24px; font-weight: normal; font-size: 24px;">Nuline Publisher Notification</h2>
          <p style="font-size: 16px; line-height: 1.6;">You have received a new magazine design brief submission.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr style="border-bottom: 1px solid rgba(185, 167, 111, 0.15);">
              <td style="padding: 12px 0; font-weight: bold; font-family: sans-serif; font-size: 12px; text-transform: uppercase; color: #888; width: 35%;">Client Name</td>
              <td style="padding: 12px 0; font-size: 15px; color: #111a34;">${clientName}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(185, 167, 111, 0.15);">
              <td style="padding: 12px 0; font-weight: bold; font-family: sans-serif; font-size: 12px; text-transform: uppercase; color: #888;">Client Email</td>
              <td style="padding: 12px 0; font-size: 15px; color: #111a34; font-family: monospace;">${clientEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(185, 167, 111, 0.15);">
              <td style="padding: 12px 0; font-weight: bold; font-family: sans-serif; font-size: 12px; text-transform: uppercase; color: #888;">Category</td>
              <td style="padding: 12px 0; font-size: 15px; color: #c6a96b; font-weight: bold;">${category}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(185, 167, 111, 0.15);">
              <td style="padding: 12px 0; font-weight: bold; font-family: sans-serif; font-size: 12px; text-transform: uppercase; color: #888;">Format Selection</td>
              <td style="padding: 12px 0; font-size: 15px; color: #111a34;">${format.size} Layout · ${format.pages} Pages</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(185, 167, 111, 0.15);">
              <td style="padding: 12px 0; font-weight: bold; font-family: sans-serif; font-size: 12px; text-transform: uppercase; color: #888;">Submission ID</td>
              <td style="padding: 12px 0; font-family: monospace; font-size: 12px; color: #666;">${briefId}</td>
            </tr>
          </table>

          <div style="margin-top: 32px; text-align: center;">
            <a href="${adminUrl}" style="background-color: #c6a96b; color: #111a34; text-decoration: none; padding: 12px 32px; border-radius: 24px; font-weight: bold; font-size: 14px; display: inline-block; font-family: sans-serif;">Open Publisher Workspace</a>
          </div>
          
          <p style="font-size: 11px; color: #888; margin-top: 40px; text-align: center; font-family: sans-serif; border-top: 1px solid rgba(185, 167, 111, 0.1); padding-top: 16px;">
            This email was sent automatically by the Nuline Magazine website service.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending email notification via Resend:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error in notify endpoint:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
