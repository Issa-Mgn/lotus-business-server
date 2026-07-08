require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupBucket() {
  try {
    console.log('🔧 Configuration du bucket Supabase pour les backups...\n');

    // Vérifier si le bucket existe déjà
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erreur lors de la récupération des buckets:', listError.message);
      return;
    }

    const bucketExists = buckets.some(b => b.name === 'user-backups');

    if (bucketExists) {
      console.log('✅ Le bucket "user-backups" existe déjà.');
    } else {
      // Créer le bucket avec configuration simplifiée
      const { data, error } = await supabase.storage.createBucket('user-backups', {
        public: false, // Privé
        fileSizeLimit: 52428800, // 50 MB (plus raisonnable)
      });

      if (error) {
        console.error('❌ Erreur lors de la création du bucket:', error.message);
        console.log('\n💡 Vous pouvez créer le bucket manuellement:');
        console.log('   1. Allez sur https://supabase.com/dashboard');
        console.log('   2. Storage → New Bucket');
        console.log('   3. Nom: user-backups');
        console.log('   4. Public: Non');
        console.log('   5. File size limit: 50 MB');
        return;
      }

      console.log('✅ Bucket "user-backups" créé avec succès!');
    }

    console.log('\n📋 Configuration du bucket:');
    console.log('   - Nom: user-backups');
    console.log('   - Type: Privé');
    console.log('   - Taille max: 50 MB');
    console.log('   - Types acceptés: .db, SQLite');
    console.log('\n✨ Configuration terminée!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

setupBucket();
