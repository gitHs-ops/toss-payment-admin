-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'WAITING_FOR_DEPOSIT';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "virtualAccountBank" TEXT,
ADD COLUMN     "virtualAccountDueDate" TIMESTAMP(3),
ADD COLUMN     "virtualAccountHolder" TEXT,
ADD COLUMN     "virtualAccountNumber" TEXT;
