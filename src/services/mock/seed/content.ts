/**
 * Content pools for seeding. Handwritten, not faker.
 *
 * The Day 4 rule — real example values, never placeholders — applies hardest to
 * seed data, because seed data is what everyone actually looks at. Names are
 * plausible Brightcart customers; subjects are the four things Brightcart's
 * customers actually write in about, phrased the way a person writes them.
 */

import type { TicketCategory } from '../../../types/domain';

/** mulberry32 — small, fast, deterministic. Same seed, same product, every run. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(items: readonly T[], r: () => number): T {
  return items[Math.floor(r() * items.length)];
}

/** Deterministic Fisher–Yates. Used to spread categories and bands without clumping. */
export function shuffle<T>(items: readonly T[], r: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const CUSTOMER_NAMES: readonly string[] = [
  'Ritika Sharma',
  'Sunil Kamath',
  'Neha Agarwal',
  'Imran Sheikh',
  'Deepa Menon',
  'Harish Rane',
  'Pooja Bhatt',
  'Ajay Kulkarni',
  'Fatima Ansari',
  'Rohan D’Souza',
  'Swati Gaikwad',
  'Naveen Reddy',
  'Ishita Banerjee',
  'Kabir Malhotra',
  'Lakshmi Iyer',
  'Zoya Khan',
  'Prakash Jadhav',
  'Ananya Bose',
  'Vivek Chandran',
  'Ruchi Saxena',
  'Tarun Ghosh',
  'Sadia Rahman',
  'Gaurav Pandey',
  'Mitali Deshmukh',
  'Arif Qureshi',
  'Shreya Nambiar',
  'Devendra Patil',
  'Kavya Srinivasan',
  'Nitin Wagh',
  'Aisha Merchant',
  'Yash Thakur',
  'Sunita Barve',
  'Rajat Khurana',
  'Preeti Salunkhe',
  'Om Prakash Yadav',
  'Nandini Rao',
  'Farhan Siddiqui',
  'Trupti More',
  'Sandeep Chawla',
  'Bhavna Shetty'
];

export const EMAIL_DOMAINS: readonly string[] = [
  'gmail.com',
  'outlook.com',
  'yahoo.in',
  'rediffmail.com'
];

export function customerEmail(name: string, r: () => number): string {
  const [first, last] = name.toLowerCase().replace(/[’']/g, '').split(' ');
  return `${first}.${last[0]}@${pick(EMAIL_DOMAINS, r)}`;
}

export const SUBJECTS: Readonly<Record<TicketCategory, readonly string[]>> = {
  refund: [
    'Refund not received',
    'Refund still showing as processing',
    'Order cancelled, no refund yet',
    'Duplicate charge on my card',
    'Returned the item, no update in 9 days',
    'Refund amount is less than what I paid',
    'Bank says no refund was initiated'
  ],
  delivery: [
    'Wrong item delivered',
    'Package marked delivered but not received',
    'Delivery 6 days late',
    'Courier keeps rescheduling',
    'Box arrived damaged',
    'Delivery address was changed without asking me',
    'One item missing from the parcel'
  ],
  order_change: [
    'Need to change delivery address',
    'Want to cancel before it ships',
    'Ordered the wrong size',
    'Can I add an item to this order',
    'Change the delivery date please'
  ],
  other: [
    'Cannot apply my coupon code',
    'Invoice needed for GST filing',
    'Account login not working',
    'Wrong price charged at checkout'
  ]
};

export const CATEGORY_LABEL: Readonly<Record<TicketCategory, string>> = {
  refund: 'Refunds',
  delivery: 'Delivery',
  order_change: 'Order change',
  other: 'Other'
};

/** Thread copy for ticket detail. Short, in a customer's own register. */
export const INBOUND_OPENERS: readonly string[] = [
  'I placed this order last week and there is still no update. Can someone please check.',
  'This is the third time I am writing about the same thing. Nobody has replied.',
  'Please look into this urgently, I need this sorted before the weekend.',
  'Attaching the screenshot again as asked. Please confirm what happens next.'
];

export const OUTBOUND_REPLIES: readonly string[] = [
  'Thanks for writing in. I have pulled up the order and I am checking with our logistics team now.',
  'Apologies for the delay. I can see the refund was initiated but not settled — I am escalating it today.',
  'I have raised this with the courier and asked for a resolution within 48 hours. I will update you here.'
];

export const INTERNAL_NOTES: readonly string[] = [
  'Courier confirmed the parcel is stuck at the Bhiwandi hub. Waiting on their ops team.',
  'Second contact from this customer on the same order — check before replying.',
  'Refund reference shared by finance. Settlement takes 5–7 working days from their side.'
];
