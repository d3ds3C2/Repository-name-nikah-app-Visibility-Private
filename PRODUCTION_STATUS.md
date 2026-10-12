# Nikah.App 5.4.0 — Durum

## Hazır (kodda)
- Supabase Auth (e-posta/şifre + OTP, telefon opsiyonel), profil/tercih/ayar senkronu
- Sunucu taraflı keşif (cinsiyet iki yönlü, yaş, niyet, çocuk, bölge, doğrulanmış, engel, geçilen, beğenilen)
- Sunucu taraflı eşleşme, gerçek zamanlı mesajlaşma, engelleme/şikâyet, hesap silme
- Fotoğraf yükleme (özel bucket, imzalı URL)
- Danışmanlık modülü: paketler, talep, Stripe Checkout, webhook ile ödeme onayı, evrak yükleme, danışmana e-posta
- DeepL çeviri (profil + mesaj)
- URL yönlendirme, demo modu bandı, klavye ile erişilebilir switch'ler, reduced-motion
- Hukuki metinler (TR/EN/ID; ZH/TH özet) + açık rıza kaydı — TASLAK, avukat kontrolü gerekir
- Profil fotoğrafları kartlarda, eşleşene kadar bulanıklaştırma; vitrin illüstrasyon avatarları
- Selfie + kimlik doğrulama (Didit, rıza akışı, webhook imza doğrulama, DOB çapraz kontrol)
- Lansman kiti: etiketli vitrin profilleri (12), ekip profilleri (oto-eşleşme), kurucu üye + indirim, gerçek topluluk sayaçları
- 5 dil (yeni 70+ anahtar dâhil, kapsama %100)

## Yapılandırma gerektirir
- config.js (Supabase URL/anon key, legal: şirket ünvanı/adres/e-posta)
- Edge function secret'ları (Stripe, Resend, DeepL, Didit)
- Supabase e-posta şablonu ({{ .Token }})

## Henüz bağlı değil
- Push bildirimleri
- Gerçek RTC (sesli/görüntülü)
- iyzico/PayTR (Türkiye tüzel kişiliği için Stripe yerine)
- Moderasyon paneli (Dashboard ile idare edilir)
