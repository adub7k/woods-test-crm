const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const cors     = require('cors');
const rateLimit = require('express-rate-limit');
const low      = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Database setup ────────────────────────────────────────────────────────────
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const adapter = new FileSync(path.join(DATA_DIR, 'woods-test.json'));
const db = low(adapter);

// ── Helpers ───────────────────────────────────────────────────────────────────
const genId  = (p='x') => p + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
const getAll = (col)     => db.get(col).value() || [];
const getById= (col, id) => db.get(col).find({id}).value();
const upsert = (col, item) => {
  if (db.get(col).find({id:item.id}).value()) db.get(col).find({id:item.id}).assign(item).write();
  else db.get(col).push(item).write();
};
const remove = (col, id) => db.get(col).remove({id}).write();

// ── Seed ──────────────────────────────────────────────────────────────────────
function initDB() {
  const d = (n) => new Date(Date.now()-n*86400000).toISOString().split('T')[0];
  const today=d(0), tomorrow=d(-1), in2=d(-2), in3=d(-3);

  db.defaults({
    settings:{
      shopName:'Woods Test CRM',tagline:'Detail · Tint · Tires',
      phone:'(505) 888-4400',email:'info@woodstest.com',
      address:'3201 Central Ave NE, Albuquerque, NM 87106',
      accentColor:'#1a1a1a',invoicePrefix:'WTC',nextInvoiceNumber:1020,
      loyalty:{enabled:true,visitsForReward:5,rewardDescription:'Free interior detail ($180 value)'},
    },
    customers:[
      {id:'c1', name:'Rivera Auto Group',  phone:'(505) 210-0001',email:'fleet@riveraauto.com',   type:'fleet',     source:'referral', notes:'Net-30 terms. Priority scheduling.',  loyaltyPoints:0,fleetId:'f1',lastJobDate:d(3), createdAt:d(180)},
      {id:'c2', name:'James Whitmore',     phone:'(505) 310-2244',email:'jwhitmore@email.com',    type:'individual',source:'google',   notes:'Ceramic enthusiast. Repeat annually.',loyaltyPoints:5,fleetId:null,lastJobDate:d(7), createdAt:d(220)},
      {id:'c3', name:'Marcus Torres',      phone:'(505) 421-9988',email:'mtorres@email.com',      type:'individual',source:'walk-in', notes:'Track car. Handle with care.',        loyaltyPoints:3,fleetId:null,lastJobDate:d(5), createdAt:d(160)},
      {id:'c4', name:'Starlite Kia',       phone:'(505) 555-7100',email:'service@starlitekia.com',type:'dealer',    source:'referral',notes:'Monthly dealer prep. Net-15.',        loyaltyPoints:0,fleetId:'f2',lastJobDate:d(2), createdAt:d(200)},
      {id:'c5', name:'Danielle Kim',       phone:'(505) 678-3300',email:'dkim@email.com',         type:'individual',source:'instagram',notes:'Loves ceramic tint results.',        loyaltyPoints:2,fleetId:null,lastJobDate:d(14),createdAt:d(45)},
      {id:'c6', name:'Priya Nair',         phone:'(505) 234-5678',email:'pnair@email.com',        type:'individual',source:'google',  notes:'EV owner. EV-safe products only.',   loyaltyPoints:1,fleetId:null,lastJobDate:d(30),createdAt:d(90)},
      {id:'c7', name:'Brandon Hughes',     phone:'(505) 771-3344',email:'bhughes@email.com',      type:'individual',source:'referral',notes:'Referred by James Whitmore.',        loyaltyPoints:4,fleetId:null,lastJobDate:d(8), createdAt:d(60)},
      {id:'c8', name:'Sofia Delgado',      phone:'(505) 882-9910',email:'sdelgado@email.com',     type:'individual',source:'instagram',notes:'Detail + tint combo customer.',     loyaltyPoints:1,fleetId:null,lastJobDate:d(21),createdAt:d(30)},
      {id:'c9', name:'Desert Star Rentals',phone:'(505) 444-6600',email:'fleet@desertstar.com',   type:'fleet',     source:'google',  notes:'15 vehicle rental fleet.',          loyaltyPoints:0,fleetId:'f3',lastJobDate:d(10),createdAt:d(120)},
      {id:'c10',name:'Carlos Reyes',       phone:'(505) 993-1122',email:'creyes@email.com',       type:'individual',source:'walk-in', notes:'Classic car collector.',             loyaltyPoints:5,fleetId:null,lastJobDate:d(4), createdAt:d(75)},
      {id:'c11',name:'Amanda Foster',      phone:'(505) 334-8877',email:'afoster@email.com',      type:'individual',source:'google',  notes:'Detail before road trip.',           loyaltyPoints:0,fleetId:null,lastJobDate:d(10),createdAt:d(10)},
      {id:'c12',name:'NM State Patrol',    phone:'(505) 827-9300',email:'fleet@nmsp.gov',         type:'fleet',     source:'referral',notes:'Government fleet. Quotes required.',loyaltyPoints:0,fleetId:'f4',lastJobDate:d(15),createdAt:d(150)},
      {id:'c13',name:'Tyler Jackson',      phone:'(505) 561-4422',email:'tjackson@email.com',     type:'individual',source:'facebook',notes:'Jeep build enthusiast.',             loyaltyPoints:3,fleetId:null,lastJobDate:d(18),createdAt:d(55)},
      {id:'c14',name:'Lisa Chen',          phone:'(505) 772-0033',email:'lchen@email.com',        type:'individual',source:'referral',notes:'Referred by Sofia Delgado.',         loyaltyPoints:1,fleetId:null,lastJobDate:d(20),createdAt:d(20)},
      {id:'c15',name:'Westside BMW',       phone:'(505) 888-2200',email:'service@westsidebmw.com',type:'dealer',    source:'referral',notes:'Pre-delivery tint and detail.',     loyaltyPoints:0,fleetId:'f2',lastJobDate:d(6), createdAt:d(100)},
    ],
    fleet:[
      {id:'f1',name:'Rivera Auto Group',          contactName:'Maria Rivera',  phone:'(505) 210-0001',email:'fleet@riveraauto.com',   billingTerms:'net-30',discountPct:10,notes:'Primary fleet partner. 6-8 vehicles monthly.',  createdAt:d(180)},
      {id:'f2',name:'Starlite Kia / Westside BMW', contactName:'John Park',    phone:'(505) 555-7100',email:'service@starlitekia.com',billingTerms:'net-15',discountPct:15,notes:'Dealer group. New car prep bundles.',            createdAt:d(200)},
      {id:'f3',name:'Desert Star Rentals',         contactName:'Greg Molina',  phone:'(505) 444-6600',email:'fleet@desertstar.com',   billingTerms:'net-30',discountPct:8, notes:'Rental fleet. 15 vehicles. Bi-monthly.',       createdAt:d(120)},
      {id:'f4',name:'NM State Patrol',             contactName:'Capt. Williams',phone:'(505) 827-9300',email:'fleet@nmsp.gov',        billingTerms:'net-60',discountPct:5, notes:'Government account. PO numbers required.',     createdAt:d(150)},
    ],
    vehicles:[
      {id:'v1', customerId:'c2', year:'2021',make:'Porsche',  model:'911 Carrera',     color:'GT Silver',         plate:'ART-001',notes:'Immaculate. Ultra-premium care only.'},
      {id:'v2', customerId:'c3', year:'2022',make:'BMW',      model:'M3 Competition',  color:'Frozen Black',      plate:'TRK-993',notes:'Track use. Stone chips on hood.'},
      {id:'v3', customerId:'c5', year:'2024',make:'Jeep',     model:'Grand Cherokee',  color:'White',             plate:'JEP-2024',notes:''},
      {id:'v4', customerId:'c6', year:'2023',make:'Tesla',    model:'Model Y',         color:'Red',               plate:'EV-0023',notes:'EV-safe products only.'},
      {id:'v5', customerId:'c1', year:'2023',make:'Ford',     model:'Transit Van',     color:'White',             plate:'RVR-001',notes:'Fleet unit 1'},
      {id:'v6', customerId:'c1', year:'2023',make:'Ford',     model:'Transit Van',     color:'White',             plate:'RVR-002',notes:'Fleet unit 2'},
      {id:'v7', customerId:'c7', year:'2020',make:'Mercedes', model:'C63 AMG',         color:'Obsidian Black',    plate:'AMG-777',notes:'Picky about results.'},
      {id:'v8', customerId:'c10',year:'1969',make:'Chevrolet',model:'Camaro Z28',      color:'Rally Green',       plate:'CLX-969',notes:'Classic. Hand wash only.'},
      {id:'v9', customerId:'c10',year:'2023',make:'Chevrolet',model:'Corvette C8',     color:'Yellow',            plate:'VET-2023',notes:'Daily driver.'},
      {id:'v10',customerId:'c13',year:'2021',make:'Jeep',     model:'Wrangler Rubicon',color:'Sarge Green',       plate:'JEP-4X4',notes:'Lifted. Off-road build.'},
      {id:'v11',customerId:'c8', year:'2022',make:'Honda',    model:'Civic Type R',    color:'Championship White',plate:'CTR-322',notes:''},
      {id:'v12',customerId:'c14',year:'2023',make:'Audi',     model:'Q5',              color:'Mythos Black',      plate:'AUD-005',notes:''},
    ],
    templates:[
      {id:'t1', name:'Full Detail',          category:'detail',price:350, cost:75, description:'Interior + exterior — vacuum, shampoo, wax, tire shine'},
      {id:'t2', name:'Interior Detail',      category:'detail',price:180, cost:40, description:'Full interior vacuum, clean and condition leather'},
      {id:'t3', name:'Exterior Detail',      category:'detail',price:150, cost:35, description:'Wash, clay bar, polish, wax'},
      {id:'t4', name:'Ceramic Coating',      category:'detail',price:899, cost:180,description:'Professional ceramic paint coating — 2yr warranty'},
      {id:'t5', name:'Premium Detail',       category:'detail',price:550, cost:110,description:'Full detail + paint correction + wax'},
      {id:'t6', name:'Standard Tint',        category:'tint',  price:280, cost:55, description:'Carbon tint all windows — 3M Formula Series'},
      {id:'t7', name:'Ceramic Tint',         category:'tint',  price:450, cost:95, description:'Ceramic IR-blocking tint — 3M Crystalline'},
      {id:'t8', name:'Windshield Tint',      category:'tint',  price:120, cost:28, description:'Windshield tint strip only'},
      {id:'t9', name:'Tint + Detail Bundle', category:'tint',  price:599, cost:140,description:'Full detail + ceramic tint combo deal'},
      {id:'t10',name:'Tire Mount and Balance',category:'tire', price:80,  cost:14, description:'Per tire — mount and balance'},
      {id:'t11',name:'Tire Rotation',        category:'tire',  price:40,  cost:5,  description:'Rotate all 4 tires'},
      {id:'t12',name:'Flat Repair',          category:'tire',  price:25,  cost:4,  description:'Plug and patch flat tire'},
      {id:'t13',name:'Full Tire Service',    category:'tire',  price:280, cost:50, description:'Mount, balance and rotate — all 4 tires'},
    ],
    jobs:[
      {id:'j1', customerId:'c1', vehicleId:'v5', templateId:'t7', service:'Ceramic Tint — fleet van x2', category:'tint',  price:900, cost:190,status:'in-progress',date:today,   notes:'35% VLT, both transit vans',   invoiceId:null,     fleetId:'f1'},
      {id:'j2', customerId:'c3', vehicleId:'v2', templateId:'t5', service:'Premium Detail',               category:'detail',price:550, cost:110,status:'in-progress',date:today,   notes:'Focus on paint correction',    invoiceId:null,     fleetId:null},
      {id:'j3', customerId:'c2', vehicleId:'v1', templateId:'t4', service:'Ceramic Coating — full',       category:'detail',price:899, cost:180,status:'scheduled',  date:tomorrow,notes:'2yr warranty package',          invoiceId:null,     fleetId:null},
      {id:'j4', customerId:'c5', vehicleId:'v3', templateId:'t10',service:'Mount and Balance x4',         category:'tire',  price:320, cost:56, status:'scheduled',  date:tomorrow,notes:'305/55R20 Nitto',              invoiceId:null,     fleetId:null},
      {id:'j5', customerId:'c10',vehicleId:'v9', templateId:'t6', service:'Standard Tint — all windows',  category:'tint',  price:280, cost:55, status:'scheduled',  date:in2,     notes:'',                             invoiceId:null,     fleetId:null},
      {id:'j6', customerId:'c7', vehicleId:'v7', templateId:'t7', service:'Ceramic Tint — all windows',   category:'tint',  price:450, cost:95, status:'scheduled',  date:in2,     notes:'',                             invoiceId:null,     fleetId:null},
      {id:'j7', customerId:'c4', vehicleId:null, templateId:'t1', service:'Full Detail — dealer prep x3', category:'detail',price:1050,cost:225,status:'scheduled',  date:in3,     notes:'3 new inventory units',         invoiceId:null,     fleetId:'f2'},
      {id:'j8', customerId:'c10',vehicleId:'v8', templateId:'t1', service:'Full Detail — classic car',    category:'detail',price:420, cost:80, status:'done',       date:d(2),    notes:'Hand wash only.',               invoiceId:'inv1010',fleetId:null},
      {id:'j9', customerId:'c4', vehicleId:null, templateId:'t1', service:'Dealer prep detail x4',        category:'detail',price:1400,cost:300,status:'done',       date:d(3),    notes:'4 new Kia vehicles',            invoiceId:'inv1011',fleetId:'f2'},
      {id:'j10',customerId:'c6', vehicleId:'v4', templateId:'t2', service:'Interior Detail',              category:'detail',price:180, cost:40, status:'done',       date:d(5),    notes:'',                             invoiceId:'inv1012',fleetId:null},
      {id:'j11',customerId:'c13',vehicleId:'v10',templateId:'t9', service:'Tint + Detail Bundle',         category:'tint',  price:599, cost:140,status:'done',       date:d(6),    notes:'Rubicon build.',                invoiceId:'inv1013',fleetId:null},
      {id:'j12',customerId:'c9', vehicleId:null, templateId:'t1', service:'Full Detail x3 rental units',  category:'detail',price:1050,cost:225,status:'done',       date:d(7),    notes:'Units from Vegas trip',         invoiceId:'inv1014',fleetId:'f3'},
      {id:'j13',customerId:'c8', vehicleId:'v11',templateId:'t7', service:'Ceramic Tint — all windows',   category:'tint',  price:450, cost:95, status:'done',       date:d(8),    notes:'',                             invoiceId:'inv1015',fleetId:null},
      {id:'j14',customerId:'c2', vehicleId:'v1', templateId:'t3', service:'Exterior Detail',              category:'detail',price:150, cost:35, status:'done',       date:d(10),   notes:'Quick maintenance detail',      invoiceId:'inv1016',fleetId:null},
      {id:'j15',customerId:'c12',vehicleId:null, templateId:'t1', service:'Patrol vehicle detail x2',     category:'detail',price:700, cost:150,status:'done',       date:d(12),   notes:'PO# NM-2024-441',              invoiceId:'inv1017',fleetId:'f4'},
      {id:'j16',customerId:'c14',vehicleId:'v12',templateId:'t6', service:'Standard Tint + Windshield',   category:'tint',  price:400, cost:83, status:'done',       date:d(14),   notes:'',                             invoiceId:'inv1018',fleetId:null},
      {id:'j17',customerId:'c11',vehicleId:null, templateId:'t1', service:'Full Detail — pre road trip',  category:'detail',price:350, cost:75, status:'done',       date:d(15),   notes:'',                             invoiceId:'inv1019',fleetId:null},
      {id:'j18',customerId:'c1', vehicleId:null, templateId:'t7', service:'Ceramic Tint — fleet x4',      category:'tint',  price:1800,cost:380,status:'done',       date:d(22),   notes:'',                             invoiceId:null,     fleetId:'f1'},
      {id:'j19',customerId:'c3', vehicleId:'v2', templateId:'t4', service:'Ceramic Coating',              category:'detail',price:899, cost:180,status:'done',       date:d(25),   notes:'',                             invoiceId:null,     fleetId:null},
      {id:'j20',customerId:'c7', vehicleId:'v7', templateId:'t1', service:'Full Detail',                  category:'detail',price:350, cost:75, status:'done',       date:d(30),   notes:'',                             invoiceId:null,     fleetId:null},
      {id:'j21',customerId:'c10',vehicleId:'v8', templateId:'t2', service:'Interior Detail',              category:'detail',price:180, cost:40, status:'done',       date:d(35),   notes:'',                             invoiceId:null,     fleetId:null},
      {id:'j22',customerId:'c9', vehicleId:null, templateId:'t1', service:'Fleet detail x5',              category:'detail',price:1750,cost:375,status:'done',       date:d(38),   notes:'',                             invoiceId:null,     fleetId:'f3'},
      {id:'j23',customerId:'c4', vehicleId:null, templateId:'t9', service:'Tint + Detail bundle x6',      category:'tint',  price:3594,cost:840,status:'done',       date:d(42),   notes:'',                             invoiceId:null,     fleetId:'f2'},
      {id:'j24',customerId:'c5', vehicleId:'v3', templateId:'t6', service:'Standard Tint',                category:'tint',  price:280, cost:55, status:'done',       date:d(45),   notes:'',                             invoiceId:null,     fleetId:null},
      {id:'j25',customerId:'c6', vehicleId:'v4', templateId:'t13',service:'Full Tire Service',            category:'tire',  price:280, cost:50, status:'done',       date:d(50),   notes:'',                             invoiceId:null,     fleetId:null},
      {id:'j26',customerId:'c2', vehicleId:'v1', templateId:'t5', service:'Premium Detail',               category:'detail',price:550, cost:110,status:'done',       date:d(55),   notes:'',                             invoiceId:null,     fleetId:null},
      {id:'j27',customerId:'c13',vehicleId:'v10',templateId:'t10',service:'Tire Mount and Balance x4',    category:'tire',  price:320, cost:56, status:'done',       date:d(60),   notes:'',                             invoiceId:null,     fleetId:null},
    ],
    invoices:[
      {id:'inv1010',number:'WTC-1010',jobId:'j8', customerId:'c10',fleetId:null,lineItems:[{description:'Full Detail — classic car',amount:420}],                                                   subtotal:420, tax:0,taxAmount:0,total:420, status:'paid',  paidAt:d(2), notes:'',                     createdAt:d(2)},
      {id:'inv1011',number:'WTC-1011',jobId:'j9', customerId:'c4', fleetId:'f2',lineItems:[{description:'Dealer prep detail x4 — Kia',amount:1400}],                                                subtotal:1400,tax:0,taxAmount:0,total:1400,status:'paid',  paidAt:d(3), notes:'Net-15',                createdAt:d(3)},
      {id:'inv1012',number:'WTC-1012',jobId:'j10',customerId:'c6', fleetId:null,lineItems:[{description:'Interior Detail',amount:180}],                                                              subtotal:180, tax:0,taxAmount:0,total:180, status:'paid',  paidAt:d(5), notes:'',                     createdAt:d(5)},
      {id:'inv1013',number:'WTC-1013',jobId:'j11',customerId:'c13',fleetId:null,lineItems:[{description:'Tint + Detail Bundle',amount:599}],                                                         subtotal:599, tax:0,taxAmount:0,total:599, status:'paid',  paidAt:d(6), notes:'',                     createdAt:d(6)},
      {id:'inv1014',number:'WTC-1014',jobId:'j12',customerId:'c9', fleetId:'f3',lineItems:[{description:'Full Detail x3 rental units',amount:1050}],                                                 subtotal:1050,tax:0,taxAmount:0,total:1050,status:'paid',  paidAt:d(7), notes:'Net-30',                createdAt:d(7)},
      {id:'inv1015',number:'WTC-1015',jobId:'j13',customerId:'c8', fleetId:null,lineItems:[{description:'Ceramic Tint — Civic Type R',amount:450}],                                                  subtotal:450, tax:0,taxAmount:0,total:450, status:'paid',  paidAt:d(8), notes:'',                     createdAt:d(8)},
      {id:'inv1016',number:'WTC-1016',jobId:'j14',customerId:'c2', fleetId:null,lineItems:[{description:'Exterior Detail',amount:150}],                                                              subtotal:150, tax:0,taxAmount:0,total:150, status:'paid',  paidAt:d(10),notes:'',                     createdAt:d(10)},
      {id:'inv1017',number:'WTC-1017',jobId:'j15',customerId:'c12',fleetId:'f4',lineItems:[{description:'Patrol vehicle detail x2',amount:700}],                                                     subtotal:700, tax:0,taxAmount:0,total:700, status:'unpaid',paidAt:null, notes:'PO# NM-2024-441 Net-60',createdAt:d(12)},
      {id:'inv1018',number:'WTC-1018',jobId:'j16',customerId:'c14',fleetId:null,lineItems:[{description:'Standard Tint',amount:280},{description:'Windshield Tint',amount:120}],                    subtotal:400, tax:0,taxAmount:0,total:400, status:'paid',  paidAt:d(14),notes:'',                     createdAt:d(14)},
      {id:'inv1019',number:'WTC-1019',jobId:'j17',customerId:'c11',fleetId:null,lineItems:[{description:'Full Detail',amount:350}],                                                                  subtotal:350, tax:0,taxAmount:0,total:350, status:'paid',  paidAt:d(15),notes:'',                     createdAt:d(15)},
    ],
    appointments:[
      {id:'a1',customerId:'c1', vehicleId:'v5', title:'Fleet Tint — Rivera Auto Group (2 vans)',date:today,   time:'8:00 AM', duration:240,status:'in-progress',notes:'35% VLT ceramic tint',          jobId:'j1'},
      {id:'a2',customerId:'c3', vehicleId:'v2', title:'Premium Detail — Marcus Torres',         date:today,   time:'10:00 AM',duration:180,status:'in-progress',notes:'Paint correction focus',         jobId:'j2'},
      {id:'a3',customerId:'c2', vehicleId:'v1', title:'Ceramic Coating — James Whitmore 911',   date:tomorrow,time:'9:00 AM', duration:300,status:'confirmed',  notes:'Full paint ceramic, 2yr warranty',jobId:'j3'},
      {id:'a4',customerId:'c5', vehicleId:'v3', title:'Tire Mount and Balance — Danielle Kim',  date:tomorrow,time:'1:00 PM', duration:90, status:'confirmed',  notes:'305/55R20 Nitto',               jobId:'j4'},
      {id:'a5',customerId:'c10',vehicleId:'v9', title:'Standard Tint — Carlos Reyes Corvette',  date:in2,     time:'10:00 AM',duration:120,status:'confirmed',  notes:'',                              jobId:'j5'},
      {id:'a6',customerId:'c7', vehicleId:'v7', title:'Ceramic Tint — Brandon Hughes C63',      date:in2,     time:'2:00 PM', duration:150,status:'confirmed',  notes:'',                              jobId:'j6'},
      {id:'a7',customerId:'c4', vehicleId:null, title:'Dealer Prep x3 — Starlite Kia',          date:in3,     time:'8:00 AM', duration:360,status:'confirmed',  notes:'3 new inventory units',         jobId:'j7'},
      {id:'a8',customerId:null, vehicleId:null, title:'Walk-in — tint quote',                    date:in3,     time:'11:00 AM',duration:30, status:'pending',   notes:'Called ahead',                  jobId:null},
    ],
    leads:[
      {id:'l1', name:'Carlos Mendez',   phone:'(505) 901-2233',email:'',                  source:'instagram',interest:'Ceramic tint',       status:'new',            notes:"DM asking about pricing",      customerId:null,followUpAt:d(-1),createdAt:today},
      {id:'l2', name:'Sarah Flynn',     phone:'(505) 444-7890',email:'sflynn@email.com',  source:'google',   interest:'Full detail',          status:'contacted',      notes:'Found us on Google Maps.',     customerId:null,followUpAt:today, createdAt:d(1)},
      {id:'l3', name:'Derek Washington',phone:'(505) 552-8811',email:'dwash@email.com',   source:'referral', interest:'Ceramic coating',       status:'appointment-set',notes:'Referred by Brandon Hughes.',  customerId:null,followUpAt:d(-1),createdAt:d(2)},
      {id:'l4', name:'Monica Reyes',    phone:'(505) 334-0099',email:'mreyes@gmail.com',  source:'google',   interest:'Window tint + detail',  status:'contacted',      notes:'Price shopping. Sent quote.',  customerId:null,followUpAt:today, createdAt:d(3)},
      {id:'l5', name:'James Kirk',      phone:'(505) 771-5544',email:'jkirk@email.com',   source:'facebook', interest:'Tire mount and balance', status:'closed',         notes:'Booked for next week.',        customerId:null,followUpAt:d(-1),createdAt:d(4)},
      {id:'l6', name:'Tanya Cruz',      phone:'(505) 882-3311',email:'tcruz@email.com',   source:'instagram',interest:'Ceramic tint',          status:'closed',         notes:'Full ceramic. Easy close.',    customerId:null,followUpAt:d(-2),createdAt:d(5)},
      {id:'l7', name:'Roberto Silva',   phone:'(505) 443-9900',email:'',                  source:'walk-in',  interest:'Detail quote',           status:'no-show',        notes:'Never showed. Call back.',     customerId:null,followUpAt:d(-1),createdAt:d(6)},
      {id:'l8', name:'Angela Kim',      phone:'(505) 229-4455',email:'akim@email.com',    source:'google',   interest:'Ceramic coating Audi',   status:'lost',           notes:'Went with competitor.',        customerId:null,followUpAt:today, createdAt:d(7)},
      {id:'l9', name:'Paul Nguyen',     phone:'(505) 993-8877',email:'pnguyen@email.com', source:'referral', interest:'Full detail + tint',     status:'appointment-set',notes:'Referred by Priya Nair.',       customerId:null,followUpAt:d(-2),createdAt:d(3)},
      {id:'l10',name:'Rachel Torres',   phone:'(505) 117-6622',email:'rtorres@gmail.com', source:'instagram',interest:'Standard tint',          status:'new',            notes:'Commented on reel. Sent DM.',  customerId:null,followUpAt:d(-1),createdAt:today},
      {id:'l11',name:'Marcus Bell',     phone:'(505) 554-3300',email:'mbell@email.com',   source:'google',   interest:'Tire rotation',          status:'contacted',      notes:'Quick service inquiry.',       customerId:null,followUpAt:today, createdAt:d(2)},
      {id:'l12',name:'Stephanie Lane',  phone:'(505) 772-4411',email:'slane@email.com',   source:'referral', interest:'Ceramic tint SUV',       status:'closed',         notes:'Referred by James Whitmore.',  customerId:null,followUpAt:d(-3),createdAt:d(8)},
    ],
    tasks:[
      {id:'tk1',title:'Follow up: Carlos Mendez — Instagram tint lead',  type:'call', relatedType:'lead',relatedId:'l1',relatedCustomerId:null, dueDate:d(-1),done:false,notes:''},
      {id:'tk2',title:'Call Sarah Flynn — ready to book full detail',     type:'call', relatedType:'lead',relatedId:'l2',relatedCustomerId:null, dueDate:today, done:false,notes:''},
      {id:'tk3',title:'Confirm appt: Derek Washington ceramic coating',   type:'text', relatedType:'lead',relatedId:'l3',relatedCustomerId:null, dueDate:d(-1),done:false,notes:''},
      {id:'tk4',title:'Re-contact: Roberto Silva — no-show follow up',    type:'call', relatedType:'lead',relatedId:'l7',relatedCustomerId:null, dueDate:d(-1),done:false,notes:'Send a text first'},
      {id:'tk5',title:'Send invoice: Rivera Auto Group fleet tint',       type:'email',relatedType:'job', relatedId:'j1',relatedCustomerId:'c1',dueDate:d(-1),done:false,notes:'Net-30 terms'},
      {id:'tk6',title:'Order ceramic coating supplies — running low',     type:'other',relatedType:'',   relatedId:'',  relatedCustomerId:null, dueDate:today, done:false,notes:'Gtechniq C1 x3, EXO x2'},
      {id:'tk7',title:'Follow up: Monica Reyes — sent quote 3 days ago',  type:'call', relatedType:'lead',relatedId:'l4',relatedCustomerId:null, dueDate:today, done:false,notes:''},
      {id:'tk8',title:'Confirm: Paul Nguyen appointment — tint + detail', type:'text', relatedType:'lead',relatedId:'l9',relatedCustomerId:null, dueDate:d(-2),done:false,notes:''},
    ],
    conversations:[],
  }).write();
}
initDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin:'*' }));
app.use(express.json({ limit:'2mb' }));
app.use(express.static(path.join(__dirname, '../client')));
app.use('/api', rateLimit({ windowMs:60000, max:300 }));

