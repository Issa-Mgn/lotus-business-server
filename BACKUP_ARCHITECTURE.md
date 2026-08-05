# Architecture du Système Cloud Backup - Diagrammes

**Version**: 1.1  
**Date**: 8 juillet 2026

---

## 📊 Vue d'Ensemble du Système

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LOTUS BUSINESS - CLOUD BACKUP                    │
│                           Architecture v1.1                          │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────┐          ┌───────────────┐          ┌──────────────┐
│  App Mobile   │          │   Dashboard   │          │    Admin     │
│ (React Native)│          │  (React Vite) │          │   Panel      │
└───────┬───────┘          └───────┬───────┘          └──────┬───────┘
        │                          │                          │
        │ JWT Token                │ JWT Token                │ JWT Admin Token
        │                          │                          │
        └──────────────────────────┴──────────────────────────┘
                                   │
                                   │ HTTPS
                                   ↓
                    ┌──────────────────────────┐
                    │   Express API Server     │
                    │   (Node.js + Prisma)     │
                    │                          │
                    │  Routes:                 │
                    │  • POST /upload          │
                    │  • GET  /my-backups      │
                    │  • GET  /:id/download    │
                    │  • DELETE /:id           │
                    │  • POST /grant-access    │
                    └────────┬─────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ↓                         ↓
    ┌─────────────────────┐   ┌──────────────────────┐
    │  PostgreSQL (DB)    │   │  Supabase Storage    │
    │  Table:             │   │  Bucket:             │
    │  - user_backups     │   │  - user-backups/     │
    │                     │   │    └─ userId/        │
    │  Stocke:            │   │       ├─ 17835*.db   │
    │  • Metadata         │   │       ├─ 17836*.db   │
    │  • Chemins          │   │       └─ ...         │
    │  • Permissions      │   │                      │
    └─────────────────────┘   └──────────────────────┘
```

---

## 🔄 Flow Upload Backup (Utilisateur PREMIUM)

```
┌─────────┐                                                    
│  USER   │ "Je veux sauvegarder mes données"                 
│ PREMIUM │                                                    
└────┬────┘                                                    
     │                                                         
     │ 1. Sélectionne fichier .db dans l'app                 
     │                                                         
     ↓                                                         
┌─────────────────┐                                           
│  App Mobile     │                                           
│  React Native   │                                           
└────┬────────────┘                                           
     │                                                         
     │ 2. POST /api/backups/upload                           
     │    Content-Type: multipart/form-data                  
     │    Authorization: Bearer <token>                       
     │    Body:                                               
     │    • backup: [FILE BUFFER]                            
     │    • fileName: "backup.db"                            
     │    • deviceId: "device-123"                           
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Express API + Multer       │                               
│  backupController.js        │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 3. Vérification JWT → req.userId                      
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Prisma ORM                 │                               
│  prisma.user.findUnique()   │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 4. Récupère: licenseType = "PREMIUM"                  
     │             isPremium = true                           
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Supabase Storage Client    │                               
│  supabase.storage           │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 5. Upload fichier:                                     
     │    Path: "userId/1783516968145_backup.db"             
     │    Bucket: "user-backups"                             
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Supabase Storage           │                               
│  ✅ Fichier stocké          │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 6. Génère URL signée (10 ans)                         
     │    fileUrl = "https://..."                            
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  PostgreSQL                 │                               
│  INSERT user_backups        │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 7. Enregistre metadata:                               
     │    • fileName: "userId/1783516968145_backup.db"       
     │    • fileSize: 5242880 (5 MB)                         
     │    • fileUrl: "https://..."                           
     │    • isAccessible: true                               
     │    • accessGrantedAt: NOW()                           
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  API Response 201           │                               
│  {                          │                               
│    "message": "Backup       │                               
│     sauvegardé et           │                               
│     accessible...",         │                               
│    "backup": {              │                               
│      "fileName": "backup.db"│ ← Nom nettoyé                
│      "isAccessible": true   │                               
│      "canDownload": true    │                               
│    }                        │                               
│  }                          │                               
└────┬────────────────────────┘                               
     │                                                         
     ↓                                                         
