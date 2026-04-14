// ─── Kubika i18n ─────────────────────────────────────────────────────────────
// Supported locales: English (en) and French (fr)

export type Locale = "en" | "fr";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "kubika_locale";

// ─── Translation strings ──────────────────────────────────────────────────────

const translations = {
  en: {
    // ── Nav ──────────────────────────────────────────────────────────────────
    nav: {
      dashboard:     "Dashboard",
      contacts:      "Contacts",
      inventory:     "Inventory",
      products:      "Products",
      operations:    "Operations",
      warehouses:    "Warehouses",
      sales:         "Sales",
      orders:        "Orders",
      invoices:      "Invoices",
      purchasing:    "Purchasing",
      purchaseOrders:"Purchase Orders",
      supplierBills: "Supplier Bills",
      accounting:    "Accounting",
      chartOfAccounts:"Chart of Accounts",
      journalEntries:"Journal Entries",
      profitLoss:    "Profit & Loss",
      balanceSheet:  "Balance Sheet",
      currencies:    "Currencies",
      analyticAccounts: "Analytic Accounts",
      hrPayroll:     "HR & Payroll",
      employees:     "Employees",
      payroll:       "Payroll",
      projects:      "Projects",
      crm:           "CRM",
      pipeline:      "Pipeline",
      allLeads:      "All Leads",
      pointOfSale:   "Point of Sale",
      fieldService:  "Field Service",
      serviceOrders: "Service Orders",
      worksheets:    "Worksheets",
      statements:    "Statements",
      importData:    "Import Data",
      reports:       "Reports",
      payments:      "Payments",
      company:       "Company",
      settings:      "Settings",
    },

    // ── Common actions ────────────────────────────────────────────────────────
    actions: {
      save:        "Save",
      cancel:      "Cancel",
      edit:        "Edit",
      delete:      "Delete",
      add:         "Add",
      create:      "Create",
      confirm:     "Confirm",
      back:        "Back",
      next:        "Next",
      submit:      "Submit",
      search:      "Search",
      filter:      "Filter",
      export:      "Export",
      import:      "Import",
      print:       "Print",
      send:        "Send",
      close:       "Close",
      open:        "Open",
      view:        "View",
      refresh:     "Refresh",
      download:    "Download",
      upload:      "Upload",
    },

    // ── Status labels ─────────────────────────────────────────────────────────
    status: {
      draft:       "Draft",
      confirmed:   "Confirmed",
      paid:        "Paid",
      partial:     "Partial",
      overdue:     "Overdue",
      cancelled:   "Cancelled",
      delivered:   "Delivered",
      pending:     "Pending",
      active:      "Active",
      inactive:    "Inactive",
      open:        "Open",
      closed:      "Closed",
      new:         "New",
      contacted:   "Contacted",
      qualified:   "Qualified",
      proposal:    "Proposal",
      won:         "Won",
      lost:        "Lost",
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    auth: {
      signIn:           "Sign in",
      signOut:          "Sign out",
      welcomeBack:      "Welcome back",
      enterCredentials: "Enter your credentials to access your account",
      email:            "Email",
      password:         "Password",
      invalidCredentials:"Invalid email or password.",
      signingIn:        "Signing in...",
      noAccount:        "Don't have an account?",
      startTrial:       "Start free trial",
      register:         "Register",
    },

    // ── Register ──────────────────────────────────────────────────────────────
    register: {
      title:            "Start your free trial",
      subtitle:         "No credit card required",
      yourCompany:      "Your company",
      companyInfo:      "Tell us about your business",
      companyName:      "Company Name",
      country:          "Country",
      currency:         "Currency",
      yourAccount:      "Your account",
      adminAccount:     "Create the admin account for",
      fullName:         "Full Name",
      workEmail:        "Work Email",
      minPassword:      "Min 6 characters",
      confirmPassword:  "Confirm Password",
      passwordMismatch: "Passwords do not match",
      launch:           "Launch my workspace",
      settingUp:        "Setting up...",
      alreadyAccount:   "Already have an account?",
    },

    // ── Landing ───────────────────────────────────────────────────────────────
    landing: {
      tagline:     "Built for African traders & businesses",
      heroTitle:   "Run your entire business",
      heroTitleEm: "from one platform",
      heroDesc:    "Inventory, sales, accounting, HR, POS, CRM, and field service — all connected, all in real time. No spreadsheets. No chaos.",
      trialCta:    "Start free trial",
      signinCta:   "Sign in to your workspace",
      noCard:      "No credit card required · Full access for 14 days",
      modulesTitle:"Everything your business needs",
      modulesDesc: "Activate only the modules you need. Upgrade as your business grows.",
      whyTitle:    "Why Kubika?",
      whyDesc:     "Most ERP software isn't built for African markets. Kubika is.",
      pricingTitle:"Simple, transparent pricing",
      pricingDesc: "Start free. Scale as you grow. Cancel anytime.",
      ctaTitle:    "Ready to take control of your business?",
      ctaDesc:     "Join businesses across Africa using Kubika to manage operations, close deals faster, and grow with confidence.",
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────
    dashboard: {
      title:           "Dashboard",
      welcome:         "Welcome back",
      totalRevenue:    "Total Revenue",
      totalExpenses:   "Total Expenses",
      outstanding:     "Outstanding",
      netProfit:       "Net Profit",
      recentInvoices:  "Recent Invoices",
      recentOrders:    "Recent Orders",
      quickActions:    "Quick Actions",
      newSalesOrder:   "New Sales Order",
      newInvoice:      "New Invoice",
      newContact:      "New Contact",
      newPurchaseOrder:"New Purchase Order",
    },

    // ── Contacts ──────────────────────────────────────────────────────────────
    contacts: {
      title:      "Contacts",
      newContact: "New Contact",
      name:       "Name",
      email:      "Email",
      phone:      "Phone",
      type:       "Type",
      customer:   "Customer",
      supplier:   "Supplier",
      both:       "Both",
      address:    "Address",
      city:       "City",
      country:    "Country",
      taxId:      "Tax ID (NIF)",
      notes:      "Notes",
    },

    // ── Common form labels ────────────────────────────────────────────────────
    form: {
      required: "Required",
      optional: "Optional",
      select:   "Select...",
      noResults:"No results found",
      loading:  "Loading...",
    },
  },

  fr: {
    // ── Nav ──────────────────────────────────────────────────────────────────
    nav: {
      dashboard:     "Tableau de bord",
      contacts:      "Contacts",
      inventory:     "Inventaire",
      products:      "Produits",
      operations:    "Opérations",
      warehouses:    "Entrepôts",
      sales:         "Ventes",
      orders:        "Commandes",
      invoices:      "Factures",
      purchasing:    "Achats",
      purchaseOrders:"Bons de commande",
      supplierBills: "Factures fournisseurs",
      accounting:    "Comptabilité",
      chartOfAccounts:"Plan comptable",
      journalEntries:"Écritures comptables",
      profitLoss:    "Compte de résultat",
      balanceSheet:  "Bilan comptable",
      currencies:    "Devises",
      analyticAccounts: "Comptes analytiques",
      hrPayroll:     "RH & Paie",
      employees:     "Employés",
      payroll:       "Paie",
      projects:      "Projets",
      crm:           "CRM",
      pipeline:      "Pipeline",
      allLeads:      "Tous les prospects",
      pointOfSale:   "Point de vente",
      fieldService:  "Service terrain",
      serviceOrders: "Ordres de service",
      worksheets:    "Feuilles de travail",
      statements:    "Relevés de compte",
      importData:    "Importer des données",
      reports:       "Rapports",
      payments:      "Paiements",
      company:       "Entreprise",
      settings:      "Paramètres",
    },

    // ── Common actions ────────────────────────────────────────────────────────
    actions: {
      save:        "Enregistrer",
      cancel:      "Annuler",
      edit:        "Modifier",
      delete:      "Supprimer",
      add:         "Ajouter",
      create:      "Créer",
      confirm:     "Confirmer",
      back:        "Retour",
      next:        "Suivant",
      submit:      "Soumettre",
      search:      "Rechercher",
      filter:      "Filtrer",
      export:      "Exporter",
      import:      "Importer",
      print:       "Imprimer",
      send:        "Envoyer",
      close:       "Fermer",
      open:        "Ouvrir",
      view:        "Voir",
      refresh:     "Actualiser",
      download:    "Télécharger",
      upload:      "Téléverser",
    },

    // ── Status labels ─────────────────────────────────────────────────────────
    status: {
      draft:       "Brouillon",
      confirmed:   "Confirmé",
      paid:        "Payé",
      partial:     "Partiel",
      overdue:     "En retard",
      cancelled:   "Annulé",
      delivered:   "Livré",
      pending:     "En attente",
      active:      "Actif",
      inactive:    "Inactif",
      open:        "Ouvert",
      closed:      "Fermé",
      new:         "Nouveau",
      contacted:   "Contacté",
      qualified:   "Qualifié",
      proposal:    "Proposition",
      won:         "Gagné",
      lost:        "Perdu",
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    auth: {
      signIn:           "Se connecter",
      signOut:          "Se déconnecter",
      welcomeBack:      "Bon retour",
      enterCredentials: "Entrez vos identifiants pour accéder à votre compte",
      email:            "E-mail",
      password:         "Mot de passe",
      invalidCredentials:"E-mail ou mot de passe invalide.",
      signingIn:        "Connexion en cours...",
      noAccount:        "Pas encore de compte ?",
      startTrial:       "Commencer l'essai gratuit",
      register:         "S'inscrire",
    },

    // ── Register ──────────────────────────────────────────────────────────────
    register: {
      title:            "Commencez votre essai gratuit",
      subtitle:         "Sans carte bancaire",
      yourCompany:      "Votre entreprise",
      companyInfo:      "Parlez-nous de votre entreprise",
      companyName:      "Nom de l'entreprise",
      country:          "Pays",
      currency:         "Devise",
      yourAccount:      "Votre compte",
      adminAccount:     "Créer le compte administrateur pour",
      fullName:         "Nom complet",
      workEmail:        "E-mail professionnel",
      minPassword:      "6 caractères minimum",
      confirmPassword:  "Confirmer le mot de passe",
      passwordMismatch: "Les mots de passe ne correspondent pas",
      launch:           "Lancer mon espace de travail",
      settingUp:        "Configuration en cours...",
      alreadyAccount:   "Vous avez déjà un compte ?",
    },

    // ── Landing ───────────────────────────────────────────────────────────────
    landing: {
      tagline:     "Conçu pour les commerçants et entreprises africains",
      heroTitle:   "Gérez toute votre entreprise",
      heroTitleEm: "depuis une seule plateforme",
      heroDesc:    "Inventaire, ventes, comptabilité, RH, PDV, CRM et service terrain — tout connecté, en temps réel. Fini les tableurs. Fini le chaos.",
      trialCta:    "Commencer l'essai gratuit",
      signinCta:   "Accéder à mon espace",
      noCard:      "Sans carte bancaire · Accès complet pendant 14 jours",
      modulesTitle:"Tout ce dont votre entreprise a besoin",
      modulesDesc: "Activez uniquement les modules dont vous avez besoin. Évoluez à votre rythme.",
      whyTitle:    "Pourquoi Kubika ?",
      whyDesc:     "La plupart des logiciels ERP ne sont pas conçus pour les marchés africains. Kubika l'est.",
      pricingTitle:"Tarifs simples et transparents",
      pricingDesc: "Commencez gratuitement. Évoluez selon votre croissance. Annulez à tout moment.",
      ctaTitle:    "Prêt à prendre le contrôle de votre entreprise ?",
      ctaDesc:     "Rejoignez les entreprises à travers l'Afrique qui utilisent Kubika pour gérer leurs opérations, conclure des ventes et croître en toute confiance.",
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────
    dashboard: {
      title:           "Tableau de bord",
      welcome:         "Bon retour",
      totalRevenue:    "Chiffre d'affaires",
      totalExpenses:   "Total des dépenses",
      outstanding:     "Encours",
      netProfit:       "Bénéfice net",
      recentInvoices:  "Factures récentes",
      recentOrders:    "Commandes récentes",
      quickActions:    "Actions rapides",
      newSalesOrder:   "Nouvelle commande",
      newInvoice:      "Nouvelle facture",
      newContact:      "Nouveau contact",
      newPurchaseOrder:"Nouveau bon de commande",
    },

    // ── Contacts ──────────────────────────────────────────────────────────────
    contacts: {
      title:      "Contacts",
      newContact: "Nouveau contact",
      name:       "Nom",
      email:      "E-mail",
      phone:      "Téléphone",
      type:       "Type",
      customer:   "Client",
      supplier:   "Fournisseur",
      both:       "Les deux",
      address:    "Adresse",
      city:       "Ville",
      country:    "Pays",
      taxId:      "N° fiscal (NIF)",
      notes:      "Notes",
    },

    // ── Common form labels ────────────────────────────────────────────────────
    form: {
      required: "Obligatoire",
      optional: "Facultatif",
      select:   "Sélectionner...",
      noResults:"Aucun résultat",
      loading:  "Chargement...",
    },
  },
} as const;

export type Translations = typeof translations.en;
export type TranslationKey = keyof Translations;

export function getTranslations(locale: Locale): Translations {
  return (translations[locale] ?? translations.en) as unknown as Translations;
}

// Type-safe nested key access: t("nav.dashboard") → string
export type FlatKey = {
  [K in keyof Translations]: {
    [SK in keyof Translations[K]]: `${K & string}.${SK & string}`
  }[keyof Translations[K]]
}[keyof Translations];

export function translate(locale: Locale, key: FlatKey): string {
  const [section, subkey] = key.split(".") as [keyof Translations, string];
  const t = getTranslations(locale);
  return (t[section] as Record<string, string>)[subkey] ?? key;
}
