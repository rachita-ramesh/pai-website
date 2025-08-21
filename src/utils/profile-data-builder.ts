// Profile Data Builder for New Structure
// Converts interview responses to structured profile data

import { 
  NewProfileData, 
  CentrepieceData, 
  BeautyCategoryData, 
  FacialMoisturizerProductData 
} from '../types/profile-data'

interface InterviewResponse {
  question_id: string
  question_text: string
  response: string
}

interface QuestionnaireCompletion {
  questionnaire_type: 'centrepiece' | 'category' | 'product'
  questionnaire_name: string
  category?: string
  completion_data: {
    responses: InterviewResponse[]
    transcript?: string
    session_id?: string
  }
}

export class ProfileDataBuilder {
  private profileData: NewProfileData = {}

  constructor() {
    this.profileData = {
      centrepiece: undefined,
      categories: {},
      products: {}
    }
  }

  /**
   * Add centrepiece questionnaire data
   */
  addCentrepieceData(completion: QuestionnaireCompletion): void {
    if (completion.questionnaire_type !== 'centrepiece') {
      throw new Error('Invalid questionnaire type for centrepiece data')
    }

    const responses = completion.completion_data.responses
    const centrepiece: CentrepieceData = {
      demographics: this.extractDemographics(responses),
      lifestyle: this.extractLifestyle(responses),
      media_culture: this.extractMediaCulture(responses),
      personality: this.extractPersonality(responses),
      values_beliefs: this.extractValuesBeliefs(responses)
    }

    this.profileData.centrepiece = centrepiece
  }

  /**
   * Add category questionnaire data (e.g., beauty, fitness)
   */
  addCategoryData(completion: QuestionnaireCompletion): void {
    if (completion.questionnaire_type !== 'category') {
      throw new Error('Invalid questionnaire type for category data')
    }

    if (!completion.category) {
      throw new Error('Category name is required for category questionnaires')
    }

    if (!this.profileData.categories) {
      this.profileData.categories = {}
    }

    const responses = completion.completion_data.responses
    
    switch (completion.category.toLowerCase()) {
      case 'beauty':
        this.profileData.categories.beauty = this.extractBeautyData(responses)
        break
      case 'fitness':
        // TODO: Implement when fitness questionnaire is defined
        this.profileData.categories.fitness = this.extractGenericCategoryData(responses)
        break
      case 'nutrition':
        // TODO: Implement when nutrition questionnaire is defined
        this.profileData.categories.nutrition = this.extractGenericCategoryData(responses)
        break
      default:
        // Generic category handling
        this.profileData.categories[completion.category] = this.extractGenericCategoryData(responses)
    }
  }

  /**
   * Add product questionnaire data (e.g., moisturizer, sunscreen)
   */
  addProductData(completion: QuestionnaireCompletion): void {
    if (completion.questionnaire_type !== 'product') {
      throw new Error('Invalid questionnaire type for product data')
    }

    if (!this.profileData.products) {
      this.profileData.products = {}
    }

    const responses = completion.completion_data.responses
    
    switch (completion.questionnaire_name.toLowerCase()) {
      case 'facial_moisturizer':
      case 'moisturizer':
        this.profileData.products.facial_moisturizer = this.extractMoisturizerData(responses)
        break
      case 'sunscreen':
        // TODO: Implement when sunscreen questionnaire is defined
        this.profileData.products.sunscreen = this.extractGenericProductData(responses)
        break
      default:
        // Generic product handling
        this.profileData.products[completion.questionnaire_name] = this.extractGenericProductData(responses)
    }
  }

  /**
   * Get the built profile data
   */
  getProfileData(): NewProfileData {
    return this.profileData
  }

  /**
   * Extract demographics from centrepiece responses
   */
  private extractDemographics(responses: InterviewResponse[]) {
    return {
      name: this.findResponse(responses, ['name', 'your_name']),
      age: this.parseNumber(this.findResponse(responses, ['age', 'how_old'])),
      age_range: this.findResponse(responses, ['age_range', 'age_group']),
      gender: this.findResponse(responses, ['gender', 'gender_identity']),
      country: this.findResponse(responses, ['country', 'location', 'where_live']),
      state: this.findResponse(responses, ['state', 'province']),
      city: this.findResponse(responses, ['city', 'town']),
      education_level: this.findResponse(responses, ['education', 'education_level', 'school']),
      employment: this.findResponse(responses, ['employment', 'job', 'work', 'occupation']),
      income: this.findResponse(responses, ['income', 'salary', 'earnings'])
    }
  }

  /**
   * Extract lifestyle from centrepiece responses
   */
  private extractLifestyle(responses: InterviewResponse[]) {
    return {
      daily_life_work: this.findResponse(responses, ['daily_life', 'weekday', 'work_life', 'average_day']),
      activity_wellness: this.findResponse(responses, ['activity', 'wellness', 'exercise', 'fitness', 'mental_health']),
      interests_hobbies: this.findResponse(responses, ['interests', 'hobbies', 'favorite_activities']),
      weekend_life: this.findResponse(responses, ['weekend', 'weekend_life', 'free_time'])
    }
  }

