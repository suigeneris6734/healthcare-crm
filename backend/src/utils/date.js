function todayDate() { return new Date().toISOString().slice(0,10); }
function addDays(dateString, days) { const d = new Date(dateString + 'T00:00:00'); d.setDate(d.getDate() + days); return d.toISOString().slice(0,10); }
module.exports = { todayDate, addDays };
