import { LanguageOption, PresetScript, VoiceOption, VoiceTone } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    id: 'Odia',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    sampleScript:
      'ପାରଳାଖେମୁଣ୍ଡିରେ ଏବେ ଉପଲବ୍ଧ ଗ୍ୟାଷ୍ଟ୍ରୋଏଣ୍ଟ୍ରୋଲୋଜି ଅର୍ଥାତ୍ ପେଟ ଏବଂ ଲିଭର ରୋଗ ବିଶେଷଜ୍ଞଙ୍କ ଉନ୍ନତ ପରାମର୍ଶ! ଦୀର୍ଘ ଦିନର ଗ୍ୟାସ, ଏସିଡିଟି କିମ୍ବା ପେଟ ବ୍ୟଥା ପାଇଁ ଆଜି ହିଁ ଅଭିଜ୍ଞ ବିଶେଷଜ୍ଞଙ୍କ ସହ ପରାମର୍ଶ କରନ୍ତୁ ଏବଂ ସୁସ୍ଥ ଜୀବନ ବଞ୍ଚନ୍ତୁ।',
    description: 'Authentic Eastern regional dialect with clear articulation',
  },
  {
    id: 'Hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    sampleScript:
      'परलाखेमुंडी में अब उपलब्ध है गैस्ट्रोएंटरोलॉजी यानी पेट और लिवर रोग विशेषज्ञ का उत्तम परामर्श! लगातार गैस, एसिडिटी या पेट दर्द की समस्या के लिए आज ही परामर्श बुक करें और स्वस्थ रहें।',
    description: 'Standard conversational & broadcasting Hindi delivery',
  },
  {
    id: 'Telugu',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    sampleScript:
      'పర్లాఖెముండి ప్రజలకు శుభవార్త! గ్యాస్ట్రోఎంటరాలజీ అనగా కడుపు మరియు కాలేయ వ్యాధుల నిపుణుల ప్రత్యేక చికిత్స ఇప్పుడు అందుబాటులో ఉంది. గ్యాస్, ఎసిడిటీ లేదా కడుపునొప్పి సమస్యలకు వెంటనే సంప్రదించండి!',
    description: 'Natural Andhra/Telangana regional broadcasting inflection',
  },
  {
    id: 'English',
    name: 'English',
    nativeName: 'English',
    sampleScript:
      'Special healthcare announcement for Paralakhemundi! Advanced consultation with top Gastroenterology and Liver disease specialists is now available locally. Book your specialist appointment today and prioritize your health!',
    description: 'Clear, articulate Indian-English broadcast delivery',
  },
];

export const VOICE_TONES: { id: VoiceTone; label: string; description: string }[] = [
  {
    id: 'Marketing / High Energy',
    label: 'Marketing / High Energy',
    description: 'Energetic, persuasive, and dynamic delivery for promotional announcements',
  },
  {
    id: 'Professional / Reassuring',
    label: 'Professional / Reassuring',
    description: 'Calm, authoritative, clear, and trustworthy medical and clinical delivery',
  },
  {
    id: 'Casual / Friendly',
    label: 'Casual / Friendly',
    description: 'Warm, relatable, conversational, and approachable everyday tone',
  },
];

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    label: 'Kore (Default Female - Energetic & Warm)',
    gender: 'female',
    description: 'Default female voice: energetic, warm, and natural for Odia, Telugu, Hindi, and English broadcasts',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    label: 'Zephyr (Alternative - Articulate & Reassuring)',
    gender: 'female',
    description: 'Alternative articulate voice: smooth, clear, and reassuring commercial healthcare delivery',
  },
];

