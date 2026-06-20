const gmail = require('./gmailProvider');
const outlook = require('./outlookProvider');
function getEmailProvider(provider) { if (provider === 'GMAIL') return gmail; if (provider === 'OUTLOOK') return outlook; return { name: 'NONE', send: async () => { throw new Error('Email sending disabled in Version 1'); } }; }
module.exports = { getEmailProvider };
