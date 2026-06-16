import { useCallback, useEffect, useMemo, useState } from "react";
import { jastipService } from "../services/jastipService";

export const useMemberJastip = (memberId) => {
  const [sessions, setSessions] = useState([]);
  const [openSession, setOpenSession] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessionMenus, setSessionMenus] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menusLoading, setMenusLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMemberData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [openSessionData, orderData] = await Promise.all([
        jastipService.getOpenSession(),
        jastipService.getMyOrders(),
      ]);
      const openOnly = openSessionData ? [openSessionData] : [];
      setSessions(openOnly);
      setOpenSession(openSessionData || null);
      setMyOrders(Array.isArray(orderData) ? orderData : []);
      setSelectedSessionId((current) => current || (openSessionData ? String(openSessionData.id) : ""));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal mengambil data jastip member");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  useEffect(() => {
    const fetchMenus = async () => {
      if (!selectedSessionId) {
        setSessionMenus([]);
        return;
      }

      try {
        setMenusLoading(true);
        const data = await jastipService.getMemberSessionMenus(selectedSessionId);
        setSessionMenus(Array.isArray(data) ? data : []);
      } catch (err) {
        setSessionMenus([]);
        setError(err?.response?.data?.message || err.message || "Gagal mengambil menu session");
      } finally {
        setMenusLoading(false);
      }
    };

    fetchMenus();
  }, [selectedSessionId]);

  const hasOrderedSessionIds = useMemo(() => {
    return new Set(myOrders.map((order) => String(order.order_id)));
  }, [myOrders]);

  const submitOrder = async (items) => {
    try {
      setSaving(true);
      setError("");
      const sessionKey = String(selectedSessionId);
      if (hasOrderedSessionIds.has(sessionKey)) {
        throw new Error("Member sudah memiliki order pada session ini");
      }
      const response = await jastipService.createMemberOrder({
        session_id: Number(selectedSessionId),
        member_id: memberId,
        items,
      });
      await fetchMemberData();
      return response;
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Gagal membuat order";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  };

  return {
    sessions,
    openSession,
    selectedSessionId,
    setSelectedSessionId,
    sessionMenus,
    myOrders,
    hasOrderedSessionIds,
    loading,
    menusLoading,
    saving,
    error,
    refresh: fetchMemberData,
    submitOrder,
  };
};
