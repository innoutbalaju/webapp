import { Navigate } from 'react-router-dom';

import { AdminShell } from '@/components/AdminShell';
import { GuestShell } from '@/components/GuestShell';
import { SectionCard } from '@/components/SectionCard';
import { useSessionStore } from '@/store/sessionStore';

export default function DocsPage() {
  const role = useSessionStore((state) => state.role);
  const authUser = useSessionStore((state) => state.authUser);
  const room = useSessionStore((state) => state.room);

  if (!authUser) {
    return <Navigate replace to="/login" />;
  }

  if (role === 'guest' && !room) {
    return <Navigate replace to="/login" />;
  }

  const content = (
    <>
      <SectionCard
        title="Application overview"
        description="Learn how the guest portal and admin dashboard work together to manage hotel room service orders."
      >
        <div className="space-y-3 text-sm leading-7 text-slate-300">
          <p>
            This web app helps hotel guests place room service orders from their phone while the admin team manages orders,
            prints receipts, and tracks sales from a desktop dashboard.
          </p>
          <p>
            Guests sign in with Google and a room PIN, view the current available menu, submit orders, and track order status in real time.
          </p>
          <p>
            The admin dashboard is designed for staff: it shows live order updates, room management controls, automated WebUSB
            receipt printing, and business reporting.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Guest flow"
        description="How guests place an order, follow room delivery status, and sign out safely."
      >
        <div className="space-y-3 text-sm leading-7 text-slate-300">
          <p>
            1. Guests sign in using Google and a 4-digit room PIN. The first successful login binds the guest to the room.
          </p>
          <p>
            2. The menu shows only available items in Food, Beverage, and Amenities categories.
          </p>
          <p>
            3. Guests add items to the cart, submit a room service order, then follow the delivery status from Placed → Preparing → Delivered.
          </p>
          <p>
            4. If the room is blocked or checked out, the session automatically ends and the guest is redirected to login.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Admin flow"
        description="How hotel staff manage rooms, print receipts, and view reports."
      >
        <div className="space-y-3 text-sm leading-7 text-slate-300">
          <p>
            - Orders are displayed in real time so staff can accept, prepare, and deliver requests quickly.
          </p>
          <p>
            - Rooms can be blocked, checked out, or reset with new PIN values from the admin rooms screen.
          </p>
          <p>
            - WebUSB printing is used for automatic 80mm thermal receipts. The printer must be connected and authorized in the browser.
          </p>
          <p>
            - Daily sales and order summaries are available in the reports screen for monitoring business performance.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Deployment and hosting"
        description="How to build and host this app on GitHub Pages."
      >
        <div className="space-y-3 text-sm leading-7 text-slate-300">
          <p>
            - The app uses Vite and is configured with `base: './'` so it works correctly on GitHub Pages.
          </p>
          <p>
            - Push your code to the `main` branch and GitHub Actions will build and publish the `dist/` folder.
          </p>
          <p>
            - The workflow file is located at `.github/workflows/deploy.yml`.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Security and validation"
        description="What protections are in place for orders, rooms, and pricing."
      >
        <div className="space-y-3 text-sm leading-7 text-slate-300">
          <p>
            - Price calculations and order validation are handled on the server side to prevent tampering.
          </p>
          <p>
            - Supabase authentication and row-level security keep guest data isolated by room.
          </p>
          <p>
            - Rate limits and room checks prevent abuse and keep the system secure for hotel guests.
          </p>
        </div>
      </SectionCard>
    </>
  );

  if (role === 'admin') {
    return (
      <AdminShell
        title="Documentation"
        subtitle="Read the app flow, deployment steps, and how hotel staff and guests interact with the system."
      >
        {content}
      </AdminShell>
    );
  }

  return (
    <GuestShell
      title="Documentation"
      subtitle="Read how to use the guest portal, place room service orders, and follow hotel instructions."
    >
      {content}
    </GuestShell>
  );
}
