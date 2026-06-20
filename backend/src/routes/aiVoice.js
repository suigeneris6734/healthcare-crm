const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

router.post('/voice-command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ success: false, message: 'Komut boş olamaz.' });
    if (!genAI) return res.status(500).json({ success: false, message: 'Yapay Zeka API anahtarı bulunamadı.' });

    // Fetch all organizations to give context to AI
    const orgs = db.prepare('SELECT id, name, status, client_status FROM organizations').all();
    const orgsList = orgs.map(o => `[ID:${o.id}] ${o.name}`).join('\n');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Sen akıllı bir CRM asistanısın. Kullanıcıdan gelen sesli talimat metnini analiz edeceksin.
      Amacın bu metin üzerinden hangi hastane/kurum ile ilgili işlem yapılmak istendiğini bulmak ve veritabanı değişikliklerini JSON olarak döndürmek.

      Kullanıcı Komutu: "${command}"

      Sistemdeki Mevcut Kurumlar:
      ${orgsList}

      Lütfen bu komutu analiz et ve aşağıdaki JSON formatında bir cevap dön (başka hiçbir metin veya markdown kodu yazma, sadece saf JSON olsun):
      {
        "organization_id": [Eşleşen kurumun ID'si veya bulamazsan null],
        "organization_name": "[Bulduğun kurumun adı veya null]",
        "update_status": "[Eğer kullanıcı durumunu güncellemek istiyorsa yeni durum, yoksa null. Geçerli durumlar: NEW, EMAIL_PLANNED, EMAIL_SENT, FOLLOW_UP_DUE, FOLLOW_UP_SENT, REPLIED, POSITIVE, NEGATIVE, CLOSED]",
        "add_activity_note": "[Kullanıcı bir not/aktivite girmek istiyorsa metni, yoksa null. Örneğin: 'Hastane arandı, teklife sıcak bakıyorlar']",
        "add_task_date": "[Eğer ileri bir tarih için hatırlatma/görev istiyorsa YYYY-MM-DD formatında tarih, yoksa null. (Bugün: ${new Date().toISOString().split('T')[0]})]",
        "add_task_description": "[Eğer görev istiyorsa görevin detayı, yoksa null. Örneğin: 'Tekrar aranacak']"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean markdown
    if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    if (text.startsWith('```')) text = text.replace(/```/g, '').trim();

    const parsed = JSON.parse(text);

    if (!parsed.organization_id) {
      return res.json({ success: false, message: `Hangi kurumdan bahsettiğinizi anlayamadım. (Metniniz: "${command}")` });
    }

    let successMessage = `${parsed.organization_name} için işlemler yapıldı:\n`;

    // 1. Update Status
    if (parsed.update_status) {
      db.prepare('UPDATE organizations SET status = ?, updated_at = ? WHERE id = ?')
        .run(parsed.update_status, new Date().toISOString(), parsed.organization_id);
      successMessage += `- Durum '${parsed.update_status}' olarak güncellendi.\n`;
    }

    // 2. Add Activity
    if (parsed.add_activity_note) {
      db.prepare('INSERT INTO activities (organization_id, action, description, created_at) VALUES (?, ?, ?, ?)')
        .run(parsed.organization_id, 'OTHER', parsed.add_activity_note, new Date().toISOString());
      successMessage += `- Aktivite eklendi: ${parsed.add_activity_note}\n`;
    }

    // 3. Add General Task
    if (parsed.add_task_date || parsed.add_task_description) {
      const taskDate = parsed.add_task_date || new Date().toISOString().split('T')[0];
      const taskDesc = parsed.add_task_description || 'Takip araması';
      db.prepare(`
        INSERT INTO general_tasks (title, description, due_date, status, organization_id, created_at)
        VALUES (?, ?, ?, 'PENDING', ?, ?)
      `).run('AI Sesli Görev', taskDesc, taskDate, parsed.organization_id, new Date().toISOString());
      successMessage += `- ${taskDate} tarihine görev eklendi.\n`;
    }

    res.json({ success: true, message: successMessage, parsed });

  } catch (error) {
    console.error('Voice AI Error:', error);
    res.status(500).json({ success: false, message: 'Yapay Zeka işlenirken hata oluştu: ' + error.message });
  }
});

module.exports = router;
