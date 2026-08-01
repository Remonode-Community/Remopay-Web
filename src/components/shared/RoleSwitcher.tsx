'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Shield, Briefcase, User, Newspaper } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';

export const RoleSwitcher: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { activeRole, setActiveRole } = useAuthStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMounted) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMounted]);

  // Only show if user has multiple roles
  if (!user || !user.roles || user.roles.length <= 1) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-[#fee2e2] text-[#991b1b]';
      case 'manager':
        return 'bg-[#ede9fe] text-[#6d28d9]';
      case 'agent':
        return 'bg-[#dbeafe] text-[#1e40af]';
      default:
        return 'bg-[#f0fdf4] text-[#166534]';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <Newspaper className="h-4 w-4" />;
      case 'agent':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getDashboardPath = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '/admin';
      case 'manager':
        return '/admin/blog';
      case 'agent':
        return '/agent';
      default:
        return '/dashboard';
    }
  };

  const handleRoleSwitch = (role: string) => {
    // Verify user actually has this role (security check)
    if (!user.roles.includes(role)) {
      console.error(`User does not have role: ${role}`);
      return;
    }

    // Set the active role
    setActiveRole(role);
    setShowRoleMenu(false);

    // Redirect to appropriate dashboard
    const path = getDashboardPath(role);
    router.push(path);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Role Switcher Button */}
      <button
        onClick={() => setShowRoleMenu(!showRoleMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        title="Switch role"
      >
        <div className="flex items-center gap-2">
          {getRoleIcon(activeRole || user.roles[0])}
          <span className="text-sm font-medium text-gray-700 capitalize hidden sm:inline">
            {activeRole || user.roles[0]}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {/* Role Menu Dropdown */}
      {showRoleMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 font-medium px-2 py-1 uppercase tracking-wider">
              Switch Dashboard
            </p>
          </div>

          <div className="space-y-1 p-2">
            {user.roles.map((role) => {
              const isActive = activeRole === role;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? `${getRoleColor(role)} cursor-default`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  disabled={isActive}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {getRoleIcon(role)}
                    <span className="capitalize">{role}</span>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-current" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-gray-100 text-xs text-gray-500">
            <p>Current: <span className="font-medium capitalize text-gray-700">{activeRole || user.roles[0]}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};
