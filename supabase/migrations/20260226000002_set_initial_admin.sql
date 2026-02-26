-- Grant admin role to the initial admin user
UPDATE users SET role = 'admin' WHERE email = 'terence@stewardingchange.org';
