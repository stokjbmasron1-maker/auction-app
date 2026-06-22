-- Kembalikan nama asli dari metadata auth.users
UPDATE public.profiles p
SET full_name = COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), 'Pengguna')
FROM auth.users u
WHERE p.id = u.id;
