-- Add multiple images support to infos table

-- Add images column (JSON array for multiple images)
ALTER TABLE "infos" ADD COLUMN IF NOT EXISTS "images" JSONB;

-- Comment on column
COMMENT ON COLUMN "infos"."images" IS 'Tableau d''images multiples [{url, fileId, filePath, thumbnailUrl}]';

-- Create index for better performance on JSON queries (optional)
CREATE INDEX IF NOT EXISTS "infos_images_idx" ON "infos" USING GIN ("images");