┌─────────────────┐                                           
│  App Mobile     │                                           
│  ✅ Success     │                                           
│  "Backup        │                                           
│   sauvegardé!"  │                                           
└─────────────────┘                                           
```

---

## 🚫 Flow Upload Backup (Utilisateur FREE)

```
┌─────────┐                                                    
│  USER   │ "Je veux sauvegarder mes données"                 
│  FREE   │                                                    
└────┬────┘                                                    
     │                                                         
     │ 1-4. Même flow jusqu'à...                             
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Prisma ORM                 │                               
│  prisma.user.findUnique()   │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 4. Récupère: licenseType = "FREE"                     
     │             isPremium = false                          
     │             isAccessible = false ❌                    
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Supabase Storage           │                               
│  ✅ Fichier stocké          │                               
│  (même process)             │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 6. PAS d'URL signée générée                           
     │    fileUrl = null ❌                                   
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  PostgreSQL                 │                               
│  INSERT user_backups        │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 7. Enregistre metadata:                               
     │    • fileName: "userId/1783516968145_backup.db"       
     │    • fileUrl: null ❌                                  
     │    • isAccessible: false ❌                            
     │    • accessGrantedAt: null                            
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  API Response 201           │                               
│  {                          │                               
│    "message": "Backup       │                               
│     sauvegardé. Passez à    │                               
│     PREMIUM pour y          │                               
│     accéder.",              │                               
│    "backup": {              │                               
│      "isAccessible": false  │                               
│      "canDownload": false   │                               
│    },                       │                               
│    "upgradeMessage": "..."  │ ← Message marketing          
│  }                          │                               
└────┬────────────────────────┘                               
     │                                                         
     ↓                                                         
┌─────────────────┐                                           
│  App Mobile     │                                           
│  ⚠️  Saved but  │                                           
│  not accessible │                                           
│  "Upgrade to    │                                           
│   PREMIUM!"     │                                           
└─────────────────┘                                           
```

---

## 📥 Flow Téléchargement (Utilisateur PREMIUM)

```
┌─────────┐                                                    
│  USER   │ "Je veux restaurer mon backup"                    
│ PREMIUM │                                                    
└────┬────┘                                                    
     │                                                         
     │ 1. GET /api/backups/my-backups                        
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Liste des backups          │                               
│  [{                         │                               
│    "id": "cm...",           │                               
│    "fileName": "backup.db", │                               
│    "canDownload": true,     │                               
│    "downloadUrl": "/..."    │                               
│  }]                         │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 2. Click "Télécharger"                                
     │    GET /api/backups/:id/download                      
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Express API                │                               
│  backupController.js        │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 3. Vérifications:                                      
     │    ✅ JWT valide                                       
     │    ✅ licenseType = "PREMIUM"                         
     │    ✅ backup.userId = req.userId                      
     │    ✅ backup.isAccessible = true                      
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Supabase Storage           │                               
│  createSignedUrl()          │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 4. Génère URL signée (1h):                            
     │    Path: backup.fileName                              
     │    = "userId/1783516968145_backup.db"                 
     │    ✅ Fichier trouvé                                   
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  API Response 200           │                               
│  {                          │                               
│    "downloadUrl":           │                               
│    "https://xxx.supabase    │                               
│     .co/storage/v1/object   │                               
│     /sign/user-backups/     │                               
│     userId/1783516968145_   │                               
│     backup.db?token=..."    │                               
│    "expiresIn": 3600        │                               
│  }                          │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 5. Redirect vers URL signée                           
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Navigateur / App           │                               
│  ⬇️  Téléchargement fichier │                               
│  ✅ backup.db sauvegardé    │                               
└─────────────────────────────┘                               
```

---

## 🚫 Flow Téléchargement (Utilisateur FREE)

```
┌─────────┐                                                    
│  USER   │ "Je veux restaurer mon backup"                    
│  FREE   │                                                    
└────┬────┘                                                    
     │                                                         
     │ 1. GET /api/backups/my-backups                        
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Liste des backups          │                               
│  [{                         │                               
│    "fileName": "backup.db", │                               
│    "canDownload": false, ❌ │                               
│    "downloadUrl": null ❌   │                               
│  }]                         │                               
│  + upgradeMessage           │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 2. Click "Télécharger"                                
     │    GET /api/backups/:id/download                      
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Express API                │                               
│  backupController.js        │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 3. Vérifications:                                      
     │    ✅ JWT valide                                       
     │    ❌ licenseType = "FREE"                            
     │    → STOP                                              
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  API Response 403 Forbidden │                               
│  {                          │                               
│    "error": "Accès refusé", │                               
│    "message":               │                               
│    "Cette fonctionnalité    │                               
│     est réservée aux        │                               
│     utilisateurs PREMIUM.", │                               
│    "upgradeRequired": true, │                               
│    "upgradeUrl":            │                               
│    "/upgrade-premium"       │                               
│  }                          │                               
└────┬────────────────────────┘                               
     │                                                         
     ↓                                                         
┌─────────────────┐                                           
│  App Mobile     │                                           
│  ⚠️  Accès      │                                           
│  refusé         │                                           
│                 │                                           
│  [Upgrade to    │                                           
│   PREMIUM]      │ ← Bouton call-to-action                  
└─────────────────┘                                           
```

---

## 👨‍💼 Flow Admin Grant Access

```
┌─────────┐                                                    
│  FREE   │ "J'ai perdu mon téléphone!"                       
│  USER   │                                                    
└────┬────┘                                                    
     │                                                         
     │ 1. Contacte le support                                
     │    Email: support@lotusbusiness.com                   
     │                                                         
     ↓                                                         
