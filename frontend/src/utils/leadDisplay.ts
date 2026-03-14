type LeadIdentity = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

const FIRST_NAMES = [
  'Aarav','Aditi','Akash','Ananya','Arjun','Bhavna','Dev','Diya','Eshan','Ira',
  'Ishan','Kavya','Kunal','Meera','Neha','Nikhil','Priya','Rahul','Riya','Rohit',
  'Saanvi','Sanjana','Sarthak','Shreya','Tanvi','Varun','Ved','Zoya'
];

const LAST_NAMES = [
  'Sharma','Verma','Gupta','Kapoor','Mehta','Nair','Iyer','Reddy','Singh','Patel',
  'Malhotra','Bansal','Khanna','Chopra','Menon','Joshi','Kumar','Jain','Saha','Das'
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function makeFriendlyName(seed: string) {
  const hash = hashString(seed);
  const first = FIRST_NAMES[hash % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(hash / 7) % LAST_NAMES.length];
  return `${first} ${last}`;
}

export function getLeadDisplayName(lead?: LeadIdentity): string {
  const rawName = (lead?.name ?? '').trim();
  if (!rawName) return lead?.phone ?? lead?.email ?? 'Unknown Lead';
  if (/^k6-user-/i.test(rawName)) {
    return makeFriendlyName(rawName);
  }
  return rawName;
}
