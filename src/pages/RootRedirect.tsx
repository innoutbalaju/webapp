import { Navigate } from 'react-router-dom';

import { useSessionStore } from '@/store/sessionStore';

export default function RootRedirect() {
  const authUser = useSessionStore((state) => state.authUser);
  const room = useSessionStore((state) => state.room);
  const role = useSessionStore((state) => state.role);

  if (role === 'admin') {
    return <Navigate to="/admin/orders" replace />;
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (!room) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/menu" replace />;
}
