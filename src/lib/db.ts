import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  doc,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { ClientRecommendationResult } from "./types";

export interface HistoryDocument {
  id?: string;
  userId: string;
  userEmail?: string | null;
  userEmailNormalized?: string | null;
  prompt: string;
  timestamp: number;
  result: ClientRecommendationResult & { source?: string };
}

/**
 * Saves a recommendation result to Firestore for the given user.
 */
export async function saveHistoryToFirestore(
  userId: string,
  userEmail: string | null,
  prompt: string,
  result: ClientRecommendationResult & { source?: string }
): Promise<string> {
  const normalizedEmail = userEmail ? userEmail.toLowerCase() : null;
  if (!db) throw new Error("Firestore not initialized. Set NEXT_PUBLIC_FIREBASE_* environment variables.");

  const docRef = await addDoc(collection(db, "history"), {
    userId,
    userEmail,
    userEmailNormalized: normalizedEmail,
    prompt,
    timestamp: Date.now(),
    result,
  });
  return docRef.id;
}

/**
 * Loads the history of a user from Firestore (up to 10 entries).
 * Falls back to email lookup if the UID-based history is missing.
 */
export async function loadHistoryFromFirestore(
  userId: string,
  userEmail?: string | null
): Promise<HistoryDocument[]> {
  const buildHistory = (querySnapshot: QuerySnapshot<DocumentData>) => {
    const history: HistoryDocument[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail ?? null,
        prompt: data.prompt,
        timestamp: data.timestamp,
        result: data.result,
      });
    });
    return history;
  };

  if (!db) return [];

  const uidQuery = query(
    collection(db, "history"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(10)
  );

  const uidSnapshot = await getDocs(uidQuery);
  const uidHistory = buildHistory(uidSnapshot);
  if (uidHistory.length > 0) {
    return uidHistory;
  }

  if (userEmail) {
    const normalizedEmail = userEmail.toLowerCase();
    const emailQuery = query(
      collection(db, "history"),
      where("userEmailNormalized", "==", normalizedEmail),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const emailSnapshot = await getDocs(emailQuery);
    return buildHistory(emailSnapshot);
  }

  return [];
}

/**
 * Deletes a single history entry by its document ID.
 */
export async function deleteHistoryFromFirestore(docId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "history", docId));
}