export const PRESET_SCRIPTS: PresetScript[] = [
  // Odia Presets
  {
    id: 'odia-marketing',
    language: 'Odia',
    title: 'Gastroenterology Promotional Announcement',
    tone: 'Marketing / High Energy',
    scriptText:
      'ପାରଳାଖେମୁଣ୍ଡିରେ ଏବେ ଉପଲବ୍ଧ ଗ୍ୟାଷ୍ଟ୍ରୋଏଣ୍ଟ୍ରୋଲୋଜି ଅର୍ଥାତ୍ ପେଟ ଏବଂ ଲିଭର ରୋଗ ବିଶେଷଜ୍ଞଙ୍କ ଉନ୍ନତ ପରାମର୍ଶ! ଦୀର୍ଘ ଦିନର ଗ୍ୟାସ, ଏସିଡିଟି କିମ୍ବା ପେଟ ବ୍ୟଥା ପାଇଁ ଆଜି ହିଁ ଅଭିଜ୍ଞ ବିଶେଷଜ୍ଞଙ୍କ ସହ ପରାମର୍ଶ କରନ୍ତୁ ଏବଂ ସୁସ୍ଥ ଜୀବନ ବଞ୍ଚନ୍ତୁ।',
    englishTranslation:
      'Now available in Paralakhemundi: Advanced consultation with Gastroenterology and Liver disease specialists! Book your consultation today.',
    durationEstimate: '~12 sec',
  },
  {
    id: 'odia-reassuring',
    language: 'Odia',
    title: 'Clinical Consultation & Liver Care Advisory',
    tone: 'Professional / Reassuring',
    scriptText:
      'ନମସ୍କାର, ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ଆମର ପ୍ରାଥମିକତା। ପେଟ ରୋଗ, ହଜମ ସମସ୍ୟା କିମ୍ବା ଫ୍ୟାଟି ଲିଭରକୁ ଅଣଦେଖା କରନ୍ତୁ ନାହିଁ। ବିଶେଷଜ୍ଞ ଡାକ୍ତରଙ୍କ ସଠିକ୍ ପରାମର୍ଶ ନିଅନ୍ତୁ ଏବଂ ନିରୋଗ ରୁହନ୍ତୁ।',
    englishTranslation:
      'Greetings, your health is our priority. Do not ignore digestive issues or fatty liver. Seek expert consultation and stay healthy.',
    durationEstimate: '~10 sec',
  },
  {
    id: 'odia-friendly',
    language: 'Odia',
    title: 'Friendly Clinic Welcome & Camp Notice',
    tone: 'Casual / Friendly',
    scriptText:
      'ନମସ୍କାର ସାଙ୍ଗମାନେ! ଆମ ପାରଳାଖେମୁଣ୍ଡି କ୍ଲିନିକରେ ଆପଣଙ୍କ ପାଇଁ ସ୍ୱତନ୍ତ୍ର ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା ଶିବିର ଆୟୋଜନ କରାଯାଇଛି। ଆପଣଙ୍କ ସମ୍ପୂର୍ଣ୍ଣ ପରିବାର ପାଇଁ ଉତ୍ତମ ଚିକିତ୍ସା ସୁବିଧା ଏଠାରେ ଉପଲବ୍ଧ।',
    englishTranslation:
      'Hello friends! A special health checkup camp is organized at our Paralakhemundi clinic. High quality healthcare is available for your entire family.',
    durationEstimate: '~11 sec',
  },

  // Hindi Presets
  {
    id: 'hindi-marketing',
    language: 'Hindi',
    title: 'Specialist Clinic Promotional Announcement',
    tone: 'Marketing / High Energy',
    scriptText:
      'परलाखेमुंडी में अब उपलब्ध है गैस्ट्रोएंटरोलॉजी यानी पेट और लिवर रोग विशेषज्ञ का उत्तम परामर्श! लगातार गैस, एसिडिटी या पेट दर्द की समस्या के लिए आज ही परामर्श बुक करें और स्वस्थ रहें।',
    englishTranslation:
      'Now available in Paralakhemundi: Advanced consultation with Gastroenterology and Liver disease specialists! Book today.',
    durationEstimate: '~11 sec',
  },
  {
    id: 'hindi-reassuring',
    language: 'Hindi',
    title: 'Digestive & Liver Health Advisory',
    tone: 'Professional / Reassuring',
    scriptText:
      'नमस्ते, आपका स्वास्थ्य ही आपकी असली पूंजी है। यदि आप पेट की पुरानी समस्याओं या फैटी लिवर से परेशान हैं, तो आज ही योग्य विशेषज्ञ से संपर्क करें।',
    englishTranslation:
      'Greetings, your health is your greatest wealth. If you are troubled by chronic stomach issues or fatty liver, consult our specialist today.',
    durationEstimate: '~10 sec',
  },
  {
    id: 'hindi-friendly',
    language: 'Hindi',
    title: 'Community Health Camp Invitation',
    tone: 'Casual / Friendly',
    scriptText:
      'नमस्ते दोस्तों! परलाखेमुंडी में आपके और आपके पूरे परिवार के लिए विशेष स्वास्थ्य शिविर का आयोजन किया जा रहा है। अपनी सेहत की जांच करवाएं और खुशहाल रहें।',
    englishTranslation:
      'Hello friends! A special community health camp is being organized in Paralakhemundi for you and your family.',
    durationEstimate: '~10 sec',
  },

  // Telugu Presets
  {
    id: 'telugu-marketing',
    language: 'Telugu',
    title: 'Gastroenterology Broadcast Promo',
    tone: 'Marketing / High Energy',
    scriptText:
      'పర్లాఖెముండి ప్రజలకు శుభవార్త! గ్యాస్ట్రోఎంటరాలజీ అనగా కడుపు మరియు కాలేయ వ్యాధుల నిపుణుల ప్రత్యేక చికిత్స ఇప్పుడు అందుబాటులో ఉంది. గ్యాస్, ఎసిడిటీ లేదా కడుపునొప్పి సమస్యలకు వెంటనే సంప్రదించండి!',
    englishTranslation:
      'Good news for Paralakhemundi residents! Advanced Gastroenterology and Liver disease specialist consultation is now available. Contact us immediately!',
    durationEstimate: '~12 sec',
  },
  {
    id: 'telugu-reassuring',
    language: 'Telugu',
    title: 'Clinical Consultation Reassurance',
    tone: 'Professional / Reassuring',
    scriptText:
      'నమస్కారం, మీ ఆరోగ్యం మా బాధ్యత. దీర్ఘకాలిక జీర్ణక్రియ సమస్యలు మరియు కాలేయ వ్యాధులకు అనుభవజ్ఞులైన వైద్యుల ద్వారా సరైన చికిత్స తీసుకోండి.',
    englishTranslation:
      'Greetings, your health is our responsibility. Receive expert diagnosis and care for persistent digestive and liver ailments.',
    durationEstimate: '~11 sec',
  },
  {
    id: 'telugu-friendly',
    language: 'Telugu',
    title: 'Friendly Clinic Notice',
    tone: 'Casual / Friendly',
    scriptText:
      'హలో మిత్రులారా! పర్లాఖెముండిలో మీ కుటుంబ ఆరోగ్య సంరక్షణ కోసం ప్రత్యేక వైద్య శిబిరం ప్రారంభించబడింది. అందరూ సద్వినియోగం చేసుకోండి.',
    englishTranslation:
      'Hello friends! A special healthcare camp has begun in Paralakhemundi for your family care. Make good use of it.',
    durationEstimate: '~10 sec',
  },

  // English Presets
  {
    id: 'english-marketing',
    language: 'English',
    title: 'Healthcare Specialist Announcement',
    tone: 'Marketing / High Energy',
    scriptText:
      'Special healthcare announcement for Paralakhemundi! Advanced consultation with top Gastroenterology and Liver disease specialists is now available locally. Book your specialist appointment today and prioritize your health!',
    englishTranslation:
      'Special healthcare announcement for Paralakhemundi! Advanced consultation with top specialists is now available locally.',
    durationEstimate: '~11 sec',
  },
  {
    id: 'english-reassuring',
    language: 'English',
    title: 'Professional Medical Consultation Advisory',
    tone: 'Professional / Reassuring',
    scriptText:
      'Good health begins with early diagnosis. If you are experiencing persistent digestive distress, acidity, or liver concerns, schedule a comprehensive consultation with our senior medical specialist today.',
    englishTranslation:
      'Good health begins with early diagnosis. Schedule a comprehensive consultation with our senior medical specialist today.',
    durationEstimate: '~12 sec',
  },
  {
    id: 'english-friendly',
    language: 'English',
    title: 'Community Wellness Camp Welcome',
    tone: 'Casual / Friendly',
    scriptText:
      'Hello Paralakhemundi! We are excited to announce our upcoming community wellness clinic. Comprehensive health checkups, personalized dietary guidance, and expert medical consultations for your entire family.',
    englishTranslation:
      'Hello Paralakhemundi! We are excited to announce our upcoming community wellness clinic.',
    durationEstimate: '~11 sec',
  },
];
