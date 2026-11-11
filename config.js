// Nikah.App runtime configuration (public values only — never put a service-role key here).
// Leave supabaseUrl/supabaseAnonKey empty to run in demo mode (localStorage only).
window.NIKAH_CONFIG = {
  supabaseUrl: "https://qxixbwhzxsnkfnunnesf.supabase.co",            // e.g. 'https://abcdefgh.supabase.co'
  supabaseAnonKey: "sb_publishable_M8VpB5LE8zVPVBgIR5ZbTA_tMGvtQdL", // publishable key — public by design
  authChannel: 'email',       // 'email' | 'phone'  (phone needs an SMS provider in Supabase Auth)
  functionsBase: '',          // optional override; default is <supabaseUrl>/functions/v1
  translationEnabled: false,  // true once the `translate` edge function + DeepL key are live
  advisorWhatsApp: '+90 554 293 9155',        // e.g. '+905xxxxxxxxx' — shown on the advisory page when set
  advisorEmail: '',           // e.g. 'info@ivogsan.com'
  paymentsEnabled: false,     // true once the `create-checkout` edge function + payment provider are live
  verificationEnabled: false, // true once the `verify-start` edge function + Didit are live
  legal: {                    // shown in Terms / Privacy / KVKK texts
    companyName: "Lion Translate Tercüme Danışmanlık Bilişim Ticaret Limited Şirketi",          // legal entity, e.g. 'İVOGSAN Tercüme Grup Ltd. Şti.'
    address: "İvedikosb Mah. 1392 Cad. No: 1 İç Kapı No: 27 Yenimahalle / Ankara",
    email: "yalciner4@gmail.com",                // privacy / data requests
    mersis: "0608166760100001 · Ankara Ticaret Sicil No: 495379"
  }
};
