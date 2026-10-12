'use strict';
// Nikah.App legal texts. DRAFTS — have a lawyer review before launch (TR: KVKK; ID: UU PDP 27/2022; EU users: GDPR).
// Placeholders are filled from window.NIKAH_CONFIG.legal. Binding language: Turkish for Türkiye-law matters, English otherwise.
const LEGAL_VERSION='2026-10-05';
const LEGAL_DOCS=['terms','privacy','kvkk','consent','deletion'];

const LEGAL={
tr:{
_title:{terms:'Kullanım Koşulları',privacy:'Gizlilik Politikası',kvkk:'KVKK Aydınlatma Metni',consent:'Açık Rıza Metni',deletion:'Hesap Silme ve Veri Talepleri'},
terms:`
<p><b>Son güncelleme:</b> %{version} · <b>Hizmet sağlayıcı:</b> %{company}, %{address} · %{email}</p>
<h3>1. Hizmetin tanımı</h3>
<p>Nikah.App ("Hizmet"), evlilik niyetiyle tanışmak isteyen yetişkinleri bir araya getiren, isteğe bağlı uluslararası evlilik danışmanlığı sunan çok dilli bir platformdur. Hizmet bir evlilik vaadi vermez; eşleşme veya evlilik garantisi yoktur.</p>
<h3>2. Üyelik şartları</h3>
<ul><li>18 yaşını doldurmuş olmak zorunludur. Yaş beyanı yanlış çıkarsa hesap derhal kapatılır.</li>
<li>Her kişi yalnızca bir hesap açabilir; başkası adına veya sahte kimlikle hesap açılamaz.</li>
<li>Profil bilgileri doğru ve güncel olmalıdır. Başkasına ait fotoğraf kullanılamaz.</li></ul>
<h3>3. Yasak davranışlar</h3>
<ul><li>Para, hediye veya finansal bilgi talep etmek; dolandırıcılık, taciz, tehdit, nefret söylemi.</li>
<li>Müstehcen içerik paylaşmak; ticari tanıtım; otomatik araç (bot) kullanmak.</li>
<li>Diğer kullanıcıların verilerini toplamak, ekran görüntülerini izinsiz yaymak.</li></ul>
<p>İhlal halinde hesap uyarı yapılmaksızın askıya alınabilir veya kapatılabilir; gerekli hallerde yetkili makamlara bildirim yapılır.</p>
<h3>4. Örnek ve ekip profilleri</h3>
<p>Platformda açıkça "Örnek profil" olarak etiketlenmiş, gerçek kişi olmayan tanıtım profilleri bulunabilir. Bu profiller beğenilemez, eşleşme oluşturmaz ve mesaj alamaz. "Nikah.App ekibi" etiketli profiller gerçek çalışanlarımıza aittir.</p>
<h3>5. Doğrulama</h3>
<p>Kimlik ve selfie doğrulaması isteğe bağlıdır ve bağımsız sağlayıcı Didit tarafından yürütülür. Doğrulama rozeti bir kimlik garantisi değildir; kullanıcılar her zaman kendi güvenlik önlemlerini almalıdır.</p>
<h3>6. Danışmanlık hizmetleri ve ücretler</h3>
<ul><li>Danışmanlık paketleri uygulamada gösterilen fiyatlarla sunulur; fiyat sipariş anında kesinleşir.</li>
<li>Danışmanlık; evrak listesi, ön inceleme, tercüme ve resmi süreç yönlendirmesi içerir. Resmi makamların kararı (vize, nikâh izni vb.) garanti edilmez.</li>
<li>Hizmete fiilen başlanmadan önce iptal halinde ücret tam iade edilir. Başlandıktan sonra, tamamlanmış işlerin bedeli düşülerek kalan kısım iade edilir. Teslim edilmiş tercüme ve apostil işlemleri iade edilemez.</li>
<li>Mesafeli Sözleşmeler Yönetmeliği uyarınca tüketicinin 14 günlük cayma hakkı, ifasına başlanmış hizmetler hariç saklıdır.</li></ul>
<h3>7. Fikri mülkiyet</h3>
<p>Uygulama, tasarım ve içerikler %{company}'e aittir. Kullanıcı, yüklediği içerikler için Hizmetin işletilmesi amacıyla sınırlı, dünya çapında, telifsiz bir lisans verir.</p>
<h3>8. Sorumluluğun sınırı</h3>
<p>Hizmet "olduğu gibi" sunulur. Kullanıcılar arasındaki iletişim ve buluşmalardan doğan zararlardan %{company} sorumlu değildir. Zorunlu hukuk kuralları saklı kalmak kaydıyla sorumluluk, son 12 ayda ödenen ücretle sınırlıdır.</p>
<h3>9. Değişiklikler ve fesih</h3>
<p>Koşullar önceden duyurularak değiştirilebilir; devam eden kullanım kabul anlamına gelir. Kullanıcı hesabını istediği an silebilir (bkz. Hesap Silme).</p>
<h3>10. Uygulanacak hukuk</h3>
<p>Türkiye Cumhuriyeti hukuku uygulanır; Ankara mahkemeleri ve icra daireleri yetkilidir. Tüketicilerin yerleşim yeri mahkemelerine ve tüketici hakem heyetlerine başvuru hakkı saklıdır.</p>`,
privacy:`
<p><b>Son güncelleme:</b> %{version} · <b>Veri sorumlusu:</b> %{company}, %{address} · %{email}</p>
<p>Bu politika Türkiye (6698 sayılı KVKK), Endonezya (UU No. 27/2022 PDP) ve AB (GDPR) kullanıcıları için geçerlidir. Türkiye'deki kullanıcılar için ayrıca <a href="/legal/kvkk" data-route="legal:kvkk">KVKK Aydınlatma Metni</a> geçerlidir.</p>
<h3>1. Topladığımız veriler</h3>
<ul><li><b>Hesap:</b> e-posta, telefon, şifre (karma olarak).</li>
<li><b>Profil:</b> ad, doğum tarihi, cinsiyet, aradığı cinsiyet, ülke/şehir, diller, meslek, eğitim, biyografi, evlilik/çocuk/aile/taşınma tercihleri, uyum soruları, fotoğraf.</li>
<li><b>Özel nitelikli veriler:</b> Hizmetin niteliği gereği dini inanca ilişkin çıkarım yapılabilir; kimlik doğrulamasında biyometrik veri (yüz) işlenir. Bunlar yalnızca <b>açık rızanızla</b> işlenir.</li>
<li><b>Kullanım:</b> beğeni, geçme, eşleşme, mesaj içerikleri, şikâyet ve engelleme kayıtları, arama kayıtları (içerik değil), cihaz ve IP bilgisi, çeviri istekleri.</li>
<li><b>Danışmanlık:</b> iletişim bilgileri, ülke bilgileri, notlar, yüklenen evraklar (pasaport, doğum belgesi vb.), ödeme durumu (kart bilgisi bizde tutulmaz).</li></ul>
<h3>2. İşleme amaçları ve hukuki dayanak</h3>
<ul><li>Hizmetin sunulması, eşleştirme, mesajlaşma — sözleşmenin ifası.</li>
<li>Güvenlik, dolandırıcılık önleme, şikâyet yönetimi — meşru menfaat ve hukuki yükümlülük.</li>
<li>Kimlik doğrulama (biyometrik) ve din bilgisi — açık rıza.</li>
<li>Danışmanlık hizmeti ve faturalama — sözleşmenin ifası ve hukuki yükümlülük.</li>
<li>Çeviri — sözleşmenin ifası (mesaj metni çeviri sağlayıcısına iletilir).</li></ul>
<h3>3. Paylaştığımız taraflar</h3>
<ul><li><b>Supabase</b> (veritabanı, kimlik, dosya depolama; sunucular AB'de, Frankfurt).</li>
<li><b>Vercel</b> (uygulama barındırma).</li>
<li><b>Didit</b> (kimlik ve selfie doğrulama — belge görüntüleri Didit'te işlenir, bizde saklanmaz).</li>
<li><b>DeepL</b> (çeviri), <b>Resend</b> (e-posta), ödeme sağlayıcısı (Stripe/iyzico — kart bilgileri yalnızca onlarda).</li>
<li>Yetkili kamu makamları — yasal zorunluluk halinde.</li></ul>
<p>Veriler reklam amacıyla satılmaz veya paylaşılmaz.</p>
<h3>4. Yurt dışına aktarım</h3>
<p>Veriler AB'de barındırılır. Endonezya ve diğer ülkelerdeki kullanıcıların verileri Türkiye ve AB'ye aktarılır; KVKK m.9 ve UU PDP m.56 kapsamında açık rıza ve/veya yeterli koruma güvencesiyle aktarım yapılır.</p>
<h3>5. Saklama süreleri</h3>
<ul><li>Hesap verileri: hesap silinene kadar; silme sonrası 30 gün içinde kalıcı olarak silinir.</li>
<li>Mesajlar: eşleşme süresince; hesap silinince silinir (karşı tarafın kopyası anonimleştirilir).</li>
<li>Şikâyet ve engelleme kayıtları: güvenlik amacıyla 2 yıl.</li>
<li>Danışmanlık evrakları: hizmet tamamlandıktan 1 yıl sonra; fatura kayıtları 10 yıl (Vergi Usul Kanunu).</li>
<li>Doğrulama sonucu: hesap silinene kadar; belge görüntüsü hiç saklanmaz.</li></ul>
<h3>6. Haklarınız</h3>
<p>Verilerinize erişme, düzeltme, silme, işlemeyi kısıtlama, taşınabilirlik ve itiraz haklarınız vardır. Açık rızanızı dilediğiniz an geri alabilirsiniz. Başvuru: %{email}. 30 gün içinde yanıt verilir. Türkiye'de Kişisel Verileri Koruma Kurulu'na, Endonezya'da veri koruma otoritesine şikâyet hakkınız saklıdır.</p>
<h3>7. Çocuklar</h3>
<p>Hizmet 18 yaş altına kapalıdır. Tespit edilen hesaplar silinir.</p>
<h3>8. Çerezler ve yerel depolama</h3>
<p>Yalnızca oturumun sürdürülmesi ve tercihlerin saklanması için zorunlu yerel depolama kullanılır. Takip veya reklam çerezi yoktur.</p>`,
kvkk:`
<p><b>6698 sayılı Kişisel Verilerin Korunması Kanunu m.10 kapsamında aydınlatma</b></p>
<p><b>Veri sorumlusu:</b> %{company}, %{address}, %{email}%{mersis}</p>
<h3>İşlenen kişisel veriler ve amaçlar</h3>
<ul><li><b>Kimlik ve iletişim</b> (ad, doğum tarihi, e-posta, telefon): hesap oluşturma, kimlik tespiti, bildirim.</li>
<li><b>Profil ve tercih verileri</b> (cinsiyet, aradığı kişi, konum, dil, meslek, biyografi, evlilik tercihleri): eşleştirme hizmetinin sunulması.</li>
<li><b>Görsel veri</b> (profil fotoğrafı): hizmetin sunulması.</li>
<li><b>Özel nitelikli veri — din</b> (platformun niteliğinden kaynaklanan çıkarım): yalnızca açık rıza ile; eşleştirme.</li>
<li><b>Özel nitelikli veri — biyometrik</b> (yüz görüntüsü; doğrulama sırasında): yalnızca açık rıza ile; kimlik doğrulama ve dolandırıcılık önleme. Görüntü veri işleyen Didit'te işlenir, veri sorumlusu nezdinde saklanmaz.</li>
<li><b>İşlem güvenliği</b> (IP, cihaz, log kayıtları): 5651 sayılı Kanun ve güvenlik.</li>
<li><b>Müşteri işlem ve finans</b> (danışmanlık talepleri, ödeme durumu, fatura): sözleşmenin ifası, VUK yükümlülükleri.</li></ul>
<h3>Hukuki sebepler (KVKK m.5-6)</h3>
<p>Sözleşmenin kurulması ve ifası (m.5/2-c), hukuki yükümlülük (m.5/2-ç), meşru menfaat (m.5/2-f) ve özel nitelikli veriler için açık rıza (m.6/2).</p>
<h3>Aktarım</h3>
<p>Veriler; barındırma (Supabase – AB), doğrulama (Didit), çeviri (DeepL), e-posta (Resend), ödeme (Stripe/iyzico) hizmet sağlayıcılarına ve talep halinde yetkili kamu kurumlarına aktarılır. Yurt dışına aktarım KVKK m.9 çerçevesinde açık rızanıza dayanır.</p>
<h3>Toplama yöntemi</h3>
<p>Veriler, uygulama üzerinden elektronik ortamda, doğrudan sizden ve kullanımınız sırasında otomatik yollarla toplanır.</p>
<h3>Haklarınız (KVKK m.11)</h3>
<p>İşlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, düzeltme, silme/yok edilmesini isteme, bu işlemlerin aktarılan üçüncü kişilere bildirilmesini isteme, otomatik sistemlerle analiz sonucuna itiraz etme ve zarara uğramanız hâlinde tazminat talep etme. Başvurular %{email} adresine veya yazılı olarak %{address} adresine yapılabilir; en geç 30 gün içinde yanıtlanır.</p>`,
consent:`
<p><b>Özel nitelikli kişisel verilerin işlenmesine ilişkin açık rıza (KVKK m.6, UU PDP m.4 ve m.20, GDPR m.9)</b></p>
<p>Aşağıdaki hususları okudum, anladım ve <b>özgür irademle</b> kabul ediyorum:</p>
<h3>A. Dini inanç</h3>
<p>Nikah.App'in İslami evlilik odaklı bir platform olması nedeniyle üyeliğimden dini inancıma ilişkin çıkarım yapılabileceğini biliyorum. Bu bilginin yalnızca eşleştirme hizmetinin sunulması amacıyla işlenmesine açık rıza veriyorum.</p>
<h3>B. Biyometrik veri (yalnızca doğrulamayı başlatırsam)</h3>
<p>Kimlik doğrulaması için kimlik belgemin fotoğrafının ve canlı selfie görüntümün (yüz biyometrisi) veri işleyen <b>Didit</b> tarafından, belge gerçekliği, canlılık ve yüz eşleştirme amacıyla işlenmesine açık rıza veriyorum. Belge görüntülerinin %{company} sunucularında saklanmayacağını, yalnızca doğrulama sonucu, belge ülkesi ve doğum tarihi eşleşmesinin iletileceğini anlıyorum.</p>
<h3>C. Yurt dışına aktarım</h3>
<p>Verilerimin Türkiye dışında (AB – Frankfurt) barındırılmasına ve yukarıdaki hizmet sağlayıcılara aktarılmasına açık rıza veriyorum.</p>
<h3>D. Rızanın geri alınması</h3>
<p>Bu rızayı dilediğim zaman Ayarlar &gt; Gizlilik üzerinden veya %{email} adresine yazarak geri alabileceğimi; geri alma hâlinde doğrulama rozetimin kaldırılacağını ve platformun niteliği gereği A maddesi geri alınırsa hesabımın kapatılacağını biliyorum. Geri alma, o ana kadar yapılan işlemlerin hukuka uygunluğunu etkilemez.</p>`,
deletion:`
<h3>Hesabınızı silmek</h3>
<p>Ayarlar &gt; "Hesabı kalıcı olarak sil". İşlem anında gerçekleşir: profil, tercihler, beğeniler, eşleşmeler, mesajlar, fotoğraflar, doğrulama sonucu ve danışmanlık evrakları silinir. Eşleştiğiniz kişilerde kalan mesajlar anonimleştirilir ("Silinmiş kullanıcı").</p>
<h3>Saklanmaya devam edenler</h3>
<ul><li>Fatura ve ödeme kayıtları — 10 yıl (Vergi Usul Kanunu).</li>
<li>Hakkınızda yapılmış şikâyet ve engelleme kayıtları — 2 yıl (diğer kullanıcıların güvenliği).</li>
<li>Erişim logları — 2 yıl (5651 sayılı Kanun).</li></ul>
<h3>Verilerinizi talep etmek</h3>
<p>%{email} adresine "veri taşınabilirlik talebi" yazın; 30 gün içinde makine tarafından okunabilir (JSON) formatta gönderilir.</p>
<h3>Uygulamayı kullanamıyorsanız</h3>
<p>Kayıtlı e-posta adresinizden %{email} adresine "hesap silme" yazmanız yeterlidir; kimlik teyidinden sonra 7 gün içinde silinir.</p>`
},
en:{
_title:{terms:'Terms of Use',privacy:'Privacy Policy',kvkk:'KVKK Notice (Türkiye)',consent:'Explicit Consent',deletion:'Account Deletion & Data Requests'},
terms:`
<p><b>Last updated:</b> %{version} · <b>Provider:</b> %{company}, %{address} · %{email}</p>
<h3>1. The Service</h3>
<p>Nikah.App ("Service") is a multilingual platform connecting adults who intend to marry, with optional international-marriage advisory services. The Service does not promise or guarantee a match or a marriage.</p>
<h3>2. Eligibility</h3>
<ul><li>You must be at least 18. Accounts with false age statements are closed immediately.</li>
<li>One account per person; no accounts on behalf of others or under a false identity.</li>
<li>Profile information must be true and current. You may not use another person's photo.</li></ul>
<h3>3. Prohibited conduct</h3>
<ul><li>Requesting money, gifts or financial information; fraud, harassment, threats, hate speech.</li>
<li>Sexual or obscene content; commercial promotion; automated tools (bots).</li>
<li>Collecting other users' data or sharing screenshots of them without consent.</li></ul>
<p>Violations may lead to suspension or termination without notice and, where required, reports to authorities.</p>
<h3>4. Sample and team profiles</h3>
<p>The platform may show profiles clearly labelled "Sample profile" that do not represent real people. They cannot be liked, matched or messaged. Profiles labelled "Nikah.App team" belong to our real staff.</p>
<h3>5. Verification</h3>
<p>ID and selfie verification is optional and performed by the independent provider Didit. A verification badge is not a guarantee of identity; users must always take their own safety precautions.</p>
<h3>6. Advisory services and fees</h3>
<ul><li>Advisory packages are offered at the prices shown in the app; the price is fixed at the time of order.</li>
<li>Advisory includes a document checklist, pre-review, translation and guidance through official procedures. Decisions of public authorities (visas, marriage permits etc.) are not guaranteed.</li>
<li>Cancellation before work begins: full refund. After work begins: refund minus completed work. Delivered translations and apostille procedures are non-refundable.</li>
<li>Consumers in Türkiye retain their 14-day withdrawal right under the Distance Contracts Regulation, except for services already performed.</li></ul>
<h3>7. Intellectual property</h3>
<p>The app, design and content belong to %{company}. You grant us a limited, worldwide, royalty-free licence to use content you upload for operating the Service.</p>
<h3>8. Limitation of liability</h3>
<p>The Service is provided "as is". %{company} is not liable for damages arising from communication or meetings between users. Subject to mandatory law, liability is limited to fees paid in the last 12 months.</p>
<h3>9. Changes and termination</h3>
<p>We may change these Terms with prior notice; continued use constitutes acceptance. You may delete your account at any time (see Account Deletion).</p>
<h3>10. Governing law</h3>
<p>Laws of the Republic of Türkiye apply; the courts of Ankara have jurisdiction, without prejudice to mandatory consumer-protection rights in your country of residence.</p>`,
privacy:`
<p><b>Last updated:</b> %{version} · <b>Controller:</b> %{company}, %{address} · %{email}</p>
<p>This policy applies to users in Türkiye (Law No. 6698, KVKK), Indonesia (Law No. 27/2022 on Personal Data Protection, UU PDP) and the EU (GDPR). Users in Türkiye are additionally covered by the <a href="/legal/kvkk" data-route="legal:kvkk">KVKK Notice</a>.</p>
<h3>1. Data we collect</h3>
<ul><li><b>Account:</b> email, phone, password (hashed).</li>
<li><b>Profile:</b> name, date of birth, gender, gender sought, country/city, languages, occupation, education, bio, marriage/children/family/relocation preferences, compatibility answers, photo.</li>
<li><b>Sensitive data:</b> by the nature of the Service an inference about religious belief may be made; biometric data (face) is processed during ID verification. These are processed <b>only with your explicit consent</b>.</li>
<li><b>Usage:</b> likes, passes, matches, message content, reports and blocks, call logs (not content), device and IP data, translation requests.</li>
<li><b>Advisory:</b> contact details, countries, notes, uploaded documents (passport, birth certificate etc.), payment status (card data is never stored by us).</li></ul>
<h3>2. Purposes and legal bases</h3>
<ul><li>Providing the Service, matching, messaging — performance of contract.</li>
<li>Safety, fraud prevention, handling reports — legitimate interest and legal obligation.</li>
<li>ID verification (biometric) and religious inference — explicit consent.</li>
<li>Advisory services and invoicing — contract and legal obligation.</li>
<li>Translation — contract (message text is sent to the translation provider).</li></ul>
<h3>3. Recipients</h3>
<ul><li><b>Supabase</b> (database, auth, file storage; servers in the EU, Frankfurt).</li>
<li><b>Vercel</b> (hosting).</li>
<li><b>Didit</b> (ID and selfie verification — document images are processed by Didit and never stored by us).</li>
<li><b>DeepL</b> (translation), <b>Resend</b> (email), payment provider (Stripe/iyzico — card data only with them).</li>
<li>Public authorities where legally required.</li></ul>
<p>We do not sell or share data for advertising.</p>
<h3>4. International transfers</h3>
<p>Data is hosted in the EU. Data of users in Indonesia and other countries is transferred to Türkiye and the EU on the basis of explicit consent and/or adequate safeguards (KVKK art. 9, UU PDP art. 56, GDPR ch. V).</p>
<h3>5. Retention</h3>
<ul><li>Account data: until deletion; permanently erased within 30 days after deletion.</li>
<li>Messages: for the duration of the match; erased on account deletion (the other party's copy is anonymised).</li>
<li>Reports and blocks: 2 years, for safety.</li>
<li>Advisory documents: 1 year after completion; invoicing records 10 years (Turkish tax law).</li>
<li>Verification result: until deletion; document images are never stored.</li></ul>
<h3>6. Your rights</h3>
<p>Access, rectification, erasure, restriction, portability and objection. You may withdraw consent at any time. Contact: %{email}; we respond within 30 days. You may lodge a complaint with the Turkish Personal Data Protection Authority, the Indonesian data protection authority, or your EU supervisory authority.</p>
<h3>7. Children</h3>
<p>The Service is not available to anyone under 18. Such accounts are deleted.</p>
<h3>8. Cookies and local storage</h3>
<p>Only strictly necessary local storage is used to keep you signed in and remember preferences. No tracking or advertising cookies.</p>`,
kvkk:`<p>This notice is issued under Turkish Law No. 6698 and is binding in Turkish. <a href="/legal/kvkk" data-lang-doc="tr:kvkk">Read the Turkish text</a>. Summary: %{company} is the data controller; personal data is processed to provide the matchmaking and advisory service; special-category data (religion, biometrics) only with explicit consent; data is transferred abroad (EU hosting, Didit, DeepL, Resend, payment provider) on the basis of consent; you may exercise your rights under art. 11 by writing to %{email}.</p>`,
consent:`
<p><b>Explicit consent to the processing of special-category personal data (KVKK art. 6, UU PDP art. 4 & 20, GDPR art. 9)</b></p>
<p>I have read and understood the following and <b>freely</b> agree:</p>
<h3>A. Religious belief</h3>
<p>Because Nikah.App is an Islamic marriage platform, my membership may reveal an inference about my religious belief. I consent to this information being processed solely to provide the matching service.</p>
<h3>B. Biometric data (only if I start verification)</h3>
<p>I consent to a photo of my ID document and a live selfie (facial biometrics) being processed by the processor <b>Didit</b> for document authenticity, liveness and face matching. I understand that document images are not stored on %{company} servers and that only the result, document country and date-of-birth match are shared with %{company}.</p>
<h3>C. International transfer</h3>
<p>I consent to my data being hosted outside Türkiye/Indonesia (EU – Frankfurt) and transferred to the service providers above.</p>
<h3>D. Withdrawal</h3>
<p>I may withdraw this consent at any time via Settings &gt; Privacy or by writing to %{email}; on withdrawal my verification badge will be removed and, if consent A is withdrawn, my account will be closed given the nature of the platform. Withdrawal does not affect the lawfulness of processing before withdrawal.</p>`,
deletion:`
<h3>Deleting your account</h3>
<p>Settings &gt; "Delete account permanently". It happens immediately: profile, preferences, likes, matches, messages, photos, verification result and advisory documents are deleted. Messages that remain with people you matched are anonymised ("Deleted user").</p>
<h3>What we keep</h3>
<ul><li>Invoicing and payment records — 10 years (Turkish tax law).</li>
<li>Reports and blocks filed about you — 2 years (safety of other users).</li>
<li>Access logs — 2 years (Turkish Law No. 5651).</li></ul>
<h3>Requesting your data</h3>
<p>Email %{email} with "data portability request"; we send a machine-readable (JSON) export within 30 days.</p>
<h3>If you cannot access the app</h3>
<p>Email "delete my account" from your registered address to %{email}; after identity confirmation the account is deleted within 7 days.</p>`
},
id:{
_title:{terms:'Syarat Penggunaan',privacy:'Kebijakan Privasi',kvkk:'Pemberitahuan KVKK (Turki)',consent:'Persetujuan Eksplisit',deletion:'Penghapusan Akun & Permintaan Data'},
terms:`
<p><b>Diperbarui:</b> %{version} · <b>Penyedia:</b> %{company}, %{address} · %{email}</p>
<h3>1. Layanan</h3>
<p>Nikah.App ("Layanan") adalah platform multibahasa yang mempertemukan orang dewasa yang berniat menikah, dengan layanan konsultasi pernikahan internasional opsional. Layanan tidak menjanjikan atau menjamin kecocokan maupun pernikahan.</p>
<h3>2. Syarat keanggotaan</h3>
<ul><li>Usia minimal 18 tahun. Akun dengan pernyataan usia palsu ditutup segera.</li>
<li>Satu akun per orang; dilarang membuat akun atas nama orang lain atau dengan identitas palsu.</li>
<li>Informasi profil harus benar dan terkini. Dilarang menggunakan foto orang lain.</li></ul>
<h3>3. Perilaku yang dilarang</h3>
<ul><li>Meminta uang, hadiah, atau informasi keuangan; penipuan, pelecehan, ancaman, ujaran kebencian.</li>
<li>Konten seksual/cabul; promosi komersial; penggunaan alat otomatis (bot).</li>
<li>Mengumpulkan data pengguna lain atau menyebarkan tangkapan layar tanpa izin.</li></ul>
<p>Pelanggaran dapat menyebabkan penangguhan atau penutupan akun tanpa pemberitahuan dan, bila perlu, pelaporan kepada pihak berwenang.</p>
<h3>4. Profil contoh dan profil tim</h3>
<p>Platform dapat menampilkan profil yang diberi label jelas "Profil contoh" dan bukan orang sungguhan. Profil ini tidak dapat disukai, dicocokkan, atau dikirimi pesan. Profil berlabel "Tim Nikah.App" adalah milik staf kami yang sesungguhnya.</p>
<h3>5. Verifikasi</h3>
<p>Verifikasi KTP/paspor dan selfie bersifat opsional dan dilakukan oleh penyedia independen Didit. Lencana verifikasi bukan jaminan identitas; pengguna harus selalu berhati-hati.</p>
<h3>6. Layanan konsultasi dan biaya</h3>
<ul><li>Paket konsultasi ditawarkan dengan harga yang tertera di aplikasi; harga mengikat saat pemesanan.</li>
<li>Konsultasi mencakup daftar dokumen, pra-tinjau, terjemahan, dan pendampingan proses resmi (termasuk pendaftaran KUA). Keputusan instansi pemerintah tidak dijamin.</li>
<li>Pembatalan sebelum pekerjaan dimulai: pengembalian penuh. Setelah dimulai: dikurangi pekerjaan yang selesai. Terjemahan dan apostille yang telah diserahkan tidak dapat dikembalikan.</li></ul>
<h3>7. Kekayaan intelektual</h3>
<p>Aplikasi, desain, dan konten adalah milik %{company}. Anda memberikan lisensi terbatas, global, bebas royalti atas konten yang Anda unggah untuk pengoperasian Layanan.</p>
<h3>8. Batasan tanggung jawab</h3>
<p>Layanan disediakan "sebagaimana adanya". %{company} tidak bertanggung jawab atas kerugian yang timbul dari komunikasi atau pertemuan antar pengguna. Dengan tunduk pada hukum yang berlaku, tanggung jawab dibatasi pada biaya yang dibayarkan dalam 12 bulan terakhir.</p>
<h3>9. Perubahan dan pengakhiran</h3>
<p>Syarat dapat diubah dengan pemberitahuan sebelumnya; penggunaan berkelanjutan berarti penerimaan. Anda dapat menghapus akun kapan saja.</p>
<h3>10. Hukum yang berlaku</h3>
<p>Hukum Republik Turki berlaku; pengadilan Ankara berwenang, tanpa mengurangi hak perlindungan konsumen yang bersifat memaksa di Indonesia (UU No. 8/1999).</p>`,
privacy:`
<p><b>Diperbarui:</b> %{version} · <b>Pengendali data:</b> %{company}, %{address} · %{email}</p>
<p>Kebijakan ini berlaku bagi pengguna di Turki (UU No. 6698/KVKK), Indonesia (UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi) dan UE (GDPR).</p>
<h3>1. Data yang kami kumpulkan</h3>
<ul><li><b>Akun:</b> email, telepon, kata sandi (ter-hash).</li>
<li><b>Profil:</b> nama, tanggal lahir, jenis kelamin, jenis kelamin yang dicari, negara/kota, bahasa, pekerjaan, pendidikan, bio, preferensi pernikahan/anak/keluarga/relokasi, jawaban kecocokan, foto.</li>
<li><b>Data pribadi spesifik (UU PDP Pasal 4 ayat 2):</b> karena sifat Layanan, dapat ditarik kesimpulan tentang keyakinan agama; data biometrik (wajah) diproses saat verifikasi identitas. Keduanya diproses <b>hanya dengan persetujuan eksplisit Anda</b>.</li>
<li><b>Penggunaan:</b> suka, lewati, kecocokan, isi pesan, laporan dan blokir, catatan panggilan (bukan isi), data perangkat dan IP, permintaan terjemahan.</li>
<li><b>Konsultasi:</b> kontak, negara, catatan, dokumen yang diunggah (paspor, akta kelahiran, dll.), status pembayaran (data kartu tidak pernah kami simpan).</li></ul>
<h3>2. Tujuan dan dasar pemrosesan (UU PDP Pasal 20)</h3>
<ul><li>Penyediaan Layanan, pencocokan, perpesanan — pelaksanaan perjanjian.</li>
<li>Keamanan, pencegahan penipuan, penanganan laporan — kepentingan sah dan kewajiban hukum.</li>
<li>Verifikasi identitas (biometrik) dan kesimpulan agama — persetujuan eksplisit.</li>
<li>Layanan konsultasi dan penagihan — perjanjian dan kewajiban hukum.</li>
<li>Terjemahan — perjanjian (teks pesan dikirim ke penyedia terjemahan).</li></ul>
<h3>3. Penerima data</h3>
<ul><li><b>Supabase</b> (basis data, autentikasi, penyimpanan; server di UE, Frankfurt).</li>
<li><b>Vercel</b> (hosting).</li>
<li><b>Didit</b> (verifikasi identitas dan selfie — gambar dokumen diproses oleh Didit dan tidak pernah kami simpan).</li>
<li><b>DeepL</b> (terjemahan), <b>Resend</b> (email), penyedia pembayaran (Stripe/iyzico — data kartu hanya pada mereka).</li>
<li>Instansi berwenang bila diwajibkan hukum.</li></ul>
<p>Kami tidak menjual atau membagikan data untuk iklan.</p>
<h3>4. Transfer ke luar negeri (UU PDP Pasal 56)</h3>
<p>Data disimpan di UE. Data pengguna Indonesia ditransfer ke Turki dan UE berdasarkan persetujuan eksplisit Anda dan/atau pengamanan yang memadai.</p>
<h3>5. Masa penyimpanan</h3>
<ul><li>Data akun: hingga akun dihapus; dihapus permanen dalam 30 hari setelah penghapusan.</li>
<li>Pesan: selama kecocokan berlangsung; dihapus saat akun dihapus (salinan pihak lain dianonimkan).</li>
<li>Laporan dan blokir: 2 tahun, untuk keamanan.</li>
<li>Dokumen konsultasi: 1 tahun setelah selesai; catatan faktur 10 tahun (hukum pajak Turki).</li>
<li>Hasil verifikasi: hingga akun dihapus; gambar dokumen tidak pernah disimpan.</li></ul>
<h3>6. Hak Anda (UU PDP Pasal 5-13)</h3>
<p>Akses, perbaikan, penghapusan, pembatasan, portabilitas, dan keberatan. Anda dapat menarik persetujuan kapan saja. Hubungi %{email}; kami menanggapi dalam 30 hari. Anda berhak mengadu kepada lembaga pelindungan data pribadi di Indonesia atau otoritas di Turki.</p>
<h3>7. Anak-anak</h3>
<p>Layanan tidak tersedia bagi siapa pun di bawah 18 tahun. Akun semacam itu dihapus.</p>
<h3>8. Cookie dan penyimpanan lokal</h3>
<p>Hanya penyimpanan lokal yang diperlukan untuk menjaga sesi dan preferensi. Tidak ada cookie pelacakan atau iklan.</p>`,
kvkk:`<p>Pemberitahuan ini diterbitkan berdasarkan UU Turki No. 6698 dan mengikat dalam bahasa Turki. <a href="/legal/kvkk" data-lang-doc="tr:kvkk">Baca teks bahasa Turki</a>. Ringkasan: %{company} adalah pengendali data; data pribadi diproses untuk menyediakan layanan perjodohan dan konsultasi; data spesifik (agama, biometrik) hanya dengan persetujuan eksplisit; data ditransfer ke luar negeri (hosting UE, Didit, DeepL, Resend, penyedia pembayaran) berdasarkan persetujuan; hak Anda dapat digunakan dengan menulis ke %{email}.</p>`,
consent:`
<p><b>Persetujuan eksplisit atas pemrosesan data pribadi spesifik (UU PDP Pasal 4, 20; KVKK Pasal 6; GDPR Pasal 9)</b></p>
<p>Saya telah membaca, memahami, dan <b>dengan bebas</b> menyetujui hal berikut:</p>
<h3>A. Keyakinan agama</h3>
<p>Karena Nikah.App adalah platform pernikahan Islami, keanggotaan saya dapat mengungkapkan kesimpulan tentang keyakinan agama saya. Saya menyetujui informasi ini diproses semata-mata untuk menyediakan layanan pencocokan.</p>
<h3>B. Data biometrik (hanya jika saya memulai verifikasi)</h3>
<p>Saya menyetujui foto dokumen identitas saya dan selfie langsung (biometrik wajah) diproses oleh pemroses <b>Didit</b> untuk keaslian dokumen, liveness, dan pencocokan wajah. Saya memahami gambar dokumen tidak disimpan di server %{company} dan hanya hasil, negara dokumen, serta kecocokan tanggal lahir yang dibagikan kepada %{company}.</p>
<h3>C. Transfer ke luar negeri</h3>
<p>Saya menyetujui data saya disimpan di luar Indonesia (UE – Frankfurt) dan ditransfer kepada penyedia layanan di atas.</p>
<h3>D. Penarikan persetujuan</h3>
<p>Saya dapat menarik persetujuan ini kapan saja melalui Pengaturan &gt; Privasi atau dengan menulis ke %{email}; setelah penarikan lencana verifikasi saya dihapus dan, jika persetujuan A ditarik, akun saya ditutup mengingat sifat platform. Penarikan tidak memengaruhi keabsahan pemrosesan sebelumnya.</p>`,
deletion:`
<h3>Menghapus akun</h3>
<p>Pengaturan &gt; "Hapus akun secara permanen". Berlaku seketika: profil, preferensi, suka, kecocokan, pesan, foto, hasil verifikasi, dan dokumen konsultasi dihapus. Pesan yang tersisa pada pihak yang pernah cocok dianonimkan ("Pengguna terhapus").</p>
<h3>Yang tetap disimpan</h3>
<ul><li>Catatan faktur dan pembayaran — 10 tahun (hukum pajak Turki).</li>
<li>Laporan dan blokir tentang Anda — 2 tahun (keamanan pengguna lain).</li>
<li>Log akses — 2 tahun (UU Turki No. 5651).</li></ul>
<h3>Meminta data Anda</h3>
<p>Kirim email ke %{email} dengan "permintaan portabilitas data"; ekspor dalam format JSON dikirim dalam 30 hari.</p>
<h3>Jika tidak dapat mengakses aplikasi</h3>
<p>Kirim email "hapus akun saya" dari alamat terdaftar ke %{email}; setelah konfirmasi identitas akun dihapus dalam 7 hari.</p>`
},
zh:{
_title:{terms:'使用条款',privacy:'隐私政策',kvkk:'KVKK 告知（土耳其）',consent:'明确同意',deletion:'账户删除与数据请求'},
_summary:`<p><b>摘要</b>（具有法律约束力的版本为英文；土耳其法律事项以土耳其文为准）。</p>
<ul><li>年满18岁方可使用；一人一账户；禁止虚假资料、索要钱财、骚扰、不当内容。</li>
<li>标有"示例资料"的卡片并非真人，无法点赞或发送消息；"Nikah.App 团队"为真实员工。</li>
<li>证件/自拍验证为可选，由独立服务商 Didit 处理；证件图像不会存储在我们的服务器。</li>
<li>宗教信仰推断与生物特征数据仅在您<b>明确同意</b>后处理；您可随时撤回。</li>
<li>数据托管于欧盟（法兰克福）；服务商：Supabase、Vercel、Didit、DeepL、Resend、支付服务商。不用于广告。</li>
<li>顾问套餐价格以应用内显示为准；开始服务前取消可全额退款。</li>
<li>您可随时删除账户（设置 → 删除账户）；发票记录依法保留10年。联系方式：%{email}。</li></ul>`
},
th:{
_title:{terms:'ข้อกำหนดการใช้งาน',privacy:'นโยบายความเป็นส่วนตัว',kvkk:'ประกาศ KVKK (ตุรกี)',consent:'ความยินยอมโดยชัดแจ้ง',deletion:'การลบบัญชีและคำขอข้อมูล'},
_summary:`<p><b>สรุป</b> (ฉบับที่มีผลผูกพันคือภาษาอังกฤษ; เรื่องตามกฎหมายตุรกีให้ยึดภาษาตุรกี)</p>
<ul><li>ต้องมีอายุ 18 ปีขึ้นไป หนึ่งคนหนึ่งบัญชี ห้ามข้อมูลเท็จ ขอเงิน คุกคาม หรือเนื้อหาไม่เหมาะสม</li>
<li>การ์ดที่ติดป้าย "โปรไฟล์ตัวอย่าง" ไม่ใช่คนจริง กดถูกใจหรือส่งข้อความไม่ได้ ส่วน "ทีม Nikah.App" คือพนักงานจริง</li>
<li>การยืนยันบัตร/เซลฟี่เป็นทางเลือก ดำเนินการโดย Didit ผู้ให้บริการอิสระ ภาพเอกสารไม่ถูกเก็บบนเซิร์ฟเวอร์ของเรา</li>
<li>ข้อมูลความเชื่อทางศาสนาและข้อมูลชีวมิติจะประมวลผลเมื่อคุณ<b>ยินยอมโดยชัดแจ้ง</b>เท่านั้น และถอนได้ทุกเมื่อ</li>
<li>ข้อมูลโฮสต์ในสหภาพยุโรป (แฟรงก์เฟิร์ต) ผู้ให้บริการ: Supabase, Vercel, Didit, DeepL, Resend, ผู้ให้บริการชำระเงิน ไม่ใช้เพื่อโฆษณา</li>
<li>ราคาแพ็กเกจที่ปรึกษาตามที่แสดงในแอป ยกเลิกก่อนเริ่มงานคืนเงินเต็มจำนวน</li>
<li>ลบบัญชีได้ทุกเมื่อ (ตั้งค่า → ลบบัญชี) บันทึกใบแจ้งหนี้เก็บ 10 ปีตามกฎหมาย ติดต่อ: %{email}</li></ul>`
}
};

function legalDoc(doc,lang){
 const cfg=(window.NIKAH_CONFIG||{}).legal||{};
 const vars={version:LEGAL_VERSION,company:cfg.companyName||'[ŞİRKET ÜNVANI / COMPANY NAME]',address:cfg.address||'[ADRES / ADDRESS]',email:cfg.email||'[E-POSTA / EMAIL]',mersis:cfg.mersis?`, MERSİS: ${cfg.mersis}`:''};
 const L=LEGAL[lang]||LEGAL.en;const title=(L._title&&L._title[doc])||LEGAL.en._title[doc]||doc;
 let body;
 if(L[doc])body=L[doc];
 else if(L._summary)body=L._summary+`<hr><h3>${LEGAL.en._title[doc]} (English)</h3>`+LEGAL.en[doc];
 else body=LEGAL.en[doc];
 for(const k of Object.keys(vars))body=body.split('%{'+k+'}').join(vars[k]);
 return {title,body};
}
