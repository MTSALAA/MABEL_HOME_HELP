import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

const services = [
  {
    slug: "senior-home-check-ins",
    titleEn: "Senior Home Check-Ins",
    titleFr: "Visites de vérification à domicile",
    descriptionEn:
      "Regular visits to check on seniors and make sure everything is okay.",
    descriptionFr:
      "Des visites régulières pour prendre des nouvelles des aînés et s'assurer que tout va bien.",
    isFeatured: true,
  },
  {
    slug: "companionship",
    titleEn: "Companionship",
    titleFr: "Compagnie",
    descriptionEn:
      "Friendly conversations, coffee visits, walks and social activities.",
    descriptionFr:
      "Conversations amicales, visites autour d'un café, promenades et activités sociales.",
    isFeatured: true,
  },
  {
    slug: "garbage-recycling",
    titleEn: "Garbage & Recycling",
    titleFr: "Ordures et recyclage",
    descriptionEn: "Taking garbage and recycling bins out and bringing them back.",
    descriptionFr: "Sortir les bacs à ordures et de recyclage, puis les rentrer.",
    isFeatured: false,
  },
  {
    slug: "light-house-cleaning",
    titleEn: "Light House Cleaning",
    titleFr: "Entretien ménager léger",
    descriptionEn: "Tidying, organizing and basic household cleaning.",
    descriptionFr: "Rangement, organisation et ménage de base.",
    isFeatured: true,
  },
  {
    slug: "garage-cleaning",
    titleEn: "Garage Cleaning",
    titleFr: "Nettoyage du garage",
    descriptionEn: "Garage organization and light cleanup.",
    descriptionFr: "Organisation du garage et nettoyage léger.",
    isFeatured: false,
  },
  {
    slug: "car-cleaning",
    titleEn: "Car Cleaning",
    titleFr: "Nettoyage de voiture",
    descriptionEn: "Basic interior cleaning, vacuuming and exterior washing.",
    descriptionFr:
      "Nettoyage de base de l'intérieur, passage de l'aspirateur et lavage extérieur.",
    isFeatured: false,
  },
  {
    slug: "snow-removal",
    titleEn: "Snow Removal",
    titleFr: "Déneigement",
    descriptionEn: "Shovelling snow, clearing sidewalks and salting walkways.",
    descriptionFr: "Pelletage, dégagement des trottoirs et épandage de sel dans les allées.",
    isFeatured: true,
  },
  {
    slug: "lawn-yard-maintenance",
    titleEn: "Lawn & Yard Maintenance",
    titleFr: "Entretien de la pelouse et du terrain",
    descriptionEn: "Grass cutting, seasonal yard cleanup and outdoor assistance.",
    descriptionFr:
      "Tonte du gazon, nettoyage saisonnier du terrain et aide à l'extérieur.",
    isFeatured: false,
  },
  {
    slug: "grocery-pharmacy-pickup",
    titleEn: "Grocery & Pharmacy Pickup",
    titleFr: "Épicerie et pharmacie",
    descriptionEn: "Picking up groceries, prescriptions and everyday essentials.",
    descriptionFr:
      "Ramassage de l'épicerie, des ordonnances et des articles essentiels du quotidien.",
    isFeatured: true,
  },
  {
    slug: "errands-shopping",
    titleEn: "Errands & Shopping Assistance",
    titleFr: "Courses et aide au magasinage",
    descriptionEn: "Helping with basic daily errands.",
    descriptionFr: "Un coup de main pour les courses courantes.",
    isFeatured: false,
  },
  {
    slug: "family-updates",
    titleEn: "Family Updates",
    titleFr: "Nouvelles à la famille",
    descriptionEn:
      "Updates to family members after visits, with the client's permission.",
    descriptionFr:
      "Des nouvelles transmises aux membres de la famille après les visites, avec la permission du client.",
    isFeatured: true,
  },
  {
    slug: "acreage-rural-help",
    titleEn: "Acreage & Rural Property Help",
    titleFr: "Aide pour propriétés rurales",
    descriptionEn:
      "Regular check-ins, outdoor maintenance and practical assistance.",
    descriptionFr:
      "Visites régulières, entretien extérieur et aide pratique.",
    isFeatured: false,
  },
  {
    slug: "basic-roadside-assistance",
    titleEn: "Basic Roadside Assistance",
    titleFr: "Assistance routière de base",
    descriptionEn:
      "Limited non-emergency help for monthly members, subject to safety and availability.",
    descriptionFr:
      "Une aide limitée et non urgente pour les membres mensuels, selon la sécurité et la disponibilité.",
    isFeatured: false,
  },
];

