-- CreateTable
CREATE TABLE "Interaction" (
    "id" SERIAL NOT NULL,
    "callTranscribe" TEXT NOT NULL,
    "supportTickets" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);
