import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  increment,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

const REPORTS_COLLECTION = "reports";

interface ReportData {
  title?: string;
  description: string;
  category?: string;
  category_label?: string;
  severity?: string;
  department?: string;
  status?: string;
  image_url?: string | null;
  latitude?: number;
  longitude?: number;
  address?: string;
  user_id?: string;
  user_name?: string;
  user_photo?: string;
  suggested_action?: string;
  upvotes?: number;
  created_at?: string;
  updated_at?: string;
  deleted?: boolean;
  deletedAt?: unknown;
  [key: string]: unknown;
}

export async function createReport(data: ReportData) {
  const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
    ...data,
    upvotes: 0,
    deleted: false,
    status: data.status || "reported",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getAllReports() {
  const snapshot = await getDocs(collection(db, REPORTS_COLLECTION));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as ReportData & { id: string }))
    .filter((r) => r.deleted !== true)
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
}

export async function getUserReports(userId: string) {
  const snapshot = await getDocs(collection(db, REPORTS_COLLECTION));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as ReportData & { id: string }))
    .filter((r) => r.user_id === userId && r.deleted !== true)
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
}

export async function getReport(reportId: string) {
  const docSnap = await getDoc(doc(db, REPORTS_COLLECTION, reportId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  if (data.deleted === true) return null;
  return { id: docSnap.id, ...data };
}

export async function updateReportStatus(reportId: string, status: string) {
  const ref = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(ref, { status, updated_at: new Date().toISOString() });
}

export async function updateReport(reportId: string, data: Partial<ReportData>) {
  const ref = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(ref, { ...data, updated_at: new Date().toISOString() });
}

export async function softDeleteReport(reportId: string) {
  const ref = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(ref, {
    status: "cancelled",
    deleted: true,
    deletedAt: serverTimestamp(),
    updated_at: new Date().toISOString(),
  });
}

export async function hardDeleteReport(reportId: string) {
  const ref = doc(db, REPORTS_COLLECTION, reportId);
  await deleteDoc(ref);
}

export async function upvoteReport(reportId: string) {
  const ref = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(ref, { upvotes: increment(1) });
}

export async function getReportStats() {
  const issues = await getAllReports();
  const total = issues.length;
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  issues.forEach((issue) => {
    const cat = issue.category || "other";
    const stat = issue.status || "reported";
    const sev = issue.severity || "medium";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    byStatus[stat] = (byStatus[stat] || 0) + 1;
    bySeverity[sev] = (bySeverity[sev] || 0) + 1;
  });

  return { total, by_category: byCategory, by_status: byStatus, by_severity: bySeverity };
}
