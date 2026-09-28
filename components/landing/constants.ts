import { Search, MapPin, Pill, Store, Bell, MessageSquare, Truck, Heart, Users, Shield, Activity, HelpCircle, Phone, Mail, Globe, BookOpen, FileText, HeadphonesIcon, Settings, Building, Target, Award, Zap } from 'lucide-react';

export const translations = {
  en: {
    nav: {
      about: "About",
      features: "Features",
      benefits: "Benefits",
      testimonials: "Testimonials",
      faq: "FAQ",
      contact: "Contact",
      countryName: "Cameroon",
      signIn: "Sign In",
      joinAsPharmacy: "Join as Pharmacy",
      joinAsPharmacyShort: "Pharmacies",
      healthAuthority: "MINSANTÉ / ONPC",
      healthAuthorityTitle: "National Health Authority Portal (MINSANTÉ & ONPC)",
      switchLang: "Passer au Français"
    },
    hero: {
      badge: "🇨🇲 Proudly Serving Cameroon",
      titlePart1: "Find Medicines",
      titleGradient: "Across Cameroon",
      description: "Connect with verified pharmacies, locate essential medicines, and access healthcare services throughout Cameroon. Your health, our priority.",
      ctaPatient: "Get Started as Patient",
      ctaPharmacy: "Join as Pharmacy",
      citiesCovered: "Cities Covered",
      quickCards: [
        { title: "Find Medicines", desc: "Search across verified pharmacies" },
        { title: "Locate Pharmacies", desc: "Find nearest available stock" },
        { title: "Connect Direct", desc: "Talk to pharmacists directly" },
        { title: "Real-time Stock", desc: "Live inventory updates" }
      ],
      demoTitle: "Try searching for a medicine",
      demoPlaceholder: "e.g., Paracetamol, Amoxicillin, Coartem...",
      demoButton: "Search",
      demoSubtitle: "Sign in to search across 150+ verified pharmacies"
    },
    statsSection: {
      title: "Trusted Across Cameroon",
      subtitle: "Join thousands of patients and hundreds of pharmacies already using MediConnect"
    },
    stats: {
      pharmacies: "Verified Pharmacies",
      medicines: "Medicines Available",
      patients: "Happy Patients",
      service: "Service Available",
      cities: "Cities Covered",
      pharmaciesSub: "Across all 10 regions",
      medicinesSub: "Including rare medications",
      patientsSub: "And growing daily",
      serviceSub: "Round-the-clock support",
    },
    about: {
      title: "About MediConnect",
      description: "We're revolutionizing healthcare access in Cameroon by connecting patients with pharmacies and ensuring essential medicines are always within reach.",
      points: [
        {
          title: "Our Mission",
          description: "To bridge the gap between patients and pharmacies in Cameroon, ensuring everyone has access to essential medicines regardless of their location."
        },
        {
          title: "Our Vision",
          description: "A Cameroon where no one suffers from lack of access to medicines, where healthcare is digitized, efficient, and accessible to all."
        },
        {
          title: "Our Impact",
          description: "Connecting thousands of patients with verified pharmacies, reducing medicine shortages, and improving healthcare outcomes across the country."
        }
      ],
      commitmentTitle: "Our Commitment to Cameroon",
      commitmentDescription: "MediConnect was born from the vision of a healthier Cameroon where geography and resources don't determine access to essential medicines. We're committed to supporting the healthcare ecosystem by empowering both patients and pharmacies with technology.",
      tag1: "Proudly Cameroonian",
      tag2: "Healthcare Innovation",
      tag3: "Digital Transformation",
    },
    features: {
      title: "Powerful Features for Healthcare Access",
      description: "Discover how MediConnect's advanced features make finding and accessing medicines easier than ever.",
      getStarted: "Get Started Now",
      items: [
        {
          title: "Smart Medicine Search",
          description: "Find medicines instantly with our intelligent search that shows real-time availability across Cameroon.",
          benefits: ["Real-time inventory updates", "Price comparison", "Alternative generic suggestions", "Stock arrival notifications"]
        },
        {
          title: "Pharmacy Location",
          description: "Locate nearby pharmacies with GPS integration, opening hours, and direct contact information.",
          benefits: ["GPS-powered search", "Opening hours display", "Contact information", "Directions integration"]
        },
        {
          title: "Verified Pharmacies",
          description: "All pharmacies are verified by health authorities ensuring authentic medicines and professional service.",
          benefits: ["Government verified (MINSANTÉ)", "Licensed pharmacists (ONPC)", "Quality assurance", "Professional standards"]
        },
        {
          title: "Direct Communication",
          description: "Connect directly with pharmacists for consultations, availability checks, and health guidance.",
          benefits: ["Real-time chat", "Professional consultations", "Health advice", "Prescription assistance"]
        }
      ]
    },
    benefits: {
      title: "Benefits for Everyone",
      description: "Whether you're a patient or pharmacy, MediConnect provides exceptional value",
      items: [
        {
          title: "For Patients",
          points: [
            "Find medicines quickly without wasted trips",
            "Compare prices across verified pharmacies",
            "Get health tips and medication guidance",
            "Set up stock restock notifications",
            "Connect directly with licensed pharmacists"
          ]
        },
        {
          title: "For Pharmacies",
          points: [
            "Increase visibility and patient footfall",
            "Manage inventory and batch stocks efficiently",
            "Communicate directly with patients digitally",
            "Receive epidemiological demand analytics",
            "Grow your healthcare business securely"
          ]
        }
      ],
      ctaTitle: "Ready to Transform Healthcare Access?",
      ctaDescription: "Join thousands of satisfied users who trust MediConnect for their healthcare needs.",
      ctaPatient: "Start as Patient",
      ctaPharmacy: "Join as Partner Pharmacy",
    },
    faq: {
      title: "Frequently Asked Questions",
      description: "Get answers to common questions about MediConnect",
      stillHaveQuestions: "Still have questions?",
      contactSupport: "Contact Support",
      items: [
        {
          question: "How do I find medicines in my area?",
          answer: "Simply use our search feature to find any medicine. Our system will show you all nearby pharmacies that have it in stock, along with prices and contact information. You can also set up notifications to be alerted when medicines become available."
        },
        {
          question: "Are all pharmacies on the platform verified?",
          answer: "Yes, all pharmacies undergo thorough verification by Cameroon health authorities (MINSANTÉ and ONPC) before being listed on our platform. We check licenses, certifications, and conduct regular audits to ensure quality and authenticity."
        },
        {
          question: "Is the service available in French?",
          answer: "Yes, MediConnect supports both English and French to serve all Cameroonians comfortably. You can switch languages at any time in your settings or at the top of the page."
        },
        {
          question: "How do I know if a medicine is authentic?",
          answer: "All medicines sold through verified pharmacies on our platform are sourced from authorized distributors regulated by the Ministry of Public Health. We track batch numbers and certification numbers to ensure full traceability."
        },
        {
          question: "What if I need emergency medicines?",
          answer: "Our platform includes an emergency pharmacy locator that shows 24-hour on-duty pharmacies and emergency medical services in your area. You can also view national emergency contacts (112, SAMU 8022)."
        },
        {
          question: "How much does MediConnect cost to use?",
          answer: "MediConnect is completely free for patients to use. Pharmacies pay a modest subscription fee to be listed on our platform, which helps us maintain the service, digital inventory sync, and quality standards."
        },
        {
          question: "Can I get health advice through the platform?",
          answer: "Yes, our verified pharmacists provide health consultations and medication guidance. However, for serious health emergencies, we always recommend consulting with a doctor or visiting an accredited healthcare facility."
        },
        {
          question: "How do you ensure patient privacy?",
          answer: "We take privacy seriously and comply with all Cameroonian data protection laws. Your personal health information is encrypted and never shared without your explicit consent."
        }
      ]
    },
    contact: {
      title: "Get in Touch",
      subtitle: "Have questions or need support? We're here to help you.",
      infoTitle: "Contact Information",
      phoneTitle: "Phone Support",
      phoneHours: "Monday - Friday, 8AM - 6PM",
      emailTitle: "Email Support",
      emailSubtitle: "We respond within 24 hours",
      officeTitle: "Office Locations",
      officeLocations: "Douala & Yaoundé",
      officeSub: "Serving all 10 regions of Cameroon",
      emergencyTitle: "Emergency Contacts",
      emergencySub: "For Medical Emergencies:",
      emergencyServices: "Call Emergency Services: 112",
      ambulanceService: "Ambulance Service (SAMU): 8022",
      formTitle: "Send us a Message",
      nameLabel: "Full Name",
      namePlaceholder: "Enter your full name",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email address",
      phoneLabel: "Phone Number",
      phonePlaceholder: "Enter your phone number",
      messageLabel: "Message",
      messagePlaceholder: "How can we help you?",
      submitButton: "Send Message",
      successToast: "Thank you for your message! We will get back to you within 24 hours."
    },
    footer: {
      tagline: "Connecting Cameroon to better healthcare, one medication at a time.",
      patientsTitle: "For Patients",
      pharmaciesTitle: "For Pharmacies",
      supportTitle: "Support",
      patientsLinks: [
        { label: "Find Medicines", href: "#features" },
        { label: "Locate Pharmacies", href: "#features" },
        { label: "Health Tips", href: "#benefits" },
        { label: "Emergency Contacts", href: "#contact" }
      ],
      pharmaciesLinks: [
        { label: "Join Platform", href: "#contact" },
        { label: "Manage Inventory", href: "#features" },
        { label: "Customer Communication", href: "#features" },
        { label: "Business Analytics", href: "#benefits" }
      ],
      supportLinks: [
        { label: "Help Center", href: "#faq" },
        { label: "Contact Support", href: "#contact" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" }
      ],
      copyright: "© 2026 MediConnect Cameroon. All rights reserved."
    },
    chatbot: {
      headerTitle: "MediBot",
      headerSubtitle: "Healthcare Assistant",
      inputPlaceholder: "Type your health inquiry...",
      initialGreeting: "Hello! I'm MediBot, your healthcare assistant. How can I help you find medicines or pharmacies today?",
      responses: [
        "I can help you search for medicines, find nearby pharmacies, check availability, and answer questions about our services.",
        "Would you like me to help you find a specific medicine or locate pharmacies in your area?",
        "For emergency situations, I recommend contacting your nearest hospital or calling emergency services immediately (112 / SAMU 8022).",
        "All pharmacies on MediConnect are verified by Cameroon health authorities (MINSANTÉ/ONPC) for your safety and peace of mind.",
        "You can set up notifications to be alerted when specific medicines become available at nearby pharmacies.",
        "I can connect you with verified pharmacists for professional health consultations through our platform."
      ]
    },
    testimonials: [
      {
        name: "Marie Ngozi",
        location: "Douala",
        role: "Patient",
        avatar: "MN",
        text: "MediConnect has made finding medications so much easier. I can check availability before traveling to the pharmacy.",
        rating: 5
      },
      {
        name: "Dr. Paul Mballa",
        location: "Yaoundé", 
        role: "Pharmacy Owner",
        avatar: "PM",
        text: "Our pharmacy has seen increased efficiency since using MediConnect. Patient communication has improved significantly.",
        rating: 5
      },
      {
        name: "Fatima Hassan",
        location: "Bamenda",
        role: "Patient", 
        avatar: "FH",
        text: "As a parent, being able to quickly find children's medications during emergencies has been invaluable.",
        rating: 5
      },
      {
        name: "Pharmacie Centrale",
        location: "Garoua",
        role: "Pharmacy",
        avatar: "PC", 
        text: "The inventory management system helps us serve our community better by keeping track of essential medications.",
        rating: 5
      },
      {
        name: "Jean-Claude Fotso",
        location: "Bafoussam",
        role: "Patient",
        avatar: "JF",
        text: "The health tips section has been incredibly helpful for managing my chronic condition. Thank you MediConnect!",
        rating: 5
      },
      {
        name: "Pharmacie du Nord",
        location: "Maroua",
        role: "Pharmacy",
        avatar: "PN",
        text: "Since joining MediConnect, we've been able to reach more patients and better serve our community's healthcare needs.",
        rating: 5
      }
    ],
  },

  fr: {
    nav: {
      about: "À Propos",
      features: "Fonctionnalités",
      benefits: "Avantages",
      testimonials: "Témoignages",
      faq: "FAQ",
      contact: "Contact",
      countryName: "Cameroun",
      signIn: "Se Connecter",
      joinAsPharmacy: "Rejoindre comme Pharmacie",
      joinAsPharmacyShort: "Pharmacies",
      healthAuthority: "MINSANTÉ / ONPC",
      healthAuthorityTitle: "Portail Régulateur MINSANTÉ & ONPC",
      switchLang: "Switch to English"
    },
    hero: {
      badge: "🇨🇲 Fièrement au Service du Cameroun",
      titlePart1: "Trouvez vos Médicaments",
      titleGradient: "À Travers le Cameroun",
      description: "Connectez-vous avec des pharmacies vérifiées, localisez les médicaments essentiels et accédez aux services de santé partout au Cameroun. Votre santé, notre priorité.",
      ctaPatient: "Commencer comme Patient",
      ctaPharmacy: "Rejoindre comme Pharmacie",
      citiesCovered: "Villes Couvertes",
      quickCards: [
        { title: "Trouver des Médicaments", desc: "Recherchez parmi les pharmacies vérifiées" },
        { title: "Localiser les Pharmacies", desc: "Trouvez le stock disponible le plus proche" },
        { title: "Contact Direct", desc: "Échangez directement avec les pharmaciens" },
        { title: "Stock en Temps Réel", desc: "Mises à jour des stocks en direct" }
      ],
      demoTitle: "Essayez de rechercher un médicament",
      demoPlaceholder: "ex. Paracétamol, Amoxicilline, Coartem...",
      demoButton: "Rechercher",
      demoSubtitle: "Connectez-vous pour rechercher parmi plus de 150 pharmacies vérifiées"
    },
    statsSection: {
      title: "Approuvé à travers le Cameroun",
      subtitle: "Rejoignez des milliers de patients et des centaines de pharmacies qui utilisent déjà MediConnect"
    },
    stats: {
      pharmacies: "Pharmacies Vérifiées",
      medicines: "Médicaments Disponibles",
      patients: "Patients Satisfaits",
      service: "Service Disponible",
      cities: "Villes Couvertes",
      pharmaciesSub: "Dans les 10 régions",
      medicinesSub: "Y compris les médicaments rares",
      patientsSub: "Et ça continue de grandir",
      serviceSub: "Assistance 24h/24 et 7j/7",
    },
    about: {
      title: "À Propos de MediConnect",
      description: "Nous révolutionnons l'accès aux soins de santé au Cameroun en connectant les patients aux pharmacies et en garantissant que les médicaments essentiels sont toujours à portée de main.",
      points: [
        {
          title: "Notre Mission",
          description: "Combler le fossé entre les patients et les pharmacies au Cameroun, en veillant à ce que chacun ait accès aux médicaments essentiels, quel que soit son lieu de résidence."
        },
        {
          title: "Notre Vision",
          description: "Un Cameroun où personne ne souffre d'un manque d'accès aux médicaments, où les soins de santé sont numérisés, efficaces et accessibles à tous."
        },
        {
          title: "Notre Impact",
          description: "Connecter des milliers de patients à des pharmacies vérifiées, réduire les pénuries de médicaments et améliorer les résultats sanitaires dans tout le pays."
        }
      ],
      commitmentTitle: "Notre Engagement pour le Cameroun",
      commitmentDescription: "MediConnect est né de la vision d'un Cameroun plus sain où la géographie et les ressources ne déterminent pas l'accès aux médicaments essentiels. Nous nous engageons à soutenir l'écosystème de santé en renforçant les patients et les pharmacies grâce à la technologie.",
      tag1: "Fièrement Camerounais",
      tag2: "Innovation en Santé",
      tag3: "Transformation Numérique",
    },
    features: {
      title: "Fonctionnalités Puissantes pour l'Accès aux Soins",
      description: "Découvrez comment les fonctionnalités avancées de MediConnect facilitent plus que jamais la recherche et l'accès aux médicaments.",
      getStarted: "Commencez Maintenant",
      items: [
        {
          title: "Recherche Intelligente de Médicaments",
          description: "Trouvez des médicaments instantanément grâce à notre recherche intelligente indiquant la disponibilité en temps réel partout au Cameroun.",
          benefits: ["Mise à jour des stocks en direct", "Comparaison des prix", "Suggestions d'alternatives génériques", "Alertes de réapprovisionnement"]
        },
        {
          title: "Localisation des Pharmacies",
          description: "Localisez les pharmacies à proximité grâce au GPS, consultez les horaires d'ouverture et les coordonnées directes.",
          benefits: ["Recherche assistée par GPS", "Affichage des horaires", "Coordonnées de contact direct", "Calcul d'itinéraire routier"]
        },
        {
          title: "Pharmacies Homologuées & Vérifiées",
          description: "Toutes les pharmacies sont certifiées par les autorités sanitaires (MINSANTÉ/ONPC), garantissant des médicaments authentiques.",
          benefits: ["Agrément ministériel vérifié (MINSANTÉ)", "Pharmaciens inscrits à l'Ordre (ONPC)", "Assurance qualité des produits", "Normes professionnelles strictes"]
        },
        {
          title: "Communication Directe avec les Pharmaciens",
          description: "Échangez directement avec des professionnels de santé pour des conseils, confirmations de disponibilité et assistance posologique.",
          benefits: ["Messagerie instantanée", "Conseils pharmaceutiques fiables", "Assistance sur ordonnance", "Orientation thérapeutique rapide"]
        }
      ]
    },
    benefits: {
      title: "Des Avantages pour Tous",
      description: "Que vous soyez patient ou pharmacien, MediConnect offre une valeur ajoutée exceptionnelle",
      items: [
        {
          title: "Pour les Patients",
          points: [
            "Trouvez des médicaments rapidement et sans vous déplacer inutilement",
            "Comparez les prix entre pharmacies homologuées",
            "Recevez des conseils de santé et consignes d'utilisation",
            "Programmez des alertes de réapprovisionnement de stock",
            "Échangez directement avec des pharmaciens diplômés"
          ]
        },
        {
          title: "Pour les Pharmacies",
          points: [
            "Augmentez votre visibilité et votre patientèle locale",
            "Gérez vos stocks et approvisionnements efficacement",
            "Communiquez directement avec les patients par messagerie",
            "Accédez à des statistiques et analyses épidémiologiques",
            "Développez votre officine en toute sécurité grâce au numérique"
          ]
        }
      ],
      ctaTitle: "Prêt à Transformer l'Accès aux Soins ?",
      ctaDescription: "Rejoignez des milliers d'utilisateurs satisfaits qui font confiance à MediConnect pour leurs besoins en santé.",
      ctaPatient: "Commencer comme Patient",
      ctaPharmacy: "Rejoindre comme Pharmacie Partenaire",
    },
    faq: {
      title: "Foire Aux Questions",
      description: "Obtenez des réponses aux questions les plus fréquentes sur MediConnect",
      stillHaveQuestions: "Vous avez encore des questions ?",
      contactSupport: "Contacter le Support",
      items: [
        {
          question: "Comment trouver des médicaments dans ma région ?",
          answer: "Utilisez simplement notre fonction de recherche pour trouver n'importe quel médicament. Notre système vous affichera toutes les pharmacies proches disposant du produit en stock, avec les prix et coordonnées. Vous pouvez également activer des alertes pour être notifié de la disponibilité."
        },
        {
          question: "Toutes les pharmacies de la plateforme sont-elles vérifiées ?",
          answer: "Oui, toutes les pharmacies sont rigoureusement homologuées et contrôlées par les autorités sanitaires camerounaises (MINSANTÉ et Ordre National des Pharmaciens) avant d'être référencées. Nous vérifions les licences d'exploitation et effectuons des contrôles continus."
        },
        {
          question: "Le service est-il disponible en français et en anglais ?",
          answer: "Absolument. En conformité avec le bilinguisme officiel du Cameroun, MediConnect est intégralement disponible en français et en anglais. Vous pouvez basculer d'une langue à l'autre à tout moment en haut de page."
        },
        {
          question: "Comment savoir si un médicament est authentique ?",
          answer: "Tous les médicaments proposés proviennent exclusivement de grossistes-répartiteurs agréés et de circuits officiels contrôlés par le Laboratoire National de Contrôle de Qualité des Médicaments (LANACOME). Les numéros de lot sont tracés."
        },
        {
          question: "Que faire en cas d'urgence médicale ou nocturne ?",
          answer: "Notre plateforme intègre un localisateur des pharmacies de garde ouvertes 24h/24 ainsi que les numéros d'urgence nationaux (112, SAMU 8022). Vous pouvez rapidement trouver l'officine de garde la plus proche."
        },
        {
          question: "Combien coûte l'utilisation de MediConnect ?",
          answer: "L'application est 100% gratuite pour les patients. Les pharmacies s'acquittent d'un abonnement professionnel modique qui nous permet d'assurer la maintenance, la sécurité des données et la synchronisation des stocks."
        },
        {
          question: "Puis-je obtenir des conseils de santé sur la plateforme ?",
          answer: "Oui, nos pharmaciens agréés répondent à vos questions posologiques et vous guident sur le bon usage des médicaments. En cas de symptômes graves, nous recommandons toujours de consulter un médecin ou un centre hospitalier."
        },
        {
          question: "Comment protégez-vous la confidentialité de mes données de santé ?",
          answer: "La confidentialité de vos données médicales est une priorité absolue. Toutes les informations sont chiffrées de bout en bout conformément à la réglementation camerounaise sur la protection des données personnelles et ne sont jamais divulguées sans votre accord."
        }
      ]
    },
    contact: {
      title: "Contactez-Nous",
      subtitle: "Vous avez des questions ou besoin d'assistance ? Nous sommes là pour vous aider.",
      infoTitle: "Informations de Contact",
      phoneTitle: "Assistance Téléphonique",
      phoneHours: "Lundi - Vendredi, 8h - 18h",
      emailTitle: "Assistance par Email",
      emailSubtitle: "Nous répondons sous 24 heures",
      officeTitle: "Nos Bureaux",
      officeLocations: "Douala & Yaoundé",
      officeSub: "Au service des 10 régions du Cameroun",
      emergencyTitle: "Numéros d'Urgence",
      emergencySub: "En cas d'urgence médicale :",
      emergencyServices: "Urgences Nationales : 112",
      ambulanceService: "Service d'Ambulance (SAMU) : 8022",
      formTitle: "Envoyez-nous un Message",
      nameLabel: "Nom Complet",
      namePlaceholder: "Entrez votre nom complet",
      emailLabel: "Adresse Email",
      emailPlaceholder: "Entrez votre adresse email",
      phoneLabel: "Numéro de Téléphone",
      phonePlaceholder: "Entrez votre numéro de téléphone",
      messageLabel: "Message",
      messagePlaceholder: "Comment pouvons-nous vous aider ?",
      submitButton: "Envoyer le Message",
      successToast: "Merci pour votre message ! Notre équipe vous répondra sous 24 heures."
    },
    footer: {
      tagline: "Connecter le Cameroun à de meilleurs soins de santé, un médicament à la fois.",
      patientsTitle: "Pour les Patients",
      pharmaciesTitle: "Pour les Pharmacies",
      supportTitle: "Assistance",
      patientsLinks: [
        { label: "Trouver des Médicaments", href: "#features" },
        { label: "Localiser les Pharmacies", href: "#features" },
        { label: "Conseils de Santé", href: "#benefits" },
        { label: "Numéros d'Urgence", href: "#contact" }
      ],
      pharmaciesLinks: [
        { label: "Rejoindre la Plateforme", href: "#contact" },
        { label: "Gestion des Stocks", href: "#features" },
        { label: "Communication Patients", href: "#features" },
        { label: "Analyses & Statistiques", href: "#benefits" }
      ],
      supportLinks: [
        { label: "Centre d'Aide", href: "#faq" },
        { label: "Contacter le Support", href: "#contact" },
        { label: "Politique de Confidentialité", href: "#" },
        { label: "Conditions d'Utilisation", href: "#" }
      ],
      copyright: "© 2026 MediConnect Cameroun. Tous droits réservés."
    },
    chatbot: {
      headerTitle: "MediBot",
      headerSubtitle: "Assistant Santé Virtuel",
      inputPlaceholder: "Écrivez votre message ou question de santé...",
      initialGreeting: "Bonjour ! Je suis MediBot, votre assistant de santé virtuel. Comment puis-je vous aider à trouver des médicaments ou pharmacies aujourd'hui ?",
      responses: [
        "Je peux vous aider à rechercher des médicaments, localiser les pharmacies de garde, vérifier les disponibilités et répondre à vos questions.",
        "Souhaitez-vous que je vous aide à trouver un médicament spécifique ou les pharmacies de votre quartier ?",
        "En cas d'urgence médicale grave, contactez immédiatement l'hôpital le plus proche ou appelez le 112 / SAMU 8022.",
        "Toutes les pharmacies répertoriées sur MediConnect sont homologuées par le MINSANTÉ et l'ONPC pour votre sécurité.",
        "Vous pouvez configurer des alertes pour être informé dès qu'un médicament est réapprovisionné dans une pharmacie proche.",
        "Je peux vous mettre en relation directe avec un pharmacien diplômé pour une consultation posologique."
      ]
    },
    testimonials: [
      {
        name: "Marie Ngozi",
        location: "Douala",
        role: "Patiente",
        avatar: "MN",
        text: "MediConnect a rendu la recherche de médicaments tellement plus facile. Je peux vérifier la disponibilité avant de me rendre à la pharmacie.",
        rating: 5
      },
      {
        name: "Dr. Paul Mballa",
        location: "Yaoundé", 
        role: "Propriétaire de Pharmacie",
        avatar: "PM",
        text: "Notre pharmacie a gagné en efficacité depuis l'utilisation de MediConnect. La communication avec les patients s'est considérablement améliorée.",
        rating: 5
      },
      {
        name: "Fatima Hassan",
        location: "Bamenda",
        role: "Patiente", 
        avatar: "FH",
        text: "En tant que parent, pouvoir trouver rapidement des médicaments pour enfants en cas d'urgence a été inestimable.",
        rating: 5
      },
      {
        name: "Pharmacie Centrale",
        location: "Garoua",
        role: "Pharmacie",
        avatar: "PC", 
        text: "Le système de gestion des stocks nous aide à mieux servir notre communauté en suivant les médicaments essentiels.",
        rating: 5
      },
      {
        name: "Jean-Claude Fotso",
        location: "Bafoussam",
        role: "Patient",
        avatar: "JF",
        text: "La section des conseils de santé a été incroyablement utile pour gérer ma maladie chronique. Merci MediConnect !",
        rating: 5
      },
      {
        name: "Pharmacie du Nord",
        location: "Maroua",
        role: "Pharmacie",
        avatar: "PN",
        text: "Depuis que nous avons rejoint MediConnect, nous avons pu atteindre plus de patients et mieux répondre aux besoins de santé de notre communauté.",
        rating: 5
      }
    ],
  }
};

export const heroImages = [
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1920&q=80'
];