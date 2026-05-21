const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase config validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error("Xatolik: Supabase muhit o'zgaruvchilari to'liq emas.");
  process.exit(1);
}

// Initialize Supabase Admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve the delete page on /delete
app.get('/delete', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Redirect root to /delete
app.get('/', (req, res) => {
  res.redirect('/delete');
});

// API endpoint for account deletion
app.post('/api/delete-account', async (req, res) => {
  const { email, password, confirmPassword, agreeTerms, agreeDelete, agreeUndone } = req.body;

  // Basic validation
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: "Barcha maydonlarni to'ldiring." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Kiritilgan parollar bir-biriga mos kelmadi." });
  }

  if (!agreeTerms || !agreeDelete || !agreeUndone) {
    return res.status(400).json({ error: "Davom etish uchun barcha shartlarni tasdiqlashingiz kerak." });
  }

  try {
    // 1. Authenticate user using the credentials they provided
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    });

    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: "Email yoki parol noto'g'ri. Qaytadan urinib ko'ring." });
    }

    const userId = authData.user.id;

    // Double check email matches just in case
    if (authData.user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ error: "Kiritilgan email joriy hisobga mos kelmadi." });
    }

    // 2. Delete the user from auth.users using the admin client
    // This will trigger cascade delete on public.profiles and related tables
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Supabase o'chirishda xatolik:", deleteError);
      return res.status(500).json({ error: "Hisobni o'chirishda xatolik yuz berdi: " + deleteError.message });
    }

    return res.status(200).json({ message: "Hisobingiz va barcha ma'lumotlaringiz muvaffaqiyatli va butunlay o'chirildi." });

  } catch (error) {
    console.error("Serverda kutilmagan xatolik:", error);
    return res.status(500).json({ error: "Serverda kutilmagan xatolik yuz berdi. Iltimos keyinroq urinib ko'ring." });
  }
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} portida ishga tushdi`);
});
