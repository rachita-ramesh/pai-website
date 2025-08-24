// New Profile Data Structure for PAI Digital Twins
// Based on Centrepiece, Category, and Product questionnaire structures

export interface Demographics {
  name?: string
  age?: number
  age_range?: string
  gender?: string
  country?: string
  state?: string
  city?: string
  education_level?: string
  employment?: string
  income?: string
}

export interface Lifestyle {
  daily_life_work?: string
  activity_wellness?: string
  interests_hobbies?: string
  weekend_life?: string
}

export interface MediaCulture {
  news_information?: string
  social_media_use?: string
  tv_movies_sports?: string
  music?: string
  celebrities_influences?: string
}

export interface Personality {
  self_description?: string
  misunderstood?: string
  curiosity_openness?: string
  structure_vs_spontaneity?: string
  social_energy?: string
  stress_challenge?: string
  signature_strengths?: string
}

export interface ValuesBeliefs {
  core_values?: string
  influence_advice?: string
  cultural_political_engagement?: string
  aspirations_worldview?: string
  decision_priorities?: string
}

export interface CentrepieceData {
  demographics?: Demographics
  lifestyle?: Lifestyle
  media_culture?: MediaCulture
  personality?: Personality
  values_beliefs?: ValuesBeliefs
}

// Beauty Category Interfaces
export interface SkinHairType {
  skin_type?: string
  skin_concerns?: string
  hair_type?: string
  hair_concerns?: string
}

export interface BeautyRoutine {
  morning_routine?: string
  evening_routine?: string
  time_on_routine?: string
  extra_products_in_routine?: string
  changes_based_on_seasonality?: string
  hero_product?: string
  beauty_routine_frustrations?: string
  self_care_perception?: string
  beauty_routine_motivation?: string
  product_experimentation?: string
  buyer_type?: string
  engagement_with_beauty?: string
}

export interface BeautyCategoryData extends Record<string, unknown> {
  skin_hair_type?: SkinHairType
  routine?: BeautyRoutine
}

// Moisturizer Product Interfaces
export interface FacialMoisturizerAttitudes {
  benefits_sought?: string
  most_important_benefit?: string
  sustainable_values?: string
  ingredients_seeking?: string
  ingredients_avoided?: string
  dermatologist_recommended?: string
  moisturizer_frustrations?: string
}

export interface MoisturizerUsage {
  current_product_usage?: string
  current_product_satisfaction?: string
  brand_awareness?: string
  brand_consideration?: string
  past_usage?: string
  switching_triggers?: string
}

export interface ShoppingBehaviors {
  online_vs_instore_shopping?: string
  purchase_frequency?: string
  budget_price_point?: string
  premium_cues?: string
  deal_sensitivity?: string
  packaging_presentation?: string
  brand_attributes?: string
}

export interface InformationSourcesMessaging {
  information_searching?: string
  general_information_sources?: string
  ideal_product?: string
}

export interface FacialMoisturizerProductData extends Record<string, unknown> {
  facial_moisturizer_attitudes?: FacialMoisturizerAttitudes
  moisturizer_usage?: MoisturizerUsage
  shopping_behaviors?: ShoppingBehaviors
  information_sources_messaging?: InformationSourcesMessaging
}

// Main Profile Data Structure
export interface NewProfileData {
  centrepiece?: CentrepieceData
  categories?: {
    beauty?: BeautyCategoryData
    fitness?: Record<string, unknown> // To be defined when fitness questionnaire is added
    nutrition?: Record<string, unknown> // To be defined when nutrition questionnaire is added
    [categoryName: string]: Record<string, unknown> | undefined // Allow for dynamic categories
  }
  products?: {
    facial_moisturizer?: FacialMoisturizerProductData
    sunscreen?: Record<string, unknown> // To be defined when sunscreen questionnaire is added
    cleanser?: Record<string, unknown> // To be defined when cleanser questionnaire is added
    [productName: string]: Record<string, unknown> | undefined // Allow for dynamic products
  }
}

// Legacy support for existing profile data
export interface LegacyProfileData {
  profile_id?: string
  demographics?: Record<string, unknown>
  core_attitudes?: Record<string, unknown>
  decision_psychology?: Record<string, unknown>
  lifestyle_preferences?: Record<string, unknown>
  social_tendencies?: Record<string, unknown>
  consumption_patterns?: Record<string, unknown>
  communication_style?: Record<string, unknown>
  motivation_drivers?: Record<string, unknown>
  risk_tolerance?: Record<string, unknown>
  aesthetic_preferences?: Record<string, unknown>
  [key: string]: unknown
}

// Union type to support both old and new formats during migration
export type ProfileData = NewProfileData | LegacyProfileData

// Type guard to check if profile data is new format
export function isNewProfileData(data: ProfileData): data is NewProfileData {
  return data && typeof data === 'object' && 
    (('centrepiece' in data || 'categories' in data || 'products' in data) ||
     ('profile_data' in data && typeof (data as any).profile_data === 'object'))
}

// Type guard to check if profile data is legacy format  
export function isLegacyProfileData(data: ProfileData): data is LegacyProfileData {
  return data && typeof data === 'object' && !isNewProfileData(data)
}