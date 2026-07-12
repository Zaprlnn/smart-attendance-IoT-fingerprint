fetch("http://localhost:3000/api/absensi", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-device-key": process.env.DEVICE_KEY
  },
  body: JSON.stringify({ id_jari: 1, nama: "test", status: "hadir" })
}).then(r => r.text()).then(console.log).catch(console.error);
