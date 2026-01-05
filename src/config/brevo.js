import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;


client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendEmail = async ({ to, subject, text }) => {
  return emailApi.sendTransacEmail({
    sender: {
      email: process.env.SENDER_EMAIL,
      name: "Intryo"
    },
    to: [{ email: to }],
    subject,
    textContent: text
  });
};
