import { User } from "@/lib/types";

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function Layout({ children, user, currentPage = "dashboard", onNavigate }: LayoutProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "fas fa-home" },
    { id: "materials", label: "Materials", icon: "fas fa-book" },
    { id: "profile", label: "Profile", icon: "fas fa-user" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-slate-800">CM Training</h1>
            <div className="hidden md:flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    currentPage === item.id
                      ? "text-white bg-primary"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
              <span>{user.name || user.email}</span>
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium capitalize">
                {user.role.toLowerCase()}
              </span>
            </div>
            <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`flex flex-col items-center py-2 px-1 transition-colors ${
                currentPage === item.id ? "text-primary" : "text-slate-600"
              }`}
            >
              <i className={`${item.icon} text-lg mb-1`}></i>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
          <button className="flex flex-col items-center py-2 px-1 text-slate-600">
            <i className="fas fa-phone-alt text-lg mb-1"></i>
            <span className="text-xs">Practice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