// ── Settings ──────────────────────────────────────────────────────────────────
app.get('/api/settings', (req,res) => res.json(db.get('settings').value()||{}));
app.post('/api/settings', (req,res) => { db.get('settings').assign(req.body).write(); res.json({ok:true}); });

// ── Customers ─────────────────────────────────────────────────────────────────
app.get('/api/customers', (req,res) => {
  const fleet = getAll('fleet');
  res.json(getAll('customers').sort((a,b)=>a.name.localeCompare(b.name)).map(c=>({...c,fleet_name:c.fleetId?fleet.find(f=>f.id===c.fleetId)?.name||'':''})));
});
app.get('/api/customers/search', (req,res) => {
  const q=(req.query.q||'').toLowerCase();
  res.json(getAll('customers').filter(c=>c.name.toLowerCase().includes(q)||(c.phone||'').includes(q)||(c.email||'').toLowerCase().includes(q)).slice(0,10));
});
app.get('/api/customers/:id', (req,res) => {
  const c=getById('customers',req.params.id); if(!c)return res.status(404).json({error:'Not found'});
  const jobs=getAll('jobs').filter(j=>j.customerId===c.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const done=jobs.filter(j=>j.status==='done');
  const loyalty=db.get('settings.loyalty').value()||{visitsForReward:5};
  res.json({customer:c,vehicles:getAll('vehicles').filter(v=>v.customerId===c.id),jobs,invoices:getAll('invoices').filter(i=>i.customerId===c.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),appointments:getAll('appointments').filter(a=>a.customerId===c.id),conversations:getAll('conversations').filter(x=>x.customerId===c.id),totalRevenue:done.reduce((s,j)=>s+Number(j.price||0),0),totalProfit:done.reduce((s,j)=>s+(Number(j.price||0)-Number(j.cost||0)),0),totalVisits:done.length,loyaltyPoints:c.loyaltyPoints||0,rewardReady:(c.loyaltyPoints||0)>=(loyalty.visitsForReward||5),visitsForReward:loyalty.visitsForReward||5});
});
app.post('/api/customers', (req,res) => { const c=req.body; if(!c.id)c.id=genId('c'); upsert('customers',c); res.json({id:c.id}); });
app.delete('/api/customers/:id', (req,res) => { remove('customers',req.params.id); res.json({ok:true}); });
app.post('/api/customers/:id/redeem-reward', (req,res) => { const c=getById('customers',req.params.id); if(c){c.loyaltyPoints=0;upsert('customers',c);} res.json({ok:true}); });

// ── Vehicles ──────────────────────────────────────────────────────────────────
app.get('/api/vehicles/customer/:cid', (req,res) => res.json(getAll('vehicles').filter(v=>v.customerId===req.params.cid)));
app.post('/api/vehicles', (req,res) => { const v=req.body; if(!v.id)v.id=genId('v'); upsert('vehicles',v); res.json({id:v.id}); });
app.delete('/api/vehicles/:id', (req,res) => { remove('vehicles',req.params.id); res.json({ok:true}); });

// ── Templates ─────────────────────────────────────────────────────────────────
app.get('/api/templates', (req,res) => res.json(getAll('templates').sort((a,b)=>a.category.localeCompare(b.category))));
app.post('/api/templates', (req,res) => { const t=req.body; if(!t.id)t.id=genId('t'); upsert('templates',t); res.json({id:t.id}); });
app.delete('/api/templates/:id', (req,res) => { remove('templates',req.params.id); res.json({ok:true}); });

// ── Jobs ──────────────────────────────────────────────────────────────────────
app.get('/api/jobs', (req,res) => {
  const C=getAll('customers'),V=getAll('vehicles');
  res.json(getAll('jobs').map(j=>({...j,customer_name:C.find(c=>c.id===j.customerId)?.name||'—',vehicle_label:(v=>v?`${v.year} ${v.make} ${v.model}`:null)(V.find(v=>v.id===j.vehicleId)),profit:Number(j.price||0)-Number(j.cost||0)})).sort((a,b)=>new Date(b.date)-new Date(a.date)));
});
app.get('/api/jobs/stats', (req,res) => {
  const now=new Date(), ms=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const jobs=getAll('jobs'), done=jobs.filter(j=>j.status==='done'&&j.date>=ms), active=jobs.filter(j=>j.status==='in-progress'||j.status==='scheduled');
  const byCat={};
  done.forEach(j=>{if(!byCat[j.category])byCat[j.category]={revenue:0,profit:0};byCat[j.category].revenue+=Number(j.price||0);byCat[j.category].profit+=Number(j.price||0)-Number(j.cost||0);});
  const loyalty=db.get('settings.loyalty').value()||{enabled:true,visitsForReward:5};
  const C=getAll('customers');
  res.json({monthRevenue:done.reduce((s,j)=>s+Number(j.price||0),0),monthProfit:done.reduce((s,j)=>s+(Number(j.price||0)-Number(j.cost||0)),0),monthJobs:done.length,activeJobs:active.length,pipelineValue:active.reduce((s,j)=>s+Number(j.price||0),0),avgTicket:done.length?Math.round(done.reduce((s,j)=>s+Number(j.price||0),0)/done.length):0,byCategory:Object.entries(byCat).map(([category,d])=>({category,...d})),recentDone:jobs.filter(j=>j.status==='done').sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).map(j=>({...j,customer_name:C.find(c=>c.id===j.customerId)?.name||'—'})),loyaltyAlerts:loyalty.enabled?C.filter(c=>c.type==='individual'&&(c.loyaltyPoints||0)>=(loyalty.visitsForReward||5)):[]});
});
app.post('/api/jobs', (req,res) => {
  const j=req.body; if(!j.id)j.id=genId('j');
  const prev=getById('jobs',j.id); upsert('jobs',j);
  if(j.status==='done'&&j.customerId&&(!prev||prev.status!=='done')){const c=getById('customers',j.customerId);if(c){if(!c.lastJobDate||j.date>c.lastJobDate)c.lastJobDate=j.date;if(c.type==='individual')c.loyaltyPoints=(c.loyaltyPoints||0)+1;upsert('customers',c);}}
  res.json({id:j.id});
});
app.delete('/api/jobs/:id', (req,res) => { remove('jobs',req.params.id); res.json({ok:true}); });

