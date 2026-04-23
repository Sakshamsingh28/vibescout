import {
  collection, addDoc, getDocs, doc, getDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// ─── REPORTS ──────────────────────────────────────────────
export const saveReport = async (userId, reportData) => {
  const ref = await addDoc(collection(db, 'reports'), {
    ...reportData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
};

export const getUserReports = async (userId) => {
  const q = query(
    collection(db, 'reports'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
};

export const getReport = async (reportId) => {
  const snap = await getDoc(doc(db, 'reports', reportId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const deleteReport = async (reportId) => {
  await deleteDoc(doc(db, 'reports', reportId));
};

export const subscribeToReports = (userId, callback) => {
  const q = query(
    collection(db, 'reports'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    callback(docs);
  });
};

// ─── CONTACTS (phone sync) ─────────────────────────────────
export const saveContact = async (userId, contactData) => {
  const ref = await addDoc(collection(db, 'contacts'), {
    ...contactData,
    userId,
    synced: true,
    syncedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
  return ref.id;
};

export const getUserContacts = async (userId) => {
  const q = query(
    collection(db, 'contacts'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
};

export const subscribeToContacts = (userId, callback) => {
  const q = query(
    collection(db, 'contacts'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    callback(docs);
  });
};

export const deleteContact = async (contactId) => {
  await deleteDoc(doc(db, 'contacts', contactId));
};
