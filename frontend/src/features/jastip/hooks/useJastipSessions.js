import { useCallback, useEffect, useState } from "react";
import { jastipService } from "../services/jastipService";

export const useJastipSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [openSession, setOpenSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [sessionData, openSessionData] = await Promise.all([
        jastipService.getSessions(),
        jastipService.getOpenSession(),
      ]);
      setSessions(sessionData);
      setOpenSession(openSessionData);
    } catch (err) {
      setError(err.message || "Gagal mengambil data sesi jastip");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const runMutation = async (mutation, successMessage) => {
    try {
      setSaving(true);
      setError("");
      await mutation();
      await fetchSessions();
      return successMessage;
    } catch (err) {
      setError(err.message || "Proses gagal");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    sessions,
    openSession,
    loading,
    saving,
    error,
    refresh: fetchSessions,
    createSession: (payload) =>
      runMutation(() => jastipService.createSession(payload), "Sesi jastip berhasil dibuka"),
    closeSession: (id) =>
      runMutation(() => jastipService.closeSession(id), "Sesi jastip berhasil ditutup"),
  };
};