// ── Fleet ─────────────────────────────────────────────────────────────────────
app.get('/api/fleet', (req,res) => res.json(getAll('fleet').sort((a,b)=>a.name.localeCompare(b.name))));
app.get('/api/fleet/:id', (req,res) => {
  const fleet=getById('fleet',req.params.id); if(!fleet)return res.status(404).json({error:'Not found'});
  const invoices=getAll('invoices').filter(i=>i.fleetId===req.params.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const jobs=getAll('jobs').filter(j=>j.fleetId===req.params.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const totalBilled=invoices.reduce((s,i)=>s+Number(i.total||0),0), totalPaid=invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+Number(i.total||0),0);
  res.json({fleet,jobs,invoices,totalBilled,totalPaid,outstanding:totalBilled-totalPaid});
});
app.post('/api/fleet', (req,res) => { const f=req.body; if(!f.id)f.id=genId('f'); upsert('fleet',f); res.json({id:f.id}); });
app.delete('/api/fleet/:id', (req,res) => { remove('fleet',req.params.id); res.json({ok:true}); });

// ── Invoices ──────────────────────────────────────────────────────────────────
app.get('/api/invoices', (req,res) => {
  const C=getAll('customers'),F=getAll('fleet');
  res.json(getAll('invoices').map(i=>({...i,customer_name:C.find(c=>c.id===i.customerId)?.name||'—',fleet_name:i.fleetId?F.find(f=>f.id===i.fleetId)?.name||'':''})).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
});
app.post('/api/invoices', (req,res) => {
  const inv=req.body;
  if(!inv.id){const s=db.get('settings').value(),num=s.nextInvoiceNumber||1020,prefix=s.invoicePrefix||'WTC';inv.id='inv'+num;inv.number=`${prefix}-${num}`;db.get('settings').assign({nextInvoiceNumber:num+1}).write();}
  upsert('invoices',inv);
  if(inv.jobId){const job=getById('jobs',inv.jobId);if(job){job.invoiceId=inv.id;upsert('jobs',job);}}
  res.json({id:inv.id,number:inv.number});
});
app.post('/api/invoices/:id/mark-paid', (req,res) => { const inv=getById('invoices',req.params.id); if(inv){inv.status='paid';inv.paidAt=new Date().toISOString().split('T')[0];upsert('invoices',inv);} res.json({ok:true}); });
app.delete('/api/invoices/:id', (req,res) => { remove('invoices',req.params.id); res.json({ok:true}); });

// ── Appointments ──────────────────────────────────────────────────────────────
app.get('/api/appointments/month/:year/:month', (req,res) => {
  const prefix=`${req.params.year}-${String(req.params.month).padStart(2,'0')}`;
  const C=getAll('customers'),V=getAll('vehicles');
  res.json(getAll('appointments').filter(a=>(a.date||'').startsWith(prefix)).map(a=>({...a,customer_name:a.customerId?C.find(c=>c.id===a.customerId)?.name||'':'',vehicle_label:a.vehicleId?(v=>v?`${v.year} ${v.make} ${v.model}`:''  )(V.find(v=>v.id===a.vehicleId)):''})).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)));
});
app.post('/api/appointments', (req,res) => { const a=req.body; if(!a.id)a.id=genId('a'); upsert('appointments',a); res.json({id:a.id}); });
app.delete('/api/appointments/:id', (req,res) => { remove('appointments',req.params.id); res.json({ok:true}); });

