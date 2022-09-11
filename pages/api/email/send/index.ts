import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

import Mailgun from "mailgun.js";
import formData from "form-data";

const prisma = new PrismaClient();

export default async function sendEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed!" });
  }

  // @todo - check ethereum sig is from admin

  // Get the active subscribed emails
  const allContacts = await prisma.contact.findMany({
    where: {
      isSubscribed: true,
      NOT: {
        nftsOwned: 0,
      },
    },
    select: {
      email: true,
    },
  });

  const allActiveSubscribedEmails = allContacts
    .map(({ email }: any) => email)
    .join(", ");

  const request = JSON.parse(req.body);

  const mailgun = new Mailgun(formData);
  const client = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_PRIVATE_API_KEY ?? "",
  });

  const fromEmail =
    process.env.MAILGUN_FROM_EMAIL ?? `Test User <test@example.com>`;
  const extractEmailFromFromEmail = /<([^>]+)/g.exec(fromEmail);

  const messageData = {
    from: fromEmail,
    to: extractEmailFromFromEmail ? extractEmailFromFromEmail[1] : "",
    bcc: allActiveSubscribedEmails,
    subject: `Email from ${
      process.env.NEXT_PUBLIC_SITE_TITLE ?? "NFT Mailing List"
    }`,
    text: request.text,
    html: request.html,
  };

  client.messages
    .create(process.env.MAILGUN_API_DOMAIN ?? "localhost", messageData)
    .then((resp) => {
      res.json({ message: "Email queued with Mailgun, ready to be sent!" });
    })
    .catch((err) => {
      res.json({ message: err.message });
    });
}
