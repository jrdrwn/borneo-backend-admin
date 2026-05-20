USE borneo_trip_db;

-- Jalankan file ini hanya jika tabel sudah dibuat tetapi belum bisa menyimpan link gambar panjang.
ALTER TABLE destinations MODIFY main_image VARCHAR(500);
ALTER TABLE destination_images MODIFY image_url VARCHAR(500);
ALTER TABLE events MODIFY image VARCHAR(500);
ALTER TABLE website_settings MODIFY setting_value TEXT;
