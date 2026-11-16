const { Resend } = require('resend');

if (!process.env.RESEND_API_KEY) throw Error('RESEND_API_KEY not set');
if (!process.env.FROM_EMAIL) throw Error('FROM_EMAIL not set');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(to, templateId, variables) {

    const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: [to],
        template: {
            id: templateId,
            variables
    }
    })

    if (error) {
    throw new Error(error.message);
}
return data;
 }
    
module.exports = sendMail;