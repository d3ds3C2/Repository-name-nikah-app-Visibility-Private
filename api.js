'use strict';
// Nikah.App data layer. Two implementations behind one interface:
//  - DemoApi      : no backend, works on the in-page `state` + localStorage (gender filter included)
//  - SupabaseApi  : Supabase Auth + Postgres (RLS + RPC) + Storage + Realtime + Edge Functions
// app.js only talks to `NikahApi`.

const DEMO_PROFILES=[
 {id:'p1',photo:'/assets/showcase/p1.svg',kind:'showcase',compat:{communication:'direct',planning:'planned',social:'balanced',conflict:'calm',money:'planned'},name:'Ayu',age:31,gender:'Kadın',lang:'id',country:'Endonezya',city:'Bandung',intent:'Evliliğe hazırım',children:'İstiyorum',family:'Çok önemli',relocation:'Uygun',languages:['Bahasa Indonesia','English'],job:'Mimar',verified:true,score:92,reasons:['match_reason_intent','match_reason_family','match_reason_children','match_reason_language'],factors:[94,96,89,87],bio:{tr:'Aile odaklıyım. Seyahat etmeyi, kahve ve sakin hafta sonlarını seviyorum.',id:'Saya dekat dengan keluarga. Saya suka bepergian, kopi, dan akhir pekan yang tenang.',en:'I am family-oriented. I enjoy travel, coffee and calm weekends.',zh:'我重视家庭，喜欢旅行、咖啡和安静的周末。',th:'ฉันให้ความสำคัญกับครอบครัว ชอบท่องเที่ยว กาแฟ และวันหยุดที่เงียบสงบ'},prompts:[['prompt_marriage',{tr:'Saygı, açık iletişim ve iki ailenin de huzurlu hissetmesi.',id:'Rasa hormat, komunikasi terbuka, dan kedua keluarga merasa nyaman.',en:'Respect, open communication and both families feeling at ease.',zh:'尊重、坦诚沟通，以及双方家庭都感到安心。',th:'ความเคารพ การสื่อสารที่เปิดใจ และทั้งสองครอบครัวรู้สึกสบายใจ'}],['prompt_weekend',{tr:'Yeni bir kahveci, kısa bir yürüyüş ve aileyle akşam yemeği.',id:'Mencoba kedai kopi baru, jalan santai, lalu makan malam bersama keluarga.',en:'A new coffee shop, a short walk and dinner with family.',zh:'一家新咖啡馆、一次散步，再和家人共进晚餐。',th:'ร้านกาแฟใหม่ เดินเล่นสั้นๆ แล้วทานข้าวเย็นกับครอบครัว'}]]},
 {id:'p2',photo:'/assets/showcase/p2.svg',kind:'showcase',compat:{communication:'gentle',planning:'planned',social:'home',conflict:'calm',money:'planned'},name:'Elif',age:34,gender:'Kadın',lang:'tr',country:'Türkiye',city:'İzmir',intent:'Evliliğe hazırım',children:'İstiyorum',family:'Önemli',relocation:'Kararsız',languages:['Türkçe','English'],job:'Diş Hekimi',verified:true,score:88,reasons:['match_reason_intent','match_reason_children','match_reason_language'],factors:[90,86,84,91],bio:{tr:'Hayatı paylaşabileceğim ciddi, sakin ve saygılı bir ilişki arıyorum.',id:'Saya mencari hubungan serius, tenang, dan saling menghormati untuk berbagi hidup.',en:'I am looking for a serious, calm and respectful relationship to share life with.',zh:'我希望找到一段认真、平和、彼此尊重并能共同生活的关系。',th:'ฉันมองหาความสัมพันธ์ที่จริงจัง สงบ และให้เกียรติกันเพื่อใช้ชีวิตร่วมกัน'},prompts:[['prompt_value',{tr:'Güven ve sözünün arkasında durmak.',id:'Kepercayaan dan menepati janji.',en:'Trust and keeping your word.',zh:'信任，以及言出必行。',th:'ความไว้วางใจและการรักษาคำพูด'}]]},
 {id:'p3',photo:'/assets/showcase/p3.svg',kind:'showcase',compat:{communication:'direct',planning:'flexible',social:'balanced',conflict:'space',money:'planned'},name:'Sari',age:29,gender:'Kadın',lang:'id',country:'Endonezya',city:'Jakarta',intent:'Evliliğe hazırım',children:'İstiyorum',family:'Çok önemli',relocation:'Uygun',languages:['Bahasa Indonesia','English'],job:'Öğretmen',verified:true,score:86,reasons:['match_reason_family','match_reason_relocation','match_reason_intent'],factors:[88,95,90,76],bio:{tr:'Açık iletişim, sadakat ve aile benim için önemli.',id:'Komunikasi terbuka, kesetiaan, dan keluarga sangat penting bagi saya.',en:'Open communication, loyalty and family matter a lot to me.',zh:'坦诚沟通、忠诚和家庭对我很重要。',th:'การสื่อสารที่เปิดใจ ความซื่อสัตย์ และครอบครัวสำคัญสำหรับฉัน'},prompts:[['prompt_marriage',{tr:'Birbirinin hayatını kolaylaştıran iki iyi takım arkadaşı olmak.',id:'Menjadi dua rekan satu tim yang saling memudahkan hidup.',en:'Being two good teammates who make life easier for each other.',zh:'成为彼此扶持、让生活更轻松的好队友。',th:'เป็นทีมเดียวกันที่ช่วยให้ชีวิตของกันและกันง่ายขึ้น'}]]},
 {id:'p4',photo:'/assets/showcase/p4.svg',kind:'showcase',compat:{communication:'gentle',planning:'flexible',social:'balanced',conflict:'calm',money:'flexible'},name:'Maya',age:36,gender:'Kadın',lang:'en',country:'Malezya',city:'Kuala Lumpur',intent:'Sadece tanışıyorum',children:'Kararsız',family:'Önemli',relocation:'Uygun',languages:['English','Bahasa Melayu'],job:'Ürün Yöneticisi',verified:false,score:72,reasons:['match_reason_region','match_reason_language'],factors:[70,76,72,69],bio:{tr:'Önce iyi bir arkadaşlık ve güven, sonra ciddi adımlar.',id:'Saya percaya pada persahabatan dan kepercayaan dulu, lalu langkah yang lebih serius.',en:'I believe in friendship and trust first, then more serious steps.',zh:'我相信先建立友谊和信任，再考虑更认真的下一步。',th:'ฉันเชื่อในการสร้างมิตรภาพและความไว้วางใจก่อน แล้วค่อยก้าวสู่ความจริงจัง'},prompts:[['prompt_weekend',{tr:'Yeni bir şehir keşfetmek ve iyi yemek.',id:'Menjelajahi kota baru dan menikmati makanan enak.',en:'Exploring a new city and finding great food.',zh:'探索一座新城市，寻找美食。',th:'สำรวจเมืองใหม่และหาอาหารอร่อยๆ'}]]},
 {id:'p5',photo:'/assets/showcase/p5.svg',kind:'showcase',compat:{communication:'direct',planning:'planned',social:'balanced',conflict:'calm',money:'planned'},name:'Ahmad',age:33,gender:'Erkek',lang:'id',country:'Endonezya',city:'Jakarta',intent:'Evliliğe hazırım',children:'İstiyorum',family:'Çok önemli',relocation:'Uygun',languages:['Bahasa Indonesia','English'],job:'Mimar',verified:true,bio:{tr:'Mühendisim, aileme yakınım. Sabah koşusu ve güzel bir kahve günümü başlatır.',id:'Saya insinyur, dekat dengan keluarga. Lari pagi dan kopi yang enak memulai hari saya.',en:'I am an engineer, close to my family. A morning run and good coffee start my day.',zh:'我是工程师，重视家庭。晨跑和一杯好咖啡开启我的一天。',th:'ผมเป็นวิศวกร ใกล้ชิดครอบครัว การวิ่งตอนเช้าและกาแฟดีๆ เริ่มต้นวันของผม'},prompts:[['prompt_marriage',{tr:'Birbirine dua eden, birbirini büyüten iki kişi.',id:'Dua orang yang saling mendoakan dan saling menumbuhkan.',en:'Two people who pray for each other and help each other grow.',zh:'两个为彼此祈祷、共同成长的人。',th:'คนสองคนที่สวดภาวนาให้กันและช่วยกันเติบโต'}]]},
 {id:'p6',photo:'/assets/showcase/p6.svg',kind:'showcase',compat:{communication:'gentle',planning:'planned',social:'home',conflict:'calm',money:'planned'},name:'Mehmet',age:35,gender:'Erkek',lang:'tr',country:'Türkiye',city:'Ankara',intent:'Evliliğe hazırım',children:'İstiyorum',family:'Önemli',relocation:'Uygun',languages:['Türkçe','English'],job:'Öğretmen',verified:true,bio:{tr:'Öğretmenim; sakin, düzenli ve aile değerlerine bağlı biriyim.',id:'Saya guru; tenang, teratur, dan menjunjung nilai keluarga.',en:'I am a teacher; calm, organised and committed to family values.',zh:'我是老师，性格平和、有条理，重视家庭价值。',th:'ผมเป็นครู ใจเย็น มีระเบียบ และยึดมั่นในคุณค่าครอบครัว'},prompts:[['prompt_value',{tr:'Dürüstlük ve sabır.',id:'Kejujuran dan kesabaran.',en:'Honesty and patience.',zh:'诚实与耐心。',th:'ความซื่อสัตย์และความอดทน'}]]},
 {id:'p7',photo:'/assets/showcase/p7.svg',kind:'showcase',compat:{communication:'direct',planning:'flexible',social:'social',conflict:'talk',money:'flexible'},name:'Rizal',age:30,gender:'Erkek',lang:'id',country:'Endonezya',city:'Surabaya',intent:'Sadece tanışıyorum',children:'Kararsız',family:'Önemli',relocation:'Uygun',languages:['Bahasa Indonesia','English'],job:'Ürün Yöneticisi',verified:false,bio:{tr:'Girişimciyim, yeni kültürleri tanımayı seviyorum.',id:'Saya wirausaha dan senang mengenal budaya baru.',en:'I am an entrepreneur and love getting to know new cultures.',zh:'我是创业者，喜欢了解新的文化。',th:'ผมเป็นผู้ประกอบการ ชอบเรียนรู้วัฒนธรรมใหม่ๆ'},prompts:[['prompt_weekend',{tr:'Deniz kenarında uzun bir yürüyüş.',id:'Jalan panjang di tepi pantai.',en:'A long walk by the sea.',zh:'在海边长长地散步。',th:'เดินเล่นริมทะเลนานๆ'}]]},
 {id:'p8',photo:'/assets/showcase/p8.svg',kind:'showcase',compat:{communication:'gentle',planning:'planned',social:'home',conflict:'calm',money:'planned'},name:'Zeynep',age:28,gender:'Kadın',lang:'tr',country:'Türkiye',city:'İstanbul',intent:'Evliliğe hazırım',children:'İstiyorum',family:'Çok önemli',relocation:'Kararsız',languages:['Türkçe','English'],job:'Öğretmen',verified:true,bio:{tr:'Okul öncesi öğretmeniyim. Sakin bir hayat, güçlü bir aile ve birlikte öğrenmek istiyorum.',id:'Saya guru PAUD. Saya ingin hidup tenang, keluarga yang kuat, dan belajar bersama.',en:'I am a preschool teacher. I want a calm life, a strong family and to keep learning together.',zh:'我是幼儿园老师。我想要平静的生活、牢固的家庭，并一起不断学习。',th:'ฉันเป็นครูอนุบาล อยากมีชีวิตที่สงบ ครอบครัวที่เข้มแข็ง และเรียนรู้ไปด้วยกัน'},prompts:[['prompt_weekend',{tr:'Kahvaltı, uzun bir yürüyüş ve akşam aileyle yemek.',id:'Sarapan, jalan panjang, dan makan malam bersama keluarga.',en:'Breakfast, a long walk and dinner with family.',zh:'早餐、长时间散步，晚上与家人共进晚餐。',th:'อาหารเช้า เดินเล่นนานๆ และมื้อเย็นกับครอบครัว'}]]},
 {id:'p9',photo:'/assets/showcase/p9.svg',kind:'showcase',compat:{communication:'direct',planning:'flexible',social:'balanced',conflict:'talk',money:'planned'},name:'Nadia',age:27,gender:'Kadın',lang:'id',country:'Endonezya',city:'Yogyakarta',intent:'Evliliğe hazırım',children:'İstiyorum',family:'Çok önemli',relocation:'Uygun',languages:['Bahasa Indonesia','English','Türkçe'],job:'Diş Hekimi',verified:true,bio:{tr:'Türkçe öğreniyorum ve Türkiye kültürünü seviyorum. Ortak değerler benim için her şeyden önce gelir.',id:'Saya sedang belajar bahasa Turki dan menyukai budaya Turki. Nilai yang sama adalah hal utama bagi saya.',en:'I am learning Turkish and love Turkish culture. Shared values come first for me.',zh:'我正在学习土耳其语，也喜欢土耳其文化。共同的价值观对我最重要。',th:'ฉันกำลังเรียนภาษาตุรกีและชอบวัฒนธรรมตุรกี ค่านิยมร่วมกันสำคัญที่สุดสำหรับฉัน'},prompts:[['prompt_value',{tr:'Sabır ve sadakat.',id:'Kesabaran dan kesetiaan.',en:'Patience and loyalty.',zh:'耐心与忠诚。',th:'ความอดทนและความซื่อสัตย์'}]]},
 {id:'p10',photo:'/assets/showcase/p10.svg',kind:'showcase',compat:{communication:'gentle',planning:'planned',social:'balanced',conflict:'calm',money:'planned'},name:'Aisyah',age:32,gender:'Kadın',lang:'en',country:'Malezya',city:'Johor Bahru',intent:'Evliliğe hazırım',children:'Kararsız',family:'Önemli',relocation:'Uygun',languages:['Bahasa Melayu','English'],job:'Ürün Yöneticisi',verified:false,bio:{tr:'Yazılım sektöründeyim. Birlikte büyüyebileceğim, dürüst ve nazik bir eş arıyorum.',id:'Saya bekerja di bidang teknologi. Saya mencari pasangan yang jujur dan lembut untuk tumbuh bersama.',en:'I work in tech. I am looking for an honest, kind partner to grow with.',zh:'我在科技行业工作。我在寻找一位诚实、善良、能共同成长的伴侣。',th:'ฉันทำงานด้านเทคโนโลยี มองหาคู่ชีวิตที่ซื่อสัตย์และอ่อนโยนเพื่อเติบโตไปด้วยกัน'},prompts:[['prompt_marriage',{tr:'Birbirini dinleyen iki kişi.',id:'Dua orang yang saling mendengarkan.',en:'Two people who truly listen to each other.',zh:'两个真正倾听彼此的人。',th:'คนสองคนที่รับฟังกันอย่างแท้จริง'}]]},
 {id:'p11',photo:'/assets/showcase/p11.svg',kind:'showcase',compat:{communication:'direct',planning:'planned',social:'social',conflict:'talk',money:'planned'},name:'Emre',age:34,gender:'Erkek',lang:'tr',country:'Türkiye',city:'Bursa',intent:'Evliliğe hazırım',children:'İstiyorum',family:'Çok önemli',relocation:'Uygun',languages:['Türkçe','English','Bahasa Indonesia'],job:'Mimar',verified:true,bio:{tr:'Endonezya’da iki yıl çalıştım, kültürü yakından tanıyorum. Aile kurmaya hazırım.',id:'Saya pernah bekerja dua tahun di Indonesia dan mengenal budayanya dengan baik. Saya siap membangun keluarga.',en:'I worked in Indonesia for two years and know the culture well. I am ready to build a family.',zh:'我在印尼工作过两年，很了解当地文化。我已准备好组建家庭。',th:'ผมเคยทำงานในอินโดนีเซียสองปีและรู้จักวัฒนธรรมดี ผมพร้อมสร้างครอบครัว'},prompts:[['prompt_weekend',{tr:'Pazar sabahı pazar alışverişi ve uzun bir kahvaltı.',id:'Belanja ke pasar Minggu pagi dan sarapan panjang.',en:'A Sunday market run and a long breakfast.',zh:'周日早晨去市场，然后吃一顿悠长的早餐。',th:'ไปตลาดเช้าวันอาทิตย์แล้วกินอาหารเช้านานๆ'}]]},
 {id:'p12',photo:'/assets/showcase/p12.svg',kind:'showcase',compat:{communication:'gentle',planning:'flexible',social:'home',conflict:'space',money:'flexible'},name:'Fajar',age:31,gender:'Erkek',lang:'id',country:'Endonezya',city:'Bandung',intent:'Evliliğe hazırım',children:'İstiyorum',family:'Önemli',relocation:'Kararsız',languages:['Bahasa Indonesia','English'],job:'Öğretmen',verified:true,bio:{tr:'Üniversitede ders veriyorum. Kitaplar, doğa ve sade bir hayat.',id:'Saya mengajar di universitas. Buku, alam, dan hidup sederhana.',en:'I teach at a university. Books, nature and a simple life.',zh:'我在大学教书。喜欢书籍、自然和简单的生活。',th:'ผมสอนที่มหาวิทยาลัย ชอบหนังสือ ธรรมชาติ และชีวิตเรียบง่าย'},prompts:[['prompt_value',{tr:'Şükür ve tevazu.',id:'Rasa syukur dan kerendahan hati.',en:'Gratitude and humility.',zh:'感恩与谦逊。',th:'ความกตัญญูและความถ่อมตน'}]]},
 {id:'t1',photo:'/assets/showcase/t1.svg',kind:'team',compat:{communication:'direct',planning:'planned',social:'balanced',conflict:'talk',money:'planned'},name:'Ömer',age:40,gender:'Erkek',lang:'tr',country:'Türkiye',city:'Ankara',intent:'Evlilik sürecinde danışmanlık istiyorum',children:'Kararsız',family:'Önemli',relocation:'Uygun',languages:['Türkçe','English'],job:'Mimar',verified:true,mutual:true,bio:{tr:'Nikah.App kurucu ekibindenim. Türkiye–Endonezya evlilik evrakları ve süreç hakkında sorularınızı buradan sorabilirsiniz.',id:'Saya dari tim pendiri Nikah.App. Tanyakan tentang dokumen dan proses pernikahan Turki–Indonesia di sini.',en:'I am on the Nikah.App founding team. Ask me here about Türkiye–Indonesia marriage documents and the process.',zh:'我是 Nikah.App 创始团队成员。可以在这里向我咨询土耳其–印尼结婚文件和流程。',th:'ผมอยู่ในทีมผู้ก่อตั้ง Nikah.App ถามเรื่องเอกสารและขั้นตอนการแต่งงานตุรกี–อินโดนีเซียได้ที่นี่'},prompts:[['prompt_value',{tr:'Şeffaflık.',id:'Transparansi.',en:'Transparency.',zh:'透明。',th:'ความโปร่งใส'}]]},
 {id:'t2',photo:'/assets/showcase/t2.svg',kind:'team',compat:{communication:'gentle',planning:'planned',social:'balanced',conflict:'calm',money:'planned'},name:'Dewi',age:33,gender:'Kadın',lang:'id',country:'Endonezya',city:'Jakarta',intent:'Evlilik sürecinde danışmanlık istiyorum',children:'Kararsız',family:'Önemli',relocation:'Uygun',languages:['Bahasa Indonesia','English','Türkçe'],job:'Öğretmen',verified:true,mutual:true,bio:{tr:'Nikah.App Endonezya ekibi. KUA başvurusu, belge tercümesi ve apostil konusunda yardımcı olurum.',id:'Tim Nikah.App Indonesia. Saya membantu soal pendaftaran KUA, terjemahan dokumen, dan apostille.',en:'Nikah.App Indonesia team. I help with KUA registration, document translation and apostille.',zh:'Nikah.App 印尼团队。我可以协助 KUA 登记、文件翻译和海牙认证。',th:'ทีม Nikah.App อินโดนีเซีย ช่วยเรื่องการจดทะเบียน KUA การแปลเอกสาร และ apostille'},prompts:[['prompt_value',{tr:'Güven.',id:'Kepercayaan.',en:'Trust.',zh:'信任。',th:'ความไว้วางใจ'}]]}
];

