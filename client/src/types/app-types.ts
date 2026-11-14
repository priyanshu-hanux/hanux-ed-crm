export interface Destination {
  id: string;
  name: string;
  accommodation_id: string[];
  price: number;
  country: string;
  state: string | null;
  city: string | null;
  description: string | null;
  short_description: string | null;
  latitude: number | null;
  longitude: number | null;
  image_urls: string[] | null;
  best_time_to_visit: string | null;
  climate: string | null;
  currency: string | null;
  language: string | null;
  time_zone: string | null;
  visa_requirements: string | null;
  health_safety_info: string | null;
  local_customs: string | null;
  rating: number | null;
  review_count: number | null;
  popularity_score: number | null;
  tags: string[] | null;
  attractions: string[] | null;
  transportation_info: string | null;
  weather_info: string | null;
  is_active: boolean | null;
  featured: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Lead {
  name: string;
  company: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  occupation: string;
  status: string;
  assigned_to: string;
  source: string;
  certifications: string;
  education: string;
  created_on: string;
  updated_by: string;
}