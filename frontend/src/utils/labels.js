export const statusLabels = {
  NEW: 'Yeni', EMAIL_PLANNED: 'Planlandı', EMAIL_SENT: 'Gönderildi', FOLLOW_UP_DUE: 'Takip Zamanı Geldi', FOLLOW_UP_SENT: 'Takip Gönderildi', REPLIED: 'Cevap Geldi', POSITIVE: 'Olumlu', NEGATIVE: 'Olumsuz', CLOSED: 'Kapandı'
};
export const taskLabels = { SEND_FIRST_EMAIL: 'İlk Mail', SEND_FOLLOW_UP: 'Takip Maili' };
export const typeLabels = { OSGB: 'OSGB', HOSPITAL: 'Özel Hastane' };
export const regionLabels = { MARMARA: 'Marmara', TURKEY: 'Türkiye' };
export const actionLabels = { FIRST_EMAIL: 'İlk Tanıtım Maili', FOLLOW_UP: 'Takip Maili', REPLY: 'Cevap', NOTE: 'Not' };
export function label(map, value) { return map[value] || value || '-'; }
