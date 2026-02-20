import "server-only";

import { db } from "@/server/db";
import {
  companies,
  contacts,
  contactsToTags,
  deals,
  pipelineStages,
  tags,
  timelineEntries,
  users,
} from "@/server/db/schema";
import type {
  NewCompany,
  NewContact,
  NewDeal,
  NewTimelineEntry,
  NewUser,
} from "@/server/db/schema";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

interface SeedData {
  users: NewUser[];
  companies: NewCompany[];
  contacts: NewContact[];
  deals: NewDeal[];
  timelineEntries: NewTimelineEntry[];
}

export function generateSeedData(): SeedData {
  // Generate IDs upfront for cross-referencing
  const companyIds = {
    redstones: crypto.randomUUID(),
    eter: crypto.randomUUID(),
    axis: crypto.randomUUID(),
    produzione: crypto.randomUUID(),
    studio: crypto.randomUUID(),
  };

  const contactIds = {
    // RedStones (3 contacts)
    jacopoPellegrini: crypto.randomUUID(),
    martinaConti: crypto.randomUUID(),
    lucaFerri: crypto.randomUUID(),
    // Eter (3 contacts)
    sofiaRicci: crypto.randomUUID(),
    marcoRusso: crypto.randomUUID(),
    elenaMoretti: crypto.randomUUID(),
    // Axis Digital (3 contacts)
    andreaBianchi: crypto.randomUUID(),
    chiaraEsposito: crypto.randomUUID(),
    davideFerrari: crypto.randomUUID(),
    // Produzione Rapida (3 contacts)
    robertoColombo: crypto.randomUUID(),
    valentinaRomano: crypto.randomUUID(),
    francescoRicci: crypto.randomUUID(),
    // Studio Consulenze (3 contacts)
    alessiaGallo: crypto.randomUUID(),
    stefanoMarini: crypto.randomUUID(),
    giuliaCosta: crypto.randomUUID(),
  };

  const dealIds = {
    crmEnterprise: crypto.randomUUID(),
    licenzeSoftware: crypto.randomUUID(),
    sistemaAccessi: crypto.randomUUID(),
    progettoPilot: crypto.randomUUID(),
    campagnaSeo: crypto.randomUUID(),
    rebrandingDigital: crypto.randomUUID(),
    consulenzaOttimizzazione: crypto.randomUUID(),
    fornituraComponenti: crypto.randomUUID(),
    dueDiligence: crypto.randomUUID(),
    pianoRistrutturazione: crypto.randomUUID(),
  };

  const guestUserId = crypto.randomUUID();

  const seedUsers: NewUser[] = [
    {
      id: guestUserId,
      name: "Demo Guest",
      email: "guest@demo.redstones.local",
      passwordHash: null,
      role: "guest",
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
  ];

  const seedCompanies: NewCompany[] = [
    {
      id: companyIds.redstones,
      name: "RedStones",
      domain: "redstones.io",
      sector: "Software / SaaS",
      description: "Software house specializzata in soluzioni SaaS per il mercato italiano.",
      enrichmentStatus: "not_enriched",
      enrichmentDescription: null,
      enrichmentSector: null,
      enrichmentSize: null,
      enrichmentPainPoints: null,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60),
    },
    {
      id: companyIds.eter,
      name: "Eter Biometric Technologies",
      domain: "eterbiometric.com",
      sector: "Tecnologia Biometrica",
      description: "Soluzioni biometriche per accesso e sicurezza aziendale.",
      enrichmentStatus: "not_enriched",
      enrichmentDescription: null,
      enrichmentSector: null,
      enrichmentSize: null,
      enrichmentPainPoints: null,
      createdAt: daysAgo(55),
      updatedAt: daysAgo(55),
    },
    {
      id: companyIds.axis,
      name: "Axis Digital Srl",
      domain: "axisdigital.it",
      sector: "Marketing Digitale",
      description: "Agenzia di marketing digitale per PMI italiane.",
      enrichmentStatus: "enriched",
      enrichmentDescription:
        "Agenzia di marketing digitale specializzata in SEO, advertising e growth hacking per PMI italiane.",
      enrichmentSector: "Marketing e Pubblicità Digitale",
      enrichmentSize: "11-50 dipendenti",
      enrichmentPainPoints:
        "Difficoltà nel dimostrare ROI ai clienti\nAlta competizione nel mercato locale\nTurnover dei talenti digitali",
      createdAt: daysAgo(45),
      updatedAt: daysAgo(10),
    },
    {
      id: companyIds.produzione,
      name: "Produzione Rapida Srl",
      domain: "produzioneerapida.it",
      sector: "Manifattura Industriale",
      description: "Produzione CNC e prototipazione rapida per automotive.",
      enrichmentStatus: "enriched",
      enrichmentDescription:
        "Azienda manifatturiera specializzata in prototipazione rapida e produzione CNC per il settore automotive e meccatronica.",
      enrichmentSector: "Manifattura Industriale / Automotive",
      enrichmentSize: "51-200 dipendenti",
      enrichmentPainPoints:
        "Gestione lead time e supply chain volatile\nDifficoltà nel passaggio al digitale\nPressione sui margini da competitor asiatici",
      createdAt: daysAgo(50),
      updatedAt: daysAgo(8),
    },
    {
      id: companyIds.studio,
      name: "Studio Consulenze Ferrara",
      domain: "studioconsulenzeferrara.it",
      sector: "Consulenza Aziendale",
      description: "Consulenza strategica e finanziaria per aziende in crescita.",
      enrichmentStatus: "enriched",
      enrichmentDescription:
        "Studio di consulenza strategica e finanziaria per aziende in fase di crescita, M&A e ristrutturazione.",
      enrichmentSector: "Consulenza Aziendale e Finanziaria",
      enrichmentSize: "1-10 dipendenti",
      enrichmentPainPoints:
        "Dipendenza da referral\nDifficoltà nello scalare i servizi\nCompetizione da grandi studi internazionali",
      createdAt: daysAgo(40),
      updatedAt: daysAgo(6),
    },
  ];

  const seedContacts: NewContact[] = [
    // RedStones — 3 contacts
    {
      id: contactIds.jacopoPellegrini,
      firstName: "Jacopo",
      lastName: "Pellegrini",
      email: "j.pellegrini@redstones.io",
      phone: "+39 059 123 4567",
      role: "CEO",
      companyId: companyIds.redstones,
      createdAt: daysAgo(58),
      updatedAt: daysAgo(58),
    },
    {
      id: contactIds.martinaConti,
      firstName: "Martina",
      lastName: "Conti",
      email: "m.conti@redstones.io",
      phone: "+39 059 123 4568",
      role: "CTO",
      companyId: companyIds.redstones,
      createdAt: daysAgo(57),
      updatedAt: daysAgo(57),
    },
    {
      id: contactIds.lucaFerri,
      firstName: "Luca",
      lastName: "Ferri",
      email: "l.ferri@redstones.io",
      phone: "+39 059 123 4569",
      role: "Sales Director",
      companyId: companyIds.redstones,
      createdAt: daysAgo(56),
      updatedAt: daysAgo(56),
    },
    // Eter Biometric — 3 contacts
    {
      id: contactIds.sofiaRicci,
      firstName: "Sofia",
      lastName: "Ricci",
      email: "s.ricci@eterbiometric.com",
      phone: "+39 059 234 5678",
      role: "CEO",
      companyId: companyIds.eter,
      createdAt: daysAgo(53),
      updatedAt: daysAgo(53),
    },
    {
      id: contactIds.marcoRusso,
      firstName: "Marco",
      lastName: "Russo",
      email: "m.russo@eterbiometric.com",
      phone: "+39 059 234 5679",
      role: "Product Manager",
      companyId: companyIds.eter,
      createdAt: daysAgo(52),
      updatedAt: daysAgo(52),
    },
    {
      id: contactIds.elenaMoretti,
      firstName: "Elena",
      lastName: "Moretti",
      email: "e.moretti@eterbiometric.com",
      phone: "+39 059 234 5680",
      role: "Head of Marketing",
      companyId: companyIds.eter,
      createdAt: daysAgo(51),
      updatedAt: daysAgo(51),
    },
    // Axis Digital — 3 contacts
    {
      id: contactIds.andreaBianchi,
      firstName: "Andrea",
      lastName: "Bianchi",
      email: "a.bianchi@axisdigital.it",
      phone: "+39 059 345 6789",
      role: "Founder",
      companyId: companyIds.axis,
      createdAt: daysAgo(43),
      updatedAt: daysAgo(43),
    },
    {
      id: contactIds.chiaraEsposito,
      firstName: "Chiara",
      lastName: "Esposito",
      email: "c.esposito@axisdigital.it",
      phone: "+39 059 345 6790",
      role: "Account Manager",
      companyId: companyIds.axis,
      createdAt: daysAgo(42),
      updatedAt: daysAgo(42),
    },
    {
      id: contactIds.davideFerrari,
      firstName: "Davide",
      lastName: "Ferrari",
      email: "d.ferrari@axisdigital.it",
      phone: "+39 059 345 6791",
      role: "CFO",
      companyId: companyIds.axis,
      createdAt: daysAgo(41),
      updatedAt: daysAgo(41),
    },
    // Produzione Rapida — 3 contacts
    {
      id: contactIds.robertoColombo,
      firstName: "Roberto",
      lastName: "Colombo",
      email: "r.colombo@produzioneerapida.it",
      phone: "+39 059 456 7890",
      role: "Direttore Operations",
      companyId: companyIds.produzione,
      createdAt: daysAgo(48),
      updatedAt: daysAgo(48),
    },
    {
      id: contactIds.valentinaRomano,
      firstName: "Valentina",
      lastName: "Romano",
      email: "v.romano@produzioneerapida.it",
      phone: "+39 059 456 7891",
      role: "Responsabile Acquisti",
      companyId: companyIds.produzione,
      createdAt: daysAgo(47),
      updatedAt: daysAgo(47),
    },
    {
      id: contactIds.francescoRicci,
      firstName: "Francesco",
      lastName: "Ricci",
      email: "f.ricci@produzioneerapida.it",
      phone: "+39 059 456 7892",
      role: "CEO",
      companyId: companyIds.produzione,
      createdAt: daysAgo(46),
      updatedAt: daysAgo(46),
    },
    // Studio Consulenze Ferrara — 3 contacts
    {
      id: contactIds.alessiaGallo,
      firstName: "Alessia",
      lastName: "Gallo",
      email: "a.gallo@studioconsulenzeferrara.it",
      phone: "+39 0532 123 456",
      role: "Partner",
      companyId: companyIds.studio,
      createdAt: daysAgo(38),
      updatedAt: daysAgo(38),
    },
    {
      id: contactIds.stefanoMarini,
      firstName: "Stefano",
      lastName: "Marini",
      email: "s.marini@studioconsulenzeferrara.it",
      phone: "+39 0532 123 457",
      role: "Senior Consultant",
      companyId: companyIds.studio,
      createdAt: daysAgo(37),
      updatedAt: daysAgo(37),
    },
    {
      id: contactIds.giuliaCosta,
      firstName: "Giulia",
      lastName: "Costa",
      email: "g.costa@studioconsulenzeferrara.it",
      phone: "+39 0532 123 458",
      role: "Business Analyst",
      companyId: companyIds.studio,
      createdAt: daysAgo(36),
      updatedAt: daysAgo(36),
    },
  ];

  const seedDeals: NewDeal[] = [
    {
      id: dealIds.crmEnterprise,
      title: "Implementazione CRM Enterprise",
      value: "28000.00",
      stage: "Proposta",
      contactId: contactIds.jacopoPellegrini,
      companyId: companyIds.redstones,
      ownerId: guestUserId,
      lostReason: null,
      createdAt: daysAgo(25),
      updatedAt: daysAgo(5),
    },
    {
      id: dealIds.licenzeSoftware,
      title: "Licenze Software Annuali",
      value: "15000.00",
      stage: "Negoziazione",
      contactId: contactIds.martinaConti,
      companyId: companyIds.redstones,
      ownerId: guestUserId,
      lostReason: null,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(3),
    },
    {
      id: dealIds.sistemaAccessi,
      title: "Sistema Biometrico Accessi Aziendali",
      value: "42000.00",
      stage: "Demo",
      contactId: contactIds.sofiaRicci,
      companyId: companyIds.eter,
      ownerId: guestUserId,
      lostReason: null,
      createdAt: daysAgo(18),
      updatedAt: daysAgo(7),
    },
    {
      id: dealIds.progettoPilot,
      title: "Progetto Pilot 3 mesi",
      value: "8500.00",
      stage: "Qualificato",
      contactId: contactIds.marcoRusso,
      companyId: companyIds.eter,
      ownerId: guestUserId,
      lostReason: null,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(10),
    },
    {
      id: dealIds.campagnaSeo,
      title: "Campagna SEO + Ads Q1",
      value: "12000.00",
      stage: "Chiuso Vinto",
      contactId: contactIds.andreaBianchi,
      companyId: companyIds.axis,
      ownerId: guestUserId,
      lostReason: null,
      createdAt: daysAgo(40),
      updatedAt: daysAgo(14),
    },
    {
      id: dealIds.rebrandingDigital,
      title: "Rebranding Digital Completo",
      value: "22000.00",
      stage: "Lead",
      contactId: contactIds.chiaraEsposito,
      companyId: companyIds.axis,
      ownerId: guestUserId,
      lostReason: null,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      id: dealIds.consulenzaOttimizzazione,
      title: "Consulenza Ottimizzazione Processi",
      value: "18000.00",
      stage: "Chiuso Perso",
      contactId: contactIds.robertoColombo,
      companyId: companyIds.produzione,
      ownerId: guestUserId,
      lostReason: "Budget non sufficiente per questo esercizio",
      createdAt: daysAgo(35),
      updatedAt: daysAgo(12),
    },
    {
      id: dealIds.fornituraComponenti,
      title: "Fornitura Componenti Custom",
      value: "35000.00",
      stage: "Qualificato",
      contactId: contactIds.francescoRicci,
      companyId: companyIds.produzione,
      ownerId: guestUserId,
      lostReason: null,
      createdAt: daysAgo(12),
      updatedAt: daysAgo(9),
    },
    {
      id: dealIds.dueDiligence,
      title: "Due Diligence Acquisizione",
      value: "48000.00",
      stage: "Proposta",
      contactId: contactIds.alessiaGallo,
      companyId: companyIds.studio,
      ownerId: guestUserId,
      lostReason: null,
      createdAt: daysAgo(22),
      updatedAt: daysAgo(4),
    },
    {
      id: dealIds.pianoRistrutturazione,
      title: "Piano Ristrutturazione Aziendale",
      value: "6500.00",
      stage: "Lead",
      contactId: contactIds.stefanoMarini,
      companyId: companyIds.studio,
      ownerId: guestUserId,
      lostReason: null,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
  ];

  const seedTimelineEntries: NewTimelineEntry[] = [
    // Deal 1: CRM Enterprise (Proposta) — progressione da Lead
    {
      dealId: dealIds.crmEnterprise,
      type: "note",
      content:
        "Call di discovery completata. Il cliente è interessato all'implementazione Q2. Budget approvato internamente.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(24),
    },
    {
      dealId: dealIds.crmEnterprise,
      type: "stage_change",
      content: null,
      previousStage: "Lead",
      newStage: "Qualificato",
      authorId: guestUserId,
      createdAt: daysAgo(22),
    },
    {
      dealId: dealIds.crmEnterprise,
      type: "note",
      content:
        "Demo prodotto effettuata con il team tecnico. Feedback molto positivo. Richiedono personalizzazioni sul modulo reporting.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(15),
    },
    {
      dealId: dealIds.crmEnterprise,
      type: "stage_change",
      content: null,
      previousStage: "Qualificato",
      newStage: "Demo",
      authorId: guestUserId,
      createdAt: daysAgo(14),
    },
    {
      dealId: dealIds.crmEnterprise,
      type: "stage_change",
      content: null,
      previousStage: "Demo",
      newStage: "Proposta",
      authorId: guestUserId,
      createdAt: daysAgo(8),
    },
    {
      dealId: dealIds.crmEnterprise,
      type: "note",
      content:
        "Inviata proposal tecnica con architettura personalizzata. In attesa feedback entro fine settimana.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(5),
    },
    // Deal 2: Licenze Software (Negoziazione)
    {
      dealId: dealIds.licenzeSoftware,
      type: "note",
      content:
        "Primo contatto via LinkedIn. La CTO è alla ricerca di soluzioni per automatizzare i workflow interni.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(19),
    },
    {
      dealId: dealIds.licenzeSoftware,
      type: "stage_change",
      content: null,
      previousStage: "Lead",
      newStage: "Qualificato",
      authorId: guestUserId,
      createdAt: daysAgo(16),
    },
    {
      dealId: dealIds.licenzeSoftware,
      type: "stage_change",
      content: null,
      previousStage: "Qualificato",
      newStage: "Negoziazione",
      authorId: guestUserId,
      createdAt: daysAgo(6),
    },
    {
      dealId: dealIds.licenzeSoftware,
      type: "note",
      content:
        "Richiesto sconto del 15% per rinnovo triennale. In valutazione con il management. Risposta attesa entro 3 giorni.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(3),
    },
    // Deal 5: Campagna SEO (Chiuso Vinto)
    {
      dealId: dealIds.campagnaSeo,
      type: "note",
      content: "Referral da cliente esistente. Axis Digital cerca agenzia per campagna Q1.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(38),
    },
    {
      dealId: dealIds.campagnaSeo,
      type: "stage_change",
      content: null,
      previousStage: "Lead",
      newStage: "Qualificato",
      authorId: guestUserId,
      createdAt: daysAgo(35),
    },
    {
      dealId: dealIds.campagnaSeo,
      type: "stage_change",
      content: null,
      previousStage: "Qualificato",
      newStage: "Chiuso Vinto",
      authorId: guestUserId,
      createdAt: daysAgo(14),
    },
    {
      dealId: dealIds.campagnaSeo,
      type: "note",
      content:
        "Contratto firmato. Campagna avviata. Primi risultati attesi entro 30 giorni. KPI concordati: +40% traffico organico.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(14),
    },
    // Deal 7: Consulenza Ottimizzazione (Chiuso Perso)
    {
      dealId: dealIds.consulenzaOttimizzazione,
      type: "note",
      content:
        "Incontro iniziale positivo. Il direttore operations vuole ottimizzare i processi di produzione CNC.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(33),
    },
    {
      dealId: dealIds.consulenzaOttimizzazione,
      type: "stage_change",
      content: null,
      previousStage: "Lead",
      newStage: "Qualificato",
      authorId: guestUserId,
      createdAt: daysAgo(28),
    },
    {
      dealId: dealIds.consulenzaOttimizzazione,
      type: "stage_change",
      content: null,
      previousStage: "Qualificato",
      newStage: "Chiuso Perso",
      authorId: guestUserId,
      createdAt: daysAgo(12),
    },
    {
      dealId: dealIds.consulenzaOttimizzazione,
      type: "note",
      content:
        "Budget tagliato per fine esercizio. Il CFO ha bloccato tutte le nuove spese Q4. Ricontattare a gennaio.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(12),
    },
    // Deal 9: Due Diligence (Proposta)
    {
      dealId: dealIds.dueDiligence,
      type: "note",
      content:
        "Contatto diretto del partner Alessia Gallo. Acquisizione target da completare entro Q2.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(21),
    },
    {
      dealId: dealIds.dueDiligence,
      type: "stage_change",
      content: null,
      previousStage: "Lead",
      newStage: "Proposta",
      authorId: guestUserId,
      createdAt: daysAgo(10),
    },
    {
      dealId: dealIds.dueDiligence,
      type: "note",
      content:
        "Proposta di engagement inviata. Scope: analisi legale + finanziaria target. Valore stimato 48k EUR.",
      previousStage: null,
      newStage: null,
      authorId: guestUserId,
      createdAt: daysAgo(4),
    },
  ];

  return {
    users: seedUsers,
    companies: seedCompanies,
    contacts: seedContacts,
    deals: seedDeals,
    timelineEntries: seedTimelineEntries,
  };
}

async function seedPipelineStages(): Promise<void> {
  const defaultStages = [
    { name: "Lead", sortOrder: 1, isProtected: false },
    { name: "Qualificato", sortOrder: 2, isProtected: false },
    { name: "Demo", sortOrder: 3, isProtected: false },
    { name: "Proposta", sortOrder: 4, isProtected: false },
    { name: "Negoziazione", sortOrder: 5, isProtected: false },
    { name: "Chiuso Vinto", sortOrder: 6, isProtected: true },
    { name: "Chiuso Perso", sortOrder: 7, isProtected: true },
  ];

  await db
    .insert(pipelineStages)
    .values(defaultStages)
    .onConflictDoNothing({ target: pipelineStages.name });
}

export async function resetDatabase(): Promise<void> {
  const data = generateSeedData();

  await seedPipelineStages();

  await db.transaction(async (tx) => {
    await tx.delete(timelineEntries);
    await tx.delete(contactsToTags);
    await tx.delete(deals);
    await tx.delete(contacts);
    await tx.delete(tags);
    await tx.delete(companies);
    await tx.delete(users);

    await tx.insert(users).values(data.users);
    await tx.insert(companies).values(data.companies);
    await tx.insert(contacts).values(data.contacts);
    await tx.insert(deals).values(data.deals);
    await tx.insert(timelineEntries).values(data.timelineEntries);
  });
}
