# Nikah.App 5.4.0 — Backend-connected + launch kit + ID verification + legal

5.0.1 "production hardened" paketi yalnızca bir ön yüz demosuydu. 5.1.0 ile uygulama **gerçek bir backend'e bağlanıyor**
ve ilk gelir modülü (uluslararası evlilik danışmanlığı + ödeme) eklendi.

## Bu sürümde ne değişti

### (a) Mantık ve güvenlik düzeltmeleri
- **Cinsiyet filtresi** artık çalışıyor: `seeking` hem istemcide (`eligibleProfile`) hem sunucuda (`discover_candidates()`) iki yönlü uygulanıyor. Demo verisine 3 erkek profil eklendi.
- **RLS açığı kapatıldı**: doğrulama bayrakları (`selfie_verified`, `identity_verified`, `phone_verified`) `profiles` tablosundan çıkarılıp istemcinin **yalnızca okuyabildiği** `verifications` tablosuna taşındı. Kullanıcı artık kendini "doğrulanmış" yapamaz.
- **Profil okuma kısıtlandı**: `profiles` herkese açık değil; keşif `discover_candidates()` RPC'si üzerinden gider, `birth_date` yerine hesaplanmış `age` döner, engellenen kullanıcılar iki yönlü gizlenir.
- Eşleşme sunucuda oluşur (`like_profile()`), engelleme eşleşmeyi kapatır (`block_user()`), hesap silme gerçek (`delete_my_account()`).
- Giriş artık şifreyi gerçekten doğrular (Supabase Auth); OTP demo kodu yalnızca demo modunda.

### (b) Supabase entegrasyonu
- `api.js` — tek arayüz, iki uygulama: `DemoApi` (backend yok) ve `SupabaseApi` (Auth + Postgres/RLS + Storage + Realtime + Edge Functions).
- `config.js` boşsa uygulama **demo modunda** çalışır ve ekranın üstünde sarı bant gösterir. Doldurulunca canlıya geçer; kod değişikliği gerekmez.
- Gerçek zamanlı mesajlaşma (Realtime), fotoğraf yükleme (özel bucket + imzalı URL), profil/tercih/ayar senkronu, DeepL ile profil ve mesaj çevirisi (`translate` edge function).
- URL yönlendirmesi: `/discover`, `/matches`, `/chat/<id>`, `/marriage` … geri tuşu ve derin link çalışır.

### (c) Danışmanlık / gelir modülü
- Paketler (`advisory_packages`) sunucuda fiyatlanır; istemciden fiyat gelmez.
- Talep → `advisory_requests` (durum: `awaiting_payment` → `paid` → `in_progress` → `completed`).
- Ödeme: `create-checkout` edge function Stripe Checkout oturumu açar, `stripe-webhook` ödemeyi onaylar.
- Evrak yükleme: `advisory-docs` özel bucket, yalnızca sahibi ve danışman (service role) görür.
- Bildirim: `advisory-notify` edge function (Database Webhook ile tetiklenir) yeni talep ve ödeme alındığında danışmana e-posta atar (Resend).

### (d) Lansman kiti — boş uygulama sorunu, yalan söylemeden
- **Vitrin profilleri** (`showcase_profiles`, 12 adet, 5 dil): tam görünümlü ama köşede "Örnek profil" rozeti; beğenilemez, eşleşmez, mesaj gidemez. Beğenince bilgilendirme + kurucu üye indirimi mesajı çıkar. Keşif sırası: gerçek üye → ekip → vitrin.
- **Ekip profilleri** (`profiles.kind='team'`): gerçek hesaplar, "Nikah.App ekibi" rozetli, beğeniyi otomatik kabul eder → ilk kullanıcılar gerçek biriyle konuşur, danışmanlık satışının doğal kapısı. Bir hesabı ekip yapmak: `update profiles set kind='team' where id=...`.
- **Kurucu üye**: ilk 500 tamamlanmış profil (ayar: `app_settings.founder_limit`) otomatik kurucu olur; danışmanlık paketlerinde %30 indirim sunucuda uygulanır (`founder_discount_pct`). Profilde rozet, paketlerde üstü çizili fiyat.
- **Topluluk sayaçları** (`community_stats()`): yalnızca gerçek toplamlar — üye, bu hafta yeni, doğrulanmış, ekip, örnek profil, kalan kurucu kontenjanı. Sıfırken "Topluluk yeni açılıyor" der; sayı uydurmaz.
- `kind` ve `founder` alanlarını istemci değiştiremez (trigger ile korunur).

### (e) Selfie + kimlik doğrulama — Didit (ücretsiz katman)
- Akış: kullanıcı **onay kutusunu** işaretler (biyometrik veri rızası, KVKK / Endonezya UU PDP) → `verify-start` edge function Didit oturumu açar → kullanıcı Didit'in barındırılan ekranında belge + selfie çeker → Didit `didit-webhook`'a imzalı sonuç yollar → `verifications` tablosu service role ile güncellenir.
- Belge görüntüsü ve belge numarası Nikah.App'te **saklanmaz**; yalnızca sonuç, belge ülkesi ve doğum tarihi eşleşmesi tutulur. Doğum tarihi profille uyuşmazsa otomatik onay verilmez, "inceleniyor" olur.
- İmza doğrulama `X-Signature-V2` (kanonik JSON HMAC) + 5 dk zaman damgası + `event_id` ile tekrar koruması.
- Ücret: Didit'te 1 Kasım 2026'ya kadar ayda 500 doğrulama ücretsiz; sonrasında ayda **10 $ ücretsiz kredi (~30 tam doğrulama)**, fazlası 0,33 $/doğrulama, aylık ücret veya taahhüt yok. Sandbox sınırsız ücretsiz.

