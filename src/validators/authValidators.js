const { z } = require('zod');

/**
 * Schéma de validation pour l'inscription utilisateur
 */
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Numéro de téléphone trop court').max(20, 'Numéro de téléphone trop long'),
  firstName: z.string().min(2, 'Prénom trop court').max(50, 'Prénom trop long'),
  lastName: z.string().min(2, 'Nom trop court').max(50, 'Nom trop long'),
});

/**
 * Schéma de validation pour la connexion utilisateur
 */
const loginSchema = z.object({
  licenseKey: z.string().regex(/^LOT-\d{4}-[A-Z]{4}-\d{4}$/, 'Format de clé invalide (LOT-1234-ABCD-5678)'),
});

/**
 * Schéma de validation pour la récupération de clé
 */
const forgotKeySchema = z.object({
  email: z.string().email('Email invalide'),
});

/**
 * Schéma de validation pour la connexion admin
 */
const adminLoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

/**
 * Schéma de validation pour la création d'admin
 */
const createAdminSchema = z.object({
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Numéro de téléphone trop court').max(20, 'Numéro de téléphone trop long'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
});

/**
 * Schéma de validation pour la création d'utilisateur par admin
 */
const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Numéro de téléphone trop court').max(20, 'Numéro de téléphone trop long'),
  firstName: z.string().min(2, 'Prénom trop court').max(50, 'Prénom trop long'),
  lastName: z.string().min(2, 'Nom trop court').max(50, 'Nom trop long'),
  licenseType: z.enum(['FREE', 'PREMIUM']).optional(),
});

/**
 * Schéma de validation pour la mise à jour d'utilisateur
 */
const updateUserSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  phone: z.string().min(8, 'Numéro de téléphone trop court').max(20, 'Numéro de téléphone trop long').optional(),
  firstName: z.string().min(2, 'Prénom trop court').max(50, 'Prénom trop long').optional(),
  lastName: z.string().min(2, 'Nom trop court').max(50, 'Nom trop long').optional(),
  licenseType: z.enum(['FREE', 'PREMIUM']).optional(),
  licenseStatus: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED']).optional(),
  expirationDate: z.string().nullable().optional(),
  maxSimultaneousLogins: z.number().int().positive().optional(),
  lastLoginIp: z.string().nullable().optional(),
});

/**
 * Middleware de validation générique
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Données invalides',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({ error: 'Données invalides' });
    }
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotKeySchema,
  adminLoginSchema,
  createAdminSchema,
  createUserSchema,
  updateUserSchema,
  validate,
};