// ── Leads ─────────────────────────────────────────────────────────────────────
app.get('/api/leads', (req,res) => res.json(getAll('leads').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))));
app.post('/api/leads', (req,res) => { const l=req.body; if(!l.id)l.id=genId('l'); upsert('leads',l); res.json({id:l.id}); });
app.post('/api/leads/:id/convert', (req,res) => {
  const lead=getById('leads',req.params.id); if(!lead)return res.status(404).json({error:'Not found'});
  const cid=genId('c');
  upsert('customers',{id:cid,name:lead.name,phone:lead.phone||'',email:lead.email||'',type:'individual',source:lead.source,notes:lead.notes||'',loyaltyPoints:0,fleetId:null,lastJobDate:null,createdAt:new Date().toISOString().split('T')[0]});
  upsert('leads',{...lead,status:'closed',customerId:cid});
  res.json({customerId:cid});
});
app.delete('/api/leads/:id', (req,res) => { remove('leads',req.params.id); res.json({ok:true}); });

// ── Tasks ─────────────────────────────────────────────────────────────────────
app.get('/api/tasks', (req,res) => res.json(getAll('tasks').sort((a,b)=>(a.done===b.done)?new Date(a.dueDate)-new Date(b.dueDate):a.done?1:-1)));
app.post('/api/tasks', (req,res) => { const t=req.body; if(!t.id)t.id=genId('tk'); upsert('tasks',t); res.json({id:t.id}); });
app.delete('/api/tasks/:id', (req,res) => { remove('tasks',req.params.id); res.json({ok:true}); });

