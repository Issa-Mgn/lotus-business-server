# Deployment Check

Last update: 2026-07-08
Commit: e80a689

## Changes in this deployment:
- Fixed /admin/admins route (POST) for creating admins
- Updated createAdmin controller to handle authenticated admin creation
- Route /admin/create is now only for bootstrap (first admin)
- Route /admin/admins (POST) is protected and requires admin authentication
