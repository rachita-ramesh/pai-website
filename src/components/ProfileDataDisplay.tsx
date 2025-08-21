// Profile Data Display Component
// Renders both new and legacy profile data structures

import React from 'react'
import { NewProfileData, LegacyProfileData, isNewProfileData, isLegacyProfileData } from '../types/profile-data'

interface ProfileDataDisplayProps {
  profileData: NewProfileData | LegacyProfileData
  profileId: string
}

export const ProfileDataDisplay: React.FC<ProfileDataDisplayProps> = ({ profileData, profileId }) => {
  if (isNewProfileData(profileData)) {
    return <NewProfileDataDisplay data={profileData} profileId={profileId} />
  } else if (isLegacyProfileData(profileData)) {
    return <LegacyProfileDataDisplay data={profileData} profileId={profileId} />
  } else {
    return <div>Invalid profile data structure</div>
  }
}

// New Profile Data Display Component
const NewProfileDataDisplay: React.FC<{ data: NewProfileData; profileId: string }> = ({ data }) => {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Centrepiece Section */}
      {data.centrepiece && (
        <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>
            🔮 Centrepiece (Core Foundation)
          </h4>
          
          {/* Demographics */}
          {data.centrepiece.demographics && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Demographics</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px' }}>
                {Object.entries(data.centrepiece.demographics).map(([key, value]) => 
                  value && (
                    <div key={key}>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Lifestyle */}
          {data.centrepiece.lifestyle && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Lifestyle</h5>
              <div style={{ fontSize: '14px' }}>
                {Object.entries(data.centrepiece.lifestyle).map(([key, value]) => 
                  value && (
                    <div key={key} style={{ marginBottom: '4px' }}>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Personality */}
          {data.centrepiece.personality && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Personality</h5>
              <div style={{ fontSize: '14px' }}>
                {Object.entries(data.centrepiece.personality).map(([key, value]) => 
                  value && (
                    <div key={key} style={{ marginBottom: '4px' }}>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Values & Beliefs */}
          {data.centrepiece.values_beliefs && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Values & Beliefs</h5>
              <div style={{ fontSize: '14px' }}>
                {Object.entries(data.centrepiece.values_beliefs).map(([key, value]) => 
                  value && (
                    <div key={key} style={{ marginBottom: '4px' }}>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Media & Culture */}
          {data.centrepiece.media_culture && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Media & Culture</h5>
              <div style={{ fontSize: '14px' }}>
                {Object.entries(data.centrepiece.media_culture).map(([key, value]) => 
                  value && (
                    <div key={key} style={{ marginBottom: '4px' }}>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories Section */}
      {data.categories && Object.keys(data.categories).length > 0 && (
        <div style={{ padding: '16px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>
            📂 Categories Completed
          </h4>
          {Object.entries(data.categories).map(([categoryName, categoryData]) => (
            <div key={categoryName} style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151', textTransform: 'capitalize' }}>
                {categoryName}
              </h5>
              <CategoryDataDisplay data={categoryData as Record<string, unknown>} categoryName={categoryName} />
            </div>
          ))}
        </div>
      )}

      {/* Products Section */}
      {data.products && Object.keys(data.products).length > 0 && (
        <div style={{ padding: '16px', backgroundColor: '#f0fff0', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>
            📦 Products Completed
          </h4>
          {Object.entries(data.products).map(([productName, productData]) => (
            <div key={productName} style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151', textTransform: 'capitalize' }}>
                {productName.replace(/_/g, ' ')}
              </h5>
              <ProductDataDisplay data={productData as Record<string, unknown>} productName={productName} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Category Data Display
const CategoryDataDisplay: React.FC<{ data: Record<string, unknown>; categoryName: string }> = ({ data, categoryName }) => {
  if (categoryName === 'beauty' && data.routine) {
    return (
      <div style={{ fontSize: '14px' }}>
        {data.skin_hair_type && typeof data.skin_hair_type === 'object' && data.skin_hair_type !== null ? (
          <div style={{ marginBottom: '12px' }}>
            <strong>Skin & Hair:</strong>
            <div style={{ marginLeft: '16px', marginTop: '4px' }}>
              {Object.entries(data.skin_hair_type as Record<string, unknown>).map(([key, value]) => 
                value && typeof value === 'string' ? (
                  <div key={key}>• {key.replace(/_/g, ' ')}: {value}</div>
                ) : null
              )}
            </div>
          </div>
        ) : null}
        {data.routine && typeof data.routine === 'object' && data.routine !== null ? (
          <div>
            <strong>Beauty Routine:</strong>
            <div style={{ marginLeft: '16px', marginTop: '4px' }}>
              {Object.entries(data.routine as Record<string, unknown>).map(([key, value]) => 
                value && typeof value === 'string' ? (
                  <div key={key}>• {key.replace(/_/g, ' ')}: {value}</div>
                ) : null
              )}
            </div>
          </div>
        ) : null}
      </div>
    )
  }
  
  // Generic category display
  return (
    <div style={{ fontSize: '14px' }}>
      {Object.entries(data).map(([key, value]) => 
        value && typeof value === 'string' ? (
          <div key={key} style={{ marginBottom: '4px' }}>
            <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
          </div>
        ) : null
      )}
    </div>
  )
}

// Product Data Display
const ProductDataDisplay: React.FC<{ data: Record<string, unknown>; productName: string }> = ({ data, productName }) => {
  if (productName === 'facial_moisturizer' && data.facial_moisturizer_attitudes) {
    return (
      <div style={{ fontSize: '14px' }}>
        {Object.entries(data).map(([sectionKey, sectionData]) => (
          <div key={sectionKey} style={{ marginBottom: '12px' }}>
            <strong>{sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>
            <div style={{ marginLeft: '16px', marginTop: '4px' }}>
              {typeof sectionData === 'object' && sectionData !== null ? (
                Object.entries(sectionData as Record<string, unknown>).map(([key, value]) => 
                  value && typeof value === 'string' ? (
                    <div key={key}>• {key.replace(/_/g, ' ')}: {value}</div>
                  ) : null
                )
              ) : (
                typeof sectionData === 'string' && <div>{sectionData}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Generic product display
  return (
    <div style={{ fontSize: '14px' }}>
      {Object.entries(data).map(([key, value]) => 
        value && typeof value === 'string' ? (
          <div key={key} style={{ marginBottom: '4px' }}>
            <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
          </div>
        ) : null
      )}
    </div>
  )
}

// Legacy Profile Data Display (unchanged for backward compatibility)
const LegacyProfileDataDisplay: React.FC<{ data: LegacyProfileData; profileId: string }> = ({ data }) => {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ padding: '16px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
        <div style={{ fontSize: '14px', color: '#856404', marginBottom: '8px' }}>
          ⚠️ <strong>Legacy Profile Structure</strong> - This profile uses the old data format
        </div>
      </div>
      
      {/* Demographics Section */}
      {data.demographics && (
        <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>Demographics</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px' }}>
            {typeof data.demographics === 'object' && data.demographics !== null ? (
              <>
                {(data.demographics as Record<string, unknown>).age_range && typeof (data.demographics as Record<string, unknown>).age_range === 'string' ? (
                  <div><strong>Age Range:</strong> {(data.demographics as Record<string, unknown>).age_range as string}</div>
                ) : null}
                {(data.demographics as Record<string, unknown>).lifestyle && typeof (data.demographics as Record<string, unknown>).lifestyle === 'string' ? (
                  <div><strong>Lifestyle:</strong> {(data.demographics as Record<string, unknown>).lifestyle as string}</div>
                ) : null}
                {(data.demographics as Record<string, unknown>).context && typeof (data.demographics as Record<string, unknown>).context === 'string' ? (
                  <div><strong>Context:</strong> {(data.demographics as Record<string, unknown>).context as string}</div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Core Attitudes Section */}
      {data.core_attitudes && (
        <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>Core Attitudes</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px' }}>
            {typeof data.core_attitudes === 'object' && data.core_attitudes !== null && 
              Object.entries(data.core_attitudes as Record<string, unknown>).map(([key, value]) => 
                typeof value === 'string' ? (
                  <div key={key}><strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}</div>
                ) : null
              )
            }
          </div>
        </div>
      )}
      
      {/* Other legacy sections would continue here... */}
    </div>
  )
}