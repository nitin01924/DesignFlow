import SibApiV3Sdk from "sib-api-v3-sdk";

const getEmailClient = () => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

  return new SibApiV3Sdk.TransactionalEmailsApi();
};

const getClientUrl = () => {
  if (!process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL is required to send emails");
  }

  return process.env.CLIENT_URL.replace(/\/$/, "");
};

//
// !!==================== Verification Email ====================!!
//

export const sendVerificationEmail = async (email, token) => {
  const apiInstance = getEmailClient();
  try {
    const clientUrl = getClientUrl();
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
            background-color: #ff0000;
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

export const sendPasswordResetEmail = async (email, token) => {
  const apiInstance = getEmailClient();

  try {
    const clientUrl = getClientUrl();
    const resetLink = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;

    console.log("📨 Sending password reset email...");

    await apiInstance.sendTransacEmail({
      sender: {
        name: "Design Flow",
        email: process.env.BREVO_SENDER_EMAIL,
      },

      to: [
        {
          email,
        },
      ],

      subject: "Reset your password",

      htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #111;">Reset your password</h2>

        <p>Hi,</p>

        <p>
          We received a request to reset your <b>Design Flow</b> password.
        </p>

        <p>
          Click the button below to create a new password. This link expires in 15 minutes.
        </p>

        <a href="${resetLink}"
          style="
            display: inline-block;
            padding: 10px 16px;
            background-color: #2563eb;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 10px;
          ">
          Reset Password
        </a>

        <p style="margin-top: 20px;">
          If you didn’t request this, you can safely ignore this email.
        </p>

        <hr style="margin: 20px 0;" />

        <p style="font-size: 12px; color: #777;">
          — Design Flow Team
        </p>
      </div>
      `,
    });

    console.log("✅ Password reset email sent");
  } catch (error) {
    console.log("FULL ERROR:");
    console.log(error);

    console.log("RESPONSE BODY:");
    console.log(error.response?.body);

    throw error;
  }
};
