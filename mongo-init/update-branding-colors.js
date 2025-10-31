// MongoDB update script to refresh branding.theme colors for all tenants
// Usage (inside container or host with mongosh):
//   mongosh --host localhost:27017 eduscale mongo-init/update-branding-colors.js

const updates = [
  {
    institution_id: 'universidad-buenos-aires',
    theme: { primary_color: '#0B3A6A', secondary_color: '#C9A227', accent_color: '#1E4976' }
  },
  {
    institution_id: 'universidad-catolica-argentina',
    theme: { primary_color: '#7A0019', secondary_color: '#C9A227', accent_color: '#4E000F' }
  },
  {
    institution_id: 'instituto-tecnologico-buenos-aires',
    theme: { primary_color: '#0A3D62', secondary_color: '#2C647F', accent_color: '#6C757D' }
  },
  {
    institution_id: 'universidad-tecnologica-nacional',
    theme: { primary_color: '#0B3C5D', secondary_color: '#328CC1', accent_color: '#1D2731' }
  },
  {
    institution_id: 'universidad-palermo',
    theme: { primary_color: '#1F2937', secondary_color: '#374151', accent_color: '#0EA5E9' }
  },
  {
    institution_id: 'universidad-nacional-la-plata',
    theme: { primary_color: '#7B1113', secondary_color: '#C0A062', accent_color: '#2F3E46' }
  },
  {
    institution_id: 'universidad-argentina-empresa',
    theme: { primary_color: '#003DA5', secondary_color: '#0B61BF', accent_color: '#1E3A8A' }
  },
  {
    institution_id: 'universidad-austral',
    theme: { primary_color: '#003B71', secondary_color: '#2B6CB0', accent_color: '#6C757D' }
  },
  {
    institution_id: 'universidad-torcuato-di-tella',
    theme: { primary_color: '#121212', secondary_color: '#B8860B', accent_color: '#2C2C2C' }
  },
  {
    institution_id: 'universidad-nacional-cordoba',
    theme: { primary_color: '#003366', secondary_color: '#B8860B', accent_color: '#2F4F4F' }
  }
];

const dbName = 'eduscale';
let db = db.getSiblingDB(dbName);

print('🔧 Updating branding.theme colors for tenants...');

updates.forEach(({ institution_id, theme }) => {
  const res = db.tenantconfigs.updateOne(
    { institution_id },
    { $set: {
        'branding.theme.primary_color': theme.primary_color,
        'branding.theme.secondary_color': theme.secondary_color,
        'branding.theme.accent_color': theme.accent_color
    } }
  );
  printjson({ institution_id, modifiedCount: res.modifiedCount });
});

print('✅ Branding colors updated.');