### (f) Hukuki metinler ve fotoğraflar
- `legal.js`: Kullanım Koşulları, Gizlilik Politikası (KVKK + Endonezya UU PDP 27/2022 + GDPR), KVKK Aydınlatma Metni, Açık Rıza (din çıkarımı + biyometrik + yurt dışı aktarım), Hesap Silme/Veri Talepleri. TR / EN / ID tam metin; ZH / TH özet + İngilizce bağlayıcı metin. `/legal/<belge>` rotaları; giriş sayfası, onboarding, ayarlar ve doğrulama penceresinden bağlantılı.
- Onboarding son adımda **ayrı açık rıza kutusu** eklendi (özel nitelikli veri). Kabul edilen sürüm ve zaman (`legal_version`, `legal_accepted_at`, `consent_special_data`) kaydediliyor.
- Şirket bilgileri `config.js → legal` alanından doldurulur; boşsa metinlerde köşeli parantezli yer tutucular görünür — **canlıya almadan doldurun ve bir avukata okutun.** Bunlar taslaktır, hukuki görüş değildir.
- Profil kartları artık fotoğraf gösteriyor; "fotoğraf gizliliği" açık olan üyelerin fotoğrafı eşleşene kadar bulanık. 12 vitrin + 2 ekip profili için `assets/showcase/*.svg` **illüstrasyon** avatarları (gerçek kişi fotoğrafı değil; "ILLUSTRATION" filigranlı — etiketli örnek profil mantığıyla tutarlı). İstenirse lisanslı stok/AI portreyle değiştirilebilir.

## Dosyalar
```
index.html            kabuk
config.js             PUBLIC yapılandırma (Supabase URL + anon key, danışman iletişim)
i18n.js               5 dil sözlükleri (L / NX / AX)
api.js                veri katmanı (Demo + Supabase)
app.js                görünümler ve olaylar
vendor/supabase.js    supabase-js 2.x UMD (CSP script-src 'self' için yerel kopya)
supabase/schema.sql   tam şema + RLS + RPC + storage politikaları
supabase/migration-5.2-showcase.sql  vitrin/ekip/kurucu/sayaç eklentisi (schema.sql sonrası)
supabase/seed-showcase.sql           12 vitrin profili
supabase/migration-5.3-verification.sql  doğrulama oturumları + webhook idempotency
supabase/functions/verify-start, didit-webhook
supabase/migration-5.4-legal-photos.sql  rıza alanları, fotoğraf gizliliği, vitrin fotoğrafları
legal.js              hukuki metinler (TR/EN/ID tam, ZH/TH özet)
assets/showcase/      14 illüstrasyon avatar
supabase/functions/   create-checkout, stripe-webhook, advisory-notify, translate
supabase/README.md    kurulum adımları
```

## Canlıya alma (özet — ayrıntı için supabase/README.md)
1. Yeni Supabase projesi → SQL Editor → sırayla `supabase/schema.sql`, `supabase/migration-5.2-showcase.sql`, `supabase/seed-showcase.sql`, `supabase/migration-5.3-verification.sql`, `supabase/migration-5.4-legal-photos.sql` çalıştır.
2. Auth → Email: "Confirm email" açık, e-posta şablonuna `{{ .Token }}` ekle (6 haneli kod). İsteğe bağlı: Phone provider (Twilio/MessageBird) → `config.js` içinde `authChannel:'phone'`.
3. `config.js` → `supabaseUrl`, `supabaseAnonKey`, `advisorEmail`, `advisorWhatsApp`.
4. Edge function'ları deploy et ve secret'ları gir (Stripe, Resend, DeepL).
5. Dashboard → Database → Webhooks → `advisory_requests` INSERT/UPDATE → `advisory-notify`.
6. Stripe Dashboard → Webhook → `<project>.functions.supabase.co/stripe-webhook` → `checkout.session.completed`.
7. Vercel'e deploy (vercel.json hazır).

## Hâlâ bağlanması gereken dış servisler
- Push bildirimleri.
- Gerçek sesli/görüntülü arama (LiveKit / Daily / Twilio). Arama kayıtları `call_logs` tablosuna düşüyor, RTC bağlı değil.
- Moderasyon paneli (Supabase Dashboard ile başlanabilir).
- Türkiye tüzel kişiliğiyle tahsilat için iyzico/PayTR: `create-checkout` fonksiyonu sağlayıcıya göre değiştirilir; tablo yapısı (`payments.provider`) hazır.

## Fiyatlar
`advisory_packages` tablosundaki değerler **yer tutucu** (149 / 399 / 899 USD). Tek yerden değiştirilir, ön yüz tablodan okur.
