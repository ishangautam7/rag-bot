import { Request, Response } from 'express';

export const submitContactForm = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, message } = req.body;

        if (!email || !message) {
            return res.status(400).json({ error: 'Email and message are required' });
        }

        //use nodemailer later if this be used in frontend
        console.log('--- NEW CONTACT FORM SUBMISSION ---');
        console.log(`From: ${firstName} ${lastName} <${email}>`);
        console.log(`Message: ${message}`);
        console.log('-----------------------------------');

        return res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact form error:', error);
        return res.status(500).json({ error: 'Failed to submit contact form' });
    }
};