// ── Revenue ───────────────────────────────────────────────────────────────────
app.get('/api/revenue', (req,res) => {
  const jobs=getAll('jobs').filter(j=>j.status==='done'), C=getAll('customers'), T=getAll('templates');
  const bM={},bCat={},bCust={},bTpl={};
  jobs.forEach(j=>{const m=(j.date||'').slice(0,7),p=Number(j.price||0),pr=p-Number(j.cost||0);if(!bM[m])bM[m]={revenue:0,profit:0};bM[m].revenue+=p;bM[m].profit+=pr;if(!bCat[j.category])bCat[j.category]={revenue:0,profit:0};bCat[j.category].revenue+=p;bCat[j.category].profit+=pr;bCust[j.customerId]=(bCust[j.customerId]||0)+p;if(j.templateId){if(!bTpl[j.templateId])bTpl[j.templateId]={uses:0,revenue:0};bTpl[j.templateId].uses++;bTpl[j.templateId].revenue+=p;}});
  res.json({totalRevenue:jobs.reduce((s,j)=>s+Number(j.price||0),0),totalProfit:jobs.reduce((s,j)=>s+Number(j.price||0)-Number(j.cost||0),0),byMonth:Object.entries(bM).sort((a,b)=>a[0].localeCompare(b[0])).map(([month,d])=>({month,...d})),byCategory:Object.entries(bCat).map(([category,d])=>({category,...d})),byCustomer:Object.entries(bCust).map(([id,total])=>({id,total,name:C.find(c=>c.id===id)?.name||'Unknown'})).sort((a,b)=>b.total-a.total).slice(0,10),topTemplates:Object.entries(bTpl).map(([id,d])=>({id,...d,name:T.find(t=>t.id===id)?.name||'?',category:T.find(t=>t.id===id)?.category||''})).sort((a,b)=>b.uses-a.uses).slice(0,8)});
});

