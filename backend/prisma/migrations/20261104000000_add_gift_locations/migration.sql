CREATE TABLE "GiftLocation" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GiftLocation_transferId_key"
ON "GiftLocation"("transferId");

CREATE INDEX "GiftLocation_acceptedAt_idx"
ON "GiftLocation"("acceptedAt");

CREATE INDEX "GiftLocation_userId_acceptedAt_idx"
ON "GiftLocation"("userId", "acceptedAt");

CREATE INDEX "GiftLocation_boxId_acceptedAt_idx"
ON "GiftLocation"("boxId", "acceptedAt");

ALTER TABLE "GiftLocation"
ADD CONSTRAINT "GiftLocation_boxId_fkey"
FOREIGN KEY ("boxId") REFERENCES "Box"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GiftLocation"
ADD CONSTRAINT "GiftLocation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GiftLocation"
ADD CONSTRAINT "GiftLocation_transferId_fkey"
FOREIGN KEY ("transferId") REFERENCES "Transfer"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;