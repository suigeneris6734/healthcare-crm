const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/connection');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'))
});
const upload = multer({ storage });

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Convert local file to generative part object
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya yüklenemedi.' });

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const mimeType = req.file.mimetype;
    
    // If we have an explicit organization_id, just save it without AI processing
    if (req.body.organization_id && req.body.organization_id !== 'null') {
      const info = db.prepare(`
        INSERT INTO documents (organization_id, file_name, file_path, document_type, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.body.organization_id, fileName, `/uploads/${fileName}`, req.body.document_type || 'Diğer', new Date().toISOString());
      
      return res.json({ success: true, document_id: info.lastInsertRowid, type: 'MANUAL_UPLOAD' });
    }

    // AI Processing
    if (!genAI) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY bulunamadı. Lütfen ayarlardan veya .env dosyasından API anahtarını ekleyin.',
        file_name: fileName,
        file_path: `/uploads/${fileName}`
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Sen profesyonel bir veri çıkarma asistanısın. 
      Ekteki belgeyi incele. Bu belgenin hangi hastaneye, sağlık kurumuna veya şirkete ait olduğunu bul.
      Sadece kurumun adını ve belgenin türünü (Fatura, Sözleşme, Rapor, Kimlik, Diğer) JSON formatında dön.
      JSON formatı tam olarak şöyle olmalı:
      {
        "institution_name": "Kurumun Adı (Bulamazsan null)",
        "document_type": "Fatura|Sözleşme|Rapor|Diğer"
      }
      Sadece JSON kodunu ver, başka hiçbir açıklama yapma.
    `;

    const filePart = fileToGenerativePart(filePath, mimeType);
    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean markdown code blocks if any
    if (text.startsWith('```json')) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let parsedResult = { institution_name: null, document_type: 'Diğer' };
    try {
      parsedResult = JSON.parse(text);
    } catch (e) {
      console.error('AI JSON Parse Error:', text);
    }

    let matchedOrg = null;
    let isNew = false;

    if (parsedResult.institution_name) {
      // Find matching organization in DB
      const searchName = `%${parsedResult.institution_name}%`;
      const orgs = db.prepare(`SELECT id, name FROM organizations WHERE name LIKE ? LIMIT 1`).all(searchName);
      
      if (orgs.length > 0) {
        matchedOrg = orgs[0];
      } else {
        isNew = true;
      }
    }

    res.json({
      success: true,
      file_name: fileName,
      file_path: `/uploads/${fileName}`,
      ai_result: parsedResult,
      matched_org: matchedOrg,
      is_new: isNew
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Evrak işlenirken bir hata oluştu: ' + error.message });
  }
});

// Finalize assignment
router.post('/assign', (req, res) => {
  try {
    const { file_name, file_path, document_type, organization_id, create_new_name } = req.body;
    
    let targetOrgId = organization_id;

    if (create_new_name) {
      const info = db.prepare(`
        INSERT INTO organizations (name, type, region_type, status, created_at, updated_at) 
        VALUES (?, 'HOSPITAL', 'TURKEY', 'NEW', ?, ?)
      `).run(create_new_name, new Date().toISOString(), new Date().toISOString());
      targetOrgId = info.lastInsertRowid;
    }

    if (!targetOrgId) return res.status(400).json({ error: 'Kurum ID gerekli' });

    db.prepare(`
      INSERT INTO documents (organization_id, file_name, file_path, document_type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(targetOrgId, file_name, file_path, document_type || 'Diğer', new Date().toISOString());

    res.json({ success: true, organization_id: targetOrgId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get documents for an org
router.get('/org/:id', (req, res) => {
  try {
    const docs = db.prepare('SELECT * FROM documents WHERE organization_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