┌─────────────────┐                                           
│  Support Team   │                                           
│  "Payez 5€ pour │                                           
│   accès unique" │                                           
└────┬────────────┘                                           
     │                                                         
     │ 2. Utilisateur paye                                   
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Admin Panel                │                               
│  Dashboard                  │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 3. Admin voit:                                        
     │    • Liste des backups de l'utilisateur               
     │    • Backup demandé: isAccessible = false            
     │                                                         
     │ 4. POST /api/backups/grant-access                    
     │    {                                                  
     │      "backupId": "cm...",                            
     │      "userId": "180b..."                             
     │    }                                                  
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Express API (Admin)        │                               
│  backupController.js        │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 5. Vérifications:                                      
     │    ✅ Admin JWT valide                                 
     │    ✅ Backup existe                                    
     │    ✅ Backup appartient au userId                      
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Supabase Storage           │                               
│  createSignedUrl()          │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 6. Génère URL signée (10 ans)                         
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  PostgreSQL                 │                               
│  UPDATE user_backups        │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 7. Met à jour:                                        
     │    • isAccessible = true ✅                            
     │    • accessGrantedAt = NOW()                          
     │    • fileUrl = "https://..."                          
     │                                                         
     ↓                                                         
┌─────────────────────────────┐                               
│  Admin Panel                │                               
│  ✅ "Accès accordé"         │                               
└────┬────────────────────────┘                               
     │                                                         
     │ 8. Notification à l'utilisateur                       
     │    (email ou push)                                    
     │                                                         
     ↓                                                         
┌─────────────────┐                                           
│  FREE USER      │                                           
│  ✅ Peut        │                                           
│  maintenant     │                                           
│  télécharger    │                                           
│  CE backup      │                                           
└─────────────────┘                                           
```

---

## 🗄️ Structure de Stockage Supabase

```
Supabase Storage Bucket: "user-backups"
│
├── 180b55e0-ce3e-4a1c-8290-24812f1e0058/    ← userId
│   ├── 1783516968145_backup.db              ← timestamp_filename
│   ├── 1783517227390_backup.db
│   ├── 1783518450123_mydata.db
│   └── ...
│
├── 2c4a9f3e-1234-5678-abcd-ef0123456789/    ← autre userId
│   ├── 1783519000000_save.db
│   ├── 1783520000000_save.db
│   └── ...
│
└── ...
```

### Base de Données PostgreSQL

```sql
-- Table: user_backups

┌─────────────┬──────────────┬─────────────────────────────────────────┐
│ id          │ userId       │ fileName                                │
├─────────────┼──────────────┼─────────────────────────────────────────┤
│ cmrc43wyl   │ 180b55e0...  │ 180b55e0.../1783516968145_backup.db    │
│ cmrc44abc   │ 180b55e0...  │ 180b55e0.../1783517227390_backup.db    │
│ cmrc45def   │ 2c4a9f3e...  │ 2c4a9f3e.../1783519000000_save.db      │
└─────────────┴──────────────┴─────────────────────────────────────────┘

┌────────────┬───────────────┬───────────────┬──────────────────────┐
│ fileSize   │ isAccessible  │ fileUrl       │ accessGrantedAt      │
├────────────┼───────────────┼───────────────┼──────────────────────┤
│ 5242880    │ true          │ https://...   │ 2026-07-08 13:27:08 │
│ 4096       │ false         │ null          │ null                 │
│ 10485760   │ true          │ https://...   │ 2026-07-08 14:00:00 │
└────────────┴───────────────┴───────────────┴──────────────────────┘
```

---

## 🔐 Matrice de Permissions

```
┌──────────────┬──────────┬──────────┬────────┐
│ Action       │   FREE   │ PREMIUM  │ ADMIN  │
├──────────────┼──────────┼──────────┼────────┤
│ Upload       │    ✅    │    ✅    │   ✅   │
│ List         │    ✅    │    ✅    │   ✅   │
│ Download     │    ❌    │    ✅    │   ✅   │
│ Delete       │    ✅    │    ✅    │   ✅   │
│ Grant Access │    ❌    │    ❌    │   ✅   │
└──────────────┴──────────┴──────────┴────────┘
```

---

## 📈 Flow de Conversion Marketing

```
FREE User Journey:

Upload Backup
     ↓
Voit le message
"Passez à PREMIUM"
     ↓
Ignore et continue
     ↓
Perd son téléphone 📱💥
     ↓
Panique! 😱
     ↓
Contacte le support
     ↓
Découvre qu'il a 5 backups
mais ne peut pas y accéder
     ↓
Options proposées:
1. Payer 5€ pour 1 backup
2. Upgrade PREMIUM (10€/mois)
   → Accès à tous les backups
   → Toutes les features premium
     ↓
💰 Conversion!
```

---

**Documentation créée par** : Kiro AI Assistant  
**Date** : 8 juillet 2026  
**Version** : 1.1
