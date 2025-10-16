import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        <div className="container">{children}</div>
      </div>
    </div>
  );
}