// ── Conversations ─────────────────────────────────────────────────────────────
app.get('/api/conversations', (req,res) => res.json(getAll('conversations').sort((a,b)=>new Date(b.sentAt)-new Date(a.sentAt))));
app.get('/api/conversations/customer/:cid', (req,res) => res.json(getAll('conversations').filter(c=>c.customerId===req.params.cid).sort((a,b)=>new Date(a.sentAt)-new Date(b.sentAt))));
app.post('/api/conversations', (req,res) => { const c=req.body; if(!c.id)c.id=genId('msg'); upsert('conversations',c); res.json({id:c.id}); });

// ── SMS via Twilio ─────────────────────────────────────────────────────────────
app.post('/api/sms/send', async (req,res) => {
  const {to,body,customerId,customerName} = req.body;
  const cfg = (db.get('settings').value()||{}).twilio || {};
  if (!cfg.accountSid||!cfg.authToken||!cfg.fromNumber) return res.json({ok:false,error:'Twilio not configured. Go to Settings → Messaging.'});
  try {
    let twilio;
    try { twilio = require('twilio'); } catch(e) { return res.json({ok:false,error:'Twilio not installed on this server. Contact support.'}); }
    const client = twilio(cfg.accountSid, cfg.authToken);
    const clean = to.replace(/\D/g,'');
    await client.messages.create({ from: cfg.fromNumber, to: '+1'+clean, body });
    upsert('conversations',{id:genId('msg'),customerId,customerName,type:'sms',direction:'outbound',body,sentAt:new Date().toISOString(),read:true});
    res.json({ok:true});
  } catch(e) { res.json({ok:false,error:e.message}); }
});

