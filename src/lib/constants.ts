export const VIP_LEVELS = [
  { level: 0, name: "სტანდარტი", price: 0, reward: 0.10, commission: 0, color: "from-gray-600 to-gray-800" },
  { level: 1, name: "VIP 1", price: 50, reward: 1.00, commission: 8, color: "from-red-700 to-red-900" },
  { level: 2, name: "VIP 2", price: 99, reward: 2.30, commission: 15, color: "from-red-600 to-red-800" },
  { level: 3, name: "VIP 3", price: 155, reward: 3.40, commission: 20, color: "from-red-500 to-red-700" },
  { level: 4, name: "VIP 4", price: 230, reward: 5.00, commission: 25, color: "from-red-500 to-black" },
  { level: 5, name: "VIP 5", price: 320, reward: 7.50, commission: 35, color: "from-red-600 to-black" },
];

export const REFERRAL_MILESTONES = [
  { count: 50, bonus: 20 },
  { count: 100, bonus: 35 },
  { count: 300, bonus: 50 },
];

export const FREE_VIP_REQUIREMENT = 3; // Number of referrals who must purchase a VIP level to get it free

export const MIN_WITHDRAWAL_AMOUNT = 10; // Minimum withdrawal in dollars

export const TASKS = [
  {
    id: "telegram",
    name: "Telegram არხზე გაწევრიანება",
    description: "შემოუერთდით ჩვენს Telegram არხს",
    icon: "Send",
    url: "https://t.me/+aH7m5uWQG2Q1OTUy",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "facebook",
    name: "Facebook გვერდის მოწონება",
    description: "მოიწონეთ ჩვენი Facebook გვერდი",
    icon: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61586739743816",
    color: "from-blue-600 to-blue-700",
  },
  {
    id: "instagram",
    name: "Instagram-ის გამოწერა",
    description: "გამოიწერეთ ჩვენი Instagram გვერდი",
    icon: "Instagram",
    url: "https://www.instagram.com/autoearnmedia_/",
    color: "from-pink-500 to-purple-500",
  },
  {
    id: "instagram_like",
    name: "Instagram პოსტის მოწონება",
    description: "დაალაიქეთ მოცემული პოსტი ინსტაგრამზე",
    icon: "Instagram",
    url: "https://www.instagram.com/p/DTgF5FlCg72/",
    color: "from-pink-500 to-purple-500",
  },
  {
    id: "facebook_like",
    name: "Facebook პოსტის დალაიქება",
    description: "გადადით ლინკზე და მოიწონეთ პოსტი",
    icon: "Facebook",
    url: "https://www.facebook.com/share/p/1BmKmKuqQj/",
    color: "from-blue-600 to-blue-700",
  },
];

export const DEPOSIT_ADDRESS = "TJ7Hhzgz7y6N3pYUCqPuMBDeAAYaT2PYNE";

export const PLATFORM_STATS = {
  dailyVisits: 1420,
  dailyRegistrations: 94,
  totalPaidOut: 14650.50,
  workingDays: 156,
};
