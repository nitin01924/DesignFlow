import SibApiV3Sdk from "sib-api-v3-sdk";

//
// !!==================== Verification Email ====================!!
//

export const sendVerificationEmail = async (email, token) => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;

  defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  try {
    if (!process.env.CLIENT_URL) {
      throw new Error("CLIENT_URL is required to send verification emails");
    }

    const clientUrl = process.env.CLIENT_URL.replace(/\/$/, "");
    const verifyLink = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}`;

    console.log("📨 Sending verification email...");

    await apiInstance.sendTransacEmail({
      sender: {
        name: "Design Flow",
        email: process.env.BREVO_SENDER_EMAIL,
      },

      to: [
        {
          email: email,
        },
      ],

      subject: "Verify your email",

      htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        
        <h2 style="color: #111;">Verify your email</h2>

        <p>Hi,</p>

        <p>
          Welcome to <b>Design Flow</b> 🧧
        </p>

        <p>
          Please confirm your email address to activate your account.
        </p>

        <a href="${verifyLink}" 
          style="
            display: inline-block;
            padding: 10px 16px;
            background-color: #16a34a;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 10px;
          ">
          Verify Email
        </a>

        <p style="margin-top: 20px;">
          If you didn’t create this account, you can safely ignore this email.
        </p>

        <hr style="margin: 20px 0;" />

        <p style="font-size: 12px; color: #777;">
          — Design Flow Team
        </p>

      </div>
      `,
    });

    console.log("✅ Verification email sent");
  } catch (error) {
    console.log("FULL ERROR:");
    console.log(error);

    console.log("RESPONSE BODY:");
    console.log(error.response?.body);

    throw error;
  }
};
