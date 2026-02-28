const randomWords = [
  "Simontok",
  "Bokep31",
  "Bebasindo",
    "Drbokep Asia",
  "Bokepin",
    "bokepx18",
             "Sotwe", "Bokep Dood", "Twitter", "Bokepsatset", "Simontok", "Doodstream",
            "Simintok", "Xpanas", "Pekoblive", "Terabox", "Streaming", "Tiktok",
            "Doods Pro", "Lulustream", "Doodsflix", "Yakwad", "Doodflix", "Doodstreem",
            "Dood Pro", "Doostream", "Dodstream", "VideoLokal",
            "Bokep Video", "Video Viral", "Bokep Terbaru", "Video Bokep", "Bokepsin",
            "Bokepind", "Bokep31", "Video Indo", "Video Panas", "Asupan Viral",
            "Lagi Viral", "Video Viral",

  "Doodflix",
  "Tiktok",
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
  "Links Tele",

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
  "Terabox",
  "Bokep Terbaru",
  "Skandal",
  "Viral Mesum",
  "Yandex Vk",
  "Mesum",
  "Pemersatu Bangsa",
  "Pejuang Lendir",
  "Popstream",
  "Simontok",
  "Bokepind",
  "Video Bokep",
  "Video Indo",
  "Indonesia"
]

function cleanTitle(title: string): string {
  // Pisahkan PascalCase dengan menambahkan spasi sebelum huruf kapital
  let cleanedTitle = title.replace(/([a-z])([A-Z])/g, "$1 $2")

  // Hapus semua angka
  cleanedTitle = cleanedTitle.replace(/[0-9]+/g, "")

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
