-- 0) Upewnij się, że jest kolumna na hasło
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

-- 1) Utwórz enum, jeśli brak
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
  END IF;
END$$;

-- 2) Ujednolicenie wartości role
UPDATE "User" SET "role" = UPPER("role") WHERE "role" IS NOT NULL;
UPDATE "User" SET "role" = 'USER'
WHERE "role" IS NULL OR "role" NOT IN ('USER', 'ADMIN');

-- 3) Zdejmij domyślną wartość, zmień typ, ustaw nową domyślną, dopnij NOT NULL
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role" USING ("role"::"Role");

ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'USER',
  ALTER COLUMN "role" SET NOT NULL;
