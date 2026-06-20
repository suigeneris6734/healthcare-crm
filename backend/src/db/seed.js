const { initDatabase, now } = require('./init');
const db = require('./connection');
initDatabase();
const osgbCities = ['İstanbul','Bursa','Kocaeli','Sakarya','Tekirdağ','Balıkesir','Yalova'];
const hospitalCities = ['İstanbul','Ankara','İzmir','Antalya','Konya','Bursa','Adana','Gaziantep','Kayseri','Samsun'];
function addOrg(name,type,region,city,i){
 const email = `${name.toLowerCase().replaceAll(' ','').replaceAll('ğ','g').replaceAll('ü','u').replaceAll('ş','s').replaceAll('ı','i').replaceAll('ö','o').replaceAll('ç','c')}@example.test`;
 if (db.prepare('SELECT id FROM organizations WHERE email=?').get(email)) return;
 const t=now();
 db.prepare(`INSERT INTO organizations (name,type,region_type,city,district,email,phone,website,contact_person,status,source,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  .run(name,type,region,city,`Merkez ${i}`,email,`+90 555 000 ${String(i).padStart(4,'0')}`,`https://www.${email.split('@')[0]}.test`,`Yetkili ${i}`,'NEW','SEED','Fake seed data; no real personal data.',t,t);
}
for(let i=1;i<=15;i++) addOrg(`Marmara Sağlık OSGB ${i}`,'OSGB','MARMARA',osgbCities[(i-1)%osgbCities.length],i);
for(let i=1;i<=15;i++) addOrg(`Türkiye Özel Hastane ${i}`,'HOSPITAL','TURKEY',hospitalCities[(i-1)%hospitalCities.length],i);
console.log('Seed data loaded');