  /**
   * Extract media culture from centrepiece responses
   */
  private extractMediaCulture(responses: InterviewResponse[]) {
    return {
      news_information: this.findResponse(responses, ['news', 'information', 'media_consumption']),
      social_media_use: this.findResponse(responses, ['social_media', 'platforms', 'social_platforms']),
      tv_movies_sports: this.findResponse(responses, ['tv', 'movies', 'sports', 'entertainment']),
      music: this.findResponse(responses, ['music', 'concerts', 'festivals']),
      celebrities_influences: this.findResponse(responses, ['celebrities', 'influences', 'public_figures'])
    }
  }

  /**
   * Extract personality from centrepiece responses
   */
  private extractPersonality(responses: InterviewResponse[]) {
    return {
      self_description: this.findResponse(responses, ['self_description', 'describe_yourself', 'personality']),
      misunderstood: this.findResponse(responses, ['misunderstood', 'misunderstand', 'dont_know_about']),
      curiosity_openness: this.findResponse(responses, ['curiosity', 'openness', 'explore_new', 'new_experiences']),
      structure_vs_spontaneity: this.findResponse(responses, ['structure', 'spontaneity', 'plans', 'flow']),
      social_energy: this.findResponse(responses, ['social_energy', 'energized', 'people', 'alone_time']),
      stress_challenge: this.findResponse(responses, ['stress', 'challenge', 'handle_stress', 'stressful']),
      signature_strengths: this.findResponse(responses, ['strengths', 'personal_strengths', 'rely_on'])
    }
  }

  /**
   * Extract values and beliefs from centrepiece responses
   */
  private extractValuesBeliefs(responses: InterviewResponse[]) {
    return {
      core_values: this.findResponse(responses, ['values', 'core_values', 'important', 'family_health']),
      influence_advice: this.findResponse(responses, ['advice', 'trust', 'influence']),
      cultural_political_engagement: this.findResponse(responses, ['politics', 'current_events', 'political', 'social_issues']),
      aspirations_worldview: this.findResponse(responses, ['aspirations', 'worldview', 'positive_change', 'change_world']),
      decision_priorities: this.findResponse(responses, ['decisions', 'decision_priorities', 'big_decisions'])
    }
  }

  /**
   * Extract beauty category data
   */
  private extractBeautyData(responses: InterviewResponse[]): BeautyCategoryData {
    return {
      skin_hair_type: {
        skin_type: this.findResponse(responses, ['skin_type', 'describe_skin', 'skin']),
        skin_concerns: this.findResponse(responses, ['skin_concerns', 'skin_goals', 'skin_issues']),
        hair_type: this.findResponse(responses, ['hair_type', 'describe_hair', 'hair']),
        hair_concerns: this.findResponse(responses, ['hair_concerns', 'hair_goals', 'hair_issues'])
      },
      routine: {
        morning_routine: this.findResponse(responses, ['morning_routine', 'morning', 'am_routine']),
        evening_routine: this.findResponse(responses, ['evening_routine', 'night', 'pm_routine']),
        time_on_routine: this.findResponse(responses, ['time_routine', 'time_spend', 'routine_time']),
        extra_products_in_routine: this.findResponse(responses, ['extra_products', 'weekly', 'masks', 'treatments']),
        changes_based_on_seasonality: this.findResponse(responses, ['seasonality', 'seasons', 'climate']),
        hero_product: this.findResponse(responses, ['hero_product', 'most_important', 'essential_product']),
        beauty_routine_frustrations: this.findResponse(responses, ['frustrations', 'hassle', 'routine_problems']),
        self_care_perception: this.findResponse(responses, ['self_care', 'maintenance', 'look_forward']),
        beauty_routine_motivation: this.findResponse(responses, ['motivation', 'role', 'feeling_good', 'creativity']),
        product_experimentation: this.findResponse(responses, ['experimentation', 'stick_same', 'trying_new']),
        buyer_type: this.findResponse(responses, ['buyer_type', 'budget', 'premium', 'mix']),
        engagement_with_beauty: this.findResponse(responses, ['engagement', 'follow_brands', 'tutorials', 'reviews'])
      }
    }
  }

