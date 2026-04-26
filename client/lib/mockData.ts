import { FilterState } from "@/lib/filterContext";
import * as Location from "expo-location";

export interface Listing {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek: number;
  city: string;
  region: string;
  state: string;
  latitude: number;
  longitude: number;
  hostName: string;
  hostId: string;
  rating: number;
  reviewCount: number;
  features: string[];
  safetyRequirements: string;
  imageUrl: string;
  createdAt: Date;
}

const mockListings: Listing[] = [
  {
    id: "1",
    categoryId: "workshop",
    title: "Full Workshop with CNC & Welding",
    description: "Complete professional workshop space with CNC machine, MIG/TIG welding station, industrial lathe, and full range of metalworking tools. Perfect for automotive, fabrication, or custom projects.",
    pricePerHour: 25,
    pricePerDay: 150,
    pricePerWeek: 800,
    city: "San Francisco",
    region: "Bay Area",
    state: "California",
    latitude: 37.7749,
    longitude: -122.4194,
    hostName: "Mike's Workshop",
    hostId: "h1",
    rating: 4.9,
    reviewCount: 47,
    features: ["CNC Machine", "MIG/TIG Welding", "Industrial Lathe", "Air Compressor", "Ventilation System"],
    safetyRequirements: "Safety glasses and closed-toe shoes required. Welding certification needed for welding equipment.",
    imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    categoryId: "workshop",
    title: "Woodworking Studio",
    description: "Fully equipped woodworking studio with table saw, band saw, planer, jointer, and complete hand tool collection. Dust collection system throughout.",
    pricePerHour: 20,
    pricePerDay: 120,
    pricePerWeek: 650,
    city: "Oakland",
    region: "Bay Area",
    state: "California",
    latitude: 37.8044,
    longitude: -122.2712,
    hostName: "Bay Woodworks",
    hostId: "h2",
    rating: 4.7,
    reviewCount: 32,
    features: ["Table Saw", "Band Saw", "Planer", "Jointer", "Dust Collection"],
    safetyRequirements: "Eye protection required. Must complete safety orientation before first use.",
    imageUrl: "https://images.unsplash.com/photo-1597766659227-65cff803cce0?w=400&h=400&fit=crop",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "3",
    categoryId: "heavy-machinery",
    title: "Mini Excavator - Kubota KX040",
    description: "Compact excavator perfect for landscaping, foundation work, or utility installations. Easy to transport, comes with multiple bucket attachments.",
    pricePerHour: 75,
    pricePerDay: 400,
    pricePerWeek: 2000,
    city: "San Jose",
    region: "Bay Area",
    state: "California",
    latitude: 37.3382,
    longitude: -121.8863,
    hostName: "Heavy Equipment Rentals",
    hostId: "h3",
    rating: 4.8,
    reviewCount: 89,
    features: ["4-Ton Capacity", "Rubber Tracks", "Multiple Buckets", "Thumb Attachment", "Delivery Available"],
    safetyRequirements: "Valid operator certification required. Site must be accessible for delivery truck.",
    imageUrl: "https://images.unsplash.com/photo-1635187316753-4d26a4623150?w=400&h=400&fit=crop",
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "4",
    categoryId: "heavy-machinery",
    title: "Skid Steer Loader - Bobcat S650",
    description: "Versatile skid steer with multiple attachments available including bucket, forks, auger, and trencher. Great for construction and landscaping.",
    pricePerHour: 65,
    pricePerDay: 350,
    pricePerWeek: 1800,
    city: "Fremont",
    region: "Bay Area",
    state: "California",
    latitude: 37.5485,
    longitude: -121.9886,
    hostName: "Bay Construction Rentals",
    hostId: "h4",
    rating: 4.6,
    reviewCount: 56,
    features: ["2,690 lb Capacity", "Multiple Attachments", "Enclosed Cab", "A/C", "Backup Camera"],
    safetyRequirements: "Operator training certificate required. Minimum 1-day rental.",
    imageUrl: "https://images.unsplash.com/photo-1616625330673-b74e2e05a66e?w=400&h=400&fit=crop",
    createdAt: new Date("2024-03-05"),
  },
  {
    id: "5",
    categoryId: "mid-size-equipment",
    title: "Commercial Pressure Washer - 4000 PSI",
    description: "Professional-grade hot water pressure washer. Perfect for driveways, decks, commercial cleaning, and graffiti removal.",
    pricePerHour: 15,
    pricePerDay: 85,
    pricePerWeek: 450,
    city: "Palo Alto",
    region: "Bay Area",
    state: "California",
    latitude: 37.4419,
    longitude: -122.1430,
    hostName: "Clean Pro Rentals",
    hostId: "h5",
    rating: 4.5,
    reviewCount: 78,
    features: ["4000 PSI", "Hot Water Capable", "50ft Hose", "Surface Cleaner Attachment", "Turbo Nozzle"],
    safetyRequirements: "Eye protection required. Do not use on painted surfaces without testing first.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop",
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "6",
    categoryId: "mid-size-equipment",
    title: "Riding Lawn Mower - 54\" Deck",
    description: "Commercial-grade zero-turn riding mower with 54-inch cutting deck. Perfect for large properties and landscaping businesses.",
    pricePerHour: 25,
    pricePerDay: 125,
    pricePerWeek: 650,
    city: "San Francisco",
    region: "Bay Area",
    state: "California",
    latitude: 37.7599,
    longitude: -122.4148,
    hostName: "Green Thumb Rentals",
    hostId: "h6",
    rating: 4.7,
    reviewCount: 41,
    features: ["54\" Cutting Deck", "Zero Turn", "Mulching Kit", "Bagger Available", "Fuel Included"],
    safetyRequirements: "Flat, obstacle-free terrain required. Not for slopes greater than 15 degrees.",
    imageUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=400&h=400&fit=crop",
    createdAt: new Date("2024-03-01"),
  },
  {
    id: "7",
    categoryId: "power-tools",
    title: "Professional Drill Set - DeWalt",
    description: "Complete DeWalt 20V MAX drill kit including hammer drill, impact driver, circular saw, and reciprocating saw with two batteries and charger.",
    pricePerHour: 8,
    pricePerDay: 45,
    pricePerWeek: 200,
    city: "Oakland",
    region: "Bay Area",
    state: "California",
    latitude: 37.8144,
    longitude: -122.2612,
    hostName: "Tool Time Rentals",
    hostId: "h7",
    rating: 4.9,
    reviewCount: 124,
    features: ["Hammer Drill", "Impact Driver", "Circular Saw", "Reciprocating Saw", "2 Batteries + Charger"],
    safetyRequirements: "Safety glasses required. Return tools clean and in original case.",
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop",
    createdAt: new Date("2024-01-25"),
  },
  {
    id: "8",
    categoryId: "power-tools",
    title: "Compound Miter Saw - 12\"",
    description: "Dual bevel sliding compound miter saw with laser guide. Perfect for trim work, framing, and furniture making.",
    pricePerHour: 10,
    pricePerDay: 55,
    pricePerWeek: 275,
    city: "San Jose",
    region: "Bay Area",
    state: "California",
    latitude: 37.3282,
    longitude: -121.8763,
    hostName: "Saw Master Pro",
    hostId: "h8",
    rating: 4.8,
    reviewCount: 67,
    features: ["12\" Blade", "Dual Bevel", "Sliding Arm", "Laser Guide", "Dust Bag"],
    safetyRequirements: "Eye and ear protection required. Do not cut metal without proper blade.",
    imageUrl: "https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400&h=400&fit=crop",
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "9",
    categoryId: "hand-tools",
    title: "Complete Mechanic Tool Set",
    description: "Professional 450-piece mechanic tool set with ratchets, sockets (SAE & Metric), wrenches, pliers, and specialty automotive tools.",
    pricePerHour: 5,
    pricePerDay: 30,
    pricePerWeek: 150,
    city: "Fremont",
    region: "Bay Area",
    state: "California",
    latitude: 37.5385,
    longitude: -121.9786,
    hostName: "Auto Pro Tools",
    hostId: "h9",
    rating: 4.6,
    reviewCount: 93,
    features: ["450 Pieces", "SAE & Metric", "Rolling Tool Chest", "Specialty Tools", "Torque Wrench"],
    safetyRequirements: "All tools must be returned clean. Missing items will be charged at replacement cost.",
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=400&h=400&fit=crop",
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "10",
    categoryId: "hand-tools",
    title: "Professional Plumbing Kit",
    description: "Complete plumbing tool set including pipe wrenches, basin wrench, tubing cutter, PEX crimping tool, and pipe threading kit.",
    pricePerHour: 6,
    pricePerDay: 35,
    pricePerWeek: 175,
    city: "San Francisco",
    region: "Bay Area",
    state: "California",
    latitude: 37.7849,
    longitude: -122.4094,
    hostName: "Plumber's Toolbox",
    hostId: "h10",
    rating: 4.7,
    reviewCount: 52,
    features: ["Pipe Wrenches (3 sizes)", "Basin Wrench", "Tubing Cutter", "PEX Crimping Tool", "Thread Kit"],
    safetyRequirements: "Return tools clean and dry. Specialty items must be inspected upon return.",
    imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=400&fit=crop",
    createdAt: new Date("2024-03-10"),
  },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getMockListings(
  categoryId: string,
  filters: FilterState,
  userLocation: Location.LocationObject | null
): Listing[] {
  let filtered = mockListings.filter((listing) => listing.categoryId === categoryId);

  if (filters.state) {
    filtered = filtered.filter((listing) => listing.state === filters.state);
  }

  if (filters.region) {
    filtered = filtered.filter((listing) => listing.region === filters.region);
  }

  if (filters.city) {
    filtered = filtered.filter((listing) => listing.city === filters.city);
  }

  if (filters.proximityMiles && userLocation) {
    filtered = filtered.filter((listing) => {
      const distance = getDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        listing.latitude,
        listing.longitude
      );
      return distance <= filters.proximityMiles!;
    });
  }

  return filtered;
}

export function getMockListingById(id: string): Listing | undefined {
  return mockListings.find((listing) => listing.id === id);
}

export function getAllMockListings(): Listing[] {
  return mockListings;
}
