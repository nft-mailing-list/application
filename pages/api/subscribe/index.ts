import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from '@prisma/client'
import { utils } from 'ethers'

// eslint-disable-next-line
// @ts-ignore
import isValidEmail from "@dendibaev/isvalid-email";

const prisma = new PrismaClient();

export default async function addSubscription(req: NextApiRequest, res: NextApiResponse) {
    if(req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed!'});
    }

    const request = JSON.parse(req.body);

    let data;
    try { 
        data = JSON.parse(request.data);
    } catch(e) {
        data = null;
    }

    // If they did not send a valid JSON object in request data
    if(data === null || !data.hasOwnProperty('email')) {
        return res.status(404).json({message: 'Invalid post data!'});
    }

    // Check the email address is valid
    if(!isValidEmail(data.email)) {
        return res.status(404).json({message: 'Invalid email address!'});
    }

    // Convert the user address to checksum version
    let checksumAddress;
    try {
        checksumAddress = utils.getAddress(request.address)
    } catch(e) {
        return res.status(404).json({message: 'Invalid address'});
    }

    // Verify the signed message is by the address in the POST body
    let verified = '';
    try {
        verified = await utils.verifyMessage(request.data, request.proof)
    } catch(e) {
        return res.status(404).json({message: 'Signature is not valid'});
    }

    if(verified !== checksumAddress) {
        return res.status(404).json({message: 'Signature is not valid'});
    }

    let savedContact;
    try {
        savedContact = await prisma.contact.upsert({
            where: {
                address: checksumAddress
            },
            update: {
                email: data.email.toLowerCase(),
                isSubscribed: true,
            },
            create: {
                address: checksumAddress,
                email: data.email.toLowerCase(),
                isSubscribed: true
            }
        })
    } catch(e) {
        // Assume unique constraint
        return res.status(404).json({message: 'You are already in the mailing list.'});
    }

    if(!savedContact) {
        return res.status(500).json({message: 'Something went wrong! Try again later.'});
    } 

    res.json({message: 'Subscribed!'});
}