const DEMO_PACKAGES=[
 {code:'basic',nameKey:'basic',priceCents:14900,currency:'USD',features:['feat_checklist','feat_doc_review','feat_email_support']},
 {code:'full',nameKey:'full_support',priceCents:39900,currency:'USD',features:['feat_checklist','feat_doc_review','feat_sworn_translation','feat_apostille_guidance','feat_video_consult']},
 {code:'vip',nameKey:'vip',priceCents:89900,currency:'USD',features:['feat_checklist','feat_doc_review','feat_sworn_translation','feat_apostille_guidance','feat_video_consult','feat_dedicated_advisor','feat_priority']}
];

const uid=()=> (crypto.randomUUID?crypto.randomUUID():'id-'+Math.random().toString(36).slice(2)+Date.now().toString(36));

/* ---------------------------------------------------------------- demo */
function genderOk(me,p){
 const wantsMe=!p.seeking||p.seeking==='Fark etmez'||p.seeking===me.gender;
 const iWant=!me.seeking||me.seeking==='Fark etmez'||p.gender===me.seeking;
 return wantsMe&&iWant;
}
const DemoApi={
 live:false,
 async init(){return {session:!!state.session,userId:state.user.id||'me'}},
 onAuthChange(){},
 auth:{
  async register({email,phone}){state.auth.pending={email,phone};return {needsOtp:true,channel:'email'}},
  async verifyOtp({code}){if(code!=='123456')throw new Error(tr('wrong_code'));
   state.user.email=state.auth.pending?.email||state.user.email;state.user.phone=state.auth.pending?.phone||state.user.phone;
   state.user.phoneVerified=true;state.session=true;return {session:true}},
  async login(){state.session=true;if(!state.user.phoneVerified)state.user.phoneVerified=true;return {session:true}},
  async resetPassword(){return true},
  async resendOtp(){return true},
  async logout(){state.session=false},
  async deleteAccount(){localStorage.removeItem(STORAGE);localStorage.removeItem(LEGACY)}
 },
 profile:{
  async load(){return null}, // app state is the source of truth in demo
  async save(){return true},
  async uploadPhoto(dataUrl){return {url:dataUrl,path:''}},
  async requestVerification(){state.user.selfieVerified=true;state.user.identityVerified=true;state.user.verificationStatus='Approved';return {url:null,simulated:true}}
 },
 discover:{
  async list(){return DEMO_PROFILES.filter(p=>genderOk(state.user,p)).map(p=>({...p}))},
  async like(id,note,kind){const p=DEMO_PROFILES.find(x=>x.id===id);if(!p)throw new Error('not found');if(p.kind==='showcase')return {matched:false,showcase:true};return {matched:!!p.mutual||p.kind==='team',matchId:(p.mutual||p.kind==='team')?'demo-'+id:null}},
  async pass(){return true}
 },
 matches:{async list(){return DEMO_PROFILES.filter(p=>state.matches.includes(p.id)&&p.kind!=='showcase').map(p=>({...p,matchId:'demo-'+p.id}))}},
 async stats(){return {members:0,new_this_week:0,verified:0,team:DEMO_PROFILES.filter(p=>p.kind==='team').length,showcase:DEMO_PROFILES.filter(p=>p.kind==='showcase').length,founders_left:500,founder_discount_pct:30,countries:{}}},
 messages:{
  async list(id){return (state.messages[id]||[])},
  async send(id,text){state.messages[id]=state.messages[id]||[];state.messages[id].push({from:'me',text,time:new Date().toISOString()});return true},
  subscribe(){return()=>{}}
 },
 safety:{async block(){return true},async report(){return true},async requestVerification(){return true},async logCall(){return true}},
 journey:{async save(){return true}},
 advisory:{
  async packages(){return DEMO_PACKAGES},
  async list(){return state.advisory.requests},
  async create(req){const pkg=DEMO_PACKAGES.find(p=>p.code===req.packageCode);if(!pkg)throw new Error('package');
   const r={id:uid(),...req,priceCents:pkg.priceCents,currency:pkg.currency,status:'awaiting_payment',createdAt:new Date().toISOString(),documents:[]};
   state.advisory.requests.unshift(r);return r},
  async checkout(id){const r=state.advisory.requests.find(x=>x.id===id);if(r)r.status='paid';return {url:null,simulated:true}},
  async cancel(id){const r=state.advisory.requests.find(x=>x.id===id);if(r)r.status='cancelled';return true},
  async uploadDocument(id,docType,file){const r=state.advisory.requests.find(x=>x.id===id);if(!r)throw new Error('request');r.documents.push({id:uid(),docType,name:file.name});return true},
  async documents(id){return (state.advisory.requests.find(x=>x.id===id)||{}).documents||[]}
 },
 async translate(){return null}
};

