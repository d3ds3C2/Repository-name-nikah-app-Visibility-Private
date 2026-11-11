# Nikah.App 5.5.0 — Durum

## Canlı
- Supabase projesi: `nikah-app` (Frankfurt). Şema: `supabase/schema-5.5.sql` — 18 tablo, tamamı RLS korumalı; RPC'ler, depolama bucket'ları, Realtime.
- `config.js` dolu: Supabase adresi + herkese açık (publishable) anahtar, şirket bilgileri, WhatsApp.
- Kayıt/giriş, profil, keşif, beğeni/eşleşme, mesajlaşma, engelleme/şikâyet, hesap silme, danışmanlık talebi + evrak yükleme.
- 12 etiketli örnek profil; kurucu üye (ilk 500) + %30 danışmanlık indirimi.
- 5 dil.

## Yayın öncesi yapılacaklar
- Supabase Auth → e-posta: varsayılan e-posta servisi yalnızca proje ekibine gönderir (saatte 2). Halka açılmadan önce özel SMTP (ör. Resend) bağlanmalı ve "Confirm signup" şablonuna `{{ .Token }}` eklenmeli; ya da test döneminde "Confirm email" kapatılmalı.
- Supabase Auth → URL Configuration → Site URL: yayın adresi.
- Ekip profili: kayıt olup onboarding'i tamamlayın, sonra SQL Editor'da `update public.profiles set kind='team' where id='<uuid>';`
- Hukuki metinler taslaktır; avukat kontrolü gerekir.

## Kapalı (sağlayıcı hesabı gerektirir)
- Kimlik/selfie doğrulama (Didit) — `config.js` → `verificationEnabled`
- Çevrimiçi ödeme (Stripe/iyzico) — `paymentsEnabled`
- Otomatik çeviri (DeepL) — `translationEnabled`
- Push bildirimleri, gerçek sesli/görüntülü arama, moderasyon paneli