// Plan brand names are kept in English in both languages (nameFr: null falls
// back to nameEn). Amounts follow the most likely reading of the client brief and are still to
// be confirmed by the client (cahier des charges, section 18).
const plans = [
  {
    slug: "quick-drop",
    nameEn: "Quick Drop",
    nameFr: null,
    priceTextEn: "$15–$20 per visit",
    priceTextFr: "15 $ à 20 $ par visite",
    includesEn: "Up to 45 minutes",
    includesFr: "Jusqu'à 45 minutes",
    noteEn: "Pay as you go. Ideal for a quick check-in or a small job.",
    noteFr: "Payez à la visite. Idéal pour une courte visite ou un petit travail.",
    isPurchasable: false,
    monthlyCents: null,
    isHighlighted: false,
  },
  {
    slug: "mabel-check-in",
    nameEn: "Mabel Check-In",
    nameFr: null,
    priceTextEn: "$200/month",
    priceTextFr: "200 $ par mois",
    includesEn: "4 visits",
    includesFr: "4 visites",
    noteEn: "About one visit a week to stay on top of the small things.",
    noteFr: "Environ une visite par semaine pour garder les petites choses en ordre.",
    isPurchasable: true,
    monthlyCents: 20000,
    isHighlighted: false,
  },
  {
    slug: "mabel-peace-of-mind",
    nameEn: "Mabel Peace of Mind",
    nameFr: null,
    priceTextEn: "$250/month",
    priceTextFr: "250 $ par mois",
    includesEn: "8 visits",
    includesFr: "8 visites",
    noteEn: "About two visits a week, for extra support and peace of mind.",
    noteFr: "Environ deux visites par semaine, pour plus de soutien et de tranquillité.",
    isPurchasable: true,
    monthlyCents: 25000,
    isHighlighted: true,
  },
  {
    slug: "snow-yard-acreage",
    nameEn: "Snow, yard & acreage services",
    nameFr: "Déneigement, terrain et propriétés rurales",
    priceTextEn: "Custom quote",
    priceTextFr: "Sur devis",
    includesEn: "Based on service needs",
    includesFr: "Selon les besoins",
    noteEn: "Tell us about the property and we'll give you a clear price.",
    noteFr: "Parlez-nous de la propriété et nous vous donnerons un prix clair.",
    isPurchasable: false,
    monthlyCents: null,
    isHighlighted: false,
  },
];

async function main() {
  // Content is only created when missing, so re-running the seed never
  // overwrites what the owner has edited in the admin.
  for (const [index, service] of services.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: { ...service, illustration: service.slug, sortOrder: index },
    });
  }

  for (const [index, plan] of plans.entries()) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: { ...plan, sortOrder: index },
    });
  }

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "Mabel Home Help",
      taglineEn: "Small jobs. Friendly visits. Peace of mind.",
      taglineFr: "Petits travaux. Visites amicales. Tranquillité d'esprit.",
      // Phone and email are still to be confirmed by the client.
      phone: null,
      email: null,
      location: "Edmonton, Alberta, Canada",
      serviceAreasEn: [
        "Edmonton",
        "St. Albert",
        "Sherwood Park",
        "Surrounding communities",
        "Acreages",
      ],
      serviceAreasFr: [
        "Edmonton",
        "St. Albert",
        "Sherwood Park",
        "Collectivités avoisinantes",
        "Propriétés rurales",
      ],
      disclaimerEn:
        "We provide non-medical, non-emergency services only. We do not provide nursing, personal care or emergency response.",
      disclaimerFr:
        "Nous offrons uniquement des services non médicaux et non urgents. Nous n'offrons pas de soins infirmiers, de soins personnels ni d'intervention d'urgence.",
      notificationEmails: [],
    },
  });

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: no admin user created.",
    );
  } else if (password.length < 10) {
    console.warn("SEED_ADMIN_PASSWORD must be at least 10 characters: skipped.");
  } else if (await prisma.user.findUnique({ where: { email } })) {
    console.log(`Admin ${email} already exists: left unchanged.`);
  } else {
    const userId = randomUUID();
    await prisma.user.create({
      data: { id: userId, name: "Owner", email, emailVerified: true },
    });
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: await hashPassword(password),
      },
    });
    console.log(`Admin ${email} created.`);
  }

  console.log(
    `Seed complete: ${services.length} services, ${plans.length} plans, settings.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
