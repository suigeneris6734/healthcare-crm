const router = require('express').Router();
const db = require('../db/connection');
function monthlyData(month) {
 const like=(month || new Date().toISOString().slice(0,7))+'%';
 return {
  month: like.slice(0,7),
  firstEmails: db.prepare("SELECT COUNT(*) count FROM email_actions WHERE action_type='FIRST_EMAIL' AND action_date LIKE ?").get(like).count,
  followUps: db.prepare("SELECT COUNT(*) count FROM email_actions WHERE action_type='FOLLOW_UP' AND action_date LIKE ?").get(like).count,
  replies: db.prepare("SELECT COUNT(*) count FROM organizations WHERE status='REPLIED'").get().count,
  positive: db.prepare("SELECT COUNT(*) count FROM organizations WHERE status='POSITIVE'").get().count,
  negative: db.prepare("SELECT COUNT(*) count FROM organizations WHERE status='NEGATIVE'").get().count,
  ongoingFollowups: db.prepare("SELECT COUNT(*) count FROM organizations WHERE status IN ('EMAIL_SENT','FOLLOW_UP_DUE','FOLLOW_UP_SENT')").get().count,
  typeBreakdown: db.prepare("SELECT type, COUNT(*) count FROM organizations GROUP BY type").all(),
  citySummary: db.prepare("SELECT city, COUNT(*) count FROM organizations GROUP BY city ORDER BY count DESC").all()
 };
}
router.get('/monthly',(req,res)=>res.json(monthlyData(req.query.month)));
router.get('/monthly/export-csv',(req,res)=>{ const data=monthlyData(req.query.month); const lines=['metric,value',`firstEmails,${data.firstEmails}`,`followUps,${data.followUps}`,`replies,${data.replies}`,`positive,${data.positive}`,`negative,${data.negative}`,`ongoingFollowups,${data.ongoingFollowups}`]; res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition',`attachment; filename="monthly-report-${data.month}.csv"`); res.send(lines.join('\n')); });

// Flexible Report Generator
const docx = require('docx');
router.post('/generate', async (req, res) => {
  try {
    const { format, title, includeStatuses, includeMeetings, includeMetrics } = req.body;
    const docTitle = title || 'Medicare Analytics - Esnek Rapor';

    let content = [];
    
    if (includeMetrics) {
      const data = monthlyData();
      content.push(
        new docx.Paragraph({ text: "Genel İletişim Özeti", heading: docx.HeadingLevel.HEADING_1 }),
        new docx.Paragraph({ text: `İlk Mail: ${data.firstEmails} | Takip: ${data.followUps} | Olumlu Dönüş: ${data.positive}` })
      );
    }

    if (includeStatuses) {
      const orgs = db.prepare("SELECT name, status FROM organizations WHERE status != 'NEW' LIMIT 50").all();
      content.push(
        new docx.Paragraph({ text: "Kurum Durumları", heading: docx.HeadingLevel.HEADING_1 }),
        ...orgs.map(o => new docx.Paragraph({ text: `${o.name} - Durum: ${o.status}`, bullet: { level: 0 } }))
      );
    }

    if (includeMeetings) {
      const acts = db.prepare("SELECT a.description, a.created_at, o.name FROM activity_logs a LEFT JOIN organizations o ON a.organization_id = o.id WHERE a.action='MEETING' ORDER BY a.created_at DESC LIMIT 20").all();
      content.push(
        new docx.Paragraph({ text: "Toplantı Kayıtları", heading: docx.HeadingLevel.HEADING_1 }),
        ...acts.map(a => new docx.Paragraph({ text: `${new Date(a.created_at).toLocaleDateString('tr-TR')} - ${a.name || 'Genel'}: ${a.description}`, bullet: { level: 0 } }))
      );
    }

    if (content.length === 0) {
      content.push(new docx.Paragraph({ text: "Veri seçilmedi." }));
    }

    if (format === 'DOCX') {
      const doc = new docx.Document({
        sections: [{ properties: {}, children: [
          new docx.Paragraph({ text: docTitle, heading: docx.HeadingLevel.TITLE }),
          ...content
        ]}]
      });
      const b64string = await docx.Packer.toBase64String(doc);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="rapor.docx"');
      return res.send(Buffer.from(b64string, 'base64'));
    } 
    
    // Fallback to basic JSON if format is not handled (PDF requires complex fonts on backend, sending basic data to frontend for now, or we can use pdfkit)
    res.json({ error: "PDF generation is currently supported via frontend. Please use DOCX." });

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
