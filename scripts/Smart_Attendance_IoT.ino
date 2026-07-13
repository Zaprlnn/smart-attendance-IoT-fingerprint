/*
 * ============================================================
 *  SMART ATTENDANCE IoT — FINGERPRINT + LCD + LED + BUZZER
 *  + FITUR TAMBAH SIDIK JARI (ketik "daftar" di Serial Monitor)
 *  + TERHUBUNG KE SUPABASE NEXT.JS
 *  Board  : ESP32
 *  LCD    : I2C 16x2 (SDA=26, SCL=25, alamat 0x3F)
 *  AS608  : UART2 -> RX=16, TX=17
 *  LED    : Merah=33, Biru=32
 *  Buzzer : GPIO27
 * ============================================================
 *
 *  CARA TAMBAH SIDIK JARI BARU:
 *  1. Buka Serial Monitor (baud 115200), pastikan line ending
 *     di set "Newline".
 *  2. Kapan saja saat mode absensi berjalan, ketik:  daftar
 *     lalu Enter.
 *  3. Sistem akan tampilkan jumlah sidik jari yang sudah ada,
 *     lalu minta kamu ketik nomor ID baru (misal 4) lalu Enter.
 *  4. Ketik 'y' lalu Enter untuk mulai scan.
 *  5. Tempel jari saat diminta (scan 1), angkat, tempel lagi (scan 2).
 *  6. Setelah sukses/gagal, sistem otomatis balik ke mode absensi
 *     normal -- tidak perlu reset atau upload ulang.
 *  7. Jangan lupa tambahkan nama di fungsi getNama() untuk ID baru.
 * ============================================================
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_Fingerprint.h>

// ====== KONFIGURASI WIFI & SERVER ======
#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID     = "Kuning Telur 4G";
const char* WIFI_PASSWORD = "KuningTelur2026";
// Lewat proxy Next.js (port 3000) -- ESP32 cukup 1 port buat semuanya, gak
// perlu bedain 3000/4000. Backend Express (4000) tetap dipanggil, tapi cuma
// internal via proxy, gak perlu diakses langsung dari device. Risiko LCD
// corrupt akibat delay proxy udah dimitigasi lewat lcd.init() re-init tiap
// nulis (lihat tampilSukses/tampilGagal/lcdMsg).
const char* SERVER_URL    = "http://192.168.1.7:3000/api/absensi";
const char* DEVICE_KEY    = "smart-attendance-iot-key"; 
// =======================================

// ====== LCD ======
LiquidCrystal_I2C lcd(0x27, 16, 2);
#define SDA_PIN 21
#define SCL_PIN 22

// ====== PIN OUTPUT ======
#define LED_MERAH 33
#define LED_BIRU  32
#define BUZZER    27
#define SAKLAR_PIN 19 // Pin untuk saklar ON/OFF


// ====== AS608 ======
#define FP_RX  16
#define FP_TX  17
HardwareSerial fingerSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerSerial);

// ====== Mapping ID -> Nama ======
// Nama sepenuhnya diambil secara otomatis dari database Supabase melalui API Next.js!
// Arduino tidak perlu menyimpan daftar nama sama sekali.
String getNama(uint8_t id) {
  return ""; 
}

// ====== State Mesin ======
enum State { IDLE, SUKSES, GAGAL };
State state = IDLE;
unsigned long tState = 0;
const unsigned long DURASI_NOTIF = 1000;

// ====== Status Saklar ======
bool isSystemOn = true; 
bool lastSwitchState = true; 


// ====== Teks Berjalan (IDLE) ======
String pesan = "                Smart Attendance IoT Siap Digunakan !!                ";
const int LEBAR = 16;
int posisi = 0;
unsigned long tLcd = 0;
const unsigned long JEDA_LCD = 350;

// ====== LED Bergantian (IDLE) ======
unsigned long tLed = 0;
const unsigned long JEDA_LED = 500;
bool ledNyala = false;

// ====== Buzzer Non-blocking ======
int beepTotal = 0;
int beepSudah = 0;
bool beepOn = false;
unsigned long tBeep = 0;
const unsigned long DURASI_ON  = 80;
const unsigned long DURASI_OFF = 120;

void mulaiBeep(int n) {
  beepTotal = n;
  beepSudah = 0;
  beepOn    = true;
  digitalWrite(BUZZER, HIGH);
  tBeep = millis();
}

void updateBeep() {
  if (beepTotal == 0) return;
  if (beepOn && millis() - tBeep >= DURASI_ON) {
    digitalWrite(BUZZER, LOW);
    beepOn = false;
    tBeep  = millis();
    beepSudah++;
    if (beepSudah >= beepTotal) beepTotal = 0;
  } else if (!beepOn && beepTotal > 0 && millis() - tBeep >= DURASI_OFF) {
    digitalWrite(BUZZER, HIGH);
    beepOn = true;
    tBeep  = millis();
  }
}

// Beep blocking sederhana (dipakai khusus di mode enrollment)
void beepBlocking(int n) {
  for (int i = 0; i < n; i++) {
    digitalWrite(BUZZER, HIGH); delay(80);
    digitalWrite(BUZZER, LOW);  delay(120);
  }
}

// ====== Tampil LCD ======
// lcd.init() diulang tiap sebelum nulis (bukan cuma sekali pas boot) --
// transmisi WiFi (HTTP ke server) bisa bikin tegangan drop sesaat dan
// nge-corrupt state internal chip LCD I2C, biasanya kejadian abis
// kirimAbsensi()/laporHasilEnroll()/polling command. init() ulang di sini
// "menyembuhkan" itu sebelum nulis apapun, di titik tunggal yang dipakai
// semua pemanggil (bukan ditambal di tiap tempat yang habis WiFi call).
void tampilSukses(String nama) {
  lcd.init();
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("  ABSEN SUKSES  ");
  lcd.setCursor(0, 1);
  int pad = (16 - nama.length()) / 2;
  for (int i = 0; i < pad; i++) lcd.print(" ");
  lcd.print(nama);
}

void tampilGagal() {
  lcd.init();
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("TIDAK ADA DATA! ");
  lcd.setCursor(0, 1); lcd.print("  Belum Daftar  ");
}

void lcdMsg(const char* b1, const char* b2 = "                ") {
  lcd.init();
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(b1);
  lcd.setCursor(0, 1); lcd.print(b2);
}

// ====== FUNGSI WIFI & HTTP (Untuk ke Supabase) ======
// Mutex untuk mengamankan HTTP agar tidak tabrakan antara 2 Core
SemaphoreHandle_t httpMutex;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print(">> Menghubungkan ke WiFi: ");
  Serial.println(WIFI_SSID);
  lcdMsg(" Menghubungkan  ", "   ke  WiFi...  ");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // --- SOLUSI SOFTWARE ---
  // Re-inisialisasi LCD karena tegangan biasanya "drop" sesaat saat WiFi TX menyala,
  // yang sering membuat chip LCD error dan memunculkan karakter acak.
  lcd.init();
  // -----------------------

  Serial.println("\n>> WiFi Terhubung!");
  Serial.print(">> IP ESP32: "); Serial.println(WiFi.localIP());
  Serial.print(">> Gateway : "); Serial.println(WiFi.gatewayIP());
  lcdMsg("  WiFi  OK!     ", "                ");
  delay(1000);
}

String kirimAbsensi(uint8_t id_jari, String nama_fallback) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Batal kirim - WiFi putus!");
    return nama_fallback;
  }
  
  String namaDariServer = nama_fallback;
  
  // Minta izin ke Mutex agar tidak tabrakan dengan Task Polling
  if (xSemaphoreTake(httpMutex, portMAX_DELAY)) {
    Serial.println("[HTTP] Mengirim data absensi ke server...");
  // Server sekarang akan mengabaikan field "nama" dan mengambil dari database
  String jsonBody = "{\"id_jari\":" + String(id_jari) + ",\"nama\":\"" + nama_fallback + "\",\"status\":\"hadir\"}";
  
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);
  
  int httpCode = http.POST(jsonBody);
  if (httpCode == 200) {
    Serial.println("[HTTP] BERHASIL MASUK SUPABASE!");
      String response = http.getString();
      // Parse manual nama dari JSON agar kebal spasi (misal "nama": "John")
      int idxNama = response.indexOf("\"nama\"");
      if (idxNama > 0) {
        int startQuote = response.indexOf("\"", idxNama + 6);
        if (startQuote > 0) {
          int endQuote = response.indexOf("\"", startQuote + 1);
          if (endQuote > startQuote) {
            namaDariServer = response.substring(startQuote + 1, endQuote);
          }
        }
      }
    } else {
      Serial.print("[HTTP] GAGAL! Kode error: ");
      Serial.println(httpCode);
    }
    http.end();
    
    // Kembalikan Mutex
    xSemaphoreGive(httpMutex);
  }
  
  // Jika karena alasan apapun nama tidak didapat dari server/database,
  // gunakan ID sebagai fallback agar LCD tidak kosong.
  if (namaDariServer == "") {
    namaDariServer = "ID Jari #" + String(id_jari);
  }
  
  return namaDariServer;
}

// ====== FUNGSI POLLING PERINTAH DARI SERVER ======
// Variabel untuk komunikasi antara Task Polling dan Loop Utama
volatile bool taskEnrollRequested = false;
volatile uint8_t taskTargetId = 0;
String taskCmdId = "";

// ====== Fungsi Report Hasil Pendaftaran ======
void laporHasilEnroll(String cmd_id, uint8_t id_jari, bool sukses) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  if (xSemaphoreTake(httpMutex, portMAX_DELAY)) {
    HTTPClient http;
    String url = String(SERVER_URL);
    url.replace("absensi", "device/command"); // Pakai rute command
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-key", DEVICE_KEY);
    
    String statusCmd = sukses ? "completed" : "failed";
    String jsonBody = "{\"command_id\":\"" + cmd_id + "\",\"status\":\"" + statusCmd + "\",\"payload\":{\"id_jari\":" + String(id_jari) + "}}";

    // Retry -- kalau ini gagal sekali aja, sensor fisik udah kesimpen sidik
    // jarinya tapi DB gak pernah tau (mismatch permanen sampai di-enroll ulang).
    int httpCode = -1;
    for (int attempt = 0; attempt < 3 && httpCode != 200; attempt++) {
      if (attempt > 0) delay(1000);
      httpCode = http.POST(jsonBody);
    }
    http.end();
    Serial.print("[HTTP] Melaporkan hasil enroll: "); Serial.print(statusCmd);
    Serial.print(" (kode: "); Serial.print(httpCode); Serial.println(")");
    xSemaphoreGive(httpMutex);
  }
}
// ====================================================

// ====== Baca Fingerprint ======
uint8_t bacaFingerprint() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return 0;

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return 0;

  p = finger.fingerSearch();
  if (p == FINGERPRINT_OK) {
    return finger.fingerID; // ID ditemukan
  }
  return 255; // tidak dikenali
}

// ====== Fungsi Enrollment (Daftar Sidik Jari Baru) ======
bool daftarSidikJari(uint8_t id) {
  int p = -1;

  Serial.print("Mendaftarkan ID #"); Serial.println(id);

  // === SCAN PERTAMA ===
  lcdMsg(" Tempel  Jari.. ", " Scan ke-1      ");
  Serial.println("Tempel jari (scan 1)...");
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) continue;
    if (p != FINGERPRINT_OK) {
      Serial.println("Error getImage 1"); return false;
    }
  }

  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.println("Error image2Tz 1"); return false;
  }

  lcdMsg(" Angkat  Jari!  ", "                ");
  Serial.println("Angkat jari!");
  beepBlocking(1);
  delay(1500);

  while (finger.getImage() != FINGERPRINT_NOFINGER);

  // === SCAN KEDUA ===
  lcdMsg(" Tempel  Lagi.. ", " Scan ke-2      ");
  Serial.println("Tempel jari lagi (scan 2)...");
  p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) continue;
    if (p != FINGERPRINT_OK) {
      Serial.println("Error getImage 2"); return false;
    }
  }

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.println("Error image2Tz 2"); return false;
  }

  // === BUAT MODEL ===
  p = finger.createModel();
  if (p == FINGERPRINT_ENROLLMISMATCH) {
    Serial.println("Jari tidak cocok, coba lagi!");
    lcdMsg(" Jari Beda!     ", " Coba  Lagi..   ");
    beepBlocking(3);
    delay(2000);
    return false;
  } else if (p != FINGERPRINT_OK) {
    Serial.println("Error createModel"); return false;
  }

  // === SIMPAN ===
  p = finger.storeModel(id);
  if (p != FINGERPRINT_OK) {
    Serial.println("Error storeModel"); return false;
  }

  Serial.print("Berhasil simpan ID #"); Serial.println(id);
  return true;
}

// ====== Mode Enrollment Otomatis dari Server ======
void modeEnrollmentOtomatis(uint8_t id, String cmd_id) {
  Serial.println("\n========== MENDAPATKAN PERINTAH ENROLL DARI SERVER ==========");
  Serial.print("Target ID Jari: ");
  Serial.println(id);

  char buf[16];
  sprintf(buf, " Daftar ID #%d   ", id);
  lcdMsg("  Remote Enroll ", buf);
  beepBlocking(2);

  bool berhasil = daftarSidikJari(id);
  if (berhasil) {
    sprintf(buf, " ID #%d Tersimpan", id);
    lcdMsg("   SUKSES!!!    ", buf);
    digitalWrite(LED_BIRU, HIGH);
    beepBlocking(2);
    delay(2000);
    digitalWrite(LED_BIRU, LOW);
    
    // Lapor sukses ke server
    laporHasilEnroll(cmd_id, id, true);
  } else {
    lcdMsg("  GAGAL! Ulangi ", "                ");
    digitalWrite(LED_MERAH, HIGH);
    beepBlocking(3);
    delay(2000);
    digitalWrite(LED_MERAH, LOW);
    
    // Lapor gagal ke server
    laporHasilEnroll(cmd_id, id, false);
  }

  Serial.println("========== KEMBALI KE MODE ABSENSI ==========\n");
  lcd.clear();
  posisi = 0;
}

// ====== Cek Perintah dari Server (Berjalan di Background Task) ======
void TaskPollServer(void *pvParameters) {
  for (;;) {
    // Hanya polling jika sistem hidup, idle, WiFi konek, dan belum ada request enroll yang antri
    if (isSystemOn && state == IDLE && WiFi.status() == WL_CONNECTED && !taskEnrollRequested) {
      
      // Ambil Mutex HTTP
      if (xSemaphoreTake(httpMutex, (TickType_t) 100)) { // Coba ambil selama 100 Ticks
        HTTPClient http;
        String url = String(SERVER_URL);
        url.replace("absensi", "device/command");
        
        http.begin(url);
        http.addHeader("x-device-key", DEVICE_KEY);
        http.setTimeout(5000); // Kasih headroom lebih -- query backend ~1-1.2s, +jaringan bisa lebih
        
        int httpCode = http.GET();
        if (httpCode == 200) {
          String payload = http.getString();
          if (payload.indexOf("\"command\":\"enroll\"") > 0) {
            int idxId = payload.indexOf("\"id_jari\":");
            int idxCmdId = payload.indexOf("\"command_id\":\"");
            
            if (idxId > 0 && idxCmdId > 0) {
              int endId = payload.indexOf(",", idxId);
              if (endId == -1) endId = payload.indexOf("}", idxId);
              String idStr = payload.substring(idxId + 10, endId);
              
              int endCmdId = payload.indexOf("\"", idxCmdId + 14);
              String cmd_id = payload.substring(idxCmdId + 14, endCmdId);
              
              // Simpan data untuk dieksekusi oleh loop utama
              taskTargetId = (uint8_t) idStr.toInt();
              taskCmdId = cmd_id;
              taskEnrollRequested = true; 
            }
          }
        }
        http.end();
        xSemaphoreGive(httpMutex);
      }
    }
    // Jeda 1 detik sebelum cek lagi (wajib ada vTaskDelay agar RTOS tidak crash)
    // Catatan: ini cuma mempercepat DETEKSI perintah "daftar sidik jari" dari
    // dashboard, tidak memengaruhi kecepatan kirim absensi (kirimAbsensi()
    // dipanggil langsung saat jari terdeteksi, tidak lewat loop polling ini).
    vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
}

// ====== Cek Serial Command (dipanggil tiap loop, non-blocking) ======
void cekSerialCommand() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.equalsIgnoreCase("daftar")) {
      // modeEnrollment() dihapus karena pindah ke web
      Serial.println("Gunakan website untuk pendaftaran sidik jari!");
    } else if (cmd.equalsIgnoreCase("hapus")) {
      finger.emptyDatabase();
      Serial.println("Semua data sidik jari telah dihapus dari memori ESP32!");
      lcdMsg("  Data Dihapus  ", "   Kosong...    ");
      delay(2000);
    }
  }
}

// ====== Setup ======
void setup() {
  Serial.begin(115200);
  delay(300);

  // Inisialisasi Mutex HTTP
  httpMutex = xSemaphoreCreateMutex();

  pinMode(LED_MERAH, OUTPUT);
  pinMode(LED_BIRU,  OUTPUT);
  pinMode(BUZZER,    OUTPUT);
  pinMode(SAKLAR_PIN, INPUT_PULLUP); // Gunakan internal pull-up untuk saklar

  digitalWrite(LED_MERAH, LOW);
  digitalWrite(LED_BIRU,  LOW);
  digitalWrite(BUZZER,    LOW);

  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("  IoT  ABSENSI  ");
  lcd.setCursor(0, 1); lcd.print(" Inisialisasi.. ");

  fingerSerial.begin(57600, SERIAL_8N1, FP_RX, FP_TX);
  delay(200);
  finger.begin(57600);
  delay(200);

  if (finger.verifyPassword()) {
    Serial.println(">> AS608 OK!");
    finger.getTemplateCount();
    Serial.print("Sidik jari tersimpan: ");
    Serial.println(finger.templateCount);
    Serial.println(">> Ketik 'daftar' kapan saja untuk tambah sidik jari baru.");

    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("  IoT  ABSENSI  ");
    lcd.setCursor(0, 1); lcd.print("   Sensor OK!   ");
    digitalWrite(LED_BIRU, HIGH);
    mulaiBeep(1);
    delay(1500);
    digitalWrite(LED_BIRU, LOW);
    lcd.clear();
  } else {
    Serial.println(">> AS608 GAGAL!");
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("  SENSOR GAGAL! ");
    lcd.setCursor(0, 1); lcd.print(" Cek Kabel TX/RX");
    digitalWrite(LED_MERAH, HIGH);
    mulaiBeep(3);
    while (true) delay(1000);
  }

  // Panggil fungsi WiFi di setup
  connectWiFi();

  // Buat FreeRTOS Task berjalan di Core 0 khusus untuk polling server
  // sehingga tidak mengganggu animasi LCD di Core 1 (loop utama)
  xTaskCreatePinnedToCore(
    TaskPollServer,    // Fungsi Task
    "PollServerTask",  // Nama Task
    8192,              // Ukuran Stack
    NULL,              // Parameter
    1,                 // Prioritas (1 = normal)
    NULL,              // Task Handle
    0                  // Jalankan di Core 0 (Loop berjalan di Core 1)
  );
}

// ====== Loop ======
void loop() {
  // ---- Cek Status Saklar ON/OFF ----
  // Saklar terhubung ke GND. Jika dibaca LOW, berarti ON (karena terhubung ke GND).
  // Jika dibaca HIGH, berarti OFF (terbuka, ditarik ke HIGH oleh INPUT_PULLUP).
  bool currentSwitchState = (digitalRead(SAKLAR_PIN) == LOW);

  // Deteksi perubahan dari OFF ke ON atau ON ke OFF
  if (currentSwitchState != lastSwitchState) {
    if (currentSwitchState) {
      // Saklar dipindah ke ON
      lcd.backlight();
      lcd.clear();
      lcd.setCursor(0, 0); lcd.print("  Sistem Aktif  ");
      delay(1000);
      lcd.clear();
      posisi = 0;
    } else {
      // Saklar dipindah ke OFF
      lcd.clear();
      lcd.setCursor(0, 0); lcd.print("Sistem Dimatikan");
      lcd.setCursor(0, 1); lcd.print("  Sampai Jumpa  ");
      delay(1500); // Tampilkan pesan selama 1.5 detik
      
      lcd.clear();
      lcd.noBacklight();
      digitalWrite(LED_MERAH, LOW);
      digitalWrite(LED_BIRU,  LOW);
      digitalWrite(BUZZER,    LOW);
    }
    lastSwitchState = currentSwitchState;
    isSystemOn = currentSwitchState;
  }

  // Jika sistem sedang OFF, jangan jalankan kode di bawah ini
  if (!isSystemOn) {
    return;
  }

  updateBeep();

  // ---- Cek apakah user mau masuk mode daftar sidik jari baru ----
  cekSerialCommand();

  // ---- Kembali ke IDLE setelah notifikasi selesai ----
  if ((state == SUKSES || state == GAGAL) &&
      millis() - tState >= DURASI_NOTIF) {
    state = IDLE;
    posisi = 0;
    digitalWrite(LED_MERAH, LOW);
    digitalWrite(LED_BIRU,  LOW);
    lcd.clear();
  }

  // ---- Mode IDLE ----
  if (state == IDLE) {
    // Cek apakah ada request dari Task background
    if (taskEnrollRequested) {
      modeEnrollmentOtomatis(taskTargetId, taskCmdId);
      taskEnrollRequested = false;
      return; // Langsung return agar animasi dll diulang dari awal state IDLE
    }

    // Teks berjalan baris bawah
    if (millis() - tLcd >= JEDA_LCD) {
      tLcd = millis();
      String tampil = pesan.substring(posisi, posisi + LEBAR);
      lcd.setCursor(0, 0); lcd.print("  Tempel  Jari  ");
      lcd.setCursor(0, 1); lcd.print(tampil);
      posisi++;
      if (posisi > (int)pesan.length() - LEBAR) posisi = 0;
    }

    // LED bergantian
    if (millis() - tLed >= JEDA_LED) {
      tLed = millis();
      ledNyala = !ledNyala;
      digitalWrite(LED_MERAH, ledNyala ? HIGH : LOW);
      digitalWrite(LED_BIRU,  ledNyala ? LOW  : HIGH);
    }

    // Baca fingerprint
    uint8_t hasil = bacaFingerprint();

    if (hasil > 0 && hasil != 255) {
      // ==== BERHASIL DETEKSI ====
      Serial.print("Terdeteksi ID: "); Serial.println(hasil);
      state  = SUKSES;
      tState = millis();
      digitalWrite(LED_BIRU, HIGH);
      digitalWrite(LED_MERAH, LOW);
      
      lcdMsg("  Memproses...  ", "                ");
      String namaReal = kirimAbsensi(hasil, getNama(hasil)); // Ambil nama asli dari server

      tampilSukses(namaReal); // <---- Tampil LCD dengan nama asli
      mulaiBeep(2);

    } else if (hasil == 255) {
      // ==== GAGAL DETEKSI ====
      Serial.println("Jari tidak dikenali!");
      state  = GAGAL;
      tState = millis();
      digitalWrite(LED_BIRU,  LOW);
      digitalWrite(LED_MERAH, HIGH);
      tampilGagal();
      mulaiBeep(3);
    }
  }
}
