import { Request, Response } from 'express';

export const submitContactForm = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, message } = req.body;

        if (!email || !message) {
            return res.status(400).json({ error: 'Email and message are required' });
        }

        // In a real app, you would send an email here using SendGrid/AWS SES/Nodemailer
        // For now, we'll just log it
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
