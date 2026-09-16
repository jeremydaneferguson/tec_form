-- Backfill all existing users with the requested default password: Open1234!
ALTER TABLE "User" ADD COLUMN "passwordHash" VARCHAR(255) NOT NULL DEFAULT 'scrypt$16384$8$1$dGVjLWRlZmF1bHQtcGFzc3dvcmQtMjAyNi0wOQ==$LRK8msQSTYL60hb6+sfmZtP0lVV/bnxBaJNZVdCKE1p7NcSIdUEp+3KkB9KVktRtMwjtE9RyvhjKeHmFRfD7YA==';
