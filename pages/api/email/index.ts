import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Checks to see if the mailgun environmental variables exist so we can have the 
 * integration enabled on the admin panel
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export default async function isConfigured(req: NextApiRequest, res: NextApiResponse) {
    if(req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed!'});
    }

    const mailGunPrivateApiKey = process.env.MAILGUN_PRIVATE_API_KEY ?? null;
    const mailGunApiDomain = process.env.MAILGUN_API_DOMAIN ?? null;
    const mailGunFromEmail = process.env.MAILGUN_FROM_EMAIL ?? null;

    if(!mailGunPrivateApiKey || !mailGunApiDomain || !mailGunFromEmail) {
        return res.status(501).json({message: 'Mailgun not implemented.'});
    }

    res.json({message: 'All good to go.'});
}