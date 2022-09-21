import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from '../../../../components/db'

import { utils } from "ethers";

import Mailgun from "mailgun.js";
import formData from "form-data";

export default async function sendEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed!" });
  }

  const request = JSON.parse(req.body);

  // @todo - check ethereum sig is from admin
  // Convert the user address to checksum version
  let checksumUserAddress;
  try {
    checksumUserAddress = utils.getAddress(request.address);
  } catch (e) {
    return res.status(404).json({ message: "Invalid address" });
  }

  // Verify the signed message is by the address in the POST body
  let verified = "";
  try {
    verified = await utils.verifyMessage(request.data.text, request.proof);
  } catch (e) {
    return res.status(404).json({ message: "Signature is not valid" });
  }

  if (verified !== checksumUserAddress) {
    return res.status(404).json({ message: "Signature is not valid" });
  }

  if (
    checksumUserAddress !==
    (process.env.NEXT_PUBLIC_ADMIN_ADDRESS ??
      `0x0000000000000000000000000000000000000000`)
  ) {
    return res.status(401).json({ message: "Not authorised." });
  }

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
    text: request.data.text,
    html: request.data.html,
  };

  client.messages
    .create(process.env.MAILGUN_API_DOMAIN ?? "localhost", messageData)
    .then((resp) => {
      console.log(resp)
      res.json({ message: "Email queued with Mailgun, ready to be sent!" });
    })
    .catch((err) => {
      console.log(err)
      res.json({ message: err.message });
    });
}
