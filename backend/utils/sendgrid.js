const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');

module.exports = async (to, subject, text) => {
  await sgMail.send({
    to, from: 'no-reply@venturex.io', subject, text
  });
};