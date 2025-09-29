const randomWords = [
  "Simontok",
  "Bokep31",
  "Bebasindo",
    "Drbokep Asia",
  "Bokepin",
    "bokepx18",
  "Doodflix",
  "Tiktok",
  "Lagi Viral",
  "Bokepsatset",
  "Doodstream",
  "Dood Tele",
  "Abgcrot",
  "Memeksiana",
  "Doods Simontok",
  "Vidio Viral",
  "Telegram",
  "Full Album",
  "Video Viral",
  "Poophd",
  "Lulustream",
  "Xhamster",
  "Videos",
  "Twitter",
  "Asupan Lokal",
  "Link Web",
  "Streaming",
  "Web Bekeh",
  "Folder Lokal",
  "Cilbo",
  "Terupdate",
  "Terbaru",
  "Xnxnx",
  "Lokal",
  "Dodstream",
  "Bokep",
  "Pemersatu",
  "Bokepsin",
  "Update",
  "Doostream",
  "Website",
  "Download",
  "Indo Lokal",
  "Lulustream",
  "Sotwe",
  "Doodsflix",
  "Yakwad",
  "Bokep Dood",
  "Simintok",
  "Xpanas",
  "Terbaru",
    "Tiktok",
      "Instagram",
        "Twitter",
  "Videy",
 
  "Asupan Viral",
  "Pekoblive",
  "Terabox",
  "Viral",
  "Tiktok",
  "Doods Pro",
  "Bochiel",
  "Link Bokep",
  "Folder",
    "Telegram",
  "Live Bokep",
  "Tele",
  "Links",
    "xHamster",
    "bokephot",
      "Indo18",
    
  "Simontok",
  "Sakandal Indo",
  "Bokep Tobrut",
  "Lagi Viral",
  "Stw Tobrut",
  "Doodstreem",
  "Jilbab",
  "Sesuai Gambar",
  "Bokep Terbaru",
  "Skandal",
  "Viral Mesum",
  "Yandex Vk",
  "Mesum",
  "Pemersatu Bangsa",
  "Pejuang Lendir",
  "Popstream",
  "Staklam",
  "Bokepind",
  "Video Bokep",
  "Video Indo",
  "Indonesia"
]

function cleanTitle(title: string): string {
  // Hapus semua angka
  let cleanedTitle = title.replace(/[0-9]+/g, "")

  // Ganti semua karakter non-alfabet (selain spasi) dengan spasi tunggal
  cleanedTitle = cleanedTitle.replace(/[^a-zA-Z\s]+/g, " ")

  // Ganti spasi berlebih dengan satu spasi dan trim ujung-ujungnya
  cleanedTitle = cleanedTitle.replace(/\s+/g, " ").trim()

  // Ubah setiap kata pertama menjadi huruf kapital dan sisanya huruf kecil
  cleanedTitle = cleanedTitle
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  // Pecah judul menjadi kata-kata
  const words = cleanedTitle.split(" ").filter((word) => word.length > 0)

  // Tambahkan kata acak hingga jumlah kata mencapai 10
  if (words.length > 0 && words.length < 10) {
    while (words.length < 10) {
      const randomIndex = Math.floor(Math.random() * randomWords.length)
      const randomWord = randomWords[randomIndex]

      // Pastikan kata acak tidak duplikat
      if (!words.includes(randomWord)) {
        words.push(randomWord)
      }
    }

    cleanedTitle = words.join(" ")
  }

  return cleanedTitle
}

// Ekspor fungsi cleanTitle untuk digunakan di modul lain
export { cleanTitle, cleanTitle as processTitle }
