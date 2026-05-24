import { prisma } from './lib/prisma';

async function seed() {
  console.log('Seeding plans...');

  await prisma.plan.upsert({
    where: { name: 'trial' },
    update: {},
    create: {
      name: 'trial',
      displayName: '14-Day Free Trial',
      priceMonthly: 0,
      priceYearly: 0,
      seats: 5,
      aiActionLimit: 200,
      crmSyncLimit: 100,
      storageGb: 1,
      features: JSON.stringify({
        chrome_extension: true,
        shared_inbox: true,
        ai_copilot: true,
        crm_sync: true,
        analytics: true,
        tasks: true,
        quick_replies: true,
        webhook: true,
      }),
    },
  });

  await prisma.plan.upsert({
    where: { name: 'starter' },
    update: {},
    create: {
      name: 'starter',
      displayName: 'Starter',
      priceMonthly: 1900,
      priceYearly: 19000,
      seats: 3,
      aiActionLimit: 300,
      crmSyncLimit: 500,
      storageGb: 5,
      features: JSON.stringify({
        chrome_extension: true,
        shared_inbox: true,
        ai_copilot: true,
        crm_sync: true,
        analytics: true,
        tasks: true,
        quick_replies: true,
        webhook: true,
      }),
    },
  });

  await prisma.plan.upsert({
    where: { name: 'team' },
    update: {},
    create: {
      name: 'team',
      displayName: 'Team',
      priceMonthly: 3900,
      priceYearly: 39000,
      seats: 10,
      aiActionLimit: 1000,
      crmSyncLimit: 2000,
      storageGb: 20,
      features: JSON.stringify({
        chrome_extension: true,
        shared_inbox: true,
        ai_copilot: true,
        ai_autopilot: true,
        crm_sync: true,
        analytics: true,
        tasks: true,
        quick_replies: true,
        automation_rules: true,
        webhook: true,
      }),
    },
  });

  await prisma.plan.upsert({
    where: { name: 'growth' },
    update: {},
    create: {
      name: 'growth',
      displayName: 'Growth Autopilot',
      priceMonthly: 9900,
      priceYearly: 99000,
      seats: 25,
      aiActionLimit: 5000,
      crmSyncLimit: 10000,
      storageGb: 100,
      features: JSON.stringify({
        chrome_extension: true,
        shared_inbox: true,
        ai_copilot: true,
        ai_autopilot: true,
        advanced_automation: true,
        crm_sync: true,
        analytics: true,
        tasks: true,
        quick_replies: true,
        automation_rules: true,
        webhook: true,
        zapier: true,
      }),
    },
  });

  await prisma.plan.upsert({
    where: { name: 'agency' },
    update: {},
    create: {
      name: 'agency',
      displayName: 'Agency / Reseller',
      priceMonthly: 29900,
      priceYearly: 299000,
      seats: 50,
      aiActionLimit: 10000,
      crmSyncLimit: 50000,
      storageGb: 500,
      features: JSON.stringify({
        chrome_extension: true,
        shared_inbox: true,
        ai_copilot: true,
        ai_autopilot: true,
        advanced_automation: true,
        crm_sync: true,
        analytics: true,
        tasks: true,
        quick_replies: true,
        automation_rules: true,
        webhook: true,
        zapier: true,
        reseller_portal: true,
        white_label: true,
      }),
    },
  });

  await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      displayName: 'Enterprise',
      priceMonthly: 0,
      priceYearly: 0,
      seats: 0,
      aiActionLimit: 0,
      crmSyncLimit: 0,
      storageGb: 0,
      isPublic: false,
      features: JSON.stringify({
        chrome_extension: true,
        shared_inbox: true,
        ai_copilot: true,
        ai_autopilot: true,
        advanced_automation: true,
        crm_sync: true,
        analytics: true,
        tasks: true,
        quick_replies: true,
        automation_rules: true,
        webhook: true,
        zapier: true,
        reseller_portal: true,
        white_label: true,
        sso: true,
        custom_onboarding: true,
        dedicated_support: true,
      }),
    },
  });

  console.log('Seeding feature flags...');
  await prisma.featureFlag.upsert({
    where: { key: 'ai_autopilot_v1' },
    update: {},
    create: {
      key: 'ai_autopilot_v1',
      description: 'Enable AI autopilot for level 3+ automation',
      defaultValue: false,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'advanced_analytics' },
    update: {},
    create: {
      key: 'advanced_analytics',
      description: 'Enable advanced revenue and support analytics',
      defaultValue: false,
    },
  });

  console.log('Seed complete.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
