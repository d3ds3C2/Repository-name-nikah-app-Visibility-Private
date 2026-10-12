# Supabase kurulumu — Nikah.App 5.1.0

## 1. Şema
Yeni proje aç → SQL Editor → sırayla `schema.sql`, `migration-5.2-showcase.sql`, `seed-showcase.sql`, `migration-5.3-verification.sql`, `migration-5.4-legal-photos.sql` → Run.
Ekip hesabı: kendi hesabınla kayıt ol, onboarding'i tamamla, sonra `update public.profiles set kind='team' where id='<uuid>';`
Oluşanlar: tablolar, RLS politikaları, RPC'ler (`discover_candidates`, `like_profile`, `my_matches`, `block_user`, `delete_my_account`),
`profile-photos` ve `advisory-docs` bucket'ları, Realtime yayını.

## 2. Auth
- Authentication → Providers → Email: açık. "Confirm email" açık.
- Authentication → Email Templates → **Confirm signup** şablonuna `{{ .Token }}` ekleyin; uygulama 6 haneli kod bekler
  (bağlantı yerine kod). Örnek: `Doğrulama kodunuz: {{ .Token }}`
- Telefon ile kayıt istiyorsanız: Providers → Phone (Twilio/MessageBird/Vonage) → `config.js` → `authChannel:'phone'`.
- URL Configuration → Site URL: Vercel domaininiz. Redirect URL'lere `https://<domain>/reset` ekleyin.

## 3. Ön yüz yapılandırması
`config.js`:
```js
supabaseUrl: 'https://xxxx.supabase.co',
supabaseAnonKey: 'eyJ...',           // Settings → API → anon public
advisorEmail: 'info@ivogsan.com',
advisorWhatsApp: '+90...'
```
Service role key **asla** ön yüze konmaz.

## 4. Edge Functions
```
supabase login
supabase link --project-ref <ref>
supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_... SITE_URL=https://<domain>
supabase secrets set RESEND_API_KEY=re_... ADVISOR_EMAIL=info@ivogsan.com FROM_EMAIL="Nikah.App <noreply@<domain>>" WEBHOOK_SECRET=<rastgele-uzun-string>
supabase secrets set DEEPL_API_KEY=... ALLOWED_ORIGIN=https://<domain>
supabase functions deploy create-checkout
supabase functions deploy translate
supabase functions deploy verify-start
supabase functions deploy didit-webhook --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy advisory-notify --no-verify-jwt
```

## 5. Webhooks
- **Stripe**: Developers → Webhooks → endpoint `https://<ref>.supabase.co/functions/v1/stripe-webhook`,
  olaylar: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
- **Supabase → danışman e-postası**: Database → Webhooks → Create: tablo `advisory_requests`, olaylar INSERT + UPDATE,
  tür HTTP Request, URL `https://<ref>.supabase.co/functions/v1/advisory-notify`,
  header `Authorization: Bearer <WEBHOOK_SECRET>`.

## 6. Didit (selfie + kimlik doğrulama, ücretsiz katman)
1. business.didit.me → hesap aç (iş e-postası; kart istemez).
2. Workflows → Create New → şablon **KYC** → bloklar: ID Verification (OCR) + Liveness (Passive) + Face Match. AML'yi kapatın (ücretli, evlilik uygulamasında gereksiz). Kaydet → `workflow_id` kopyala.
3. API & Webhooks → API Key kopyala. Add destination: URL `https://<ref>.supabase.co/functions/v1/didit-webhook`, version **v3**, events `status.updated` + `data.updated`. Dönen `secret_shared_key`'i hemen kaydet (bir daha gösterilmez).
4. `supabase secrets set DIDIT_API_KEY=... DIDIT_WORKFLOW_ID=... DIDIT_WEBHOOK_SECRET=...` ve iki fonksiyonu deploy et.
5. Didit konsolunda **Try Webhook → approved_full_features** gönder; fonksiyon test başlığını görüp `{ok:true,test:true}` döner. Sonra gerçek bir doğrulama yap: Profil → Doğrulamayı başlat.
6. Sonuç `verifications` tablosuna düşer; `verification_sessions.decision_summary`'de uyarı kodları (örn. DOCUMENT_EXPIRED) görünür. Doğum tarihi uyuşmazlığında `last_status` "DOB mismatch — manual review" olur; Didit konsolundan belgeye bakıp elle `selfie_verified/identity_verified=true` yapabilirsiniz.

Fiyat notu: 1 Kasım 2026'dan itibaren ücretsiz katman ayda 10 $ kredi (~30 doğrulama). İlk aylar için yeter; aşarsanız 0,33 $/doğrulama, aylık ücret yok.

## 6b. Eski not
Seçilen sağlayıcının (Veriff/Onfido/Sumsub) callback'ini alan bir edge function yazın; service role ile
`update public.verifications set selfie_verified=true, identity_verified=true, provider=..., provider_ref=... where user_id=...`.
İstemcinin bu tabloya yazma yetkisi yoktur (bilinçli).

## 7. Danışman tarafı
Talepler Supabase Dashboard → Table Editor → `advisory_requests` üzerinden görülür; evraklar Storage → `advisory-docs/<user_id>/<request_id>/`.
Durumu `in_progress` / `completed` olarak elle güncelleyin; UPDATE webhook'u kullanıcıya bildirim için genişletilebilir.

## Güvenlik notları
- `profiles` yalnızca sahibi ve aktif eşleştiği kişi tarafından okunur.
- Keşifte doğum tarihi değil yaş döner.
- Fiyat ve talep durumu istemciden alınmaz; trigger ve edge function belirler.
- Beğeni/eşleşme/engelleme yalnızca `security definer` RPC'lerle yazılır.
