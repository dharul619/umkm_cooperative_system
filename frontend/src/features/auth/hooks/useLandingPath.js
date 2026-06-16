import { useAuth } from "../../features/auth/hooks/useAuth";

export const useLandingPath = () => {
  const { resolveLandingPath, user } = useAuth();
  return resolveLandingPath(user?.role_name);
};