// ── Email via nodemailer ──────────────────────────────────────────────────────
app.post('/api/email/send', async (req,res) => {
  const {to,subject,body,customerId,customerName} = req.body;
  const s = db.get('settings').value()||{};
  const cfg = s.emailConfig || {};
  if (!cfg.user||!cfg.pass) return res.json({ok:false,error:'Email not configured. Go to Settings.'});
  try {
    let nodemailer;
    try { nodemailer = require('nodemailer'); } catch(e) { return res.json({ok:false,error:'Email module not available.'}); }
    const t = nodemailer.createTransport({service:cfg.provider==='outlook'?'hotmail':'gmail',auth:{user:cfg.user,pass:cfg.pass}});
    await t.sendMail({from:`"${cfg.fromName||s.shopName||'Woods Test CRM'}" <${cfg.user}>`,to,subject,text:body});
    upsert('conversations',{id:genId('msg'),customerId,customerName,type:'email',direction:'outbound',to,subject,body,sentAt:new Date().toISOString(),read:true});
    res.json({ok:true});
  } catch(e) { res.json({ok:false,error:e.message}); }
});

// ── Widget lead capture ───────────────────────────────────────────────────────
app.post('/api/widget/lead', (req,res) => {
  const data=req.body, tmr=new Date(Date.now()+86400000).toISOString().split('T')[0], id=genId('l');
  upsert('leads',{id,name:data.name||'Unknown',phone:data.phone||'',email:data.email||'',source:data.source||'website',interest:data.interest||'',status:'new',notes:data.message||'',customerId:null,followUpAt:tmr,createdAt:new Date().toISOString().split('T')[0]});
  upsert('tasks',{id:genId('tk'),title:`Website lead: ${data.name||'Unknown'}`+(data.interest?` — ${data.interest}`:''),type:'call',relatedType:'lead',relatedId:id,relatedCustomerId:null,dueDate:tmr,done:false,notes:''});
  res.json({success:true,id});
});

// ── Serve PWA ─────────────────────────────────────────────────────────────────
app.get('*', (req,res) => res.sendFile(path.join(__dirname,'../client/index.html')));
app.listen(PORT, () => console.log(`Woods Test CRM running on port ${PORT}`));
