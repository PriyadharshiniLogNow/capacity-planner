import nodemailer, { type Transporter } from "nodemailer";
import { getMailConfig, isMailConfigured } from "../config/mail";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const config = getMailConfig();
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const config = getMailConfig();

  if (!isMailConfigured()) {
    console.info("[mail] SMTP not configured; logging message instead.");
    console.info(`To: ${input.to}`);
    console.info(`Subject: ${input.subject}`);
    console.info(input.text);
    return;
  }

  await getTransporter().sendMail({
    from: config.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

/** Test helper */
export function resetMailTransporterForTests() {
  transporter = null;
}
