/**
 * Service IA pour génération de documents comptables
 * Utilise Mistral AI en priorité, puis Groq en fallback
 */

const { Mistral } = require('@mistralai/mistralai');
const Groq = require('groq-sdk');

// Initialisation des clients
const mistralClient = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || ''
});

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

/**
 * Génère du contenu en utilisant Mistral en priorité, Groq en fallback
 */
async function generateWithFallback(prompt, options = {}) {
  const timeout = options.timeout || 10000; // 10 secondes par défaut

  // Tentative 1 : Mistral AI
  try {
    console.log('🤖 Tentative avec Mistral AI...');
    
    const mistralPromise = mistralClient.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // Plus déterministe pour la comptabilité
      maxTokens: 2000,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Mistral timeout')), timeout)
    );

    const response = await Promise.race([mistralPromise, timeoutPromise]);
    
    console.log('✅ Réponse obtenue via Mistral AI');
    return {
      provider: 'mistral',
      content: response.choices[0].message.content
    };

  } catch (mistralError) {
    console.warn('⚠️ Mistral AI échoué:', mistralError.message);
    console.log('🔄 Basculement vers Groq...');

    // Tentative 2 : Groq (fallback)
    try {
      const response = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Modèle actif et performant
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      });

      console.log('✅ Réponse obtenue via Groq');
      return {
        provider: 'groq',
        content: response.choices[0].message.content
      };

    } catch (groqError) {
      console.error('❌ Groq également échoué:', groqError.message);
      throw new Error('Tous les services IA sont indisponibles. Veuillez réessayer plus tard.');
    }
  }
}

/**
 * Génère un compte de résultat simplifié
 */
async function generateCompteResultat(data) {
  const { chiffreAffaires, coutAchat, chargesDiverses, periode, devise = 'FCFA' } = data;

  const prompt = `Tu es un expert comptable spécialisé en SYSCOHADA pour l'Afrique de l'Ouest.

Génère un compte de résultat simplifié pour la période : ${periode}

Données :
- Chiffre d'affaires : ${chiffreAffaires.toLocaleString()} ${devise}
- Coût d'achat des marchandises : ${coutAchat.toLocaleString()} ${devise}
- Charges diverses (transport, location, etc.) : ${chargesDiverses.toLocaleString()} ${devise}

Calcule :
1. Marge commerciale = Chiffre d'affaires - Coût d'achat
2. Résultat d'exploitation = Marge commerciale - Charges diverses
3. Résultat net = Résultat d'exploitation (simplifié, sans impôts)

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte avant/après) :
{
  "titre": "Compte de Résultat Simplifié",
  "periode": "${periode}",
  "produits": {
    "chiffreAffaires": ${chiffreAffaires}
  },
  "charges": {
    "coutAchat": ${coutAchat},
    "chargesDiverses": ${chargesDiverses},
    "total": ${coutAchat + chargesDiverses}
  },
  "resultats": {
    "margeCommerciale": nombre,
    "resultatExploitation": nombre,
    "resultatNet": nombre
  }
}`;

  const response = await generateWithFallback(prompt);
  
  // Parser le JSON (retirer markdown si présent)
  let content = response.content.trim();
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  return {
    provider: response.provider,
    data: JSON.parse(content)
  };
}

/**
 * Génère un bilan simplifié
 */
async function generateBilanSimplifie(data) {
  const { stockFinal, tresorerie, periode, devise = 'FCFA' } = data;

  const prompt = `Tu es un expert comptable spécialisé en SYSCOHADA pour l'Afrique de l'Ouest.

Génère un bilan simplifié pour la période : ${periode}

Données disponibles :
- Stock final : ${stockFinal.toLocaleString()} ${devise}
- Trésorerie (caisse) : ${tresorerie.toLocaleString()} ${devise}

Note : Ce bilan est simplifié car nous n'avons pas de comptabilité en partie double complète.
Il ne contient donc pas les immobilisations, créances, dettes à long terme.

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown) :
{
  "titre": "Bilan Simplifié",
  "periode": "${periode}",
  "actif": {
    "actifCirculant": {
      "stock": ${stockFinal},
      "tresorerie": ${tresorerie},
      "total": ${stockFinal + tresorerie}
    },
    "totalActif": ${stockFinal + tresorerie}
  },
  "passif": {
    "capitaux": {
      "capital": nombre_estimé,
      "resultat": nombre_estimé
    },
    "totalPassif": ${stockFinal + tresorerie}
  },
  "note": "Bilan simplifié - non conforme SYSCOHADA complet"
}`;

  const response = await generateWithFallback(prompt);
  
  let content = response.content.trim();
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  return {
    provider: response.provider,
    data: JSON.parse(content)
  };
}

/**
 * Génère une fiche de stock
 */
async function generateFicheStock(data) {
  const { produitNom, entrees, sorties, stockInitial, periode } = data;

  const prompt = `Tu es un expert en gestion de stock.

Génère une fiche de stock pour le produit : ${produitNom}
Période : ${periode}

Données :
- Stock initial : ${stockInitial} unités
- Entrées totales : ${entrees} unités
- Sorties totales : ${sorties} unités

Calcule le stock final : Stock initial + Entrées - Sorties

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown) :
{
  "titre": "Fiche de Stock",
  "produit": "${produitNom}",
  "periode": "${periode}",
  "mouvements": {
    "stockInitial": ${stockInitial},
    "entrees": ${entrees},
    "sorties": ${sorties},
    "stockFinal": nombre_calculé
  },
  "taux_rotation": "formule: Sorties / ((Stock initial + Stock final) / 2)"
}`;

  const response = await generateWithFallback(prompt);
  
  let content = response.content.trim();
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  return {
    provider: response.provider,
    data: JSON.parse(content)
  };
}

/**
 * Test de disponibilité des services IA
 */
async function testAIServices() {
  const results = {
    mistral: { available: false, error: null, responseTime: null },
    groq: { available: false, error: null, responseTime: null }
  };

  // Test Mistral
  try {
    const startMistral = Date.now();
    await mistralClient.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'Réponds juste "OK"' }],
      maxTokens: 10,
    });
    results.mistral.available = true;
    results.mistral.responseTime = Date.now() - startMistral;
  } catch (error) {
    results.mistral.error = error.message;
  }

  // Test Groq
  try {
    const startGroq = Date.now();
    await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Réponds juste "OK"' }],
      max_tokens: 10,
    });
    results.groq.available = true;
    results.groq.responseTime = Date.now() - startGroq;
  } catch (error) {
    results.groq.error = error.message;
  }

  return results;
}

module.exports = {
  generateCompteResultat,
  generateBilanSimplifie,
  generateFicheStock,
  testAIServices,
};