  /**
   * Extract moisturizer product data
   */
  private extractMoisturizerData(responses: InterviewResponse[]): FacialMoisturizerProductData {
    return {
      facial_moisturizer_attitudes: {
        benefits_sought: this.findResponse(responses, ['benefits_sought', 'look_for', 'attributes']),
        most_important_benefit: this.findResponse(responses, ['most_important', 'single_benefit', 'deliver']),
        sustainable_values: this.findResponse(responses, ['sustainable', 'clean', 'natural', 'vegan']),
        ingredients_seeking: this.findResponse(responses, ['ingredients_seeking', 'specific_ingredients', 'look_for']),
        ingredients_avoided: this.findResponse(responses, ['ingredients_avoided', 'avoid', 'distrust']),
        dermatologist_recommended: this.findResponse(responses, ['dermatologist', 'recommended', 'important']),
        moisturizer_frustrations: this.findResponse(responses, ['frustrations', 'challenges', 'face'])
      },
      moisturizer_usage: {
        current_product_usage: this.findResponse(responses, ['current_product', 'using_right_now', 'brand']),
        current_product_satisfaction: this.findResponse(responses, ['satisfaction', 'like_dislike', 'frustrates']),
        brand_awareness: this.findResponse(responses, ['brand_awareness', 'other_brands', 'aware_of']),
        brand_consideration: this.findResponse(responses, ['brand_consideration', 'open_considering', 'future']),
        past_usage: this.findResponse(responses, ['past_usage', 'used_past', 'brands_used']),
        switching_triggers: this.findResponse(responses, ['switching', 'triggers', 'motivates', 'try_new'])
      },
      shopping_behaviors: {
        online_vs_instore_shopping: this.findResponse(responses, ['online_instore', 'shop', 'websites', 'stores']),
        purchase_frequency: this.findResponse(responses, ['frequency', 'how_often', 'purchase', 'typical_year']),
        budget_price_point: this.findResponse(responses, ['budget', 'price_point', 'spend', 'affordable']),
        premium_cues: this.findResponse(responses, ['premium', 'worth_paying', 'feel_premium']),
        deal_sensitivity: this.findResponse(responses, ['deals', 'sales', 'discounts', 'promotions']),
        packaging_presentation: this.findResponse(responses, ['packaging', 'presentation', 'notice_first', 'stands_out']),
        brand_attributes: this.findResponse(responses, ['brand_attributes', 'trusting', 'reliable', 'want_buy'])
      },
      information_sources_messaging: {
        information_searching: this.findResponse(responses, ['information_searching', 'online_search', 'ingredients', 'reviews']),
        general_information_sources: this.findResponse(responses, ['information_sources', 'look_for', 'stay_up_date']),
        ideal_product: this.findResponse(responses, ['ideal_product', 'perfect', 'design', 'qualities'])
      }
    }
  }

  /**
   * Generic category data extraction (for categories not yet specifically implemented)
   */
  private extractGenericCategoryData(responses: InterviewResponse[]) {
    const data: Record<string, string> = {}
    responses.forEach(response => {
      data[response.question_id] = response.response
    })
    return data
  }

  /**
   * Generic product data extraction (for products not yet specifically implemented)
   */
  private extractGenericProductData(responses: InterviewResponse[]) {
    const data: Record<string, string> = {}
    responses.forEach(response => {
      data[response.question_id] = response.response
    })
    return data
  }

  /**
   * Find response by matching question keywords
   */
  private findResponse(responses: InterviewResponse[], keywords: string[]): string | undefined {
    for (const keyword of keywords) {
      const response = responses.find(r => 
        r.question_id.toLowerCase().includes(keyword.toLowerCase()) ||
        r.question_text.toLowerCase().includes(keyword.toLowerCase())
      )
      if (response) {
        return response.response
      }
    }
    return undefined
  }

  /**
   * Parse string to number, return undefined if invalid
   */
  private parseNumber(value: string | undefined): number | undefined {
    if (!value) return undefined
    const num = parseInt(value, 10)
    return isNaN(num) ? undefined : num
  }
}

/**
 * Convenience function to build profile data from multiple questionnaire completions
 */
export function buildProfileDataFromCompletions(completions: QuestionnaireCompletion[]): NewProfileData {
  const builder = new ProfileDataBuilder()
  
  completions.forEach(completion => {
    switch (completion.questionnaire_type) {
      case 'centrepiece':
        builder.addCentrepieceData(completion)
        break
      case 'category':
        builder.addCategoryData(completion)
        break
      case 'product':
        builder.addProductData(completion)
        break
    }
  })
  
  return builder.getProfileData()
}

/**
 * Migrate legacy profile data to new structure (best effort)
 */
export function migrateLegacyProfileData(legacyData: Record<string, unknown>): NewProfileData {
  const newData: NewProfileData = {}
  
  // Try to extract centrepiece-like data from legacy structure
  if (legacyData.demographics || legacyData.core_attitudes || legacyData.decision_psychology) {
    newData.centrepiece = {
      demographics: {
        age_range: typeof legacyData.demographics === 'object' && legacyData.demographics !== null ? 
          (legacyData.demographics as Record<string, unknown>).age_range as string : undefined,
        // Map other legacy fields as needed
      },
      personality: {
        // Map core_attitudes to personality traits
      },
      values_beliefs: {
        // Map decision_psychology to values/beliefs
      }
    }
  }
  
  return newData
}