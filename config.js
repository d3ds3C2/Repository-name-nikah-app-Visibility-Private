// Nikah.App runtime configuration (public values only — never put a service-role key here).
// Leave supabaseUrl/supabaseAnonKey empty to run in demo mode (localStorage only).
window.NIKAH_CONFIG = {
  supabaseUrl: '',            // e.g. 'https://abcdefgh.supabase.co'
  supabaseAnonKey: '',        // the public anon key
  authChannel: 'email',       // 'email' | 'phone'  (phone needs an SMS provider in Supabase Auth)
  functionsBase: '',          // optional override; default is <supabaseUrl>/functions/v1
  translationEnabled: true,   // uses the `translate` edge function when live
  advisorWhatsApp: '',        // e.g. '+905xxxxxxxxx' — shown on the advisory page when set
  advisorEmail: '',           // e.g. 'info@ivogsan.com'
  legal: {                    // shown in Terms / Privacy / KVKK texts
    companyName: '',          // legal entity, e.g. 'İVOGSAN Tercüme Grup Ltd. Şti.'
    address: '',
    email: '',                // privacy / data requests
    mersis: ''
  }
};