/* ------------------------------------------------------------ supabase */
function makeSupabaseApi(cfg){
 const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}});
 const fnBase=cfg.functionsBase||(cfg.supabaseUrl.replace(/\/$/,'')+'/functions/v1');
 const channel=cfg.authChannel==='phone'?'phone':'email';
 let me=null; // auth user
 const signedUrlCache=new Map();

 const err=(e)=>{const m=e?.message||String(e);throw new Error(m)};
 async function callFn(name,body){
  const {data:{session}}=await sb.auth.getSession();
  const r=await fetch(`${fnBase}/${name}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabaseAnonKey,'Authorization':`Bearer ${session?.access_token||cfg.supabaseAnonKey}`},body:JSON.stringify(body||{})});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||`${name} failed`);return j;
 }
 async function signed(bucket,path){
  if(!path)return '';if(/^(\/|https?:)/.test(path))return path; // static asset (showcase) or absolute URLconst k=bucket+'/'+path,c=signedUrlCache.get(k);if(c&&c.exp>Date.now())return c.url;
  const {data,error}=await sb.storage.from(bucket).createSignedUrl(path,3600);if(error)return '';
  signedUrlCache.set(k,{url:data.signedUrl,exp:Date.now()+3300e3});return data.signedUrl;
 }
 async function rowToProfile(r){
  const bio={...(r.bio_translations||{})};if(r.bio)bio[r.lang||'en']=r.bio;
  const prompts=(Array.isArray(r.prompts)?r.prompts:[]).map(([k,txt])=>[k,{[r.lang||'en']:txt}]);
  return {id:r.id,kind:r.kind||'member',name:r.name,age:r.age,gender:r.gender,lang:r.lang,country:r.country,city:r.city,intent:r.intent,children:r.children_plan,family:r.family_role,relocation:r.relocation,job:r.occupation,languages:r.languages||[],compat:r.compat||{},bio,prompts,
   verified:!!r.selfie_verified,selfieVerified:!!r.selfie_verified,identityVerified:!!r.identity_verified,phoneVerified:!!r.phone_verified,
   photo:await signed('profile-photos',r.photo_path),photoBlur:!!r.photo_blur,matchId:r.match_id||null,likeNote:r.like_note||null,lastMessageAt:r.last_message_at||null};
 }
 function userToRow(u){
  return {id:me.id,first_name:u.firstName||'',last_name:u.lastName||'',birth_date:u.dob||null,gender:u.gender||null,seeking:u.seeking||null,country:u.country||null,city:u.city||null,
   lang:state.settings.language||'tr',intent:u.intent||null,children_plan:u.children||null,family_role:u.family||null,relocation:u.relocation||null,occupation:u.job||null,education:u.education||null,
   bio:u.about||null,compat:u.compat||{},languages:u.languages||[],photo_path:u.photoPath||null,discoverable:!!state.settings.discoverable,profile_complete:!!u.profileComplete,onboarding_step:u.onboardingStep||1,
   terms_accepted_at:u.terms?(u.termsAt||new Date().toISOString()):null,privacy_accepted_at:u.privacy?(u.privacyAt||new Date().toISOString()):null,age_confirmed:!!u.ageConfirmed,legal_version:u.legalVersion||null,legal_accepted_at:u.legalAcceptedAt||null,consent_special_data:!!u.consent};
 }

 return {
  live:true,
  async init(){const {data:{session}}=await sb.auth.getSession();me=session?.user||null;return {session:!!me,userId:me?.id||null}},
  onAuthChange(cb){sb.auth.onAuthStateChange((_e,s)=>{me=s?.user||null;cb(!!me)})},
  auth:{
   async register({email,phone,password}){
    state.auth.pending={email,phone};
    if(channel==='phone'){const {error}=await sb.auth.signUp({phone,password,options:{data:{email}}});if(error)err(error);return {needsOtp:true,channel:'phone'}}
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{phone}}});if(error)err(error);
    if(data.session){me=data.session.user;return {needsOtp:false,session:true}} // email confirmation disabled in project
    return {needsOtp:true,channel:'email'};
   },
   async verifyOtp({code}){
    const p=state.auth.pending||{};
    const {data,error}=channel==='phone'?await sb.auth.verifyOtp({phone:p.phone,token:code,type:'sms'}):await sb.auth.verifyOtp({email:p.email,token:code,type:'signup'});
    if(error)err(error);me=data.session?.user||data.user;return {session:!!me};
   },
   async login({id,password}){
    const creds=id.includes('@')?{email:id,password}:{phone:id,password};
    const {data,error}=await sb.auth.signInWithPassword(creds);if(error)err(error);me=data.user;return {session:true};
   },
   async resetPassword(id){const {error}=await sb.auth.resetPasswordForEmail(id,{redirectTo:location.origin+'/reset'});if(error)err(error);return true},
   async resendOtp(){const p=state.auth.pending||{};const {error}=await sb.auth.resend(channel==='phone'?{type:'sms',phone:p.phone}:{type:'signup',email:p.email});if(error)err(error);return true},
   async logout(){await sb.auth.signOut();me=null},
   async deleteAccount(){const {error}=await sb.rpc('delete_my_account');if(error)err(error);await sb.auth.signOut();me=null}
  },
  profile:{
   async load(){
    if(!me)return null;
    const [{data:p},{data:pref},{data:set},{data:ver},{data:vs},{data:j}]=await Promise.all([
     sb.from('profiles').select('*').eq('id',me.id).maybeSingle(),
     sb.from('preferences').select('*').eq('user_id',me.id).maybeSingle(),
     sb.from('settings').select('*').eq('user_id',me.id).maybeSingle(),
     sb.from('verifications').select('*').eq('user_id',me.id).maybeSingle(),
     sb.from('verification_sessions').select('status').eq('user_id',me.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
     sb.from('marriage_journeys').select('*').eq('user_id',me.id).maybeSingle()]);
    if(!p)return null;
    const user={id:p.id,email:me.email||'',phone:me.phone||p.phone||'',firstName:p.first_name,lastName:p.last_name,dob:p.birth_date||'',gender:p.gender||'',seeking:p.seeking||'',country:p.country||'Türkiye',city:p.city||'',
     languages:p.languages||[],about:p.bio||'',intent:p.intent||'Evliliğe hazırım',children:p.children_plan||'Kararsız',family:p.family_role||'Önemli',relocation:p.relocation||'Uygun',education:p.education||'',job:p.occupation||'',
     photoPath:p.photo_path||'',photo:await signed('profile-photos',p.photo_path),selfieVerified:!!ver?.selfie_verified,identityVerified:!!ver?.identity_verified,verificationStatus:ver?.last_status||vs?.status||'',phoneVerified:!!ver?.phone_verified||!!me.phone_confirmed_at,emailVerified:!!ver?.email_verified||!!me.email_confirmed_at,
     founder:!!p.founder,founderNo:p.founder_no||null,kind:p.kind||'member',profileComplete:!!p.profile_complete,onboardingStep:p.onboarding_step||1,terms:!!p.terms_accepted_at,privacy:!!p.privacy_accepted_at,termsAt:p.terms_accepted_at,privacyAt:p.privacy_accepted_at,ageConfirmed:!!p.age_confirmed,legalVersion:p.legal_version||'',legalAcceptedAt:p.legal_accepted_at||null,consent:!!p.consent_special_data,compat:p.compat||{}};
    const preferences=pref?{minAge:pref.min_age,maxAge:pref.max_age,distance:pref.region_scope,intent:pref.intent||'Evliliğe hazırım',children:pref.children_plan||'Fark etmez',verifiedOnly:!!pref.verified_only,dealbreakers:pref.dealbreakers||{}}:null;
    const settings=set?{language:set.language,translation:!!set.translation,discoverable:!!p.discoverable,notifications:!!set.notifications,verifiedChatsOnly:!!set.verified_chats_only,photoPrivacy:!!set.photo_privacy,safetyCheckin:!!set.safety_checkin,qualityMode:!!set.quality_mode}:null;
    const safety={trustedContact:set?.trusted_contact||''};
    const journey=j?{stage:j.stage,documents:j.documents||{}}:null;
    return {user,preferences,settings,safety,journey};
   },
   async save({user,preferences,settings,safety}){
    if(!me)return false;
    const ops=[sb.from('profiles').upsert(userToRow(user))];
    if(preferences)ops.push(sb.from('preferences').upsert({user_id:me.id,min_age:preferences.minAge,max_age:preferences.maxAge,region_scope:preferences.distance||'Global',intent:preferences.intent||null,children_plan:preferences.children||null,verified_only:!!preferences.verifiedOnly,dealbreakers:preferences.dealbreakers||{}}));
    if(settings)ops.push(sb.from('settings').upsert({user_id:me.id,language:settings.language,translation:!!settings.translation,notifications:!!settings.notifications,quality_mode:!!settings.qualityMode,verified_chats_only:!!settings.verifiedChatsOnly,photo_privacy:!!settings.photoPrivacy,safety_checkin:!!settings.safetyCheckin,trusted_contact:safety?.trustedContact||null}));
    const res=await Promise.all(ops);const bad=res.find(r=>r.error);if(bad)err(bad.error);return true;
   },
   async uploadPhoto(dataUrl){
    const blob=await (await fetch(dataUrl)).blob();const path=`${me.id}/avatar-${Date.now()}.jpg`;
    const {error}=await sb.storage.from('profile-photos').upload(path,blob,{contentType:'image/jpeg',upsert:true});if(error)err(error);
    return {url:await signed('profile-photos',path),path};
   },
   async requestVerification(){return callFn('verify-start',{consent:true})} // → Didit hosted flow; didit-webhook writes verifications
  },
  discover:{
   async list(){const {data,error}=await sb.rpc('discover_candidates',{max_results:20});if(error)err(error);return Promise.all((data||[]).map(rowToProfile))},
   async like(id,note,kind){const {data,error}=await sb.rpc('like_profile',{target:id,like_kind:kind||'like',like_note:note||null});if(error)err(error);return {matched:!!data?.matched,matchId:data?.match_id||null}},
   async pass(id){const {error}=await sb.from('passes').upsert({from_user:me.id,to_user:id});if(error)err(error);return true}
  },
  matches:{async list(){const {data,error}=await sb.rpc('my_matches');if(error)err(error);return Promise.all((data||[]).map(rowToProfile))}},
  async stats(){const {data,error}=await sb.rpc('community_stats');if(error)return null;return data},
  messages:{
   async list(matchId){const {data,error}=await sb.from('messages').select('id,sender_id,body,translations,created_at').eq('match_id',matchId).order('created_at').limit(500);if(error)err(error);
    return (data||[]).map(m=>({id:m.id,from:m.sender_id===me.id?'me':'them',text:m.body,translations:m.translations||{},time:m.created_at}))},
   async send(matchId,text){const {error}=await sb.from('messages').insert({match_id:matchId,sender_id:me.id,body:text});if(error)err(error);return true},
   subscribe(matchId,cb){const ch=sb.channel('msgs-'+matchId).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`match_id=eq.${matchId}`},pl=>{const m=pl.new;cb({id:m.id,from:m.sender_id===me.id?'me':'them',text:m.body,translations:m.translations||{},time:m.created_at})}).subscribe();return()=>sb.removeChannel(ch)}
  },
  safety:{
   async block(id){const {error}=await sb.rpc('block_user',{target:id});if(error)err(error);return true},
   async report(id,reason,details){const {error}=await sb.from('reports').insert({reporter_id:me.id,reported_id:id,reason:reason||'user_report',details:details||null});if(error)err(error);return true},
   async requestVerification(id){const {error}=await sb.from('verification_requests').upsert({requester_id:me.id,target_id:id});if(error)err(error);return true},
   async logCall(matchId,kind){if(!matchId)return false;await sb.from('call_logs').insert({match_id:matchId,caller_id:me.id,kind});return true}
  },
  journey:{async save({stage,documents}){const {error}=await sb.from('marriage_journeys').upsert({user_id:me.id,stage,documents});if(error)err(error);return true}},
  advisory:{
   async packages(){const {data,error}=await sb.from('advisory_packages').select('*').eq('active',true).order('sort_order');if(error)err(error);return (data||[]).map(p=>({code:p.code,nameKey:p.name_key,priceCents:p.price_cents,currency:p.currency,features:p.features||[]}))},
   async list(){const {data,error}=await sb.from('advisory_requests').select('*, advisory_documents(id,doc_type,original_name)').eq('user_id',me.id).order('created_at',{ascending:false});if(error)err(error);
    return (data||[]).map(r=>({id:r.id,packageCode:r.package_code,priceCents:r.price_cents,listPriceCents:r.list_price_cents||r.price_cents,discountPct:r.discount_pct||0,currency:r.currency,status:r.status,contactEmail:r.contact_email,contactPhone:r.contact_phone,whatsapp:r.contact_whatsapp,countryFrom:r.country_from,countryTo:r.country_to,notes:r.notes,createdAt:r.created_at,documents:(r.advisory_documents||[]).map(d=>({id:d.id,docType:d.doc_type,name:d.original_name}))}))},
   async create(req){const {data,error}=await sb.from('advisory_requests').insert({user_id:me.id,package_code:req.packageCode,contact_email:req.contactEmail||null,contact_phone:req.contactPhone||null,contact_whatsapp:req.whatsapp||null,country_from:req.countryFrom||null,country_to:req.countryTo||null,notes:req.notes||null,match_id:req.matchId||null}).select().single();if(error)err(error);
    return {id:data.id,packageCode:data.package_code,priceCents:data.price_cents,currency:data.currency,status:data.status,createdAt:data.created_at,documents:[]}},
   async checkout(id){return callFn('create-checkout',{request_id:id})},
   async cancel(id){const {error}=await sb.from('advisory_requests').update({status:'cancelled'}).eq('id',id);if(error)err(error);return true},
   async uploadDocument(id,docType,file){const path=`${me.id}/${id}/${docType}-${Date.now()}-${file.name.replace(/[^\w.\-]+/g,'_')}`;
    const {error}=await sb.storage.from('advisory-docs').upload(path,file,{contentType:file.type||'application/octet-stream'});if(error)err(error);
    const {error:e2}=await sb.from('advisory_documents').insert({request_id:id,user_id:me.id,doc_type:docType,storage_path:path,original_name:file.name});if(e2)err(e2);return true},
   async documents(id){const {data}=await sb.from('advisory_documents').select('id,doc_type,original_name').eq('request_id',id);return (data||[]).map(d=>({id:d.id,docType:d.doc_type,name:d.original_name}))}
  },
  async translate(text,target){if(!cfg.translationEnabled)return null;try{const j=await callFn('translate',{text,target});return j.text||null}catch{return null}}
 };
}

const NikahApi=(()=>{const cfg=window.NIKAH_CONFIG||{};if(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase)return makeSupabaseApi(cfg);return DemoApi})();
