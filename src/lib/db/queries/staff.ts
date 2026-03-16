import { eq, asc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { staffMembers, staffSchedules, staffTimeOff, staffBlockedSlots } from "@/lib/db/schema";

export async function getStaffMembers(businessId: string, includeInactive = false) {
  return db.query.staffMembers.findMany({
    where: includeInactive
      ? eq(staffMembers.businessId, businessId)
      : and(eq(staffMembers.businessId, businessId), eq(staffMembers.isActive, true)),
    orderBy: [asc(staffMembers.sortOrder), asc(staffMembers.createdAt)],
  });
}

export async function getStaffMemberById(id: string) {
  return db.query.staffMembers.findFirst({
    where: eq(staffMembers.id, id),
  });
}

export async function getStaffSchedule(staffId: string) {
  return db.query.staffSchedules.findMany({
    where: eq(staffSchedules.staffId, staffId),
    orderBy: [asc(staffSchedules.dayOfWeek)],
  });
}

export async function getStaffTimeOff(staffId: string) {
  return db.query.staffTimeOff.findMany({
    where: eq(staffTimeOff.staffId, staffId),
    orderBy: [asc(staffTimeOff.startDate)],
  });
}

export async function getStaffBlockedSlots(staffId: string) {
  return db.query.staffBlockedSlots.findMany({
    where: eq(staffBlockedSlots.staffId, staffId),
    orderBy: [asc(staffBlockedSlots.startTime)],
  });
}
