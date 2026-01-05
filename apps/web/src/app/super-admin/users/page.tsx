"use client";

import UsersManagementView from '@/app/admin/users/_components/UsersManagementView';

export default function SuperAdminUsersPage() {
  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <UsersManagementView />
    </div>
  );
}
