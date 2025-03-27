import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PrismaClient } from "@prisma/client"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const prisma = new PrismaClient();
