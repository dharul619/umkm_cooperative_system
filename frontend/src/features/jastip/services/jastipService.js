import axiosInstance from "../../../services/axiosInstace";

export const jastipService = {
  getSessions: async () => {
    const response = await axiosInstance.get("/jastip/sessions");
    return response.data;
  },
  getSessionById: async (id) => {
    const response = await axiosInstance.get(`/jastip/sessions/${id}`);
    return response.data;
  },
  getOpenSession: async () => {
    const response = await axiosInstance.get("/jastip/sessions/open");
    return response.data;
  },
  createSession: async (payload) => {
    const response = await axiosInstance.post("/jastip/sessions", payload);
    return response.data;
  },
  createSessionWithMenus: async (payload) => {
    const response = await axiosInstance.post("/jastip/sessions/with-menus", payload);
    return response.data;
  },
  closeSession: async (id) => {
    const response = await axiosInstance.put(`/jastip/sessions/${id}/close`);
    return response.data;
  },
  getSessionMenus: async (sessionId) => {
    const response = await axiosInstance.get(`/jastip/session-menus/${sessionId}`);
    return response.data;
  },
  addSessionMenu: async (payload) => {
    const response = await axiosInstance.post("/jastip/session-menus", payload);
    return response.data;
  },
  updateSessionMenu: async (id, payload) => {
    const response = await axiosInstance.put(`/jastip/session-menus/${id}`, payload);
    return response.data;
  },
  removeSessionMenu: async (id) => {
    const response = await axiosInstance.delete(`/jastip/session-menus/${id}`);
    return response.data;
  },
  getOrders: async () => {
    const response = await axiosInstance.get("/jastip/orders");
    return response.data;
  },
  getMemberSessions: async () => {
    const response = await axiosInstance.get("/jastip/member/sessions");
    return response.data;
  },
  getMemberSessionMenus: async (sessionId) => {
    const response = await axiosInstance.get(`/jastip/member/sessions/${sessionId}/menus`);
    return response.data;
  },
  createMemberOrder: async (payload) => {
    const response = await axiosInstance.post("/jastip/member/orders", payload);
    return response.data;
  },
  getMyOrders: async () => {
    const response = await axiosInstance.get("/jastip/member/orders");
    return response.data;
  },
};
